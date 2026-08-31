import type { TriggerEngine as T } from "trigger-engine/types";
import { createQueuedSequence } from "$lib/sequenceQueue";
import { devGroup, moduleError } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const DEFAULT_ARGS = `{

}`;

interface TInputs {
	macro: string;
	args: string;
}
interface TOutputs {}

class MacroNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs,
	"input"
> {
	static override get type() {
		return "macro";
	}

	static override get category() {
		return "sequence";
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

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF0E7" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "macro", type: "text", ...this.io("macro") },
			{
				key: "args",
				type: "text",
				...this.io("args"),
				field: { type: "json", default: DEFAULT_ARGS },
			},
		];
	}

	static override get defineCustomInputs(): T.CustomInputSchema[] | null {
		return [{ slug: "input", array: true }];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		const macro = await this.getInputValue("macro");
		if (sequence && macro) {
			// macro() takes the macro reference and a single scope object. Start
			// from the JSON args, then add each custom input keyed by its label.
			const scope: Record<string, unknown> = {};

			const raw = await this.getInputValue("args");
			if (raw?.trim()) {
				try {
					const parsed = JSON.parse(raw);
					if (parsed && typeof parsed === "object")
						Object.assign(scope, parsed);
				} catch (e) {
					moduleError(`[${this.type}] invalid args JSON; ignoring`, e);
				}
			}

			for (const { label, value } of await this.getCustomInputs("input")) {
				if (label)
					scope[label] = value;
			}

			sequence.macro(macro, scope);
		}

		g.log("Macro Node", { macro });
		g.end();

		return this.executeNext("out");
	}
}

export { MacroNode };
