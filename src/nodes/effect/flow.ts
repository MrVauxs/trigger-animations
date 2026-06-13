import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

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
};

class FlowNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "flow";
	}

	static override get tags() {
		return super.tags.concat(...["timing", "time", "control", "delay", "wait", "repeat", "async", "playIf"])
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf550" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
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
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		if (await this.getInputValue("waitUntilFinished")) {
			const min = await this.getInputValue("waitDelayMin");
			const max = await this.getInputValue("waitDelayMax");
			if (max !== 0) effect.waitUntilFinished(min, max);
			else if (min !== 0) effect.waitUntilFinished(min);
			else effect.waitUntilFinished();
		}

		if (await this.getInputValue("async")) effect.async();

		const delayMin = await this.getInputValue("delayMin");
		const delayMax = await this.getInputValue("delayMax");
		if (delayMax > 0) effect.delay(delayMin, delayMax);
		else if (delayMin > 0) effect.delay(delayMin);

		const repeats = await this.getInputValue("repeats");
		if (repeats > 0) {
			const repeatDelayMin = await this.getInputValue("repeatDelayMin");
			const repeatDelayMax = await this.getInputValue("repeatDelayMax");
			if (repeatDelayMax > 0) effect.repeats(repeats, repeatDelayMin, repeatDelayMax);
			else effect.repeats(repeats, repeatDelayMin);
		}

		effect.playIf(await this.getInputValue("playIf"));
	}
}

export { FlowNode };
