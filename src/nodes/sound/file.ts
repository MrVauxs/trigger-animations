import type { TriggerEngine as T } from "trigger-engine/types";
import { log } from "$lib/utils";
import { SoundModifierNode } from "./base";

interface TInputs {
	file: string;
	baseFolder: string;
	mustache: string;
	override: string;
}

class SoundFileNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-file";
	}

	static override get aliases(): string[] {
		return ["file", "baseFolder", "setMustache", "addOverride"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF15B" };
	}

	static override get states(): string[] {
		return ["default", "advanced"];
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{
				key: "baseFolder",
				type: "text",
				...this.io("baseFolder"),
				field: { default: "" },
			},
			{
				key: "file",
				type: "text",
				...this.io("file"),
				field: { default: "" },
			},
			{
				key: "file",
				type: "text",
				state: "advanced",
				...this.io("fileAdv"),
				field: { type: "json", default: "[\"\"]" },
			},
			{
				key: "mustache",
				type: "text",
				...this.io("mustache"),
				field: { type: "json" },
			},
			{
				key: "mustache",
				type: "any",
				state: "advanced",
				...this.io("mustacheAdv"),
			},
			{
				key: "override",
				type: "text",
				...this.io("override"),
				field: { type: "javascript" },
			},
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		const baseFolder = await this.getInputValue("baseFolder");
		if (baseFolder?.trim()) {
			section.baseFolder(baseFolder);
		}

		const file = await this.getInputValue("file");
		if (file?.trim()) {
			if (this.state === "default") {
				section.file(file);
			} else {
				try {
					const parsed = JSON.parse(file);
					if (parsed) {
						section.file(parsed);
					}
				} catch (e) {
					log(`[${this.type}] invalid JSON for file`, e);
				}
			}
		}

		const mustache = await this.getInputValue("mustache");
		if (mustache) {
			try {
				const parsed = this.state === "default" ? JSON.parse(mustache) : mustache;
				if (parsed && typeof parsed === "object") {
					section.setMustache(parsed);
				} else {
					log(`[${this.type}] invalid object for mustache`, mustache);
				}
			} catch (e) {
				log(`[${this.type}] invalid object for mustache`, e, mustache);
			}
		}

		const overrideCode = await this.getInputValue("override");
		if (overrideCode?.trim()) {
			try {
				const fn = new (foundry.utils as any).AsyncFunction("sound", "data", overrideCode);
				section.addOverride(fn);
			} catch (e) {
				log(`[${this.type}] invalid override function`, e);
			}
		}
	}
}

export { SoundFileNode };
