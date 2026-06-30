import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

class GetQualityNode extends TriggerNode<
	"minimal" | "low" | "medium" | "high",
	never,
	never
> {
	static override get type() {
		return "get-quality" as const;
	}

	static override get category() {
		return "value";
	}

	// Query node: no incoming bridge nor outgoing bridges, only custom outputs.
	static override get hasIn(): boolean {
		return true;
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return [
			{ key: "minimal", ...this.io("output.minimal") },
			{ key: "low", ...this.io("output.low") },
			{ key: "medium", ...this.io("output.medium") },
			{ key: "high", ...this.io("output.high") }
		];
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

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);

		const setting = this.#getSetting(
			"trigger-animations",
			"quality"
		) as "minimal" | "low" | "medium" | "high";

		g.log("Get Quality Node", { setting });
		g.end();

		return this.executeNext(setting);
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

export { GetQualityNode };
