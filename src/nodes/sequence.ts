import { devLog } from "$lib/utils";
import { OutputEntrySchemaSource } from "trigger-engine/src/engine";

const { TriggerNode } = globalThis.triggerEngine;

class StartNode extends TriggerNode {
	static override get type() {
		return "animation-event";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get isEvent() {
		return true;
	}

	static localize(str: string) {
		return `trigger-animations.trigger-animations.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\ue29d" }
	}

	static override get defineOutputs(): OutputEntrySchemaSource[] | null {
		return [
			{
				key: "sequence",
				type: "sequence",
				label: this.localize("io.sequence")
			},
			{
				key: "targets",
				type: "target",
				isArray: true,
				label: this.localize("io.targets")
			},
			{
				key: "sources",
				type: "target",
				isArray: true,
				label: this.localize("io.sources")
			},
			{
				key: "item",
				type: "item",
				label: this.localize("io.item")
			}
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		devLog(`${this.type} execute`, ...args)

		return this.executeNext("out")
	}
}

export { StartNode };