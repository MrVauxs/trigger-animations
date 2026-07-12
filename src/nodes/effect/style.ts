import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";
import { BLEND_MODE_OPTIONS, FILTER_OPTIONS } from "./constants";

type TInputs = {
	tint: `#${string}`;
	blendMode: string;
	filterType: string;
	filterData: string;
	filterName: string;
};

class StyleNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "style";
	}

	static override get aliases(): string[] {
		return ["tint", "blendMode", "filter"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf53f" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "tint", type: "text", ...this.io("tint") },
			{
				key: "blendMode",
				type: "text",
				...this.io("blendMode"),
				field: { type: "select", default: "normal", options: BLEND_MODE_OPTIONS }
			},
			{
				key: "filterType",
				type: "text",
				...this.io("filterType"),
				group: "filter",
				field: { type: "select", default: "", options: FILTER_OPTIONS }
			},
			{
				key: "filterData",
				type: "text",
				...this.io("filterData"),
				group: "filter",
				field: { type: "json" }
			},
			{ key: "filterName", type: "text", ...this.io("filterName"), group: "filter" }
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const tint = await this.getInputValue("tint");
		if (tint) effect.tint(tint);

		const blendMode = await this.getInputValue("blendMode");
		if (blendMode && blendMode !== "normal") effect.blendMode(blendMode);

		const filterType = await this.getInputValue("filterType");
		if (filterType) {
			const data = this.parseJson(await this.getInputValue("filterData"), "filterData");
			const name = await this.getInputValue("filterName");
			effect.filter(filterType, data ?? {}, name || undefined);
		}
	}
}

export { StyleNode };
