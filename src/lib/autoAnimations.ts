import { id as moduleId } from "moduleJSON";
import { suggestTriggerName } from "../templateButton";
import { devLog } from "./utils";

/**
 * Automated Animations compatibility thing, most of it is repurposed code from A-A.
 */

const ITEM_MENUS = ["melee", "range", "ontoken", "templatefx", "aura", "preset"] as const;

interface AAMatch {
	menu: string;
	entry: any;
}

interface HandleItemOptions {
	/** The (dnd5e) activity, if any. */
	activity?: any;
	activeEffect?: boolean;
}

const clean = (name?: string | null) => name?.replace(/\s+/g, "").toLowerCase() ?? "";

export function isAutoAnimationsActive(): boolean {
	return !!game.modules.get("autoanimations")?.active;
}

export function overrideEnabled(): boolean {
	if (!isAutoAnimationsActive())
		return false;
	try {
		return !!game.settings.get(moduleId, "autoanimations-override");
	} catch {
		return false;
	}
}

/** How long a pending A-A workflow waits for one of our triggers to claim it, in milliseconds. */
export function overrideTimeout(): number {
	try {
		return Number(game.settings.get(moduleId, "autoanimations-override-timeout")) || 0;
	} catch {
		return 500;
	}
}

/**
 * Copy of `AAAutorecFunctions.allMenuSearch`, changed to return the source menu.
 */
function allMenuSearch(name: string, activeEffect: boolean): AAMatch | null {
	const menus = (globalThis as any).AutomatedAnimations?.AutorecManager?.getAutorecEntries?.();
	if (!menus)
		return null;

	const entries = (activeEffect ? ["aefx"] : [...ITEM_MENUS])
		.flatMap(menu => (menus[menu] ?? []).map((entry: any): AAMatch => ({ menu, entry })));

	const exact = entries.find(({ entry }) => entry?.advanced?.exactMatch && entry.label === name);
	if (exact)
		return exact;

	const rinsedName = clean(name);
	const sorted = entries.sort((a, b) => clean(b.entry?.label).length - clean(a.entry?.label).length);
	return sorted.find(({ entry }) => !entry?.advanced?.exactMatch
		&& entry?.label
		&& rinsedName.includes(clean(entry.label))
		&& !(entry.advanced?.excludedTerms ?? []).some((term: string) => rinsedName.includes(clean(term)))) ?? null;
}

/**
 * Copy of `handleItem` from A-A's `src/system-handlers/findAnimation.js`, changed to return the match.
 */
export function handleItem(item: any, { activity = null, activeEffect = false }: HandleItemOptions = {}): AAMatch | null {
	if (!item || !isAutoAnimationsActive())
		return null;

	try {
		if (game.settings.get("autoanimations", "killAllAnim") === "off")
			return null;

		const activityFlags = activity?.flags?.autoanimations;
		const itemFlags = item.flags?.autoanimations;

		const killed = (flags: any) => !!flags && (!!flags.killAnim || flags.isEnabled === false);
		if (killed(activityFlags) || killed(itemFlags))
			return null;
		if (activityFlags?.isCustomized || itemFlags?.isCustomized)
			return { menu: "flags", entry: null };

		if (game.settings.get("autoanimations", "disableAutoRec"))
			return null;

		return allMenuSearch(item.name ?? item.label ?? "", activeEffect);
	} catch (error) {
		devLog("Automated Animations check failed, assuming it will not animate.", error);
		return null;
	}
}

interface CompetesOptions extends HandleItemOptions {
	targets?: number;
	hasSource?: boolean;
}

export function competes(item: any, options: CompetesOptions = {}): boolean {
	const match = handleItem(item, options);
	if (!match)
		return false;
	if (match.menu === "flags")
		return true;

	if (["melee", "range"].includes(match.menu)) {
		const targets = options.targets ?? game.user?.targets?.size ?? 0;
		const hasSource = options.hasSource ?? !!item?.actor?.getActiveTokens?.().length;
		if (!hasSource || targets < 1)
			return false;
	}

	return true;
}

// #region Claims

/**
 * A claim says "one of our triggers took this item, A-A can stand down".
 *
 * It has to be broadcast: A-A only runs its workflow on the acting user's client, while our triggers run wherever the trigger-engine hook fired.
 */
interface Claim {
	uuid: string;
	at: number;
}

interface ClaimWaiter {
	uuid: string;
	resolve: (claimed: boolean) => void;
}

/** Marks a socket payload as a claim instead of an `animation-event`. */
export const CLAIM_FLAG = "triggerAnimationsClaim";
const SOCKET_PATH = `module.${moduleId}`;
const DEFERRAL_VERSION = "7.0.22";

const claims: Claim[] = [];
const waiters = new Set<ClaimWaiter>();

function claimUuid(item: any): string | null {
	if (!item)
		return null;
	// Socket payloads carry the item as a UUID string.
	if (typeof item === "string")
		return item;
	return item.uuid ?? null;
}

function pruneClaims(now: number): void {
	const ttl = Math.max(overrideTimeout(), 1000);
	while (claims.length && now - claims[0]!.at > ttl)
		claims.shift();
}

function recordClaim(uuid: string): void {
	const now = Date.now();
	pruneClaims(now);
	claims.push({ uuid, at: now });

	for (const waiter of [...waiters]) {
		if (waiter.uuid !== uuid)
			continue;
		waiters.delete(waiter);
		waiter.resolve(true);
	}
}

/**
 * Announce that one of our triggers matched this item, so A-A workflows waiting on it stand down.
 */
export function announceTriggerClaim(item: any, broadcast = true): void {
	const uuid = claimUuid(item);
	if (!uuid)
		return;

	devLog("Claiming Automated Animations workflow for", uuid);
	recordClaim(uuid);
	if (broadcast)
		game.socket.emit(SOCKET_PATH, { [CLAIM_FLAG]: true, uuid });
}

/** Handle a claim broadcast by another client. */
export function receiveTriggerClaim(payload: any): void {
	if (typeof payload?.uuid !== "string")
		return;
	recordClaim(payload.uuid);
}

/** Resolves true as soon as a trigger claims `item`, false once `timeout` elapses without one. */
function waitForClaim(item: any, timeout: number): Promise<boolean> {
	const uuid = claimUuid(item);
	if (!uuid)
		return Promise.resolve(false);

	// The claim can beat the workflow, e.g. a template placed a while after the trigger ran.
	pruneClaims(Date.now());
	if (claims.some(claim => claim.uuid === uuid))
		return Promise.resolve(true);

	return new Promise((resolve) => {
		const waiter: ClaimWaiter = { uuid, resolve };
		waiters.add(waiter);
		window.setTimeout(() => {
			if (waiters.delete(waiter))
				resolve(false);
		}, timeout);
	});
}

/* -------------------------------------------- */
/*  Override                                    */
/* -------------------------------------------- */

/** Does the installed A-A await `clonedData.deferrals`? */
function supportsDeferrals(): boolean {
	const version = game.modules.get("autoanimations")?.version;
	return !!version && !foundry.utils.isNewerVersion(DEFERRAL_VERSION, version);
}

/**
 * Pre-#78 fallback: A-A cannot wait for us, so all we can do is guess trigger names from the item.
 */
function hasCompetingTrigger(item: any): boolean {
	if (!item)
		return false;
	try {
		return suggestTriggerName(item).some(name => !!triggerAnimations.api.matchTrigger(name, { literalOnly: true }));
	} catch (error) {
		devLog("Failed to guess trigger names for", item, error);
		return false;
	}
}

let overrideHook: number | undefined;

function registerAutoAnimationsHooks(): void {
	if (overrideHook !== undefined) {
		Hooks.off("AutomatedAnimations-WorkflowStart", overrideHook);
		overrideHook = undefined;
	}
	if (!isAutoAnimationsActive())
		return;

	overrideHook = Hooks.on("AutomatedAnimations-WorkflowStart", (clonedData: any, animationData: any) => {
		if (!overrideEnabled())
			return;
		if (!animationData || !clonedData)
			return;

		const item = clonedData.item;

		if (!supportsDeferrals()) {
			devLog("Automated Animations is older than", DEFERRAL_VERSION, "- falling back to guessing trigger names.");
			if (!hasCompetingTrigger(item))
				return;
			devLog("Overriding Automated Animations (guessed) for", item?.name);
			clonedData.stopWorkflow = true;
			return;
		}

		const timeout = overrideTimeout();
		if (timeout <= 0)
			return;
		// Nothing could ever claim the workflow, so do not hold A-A up for nothing.
		if (!triggerAnimations.api.triggerCache.length)
			return;

		(clonedData.deferrals ??= []).push(
			waitForClaim(item, timeout).then((claimed) => {
				if (!claimed) {
					devLog("No trigger claimed", item?.name, "- letting Automated Animations through.");
					return;
				}
				devLog("Overriding Automated Animations for", item?.name);
				clonedData.stopWorkflow = true;
			}),
		);
	});
}

// #endregion

Hooks.once("ready", () => registerAutoAnimationsHooks());
