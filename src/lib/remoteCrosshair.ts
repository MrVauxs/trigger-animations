import type { CrosshairLocationRef, CrosshairRequest } from "$lib/crosshairBuilder";
import {
	CROSSHAIR_SLACK,
	crosshairRelayKey,
	getCrosshairRun,
	publishCrosshair,
	waitForCrosshair,
} from "$lib/crosshairRelay";
import { devLog, i18n, moduleError, moduleWarn, whenUserDisconnects } from "$lib/utils";

/** Where a crosshair was placed. Plain data, so it survives a query and the module socket. */
export interface CrosshairResult {
	x: number;
	y: number;
	direction: number;
	distance: number;
	t: string;
	angle: number;
	width: number;
	sceneId: string;
	/** Sequencer canvas data, as a crosshair section stores it for its named location. */
	source: Record<string, unknown>;
	target: Record<string, unknown> | null;
	/** Template source data, on the way back from the placing client when persisting. */
	template?: Record<string, unknown>;
	/** The template created from {@link template}. */
	templateUuid?: string;
}

interface CrosshairNode {
	id: string;
	triggerPath: string;
	userContext: User;
	getContext: <T>(key: string) => T | undefined;
	setContext: <T>(key: string, value: T) => T;
}

interface ShownCrosshair {
	destroyed: boolean;
	destroy: () => void;
}

interface PlacedCrosshair {
	x: number;
	y: number;
	direction: number;
	distance: number;
	t: string;
	angle: number;
	width: number;
	getOrientation: () => { source: Record<string, unknown>; target: Record<string, unknown> | null };
	toObject: () => Record<string, unknown>;
}

// #region Requesting client

/**
 * Gets a crosshair placement for a node, from `chosen` or else the user who triggered it.
 *
 * A local trigger runs on every client at once. Only the client that sent it out asks for the
 * crosshair; the others wait for it to relay the placement, so they all build the same Sequence.
 */
export async function resolveCrosshair(
	node: CrosshairNode,
	chosen: User | undefined,
	request: CrosshairRequest,
): Promise<CrosshairResult | null> {
	const run = getCrosshairRun(node);
	const key = run ? crosshairRelayKey(node, run) : undefined;
	if (run && key && run.authority !== game.userId)
		return waitForCrosshair(key, run.authority, request.timeout);

	const result = await requestCrosshair(crosshairUser(chosen, node.userContext), request);
	if (result?.template)
		await persistTemplate(result);
	if (key)
		publishCrosshair(key, result);
	return result;
}

/** The chosen user if they are online, else whoever triggered the animation, else this client. */
export function crosshairUser(chosen: User | undefined, context: User): User {
	if (chosen?.active)
		return chosen;
	if (context.active)
		return context;
	return game.user;
}

/** Asks `user` to place a crosshair. Never throws: failing, timing out and cancelling are all null. */
export async function requestCrosshair(user: User, request: CrosshairRequest): Promise<CrosshairResult | null> {
	// The placing client gives up on its own, this only covers it never answering.
	const timeout = request.timeout > 0 ? (request.timeout + CROSSHAIR_SLACK) * 1000 : 0;
	const left = user.isSelf ? undefined : whenUserDisconnects(user);
	try {
		devLog(`Requesting a crosshair from ${user.name}`, request);
		const query = triggerAnimations.api.query(user, "showCrosshair", request, { timeout });
		const result: unknown = await (left ? Promise.race([query, left.promise.then(() => null)]) : query);
		return isCrosshairResult(result) ? result : null;
	} catch (error) {
		moduleWarn(`${user.name} could not place a crosshair`, error);
		return null;
	} finally {
		left?.cancel();
	}
}

/** The location to give `Sequence.addNamedLocation()`, matching what a crosshair section stores. */
export function crosshairNamedLocation(result: CrosshairResult): Vector2 {
	const source = result.templateUuid ?? result.source;
	const target = result.templateUuid ?? result.target ?? result.source;
	return { source, target } as unknown as Vector2;
}

/** Done here rather than by the placing user, who might not be allowed to create templates. */
async function persistTemplate(result: CrosshairResult): Promise<void> {
	const { template } = result;
	delete result.template;
	const scene = game.scenes.get(result.sceneId);
	if (!template || !scene)
		return;

	try {
		const [created] = await scene.createEmbeddedDocuments("MeasuredTemplate", [template as any]);
		result.templateUuid = created?.uuid ?? undefined;
	} catch (error) {
		moduleWarn("could not create the crosshair's template", error);
	}
}

function isCrosshairResult(value: unknown): value is CrosshairResult {
	const result = value as Partial<CrosshairResult> | null;
	return typeof result?.x === "number" && typeof result.y === "number" && typeof result.sceneId === "string";
}

// #endregion
// #region Placing client

/** Milliseconds to wait after the pointer is released before showing a crosshair. */
const POINTER_SETTLE = 150;

// When you place down a template and a trigger requests a crosshair, the two can overlap and cause a double confirm, so gotta wait on that.
Hooks.once("ready", () => {
	const options = { capture: true, passive: true };
	window.addEventListener("pointerdown", trackPointer, options);
	window.addEventListener("pointerup", trackPointer, options);
	window.addEventListener("pointercancel", trackPointer, options);
	// A button let go of outside the window never reports its release.
	window.addEventListener("blur", releasePointer);
});

let queue: Promise<unknown> = Promise.resolve();
let heldButtons = 0;
const releaseWaiters: (() => void)[] = [];

function releasePointer(): void {
	heldButtons = 0;
	for (const resolve of releaseWaiters.splice(0))
		resolve();
}

function trackPointer(event: PointerEvent): void {
	heldButtons = event.buttons;
	if (!heldButtons)
		releasePointer();
}

async function pointerSettled(): Promise<void> {
	if (heldButtons)
		await new Promise<void>(resolve => releaseWaiters.push(resolve));
	await new Promise(resolve => setTimeout(resolve, POINTER_SETTLE));
}

/**
 * Shows a crosshair on this client and resolves with where it was placed, or null.
 *
 * Requests are shown one at a time: every open crosshair listens to the same canvas clicks, so a
 * single click would place them all on the same spot.
 */
export function showCrosshairLocally(request: CrosshairRequest): Promise<CrosshairResult | null> {
	const shown = queue.then(() => showCrosshair(request));
	queue = shown.catch(() => null);
	return shown;
}

async function showCrosshair({ config: source, timeout, persist }: CrosshairRequest): Promise<CrosshairResult | null> {
	await pointerSettled();
	const scene = canvas?.ready ? canvas.scene : null;
	if (!scene) {
		moduleWarn("cannot show a crosshair without a canvas");
		return null;
	}

	const config = foundry.utils.deepClone(source);
	if (config.location)
		resolveAnchor(config.location);

	let shown: ShownCrosshair | undefined;
	const callbacks = {
		[Sequencer.Crosshair.CALLBACKS.SHOW]: (placeable: ShownCrosshair) => {
			shown = placeable;
		},
	};
	const dismiss = () => {
		if (shown && !shown.destroyed)
			shown.destroy();
	};

	let placed: PlacedCrosshair | false;
	try {
		const promise = Sequencer.Crosshair.show(config, callbacks as any) as unknown as Promise<PlacedCrosshair | false>;
		placed = timeout > 0 ? await withCountdown(promise, timeout, dismiss) : await promise;
	} catch (error) {
		moduleError("the crosshair could not be shown", error);
		dismiss();
		return null;
	}
	if (!placed)
		return null;

	const { source: from, target } = placed.getOrientation();
	return {
		x: placed.x,
		y: placed.y,
		direction: placed.direction,
		distance: placed.distance,
		t: placed.t,
		angle: placed.angle,
		width: placed.width,
		sceneId: scene.id,
		source: from,
		target: target ?? null,
		template: persist ? templateData(placed) : undefined,
	};
}

/** Swaps the anchor reference for the placeable on this canvas, or the point it came with. */
function resolveAnchor(location: Record<string, any>): void {
	const ref = location.obj as CrosshairLocationRef | null | undefined;
	const doc = ref?.uuid ? fromUuidSync(ref.uuid) as { parent?: unknown; object?: unknown } | null : null;
	if (doc?.object && doc.parent === canvas.scene) {
		location.obj = doc.object;
		return;
	}

	if (typeof ref?.x === "number" && typeof ref.y === "number") {
		location.obj = { x: ref.x, y: ref.y };
		// Locking to an edge needs the placeable's shape.
		location.lockToEdge = false;
		location.lockToEdgeDirection = false;
		return;
	}

	location.obj = null;
}

function templateData(placed: PlacedCrosshair): Record<string, unknown> {
	const data = placed.toObject();
	delete data._id;
	data.author = game.userId;
	return data;
}

/** Resolves false and calls `onExpire` if `promise` takes longer than `seconds`, with a progress bar meanwhile. */
async function withCountdown<T>(promise: Promise<T>, seconds: number, onExpire: () => void): Promise<T | false> {
	const text = i18n("crosshair.progress");
	const progress = ui.notifications.info(text, { progress: true });
	const start = Date.now();
	const total = seconds * 1000;

	const interval = setInterval(() => {
		const remaining = Math.max(0, total - (Date.now() - start));
		progress.update({
			pct: 1 - remaining / total,
			message: `${text} (${Math.ceil(remaining / 1000)})`,
		});
	}, 250);

	let timer: ReturnType<typeof setTimeout> | undefined;
	const expired = new Promise<false>((resolve) => {
		timer = setTimeout(resolve, total, false);
	});

	try {
		const result = await Promise.race([promise, expired]);
		if (result === false)
			onExpire();
		return result;
	} finally {
		clearInterval(interval);
		clearTimeout(timer);
		progress.update({ pct: 1 });
		ui.notifications.remove(progress);
	}
}

// #endregion
