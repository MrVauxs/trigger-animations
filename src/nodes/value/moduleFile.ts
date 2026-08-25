import type { TriggerEngine as T } from "trigger-engine/types";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	patreon: string;
	free: string;
	module1: string;
	file1: string;
	module2: string;
	file2: string;
}

interface TOutputs {
	value: string;
}

type TState = "jb2a" | "custom";

class ModuleFileNode extends TriggerNode<never, TInputs, TOutputs, never, never, TState> {
	static override get type() {
		return "module-file" as const;
	}

	static override get category() {
		return "value";
	}

	static override get aliases() {
		return ["jb2a"];
	}

	static override get states(): string[] | null {
		return ["jb2a", "custom"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	// Query node: no incoming bridge nor outgoing bridges, only outputs.
	static override get hasIn(): boolean {
		return false;
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return null;
	}

	override get headerColor() {
		return "#6b5646";
	}

	override get subtitle(): string | null {
		return this.localize(`subtitle.${this.state}`) ?? super.subtitle;
	}

	override get icon() {
		// Font Awesome Pro unicode (puzzle-piece), top right corner.
		return { unicode: "\uF12E" };
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
			{ key: "patreon", type: "text", ...this.io("patreon"), state: "jb2a" },
			{ key: "free", type: "text", ...this.io("free"), state: "jb2a" },
			{ key: "module1", type: "text", ...this.io("module1"), state: "custom" },
			{ key: "file1", type: "text", ...this.io("file1"), state: "custom" },
			{ key: "module2", type: "text", ...this.io("module2"), state: "custom" },
			{ key: "file2", type: "text", ...this.io("file2"), state: "custom" },
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [{ key: "value", type: "text", ...this.io("value") }];
	}

	override async _query(key: string): Promise<TOutputs["value"] | undefined> {
		const g = devGroup(`[Query] ${this.type}`);

		const pairs: [string, () => Promise<string | undefined>][]
			= this.state === "custom"
				? [
						[(await this.getInputValue("module1"))?.trim() ?? "", () => this.getInputValue("file1")],
						[(await this.getInputValue("module2"))?.trim() ?? "", () => this.getInputValue("file2")],
						// Technically this means you could do custom inputs but I'd need a way to make it always add two.
					]
				: [
						["jb2a_patreon", () => this.getInputValue("patreon")],
						["JB2A_DnD5e", () => this.getInputValue("free")],
					];

		let result: string | undefined;
		for (const [id, getFile] of pairs) {
			if (!id || !game.modules.get(id)?.active)
				continue;
			result = await getFile();
			break;
		}

		g.log("Module File Node", { key, state: this.state, checked: pairs.map(([id]) => id), result });
		g.end();

		return result;
	}
}

export { ModuleFileNode };
