import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type TInputs = {
	file: string;
	baseFolder: string;
	mustache: string;
}

class FileNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "file";
	}

	static override get tags() {
		return super.tags.concat(...["baseFolder", "file", "setMustache"])
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf1c8" }
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
				field: { type: "json", width: 160 }
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const baseFolder = await this.getInputValue("baseFolder");
		if (baseFolder) effect.baseFolder(baseFolder);

		const file = await this.getInputValue("file");
		if (file) effect.file(file);

		const mustache = this.parseJson(await this.getInputValue("mustache"), "mustache");
		if (mustache) effect.setMustache(mustache);
	}
}

export { FileNode };
