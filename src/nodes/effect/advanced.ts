import { devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type TInputs = {
	override: string;
	syncGroup: string;
	preset: string;
	presetArgs: string;
	isometric: boolean;
	isometricOverlay: boolean;
};

class AdvancedNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "advanced";
	}

	static override get tags() {
		return super.tags.concat(...["addOverride", "syncGroup", "preset", "isometric"])
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf085" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{
				key: "override",
				type: "text",
				...this.io("override"),
				field: { type: "javascript" }
			},
			{ key: "syncGroup", type: "text", ...this.io("syncGroup") },
			{ key: "preset", type: "text", ...this.io("preset"), group: "preset" },
			{
				key: "presetArgs",
				type: "text",
				...this.io("presetArgs"),
				group: "preset",
				field: { type: "json" }
			},
			{ key: "isometric", type: "boolean", ...this.io("isometric"), group: "isometric" },
			{
				key: "isometricOverlay",
				type: "boolean",
				...this.io("isometricOverlay"),
				group: "isometric"
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const code = await this.getInputValue("override");
		if (code?.trim()) {
			try {
				// The override receives (effect, data) and must return data.
				const fn = new (foundry.utils.AsyncFunction)("effect", "data", code);
				effect.addOverride(fn);
			} catch (e) {
				devLog(`[${this.type}] invalid override function; skipping`, e);
			}
		}

		const syncGroup = await this.getInputValue("syncGroup");
		if (syncGroup) effect.syncGroup(syncGroup);

		const preset = await this.getInputValue("preset");
		if (preset) {
			const args = this.parseJson<unknown[]>(await this.getInputValue("presetArgs"), "presetArgs");
			effect.preset(preset, ...(Array.isArray(args) ? args : []));
		}

		if (await this.getInputValue("isometric")) {
			// @ts-expect-error Sequencer types
			effect.isometric({
				overlay: await this.getInputValue("isometricOverlay")
			});
		}
	}
}

export { AdvancedNode };
