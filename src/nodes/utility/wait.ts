import type { TriggerEngine as T } from "trigger-engine/types";
import { createQueuedSequence } from "$lib/sequenceQueue";
import { devGroup, moduleError } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	min: number;
	max: number;
}
interface TOutputs {}

class WaitNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "wait";
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
		return { unicode: "\uF017" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "min", type: "number", ...this.io("min"), field: { default: 0, min: 0 } },
			{ key: "max", type: "number", ...this.io("max"), field: { default: 0, min: 0 } },
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		if (!sequence) {
			moduleError(`[${this.type}] no Sequence in context`);
			g.end();
			return this.executeNext("out");
		}

		const min = await this.getInputValue("min");
		const max = await this.getInputValue("max");
		// wait() requires values >= 1; skip entirely when nothing meaningful is set.
		if (min > 0 && max > 0)
			sequence.wait(min, max);
		else if (min > 0)
			sequence.wait(min);

		g.log("Wait Node", { min, max });
		g.end();

		return this.executeNext("out");
	}
}

export { WaitNode };
