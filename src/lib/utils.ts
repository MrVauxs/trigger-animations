import type Document from "@7h3laughingman/foundry-types/common/abstract/document.mjs";

export const dev = import.meta.env.DEV;

export function isValidUpdater(data: Document, update?: Record<string, unknown>): boolean {
	// V13 and earlier compatible
	const isThereAnActiveGM = game.users.activeGM;
	// No GM, see if you can do it yourself.
	if (!isThereAnActiveGM) return data.canUserModify(game.user, "update", update);
	// If there is a GM, you have to be the GM to update.
	return game.users.activeGM?.isSelf || false;
	// >V14
	return game.users.getDesignatedUser((u => data.canUserModify(u, "update", update)))?.isSelf || false;
}

export function devLog(...args: unknown[]): void {
	if (dev) console.log("\x1B[1;31mTrigger-Animations:", ...args);
}

export function devGroup(s: string) {
	if (dev) {
		console.groupCollapsed("\x1B[1;31mTrigger-Animations", s);
	}

	return {
		log: dev ? console.log : () => { },
		end: dev ? console.groupEnd : () => { }
	}
}
