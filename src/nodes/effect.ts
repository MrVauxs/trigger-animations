import { devLog } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

class EffectNode extends TriggerNode {
	static override get type() {
		return "effect";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get category() {
		return "sequence"
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\ue5d6" }
	}

	override _execute(...args: any[]): Promise<boolean> {
		devLog(`${this.type} execute`, ...args)

		return Promise.resolve(true);
	}
}

export { EffectNode };