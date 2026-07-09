import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	module: string;
};

class ModuleEnabledNode extends TriggerNode<"true" | "false", TInputs, never> {
	static override get type() {
		return "module-enabled" as const;
	}

	static override get category() {
		return "logic";
	}

	// Branches on a condition: 'in' plus a 'true'/'false' bridge, like the built-in logic nodes.
	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return [{ key: "true" }, { key: "false" }];
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [{ key: "module", type: "text", ...this.io("module") }];
	}

	override get headerColor() {
		// Matches the built-in logic nodes' purple header.
		return "#7e18b5";
	}

	override get subtitle(): string | null {
		return null;
	}

	override get icon() {
		// Font Awesome Pro unicode (puzzle-piece), top right corner.
		return { unicode: "\uf12e" };
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

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);

		const id = (await this.getInputValue("module"))?.trim();
		const module = id ? game.modules.get(id) : undefined;
		const enabled = !!module?.active;

		g.log("Module Enabled Node", { id, exists: !!module, enabled });
		g.end();

		return this.executeNext(enabled ? "true" : "false");
	}
}

export { ModuleEnabledNode };
