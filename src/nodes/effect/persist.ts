import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type TInputs = {
	persist: boolean;
	persistTokenPrototype: boolean;
	temporary: boolean;
	extraEndDuration: number;
	loops: number;
	loopDelay: number;
	endOnLastLoop: boolean;
};

class PersistNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "persist";
	}

	static override get tags() {
		return super.tags.concat(...["persist", "temporary", "extraEndDuration", "loopOptions"])
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf534" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "persist", type: "boolean", ...this.io("persist"), group: "persist" },
			{
				key: "persistTokenPrototype",
				type: "boolean",
				...this.io("persistTokenPrototype"),
				group: "persist"
			},
			{ key: "temporary", type: "boolean", ...this.io("temporary") },
			{
				key: "extraEndDuration",
				type: "number",
				...this.io("extraEndDuration"),
				field: { default: 0, min: 0 }
			},
			{
				key: "loops",
				type: "number",
				...this.io("loops"),
				group: "loop",
				field: { default: 0, min: 0, step: 1 }
			},
			{
				key: "loopDelay",
				type: "number",
				...this.io("loopDelay"),
				group: "loop",
				field: { default: 0, min: 0 }
			},
			{
				key: "endOnLastLoop",
				type: "boolean",
				...this.io("endOnLastLoop"),
				group: "loop"
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		if (await this.getInputValue("persist")) {
			effect.persist(true, {
				persistTokenPrototype: await this.getInputValue("persistTokenPrototype")
			});
		}

		if (await this.getInputValue("temporary")) {
			// @ts-expect-error TODO: Fix Sequencer Types
			effect.temporary(true);
		}

		const extraEndDuration = await this.getInputValue("extraEndDuration");
		if (extraEndDuration > 0) effect.extraEndDuration(extraEndDuration);

		const loops = await this.getInputValue("loops");
		const loopDelay = await this.getInputValue("loopDelay");
		const endOnLastLoop = await this.getInputValue("endOnLastLoop");
		if (loops > 0 || loopDelay > 0 || endOnLastLoop) {
			// Unset fields equal Sequencer's loopOptions defaults, so passing them raw is safe.
			effect.loopOptions({ loops, loopDelay, endOnLastLoop });
		}
	}
}

export { PersistNode };
