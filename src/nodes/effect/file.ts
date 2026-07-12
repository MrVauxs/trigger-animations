import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	file: string;
	baseFolder: string;
	mustache: string;
}

class FileNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "file";
	}

	static override get aliases(): string[] {
		return ["baseFolder", "file", "setMustache"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF1C8" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "file", type: "text", ...this.io("file") },
			{ key: "baseFolder", type: "text", ...this.io("baseFolder") },
			{
				key: "mustache",
				type: "text",
				...this.io("mustache"),
				field: { type: "json" },
			},
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const baseFolder = await this.getInputValue("baseFolder");
		if (baseFolder)
			effect.baseFolder(baseFolder);

		const file = await this.getInputValue("file");
		if (file)
			effect.file(file);

		const mustache = this.parseJson(await this.getInputValue("mustache"), "mustache");
		if (mustache)
			effect.setMustache(mustache);
	}
}

export { FileNode };
