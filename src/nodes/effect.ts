import { devGroup, devLog } from "$lib/utils";
import { InputEntrySchemaSource, OutputEntrySchemaSource } from "trigger-engine/src/engine";

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

	static override get defineInputs(): InputEntrySchemaSource[] | null {
		return [
			{
				key: "sequence",
				type: "sequence",
				label: "trigger-animations.trigger-animations.node.event.animation-event.outputs.sequence"
			},
			{
				key: "name",
				type: "text"
			}
		];
	}

	static override get defineOutputs(): OutputEntrySchemaSource[] | null {
		return [
			{
				key: "sequence",
				type: "sequence",
				label: "trigger-animations.trigger-animations.node.event.animation-event.outputs.sequence",
			}
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence: Sequence = await this.getInputValue("sequence");
		const name: string = await this.getInputValue("name");
		if (sequence) {
			const effect = sequence.effect();
			if (name) effect.name(name);
			this.setOutputValue("sequence", effect)
		}
		g.log("Effect Node", { sequence, name });
		g.end();

		return this.executeNext("out");
	}
}

export { EffectNode };