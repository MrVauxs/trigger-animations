import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	file?: string;
	name?: string;
}
type TOutputs = {
	sound?: SoundSection;
}

class SoundNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "sound";
	}

	static override get tags() {
		return ["animation", "sound"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.trigger-animations.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#2e8b57";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf001" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "file",
				type: "text",
				label: this.localize("io.file.title"),
				tooltip: this.localize("io.file.tooltip")
			},
			{
				key: "name",
				type: "text",
				label: this.localize("io.name.title"),
				tooltip: this.localize("io.name.tooltip")
			}
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "sound",
				type: "sound",
				label: this.localize("io.sound.title"),
				tooltip: this.localize("io.sound.tooltip")
			}
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence = this.getContext<Sequence>("sequence");
		if (!sequence) {
			g.log("Sound Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}

		const file = await this.getInputValue("file");
		const sound = sequence.sound(file || undefined);
		this.setOutputValue("sound", sound);

		const name = await this.getInputValue("name");
		if (name) sound.name(name);

		g.log("Sound Node", { sequence, file, name, sound });
		g.end();

		return this.executeNext("out");
	}
}

export { SoundNode };
