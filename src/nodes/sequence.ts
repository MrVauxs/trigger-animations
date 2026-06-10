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
				key: "targets",
				type: "target",
				isArray: true,
				label: "trigger-animations.trigger-animations.node.event.animation-event.outputs.targets"
			},
			{
				key: "sources",
				type: "target",
				isArray: true,
				label: "trigger-animations.trigger-animations.node.event.animation-event.outputs.sources"
			}
		];
	}

	override _execute(...args: any[]): Promise<boolean> {
		devLog(`${this.type} execute`, ...args)

		return this.executeNext("out", new Sequence())
	}
}

export { StartNode };