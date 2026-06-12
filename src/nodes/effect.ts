import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	name?: string;
	// TODO: Create Item+Actor+Token UUID entry and converter from Item and Target to UUID entry
	origin?: string;
}
type TOutputs = {}

class EffectNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "effect";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.trigger-animations.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\ue5d6" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "name",
				type: "text",
				label: this.localize("io.name.title"),
				tooltip: this.localize("io.name.tooltip")
			},
			{
				key: "origin",
				type: "string",
				label: this.localize("io.origin.title"),
				tooltip: this.localize("io.origin.tooltip")
			}
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence = this.getContext<Sequence>("sequence");
		const name = await this.getInputValue("name");
		const origin = await this.getInputValue("origin");
		if (sequence) {
			const effect = sequence.effect();
			if (name) effect.name(name);
			if (origin) effect.origin(origin);
		}
		g.log("Effect Node", { sequence, name });
		g.end();

		return this.executeNext("out");
	}
}

export { EffectNode };