import { TriggerEngine as T } from "trigger-engine/types";
import { AnimationModifierNode } from "./base";

type TInputs = {
	duration: number;
	tint: `#${string}`;
	preset: string;
};

class AnimationMiscNode extends AnimationModifierNode<TInputs> {
	static override get type() {
		return "anim-misc";
	}

	static override get aliases(): string[] {
		return ["duration", "tint", "preset"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf0ad" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.animationInput,
			{
				key: "duration",
				type: "number",
				...this.sharedIo("duration"),
				field: { default: 0, min: 0 }
			},
			{ key: "tint", type: "text", ...this.io("tint") },
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

	protected override async apply(section: AnimationSection): Promise<void> {
		const duration = await this.getInputValue("duration");
		if (duration > 0) section.duration(duration);

		const tint = await this.getInputValue("tint");
		if (tint) section.tint(tint);

		const preset = await this.getInputValue("preset");
		if (preset) section.preset(preset);
	}
}

export { AnimationMiscNode };
