import { devLog, moduleError, moduleWarn } from "$lib/utils";

/** tokenmagic/fx/presets/defaultpresets.js (PresetsLibrary), in togglePreset's lookup order. */
export const PRESET_LIBRARIES = ["tmfx-main", "tmfx-region"];

export interface TMFXParams {
	filterType?: string;
	filterId?: string;
	[key: string]: unknown;
}

export interface TMFXPreset {
	name?: string;
	library?: string;
	defaultColor?: unknown;
	defaultOpacity?: unknown;
	params: TMFXParams[];
}

/** Only the bits of a document this module touches, across every placeable type. */
export interface AnyDocument { documentName: string; uuid: string }

export interface TokenMagicAPI {
	getPresets: (library?: string) => TMFXPreset[];
	hasFilterId: (placeable: object, filterId: string) => boolean | null;
	togglePreset: (
		placeable: object,
		preset: string | TMFXPreset,
		options?: { action?: "toggle" | "add" | "remove"; transient?: boolean },
	) => Promise<void>;
}

/**
 * The API is only on `globalThis` once Token Magic FX has booted, and
 * `togglePreset` only exists on recent versions.
 */
export function getTokenMagic(): TokenMagicAPI | undefined {
	if (!game.modules.get("tokenmagic")?.active)
		return undefined;
	const api = (globalThis as any).TokenMagic as TokenMagicAPI | undefined;
	return typeof api?.togglePreset === "function" ? api : undefined;
}

/**
 * Transient filters live on the sprite only, so `hasFilterId` (which reads the
 * document flags) cannot see them.
 */
export function hasFilter(placeable: object, filterId: string, transient: boolean): boolean {
	if (!transient)
		return !!getTokenMagic()?.hasFilterId(placeable, filterId);

	const sprite = (placeable as any).object?._TMFXgetSprite?.();
	return !!sprite?.filters?.some((f: { filterId?: string }) => f.filterId === filterId);
}

export function filterKey(uuid: string, filterId: string): string {
	return `${uuid}:${filterId}`;
}

/** One node's claim on a filter, plus the timer and hooks that end that claim. */
interface Lease {
	timer?: ReturnType<typeof setTimeout>;
	hooks: { name: string; id: number }[];
	/** Resolves once the claim is gone and any final removal has settled. */
	completion: Promise<void>;
	complete: () => void;
}

interface FilterRecord {
	placeable: AnyDocument;
	preset: TMFXPreset;
	filterId: string;
	transient: boolean;
	leases: Map<string, Lease>;
}

export interface AcquireOptions {
	placeable: AnyDocument;
	preset: TMFXPreset;
	filterId: string;
	transient: boolean;
	/** ms until this lease releases itself. 0 or missing means no timer. */
	duration?: number;
	/** UUIDs whose deletion releases this lease. */
	tieTo?: string[];
}

/**
 * Every filter this module has applied on this client, in memory only.
 *
 * Nothing here is written to a document: a flag would reintroduce the permission
 * gate and the broadcast that transient filters exist to avoid, and would need
 * per-user keying to stop other clients acting on it.
 */
const records = new Map<string, FilterRecord>();

/**
 * The in-flight Token Magic FX call for each filter. Every add and remove queues
 * behind the previous one, so an abort during an add cannot settle as
 * `add:start -> remove:end -> add:end` and leave an orphaned filter on screen.
 */
const operations = new Map<string, Promise<void>>();

/** Records whose placeable was deleted; their queued calls must not run. */
const abandoned = new WeakSet<FilterRecord>();

/** Whether this module holds the filter, optionally under one specific lease. */
export function owns(key: string, leaseId?: string): boolean {
	const record = records.get(key);
	if (!record)
		return false;
	return leaseId === undefined || record.leases.has(leaseId);
}

/** Every claim this module holds on a filter. */
export function leaseIds(key: string): string[] {
	return [...records.get(key)?.leases.keys() ?? []];
}

/** Resolves when a lease ends, or immediately if it is already gone. */
export function whenReleased(key: string, leaseId: string): Promise<void> {
	return records.get(key)?.leases.get(leaseId)?.completion ?? Promise.resolve();
}

/**
 * Take `leaseId`'s claim on a filter, applying it if nobody else holds it yet.
 *
 * Leases rather than a plain count, so two nodes sharing a `filterId` cannot
 * release each other's claim.
 */
export async function acquire(leaseId: string, options: AcquireOptions): Promise<boolean> {
	const { placeable, preset, filterId, transient } = options;
	const key = filterKey(placeable.uuid, filterId);
	const lease = createLease();

	const existing = records.get(key);
	if (existing) {
		if (existing.leases.has(leaseId))
			return true;
		existing.leases.set(leaseId, lease);
		await operations.get(key);
		arm(key, leaseId, lease, options);
		return true;
	}

	const magic = getTokenMagic();
	if (!magic) {
		moduleWarn(`[tmfx] Token Magic FX is not active, or is too old for this module`);
		return false;
	}

	const record: FilterRecord = { placeable, preset, filterId, transient, leases: new Map([[leaseId, lease]]) };
	records.set(key, record);
	installHooks();

	let applied = false;
	try {
		await enqueue(key, async () => {
			if (abandoned.has(record) || records.get(key) !== record)
				return;

			// Checked inside the queue rather than before it: a removal of the same
			// filter may still be in flight, and until it runs the filter is on the
			// placeable but owned by nobody.
			if (hasFilter(placeable, filterId, transient)) {
				moduleWarn(`[tmfx] "${filterId}" is already on ${placeable.uuid}; leaving it alone`);
				return;
			}

			await togglePreset(record, "add");
			applied = true;
		});
	} catch (e) {
		abandon(key, record);
		moduleError(`[tmfx] could not apply "${filterId}" to ${placeable.uuid}`, e);
		return false;
	}

	// Either the filter was not ours to take, or the lease was released while the
	// add was still in flight; the removal is already queued behind it, so there is
	// nothing left to arm.
	if (!applied) {
		abandon(key, record);
		return false;
	}
	if (records.get(key) !== record)
		return false;

	arm(key, leaseId, lease, options);
	devLog(`[tmfx] applied "${filterId}" to ${placeable.uuid}`, { transient, duration: options.duration });
	return true;
}

/**
 * Drop one lease, taking the filter down with the last one. Idempotent, so an
 * aborted section can release a lease that already ended on its own.
 */
export async function release(key: string, leaseId: string, reason: string): Promise<void> {
	const record = records.get(key);
	const lease = record?.leases.get(leaseId);
	if (!record || !lease) {
		devLog(`[tmfx] nothing to release for "${key}" (${reason})`);
		return;
	}

	disarm(lease);
	record.leases.delete(leaseId);
	if (record.leases.size) {
		lease.complete();
		return;
	}

	// Dropped before awaiting, so a fresh acquire builds its own record and queues
	// its add behind this removal rather than adopting a dying one.
	records.delete(key);
	try {
		await enqueue(key, async () => {
			if (abandoned.has(record))
				return;
			await togglePreset(record, "remove");
			devLog(`[tmfx] removed "${record.filterId}" from ${record.placeable.uuid} (${reason})`);
		});
	} catch (e) {
		moduleError(`[tmfx] could not remove "${record.filterId}"`, e);
	} finally {
		lease.complete();
	}
}

async function togglePreset(record: FilterRecord, action: "add" | "remove"): Promise<void> {
	const magic = getTokenMagic();
	if (!magic)
		throw new Error("Token Magic FX is not active, or does not expose togglePreset");
	await magic.togglePreset(record.placeable, record.preset, { action, transient: record.transient });
}

function enqueue(key: string, operation: () => Promise<void>): Promise<void> {
	const previous = operations.get(key) ?? Promise.resolve();
	const current = previous.catch(() => undefined).then(operation);
	operations.set(key, current);
	void current.catch(() => undefined).then(() => {
		if (operations.get(key) === current)
			operations.delete(key);
	});
	return current;
}

function createLease(): Lease {
	let complete!: () => void;
	const completion = new Promise<void>((resolve) => {
		complete = resolve;
	});
	return { hooks: [], completion, complete };
}

/** The clock starts when the filter lands, not when the node ran. */
function arm(key: string, leaseId: string, lease: Lease, options: AcquireOptions): void {
	if (options.duration && options.duration > 0)
		lease.timer = setTimeout(() => void release(key, leaseId, "duration elapsed"), options.duration);

	for (const uuid of options.tieTo ?? []) {
		const doc = fromUuidSync(uuid) as AnyDocument | null;
		if (!doc?.documentName) {
			moduleWarn(`[tmfx] could not resolve the tied document`, uuid);
			continue;
		}
		const name = `delete${doc.documentName}`;
		lease.hooks.push({
			name,
			id: Hooks.on(name, (deleted: AnyDocument) => {
				if (deleted?.uuid === uuid)
					void release(key, leaseId, `${doc.documentName} deleted`);
			}),
		});
	}
}

function disarm(lease: Lease): void {
	if (lease.timer !== undefined) {
		clearTimeout(lease.timer);
		lease.timer = undefined;
	}
	for (const { name, id } of lease.hooks.splice(0))
		Hooks.off(name, id);
}

/** Drop a record and everything waiting on it without touching the placeable. */
function abandon(key: string, record: FilterRecord): void {
	abandoned.add(record);
	for (const lease of record.leases.values()) {
		disarm(lease);
		lease.complete();
	}
	record.leases.clear();
	if (records.get(key) === record)
		records.delete(key);
}

/** The fields whose change makes Token Magic FX wipe a token's filters. */
const TOKEN_WIPE_FIELDS = ["img", "tint", "height", "width", "name"];

/** Token Magic FX restores with `requestLoadFilters(placeable, 250)`, so land after it. */
const REAPPLY_DELAY = 300;

let hooksInstalled = false;
const reapplyTimers = new Map<string, ReturnType<typeof setTimeout>>();

function installHooks(): void {
	if (hooksInstalled)
		return;
	hooksInstalled = true;

	Hooks.on("updateToken", (doc: AnyDocument, changes: Record<string, unknown>) => {
		if (TOKEN_WIPE_FIELDS.some(field => changed(changes, field)))
			scheduleReapply(doc.uuid, false);
	});
	// Any region update kills a transient filter: either Token Magic FX wipes them
	// outright, or it re-derives the sprite's shader from the tokenmagic flag,
	// which a transient filter has none of. The second leaves the filter in place
	// but not rendering, so a presence check would miss it and only a rebuild helps.
	Hooks.on("updateRegion", (doc: AnyDocument) => scheduleReapply(doc.uuid, true));

	Hooks.on("deleteToken", (doc: AnyDocument) => forget(doc.uuid));
	Hooks.on("deleteRegion", (doc: AnyDocument) => forget(doc.uuid));
}

function changed(changes: Record<string, unknown>, path: string): boolean {
	return Object.hasOwn(changes, path) || foundry.utils.hasProperty(changes, path);
}

function forget(uuid: string): void {
	const timer = reapplyTimers.get(uuid);
	if (timer !== undefined) {
		clearTimeout(timer);
		reapplyTimers.delete(uuid);
	}
	for (const [key, record] of records) {
		if (record.placeable.uuid === uuid)
			abandon(key, record);
	}
}

function scheduleReapply(uuid: string, rebuild: boolean): void {
	if (![...records.values()].some(r => r.transient && r.placeable.uuid === uuid))
		return;

	clearTimeout(reapplyTimers.get(uuid));
	reapplyTimers.set(uuid, setTimeout(() => {
		reapplyTimers.delete(uuid);
		for (const [key, record] of records) {
			if (record.transient && record.placeable.uuid === uuid)
				void reapply(key, record, rebuild);
		}
	}, REAPPLY_DELAY));
}

async function reapply(key: string, record: FilterRecord, rebuild: boolean): Promise<void> {
	try {
		await enqueue(key, async () => {
			// Re-checked inside the queued call: a duration, tie or Remove can release
			// the filter while an earlier call is still settling.
			if (abandoned.has(record) || records.get(key) !== record)
				return;

			const present = hasFilter(record.placeable, record.filterId, true);
			if (present && !rebuild)
				return;
			if (present)
				await togglePreset(record, "remove");
			await togglePreset(record, "add");
			devLog(`[tmfx] re-applied "${record.filterId}" to ${record.placeable.uuid}`);
		});
	} catch (e) {
		moduleError(`[tmfx] could not re-apply "${record.filterId}"`, e);
	}
}
