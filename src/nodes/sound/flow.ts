import { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

type TInputs = {
	playIf: boolean;
	async: boolean;
	waitUntilFinished: boolean;
	waitDelayMin: number;
	waitDelayMax: number;
	delayMin: number;
	delayMax: number;
	repeats: number;
	repeatDelayMin: number;
	repeatDelayMax: number;
	preset: string;
};

class SoundFlowNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-flow";
	}

	static override get aliases(): string[] {
		return ["waitUntilFinished", "async", "delay", "repeats", "playIf", "preset"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf550" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{ key: "playIf", type: "boolean", ...this.io("playIf"), field: { default: true } },
			{ key: "async", type: "boolean", ...this.io("async") },
			{ key: "waitUntilFinished", type: "boolean", ...this.io("waitUntilFinished"), group: "wait" },
			{
				key: "waitDelayMin",
				type: "number",
				...this.io("waitDelayMin"),
				group: "wait",
				field: { default: 0 }
			},
			{
				key: "waitDelayMax",
				type: "number",
				...this.io("waitDelayMax"),
				group: "wait",
				field: { default: 0 }
			},
			{
				key: "delayMin",
				type: "number",
				...this.io("delayMin"),
				group: "delay",
				field: { default: 0, min: 0 }
			},
			{
				key: "delayMax",
				type: "number",
				...this.io("delayMax"),
				group: "delay",
				field: { default: 0, min: 0 }
			},
			{
				key: "repeats",
				type: "number",
				...this.io("repeats"),
				group: "repeat",
				field: { default: 0, min: 0, step: 1 }
			},
			{
				key: "repeatDelayMin",
				type: "number",
				...this.io("repeatDelayMin"),
				group: "repeat",
				field: { default: 0, min: 0 }
			},
			{
				key: "repeatDelayMax",
				type: "number",
				...this.io("repeatDelayMax"),
				group: "repeat",
				field: { default: 0, min: 0 }
			},
			{
				key: "preset",
				type: "text",
				...this.io("preset"),
				field: {
					type: "select",
					default: Sequencer.Presets.getAll().keys().toArray()[0],
					options: Sequencer.Presets.getAll().keys().toArray()
				}
			}
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		if (await this.getInputValue("waitUntilFinished")) {
			const min = await this.getInputValue("waitDelayMin");
			const max = await this.getInputValue("waitDelayMax");
			if (max !== 0) section.waitUntilFinished(min, max);
			else if (min !== 0) section.waitUntilFinished(min);
			else section.waitUntilFinished();
		}

		if (await this.getInputValue("async")) section.async();

		const delayMin = await this.getInputValue("delayMin");
		const delayMax = await this.getInputValue("delayMax");
		if (delayMax > 0) section.delay(delayMin, delayMax);
		else if (delayMin > 0) section.delay(delayMin);

		const repeats = await this.getInputValue("repeats");
		if (repeats > 0) {
			const repeatDelayMin = await this.getInputValue("repeatDelayMin");
			const repeatDelayMax = await this.getInputValue("repeatDelayMax");
			if (repeatDelayMax > 0) section.repeats(repeats, repeatDelayMin, repeatDelayMax);
			else section.repeats(repeats, repeatDelayMin);
		}

		section.playIf(await this.getInputValue("playIf"));

		const preset = await this.getInputValue("preset");
		if (preset) section.preset(preset);
	}
}

export { SoundFlowNode };
