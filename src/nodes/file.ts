import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	file: string;
	effect: EffectSection;
}
type TOutputs = {}

class FileNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "file";
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
		return { unicode: "\uf1c8" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "effect",
				type: "effect",
				label: this.localize("io.effect.title"),
				tooltip: this.localize("io.effect.tooltip")
			},
			{
				key: "file",
				type: "text",
				label: this.localize("io.file.title"),
				tooltip: this.localize("io.file.tooltip")
			}
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const effect = await this.getInputValue("effect");
		const file = await this.getInputValue("file");
		if (effect) {
			if (file) effect.file(file);
		}
		g.log("Effect Node", { effect, file });
		g.end();

		return this.executeNext("out");
	}
}

export { FileNode };