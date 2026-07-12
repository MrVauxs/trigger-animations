import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	belowTokens: boolean;
	belowTiles: boolean;
	aboveLighting: boolean;
	aboveInterface: boolean;
	zIndex: number;
	sortLayer: number;
	elevation: number;
	elevationTop: number;
	absolute: boolean;
	topInclusive: boolean;
	levels: string;
}

class LayerNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "layer";
	}

	static override get aliases(): string[] {
		return ["belowTokens", "belowTiles", "aboveLighting", "aboveInterface", "zIndex", "sortLayer", "elevation", "onLevels"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF5FD" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "belowTokens", type: "boolean", ...this.io("belowTokens") },
			{ key: "belowTiles", type: "boolean", ...this.io("belowTiles") },
			{ key: "aboveLighting", type: "boolean", ...this.io("aboveLighting") },
			{ key: "aboveInterface", type: "boolean", ...this.io("aboveInterface") },
			{ key: "zIndex", type: "number", ...this.io("zIndex"), field: { default: 0, step: 1 } },
			{
				key: "sortLayer",
				type: "number",
				...this.io("sortLayer"),
				field: { default: 0, step: 1 },
			},
			{
				key: "elevation",
				type: "number",
				...this.io("elevation"),
				group: "elevation",
				field: { default: 0 },
			},
			{
				key: "elevationTop",
				type: "number",
				...this.io("elevationTop"),
				group: "elevation",
				field: { default: 0 },
			},
			{ key: "absolute", type: "boolean", ...this.io("absolute"), group: "elevation" },
			{
				key: "topInclusive",
				type: "boolean",
				...this.io("topInclusive"),
				group: "elevation",
			},
			{ key: "levels", type: "text", ...this.io("levels") },
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		if (await this.getInputValue("belowTokens"))
			effect.belowTokens(true);
		if (await this.getInputValue("belowTiles"))
			effect.belowTiles(true);
		if (await this.getInputValue("aboveLighting"))
			effect.aboveLighting(true);
		if (await this.getInputValue("aboveInterface")) {
			// @ts-expect-error TODO: Fix Sequencer Types
			effect.aboveInterface(true);
		}

		const zIndex = await this.getInputValue("zIndex");
		if (zIndex !== 0)
			effect.zIndex(zIndex);

		const sortLayer = await this.getInputValue("sortLayer");
		if (sortLayer !== 0)
			effect.sortLayer(sortLayer);

		const elevation = await this.getInputValue("elevation");
		const elevationTop = await this.getInputValue("elevationTop");
		const absolute = await this.getInputValue("absolute");
		if (elevationTop !== 0) {
			effect.elevation([elevation, elevationTop], {
				absolute,
				topInclusive: await this.getInputValue("topInclusive"),
			});
		} else if (elevation !== 0 || absolute) {
			effect.elevation(elevation, { absolute });
		}

		const levels = await this.getInputValue("levels");
		if (levels) {
			const list = levels.split(",").map(s => s.trim()).filter(Boolean);
			if (list.length === 1)
				effect.onLevels(list[0]!);
			else if (list.length)
				effect.onLevels(list);
		}
	}
}

export { LayerNode };
