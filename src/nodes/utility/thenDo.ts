import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

const DEFAULT_SCRIPT = `/**
 * Runs as a step in the sequence.
 * \`this\` is the Sequence, so you can extend it from here.
 *
 * @param {unknown[]} inputs - the values from this node's custom inputs
 * @this {Sequence}
 * @returns {void | Promise<void>}
 *
 * @example
 * const token = inputs[0];
 * this.effect().file("jb2a.explosion.01").atLocation(token);
 */
`;

type TInputs = {
	code: string;
}
type TOutputs = {}

class ThenDoNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs,
	"input"
> {
	static override get type() {
		return "then-do";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`
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
		return { unicode: "\uf121" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "code",
				type: "text",
				...this.io("code"),
				field: { type: "javascript", default: DEFAULT_SCRIPT }
			}
		];
	}

	static override get defineCustomInputs(): T.CustomInputSchema[] | null {
		return [{ slug: "input", array: true }];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence = this.getContext<Sequence>("sequence");
		const code = await this.getInputValue("code");
		if (sequence && code?.trim()) {
			const inputs = await this.getCustomInputsValues("input");
			try {
				const fn = new (foundry.utils as any).AsyncFunction("inputs", code);
				sequence.thenDo(function (this: Sequence) {
					return fn.call(this, inputs);
				});
			} catch (e) {
				devLog(`[${this.type}] invalid function; skipping`, e);
			}
		}

		g.log("Then Do Node", { code });
		g.end();

		return this.executeNext("out");
	}
}

export { ThenDoNode };
