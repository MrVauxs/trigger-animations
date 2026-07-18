import type { TriggerEngine as T } from "trigger-engine/types";
import { devLog, log } from "$lib/utils";
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

	static override get states(): string[] {
		return ["default", "advanced"];
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "baseFolder", type: "text", ...this.io("baseFolder"), field: { default: "" } },
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
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const baseFolder = await this.getInputValue("baseFolder");
		if (baseFolder.trim())
			effect.baseFolder(baseFolder);

		const file = await this.getInputValue("file");
		if (file?.trim()) {
			if (this.state === "default") {
				effect.file(file);
			} else {
				try {
					const parsed = JSON.parse(file);
					if (parsed) {
						effect.file(parsed);
					}
				} catch (e) {
					devLog(`[${this.type}] invalid JSON for file`, e);
				}
			}
		}

		const mustache = await this.getInputValue("mustache");
		if (mustache) {
			try {
				const parsed = this.state === "default" ? JSON.parse(mustache) : mustache;
				if (parsed && typeof parsed === "object") {
					effect.setMustache(parsed);
				} else {
					log(`[${this.type}] invalid object for mustache`, mustache);
				}
			} catch (e) {
				log(`[${this.type}] invalid object for mustache`, e, mustache);
			}
		}
	}
}

export { FileNode };
