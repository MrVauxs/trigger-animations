import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	module: string;
	key: string;
};

class GetSettingNode extends TriggerNode<never, TInputs, never, never, "output"> {
	static override get type() {
		return "get-setting" as const;
	}

	static override get category() {
		return "value";
	}

	// Query node: no incoming bridge nor outgoing bridges, only custom outputs.
	static override get hasIn(): boolean {
		return false;
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return null;
	}

	override get headerColor() {
		return "#6b5646";
	}

	override get icon() {
		// Font Awesome Pro unicode (gear), top right corner.
		return { unicode: "\uf013" };
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	static io(key: string) {
		return {
			label: this.localize(`io.${key}.title`),
			tooltip: this.localize(`io.${key}.tooltip`),
		};
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "module", type: "text", ...this.io("module") },
			{ key: "key", type: "text", ...this.io("key") }
		];
	}

	// The node has no fixed outputs; users add their own and choose its type.
	// Each output's `input` is an optional property path into the setting value.
	static override get defineCustomOutputs(): T.BuiltinsCustomEntry[] | null {
		return [
			{
				slug: "output",
				types: ["boolean", "number", "text", "any"],
				array: true,
				label: this.localize("io.output.title"),
				tooltip: this.localize("io.output.tooltip")
			}
		];
	}

	override async _query(key: string): Promise<any> {
		const g = devGroup(`[Query] ${this.type}`);

		const setting = this.#getSetting(
			await this.getInputValue("module"),
			await this.getInputValue("key")
		);

		g.log("Get Setting Node", { key, setting });
		g.end();

		return setting;
	}

	#getSetting(module: string, key: string): unknown {
		if (!module || !key) return undefined;
		try {
			return game.settings.get(module, key);
		} catch {
			return undefined;
		}
	}
}

export { GetSettingNode };
