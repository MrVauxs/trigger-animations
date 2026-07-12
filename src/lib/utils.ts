import type Document from "@7h3laughingman/foundry-types/common/abstract/document.mjs";
import type BaseUser from "@7h3laughingman/foundry-types/common/documents/user.mjs";

export const dev = import.meta.env.DEV;

export function isValidUpdater(data: Document, update?: Record<string, unknown>): boolean {
	// V13 and earlier compatible
	const isThereAnActiveGM = game.users.activeGM;
	// No GM, see if you can do it yourself.
	if (!isThereAnActiveGM)
		return data.canUserModify(game.user as unknown as BaseUser, "update", update);
	// If there is a GM, you have to be the GM to update.
	return game.users.activeGM?.isSelf || false;
	// >V14
	return game.users.getDesignatedUser(u => data.canUserModify(u as unknown as BaseUser, "update", update))?.isSelf || false;
}

export function log(...args: unknown[]): void {
	console.log("\x1B[1;31mTrigger-Animations:", ...args);
}

export function devLog(...args: unknown[]): void {
	if (dev)
		log(...args);
}

export function moduleError(...args: unknown[]): void {
	console.error("\x1B[1;31mTrigger-Animations:", ...args);
}

export function devGroup(s: string) {
	if (dev) {
		console.groupCollapsed("\x1B[1;31mTrigger-Animations", s);
	}

	return {
		log: dev ? console.log : () => { },
		end: dev ? console.groupEnd : () => { },
	};
}

export function toggleHook(type: "on" | "once", str: string, fn: (...args: any[]) => void) {
	let hook: number;
	return {
		activate: () => { hook = Hooks[type](str, fn); },
		deactivate: () => Hooks.off(str, hook),
	};
}

export function getMajorMinor(version: string): string | null {
	if (typeof version !== "string")
		return null;
	const match = version.match(/^(\d+)\.(\d+)/);
	if (!match || !match[1] || !match[2])
		return null;
	return `${match[1]}.${match[2]}`;
}
