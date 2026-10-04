import type { CrosshairResult } from "$lib/remoteCrosshair";
import { devLog, whenUserDisconnects } from "$lib/utils";
import { id as moduleId } from "moduleJSON";

export const CROSSHAIR_FLAG = "triggerAnimationsCrosshair";
/** Extra seconds on top of a crosshair timeout, for the round trips to and from the placing user. */
export const CROSSHAIR_SLACK = 5;

const SOCKET_PATH = `module.${moduleId}`;
const RUN_KEY = "crosshair:run";
const COUNT_KEY = "crosshair:counts";
/** Placements that arrive for runs this client never gets to are dropped after this long. */
const RESULT_TTL = 10 * 60 * 1000;

/**
 * Shared by every client running the same local trigger, so they agree on its crosshairs.
 *
 * Only the `authority` (the client that sent the trigger out) asks for crosshairs; it relays
 * each placement to the others over the module socket.
 */
export interface CrosshairRun {
	id: string;
	authority: string;
}

interface ContextNode {
	id: string;
	triggerPath: string;
	getContext: <T>(key: string) => T | undefined;
	setContext: <T>(key: string, value: T) => T;
}

const results = new Map<string, { result: CrosshairResult | null; at: number }>();
const waiters = new Map<string, (result: CrosshairResult | null) => void>();

export function createCrosshairRun(): CrosshairRun {
	return { id: foundry.utils.randomID(), authority: game.userId };
}

export function setCrosshairRun(node: ContextNode, run: unknown): void {
	const candidate = run as Partial<CrosshairRun> | undefined;
	if (typeof candidate?.id === "string" && typeof candidate.authority === "string")
		node.setContext(RUN_KEY, { id: candidate.id, authority: candidate.authority });
}

export function getCrosshairRun(node: ContextNode): CrosshairRun | undefined {
	return node.getContext<CrosshairRun>(RUN_KEY);
}

/**
 * Names one crosshair of a run. Every client executes the same nodes in the same order, so a
 * per-node counter keeps a crosshair inside a loop from picking up another iteration's placement.
 */
export function crosshairRelayKey(node: ContextNode, run: CrosshairRun): string {
	const counts = node.getContext<Map<string, number>>(COUNT_KEY) ?? node.setContext(COUNT_KEY, new Map<string, number>());
	const count = counts.get(node.id) ?? 0;
	counts.set(node.id, count + 1);
	return `${run.id}:${node.triggerPath}:${node.id}:${count}`;
}

export function publishCrosshair(key: string, result: CrosshairResult | null): void {
	devLog("Relaying crosshair placement", key, result);
	game.socket.emit(SOCKET_PATH, { [CROSSHAIR_FLAG]: true, key, result });
}

/** Handle a placement relayed by the authority of a run. */
export function receiveCrosshair(payload: any): void {
	if (typeof payload?.key !== "string")
		return;

	const result = (payload.result ?? null) as CrosshairResult | null;
	const waiter = waiters.get(payload.key);
	if (waiter) {
		waiter(result);
		return;
	}

	// The authority can get there first, e.g. while this client still runs earlier nodes.
	const now = Date.now();
	for (const [key, entry] of results) {
		if (now - entry.at > RESULT_TTL)
			results.delete(key);
	}
	results.set(payload.key, { result, at: now });
}

/**
 * Waits for the authority to relay a placement. Gives up if the authority disconnects or,
 * with a timeout, once it would have given up itself.
 */
export function waitForCrosshair(key: string, authorityId: string, timeout: number): Promise<CrosshairResult | null> {
	const early = results.get(key);
	if (early) {
		results.delete(key);
		return Promise.resolve(early.result);
	}

	const authority = game.users.get(authorityId);
	if (!authority?.active)
		return Promise.resolve(null);

	devLog("Waiting for a relayed crosshair placement", key);
	return new Promise((resolve) => {
		const left = whenUserDisconnects(authority);
		let timer: ReturnType<typeof setTimeout> | undefined;
		const finish = (result: CrosshairResult | null) => {
			waiters.delete(key);
			left.cancel();
			clearTimeout(timer);
			resolve(result);
		};

		waiters.set(key, finish);
		left.promise.then(() => finish(null));
		if (timeout > 0)
			timer = setTimeout(finish, (timeout + CROSSHAIR_SLACK * 2) * 1000, null);
	});
}
