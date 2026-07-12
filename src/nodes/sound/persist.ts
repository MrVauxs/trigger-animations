import type { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

interface TInputs {
	persist: boolean;
	persistTokenPrototype: boolean;
	extraEndDuration: number;
	loops: number;
	loopDelay: number;
	endOnLastLoop: boolean;
}

class SoundPersistNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-persist";
	}

	static override get aliases(): string[] {
		return ["persist", "extraEndDuration", "loopOptions"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF021" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{ key: "persist", type: "boolean", ...this.io("persist"), group: "persist" },
			{
				key: "persistTokenPrototype",
				type: "boolean",
				...this.io("persistTokenPrototype"),
				group: "persist",
			},
			{
				key: "extraEndDuration",
				type: "number",
				...this.io("extraEndDuration"),
				field: { default: 0, min: 0 },
			},
			{
				key: "loops",
				type: "number",
				...this.io("loops"),
				group: "loop",
				field: { default: 0, min: 0, step: 1 },
			},
			{
				key: "loopDelay",
				type: "number",
				...this.io("loopDelay"),
				group: "loop",
				field: { default: 0, min: 0 },
			},
			{
				key: "endOnLastLoop",
				type: "boolean",
				...this.io("endOnLastLoop"),
				group: "loop",
			},
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		if (await this.getInputValue("persist")) {
			section.persist(true, {
				persistTokenPrototype: await this.getInputValue("persistTokenPrototype"),
			});
		}

		const extraEndDuration = await this.getInputValue("extraEndDuration");
		if (extraEndDuration > 0)
			section.extraEndDuration(extraEndDuration);

		const loops = await this.getInputValue("loops");
		const loopDelay = await this.getInputValue("loopDelay");
		const endOnLastLoop = await this.getInputValue("endOnLastLoop");
		if (loops > 0 || loopDelay > 0 || endOnLastLoop) {
			// Unset fields equal Sequencer's loopOptions defaults, so passing them raw is safe.
			// @ts-expect-error Sequencer types
			section.loopOptions({ loops, loopDelay, endOnLastLoop });
		}
	}
}

export { SoundPersistNode };
