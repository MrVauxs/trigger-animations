import { devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

type TInputs = {
	file: string;
	baseFolder: string;
	mustache: string;
	override: string;
};

class SoundFileNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-file";
	}

	static override get aliases(): string[] {
		return ["file", "baseFolder", "setMustache", "addOverride"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf15b" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{
				key: "baseFolder",
				type: "text",
				...this.io("baseFolder"),
				field: { default: "" }
			},
			{
				key: "file",
				type: "text",
				...this.io("file"),
				field: { default: "" }
			},
			{
				key: "mustache",
				type: "text",
				...this.io("mustache"),
				field: { type: "json" }
			},
			{
				key: "override",
				type: "text",
				...this.io("override"),
				field: { type: "javascript" }
			}
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		const baseFolder = await this.getInputValue("baseFolder");
		if (baseFolder?.trim()) {
			section.baseFolder(baseFolder);
		}

		const file = await this.getInputValue("file");
		if (file?.trim()) {
			section.file(file);
		}

		const mustache = await this.getInputValue("mustache");
		if (mustache?.trim()) {
			try {
				const parsed = JSON.parse(mustache);
				if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
					section.setMustache(parsed);
				}
			} catch (e) {
				devLog(`[${this.type}] invalid JSON for mustache`, e);
			}
		}

		const overrideCode = await this.getInputValue("override");
		if (overrideCode?.trim()) {
			try {
				const fn = new (foundry.utils as any).AsyncFunction("sound", "data", overrideCode);
				section.addOverride(fn);
			} catch (e) {
				devLog(`[${this.type}] invalid override function`, e);
			}
		}
	}
}

export { SoundFileNode };
