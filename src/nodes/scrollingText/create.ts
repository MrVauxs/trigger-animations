import type { TriggerEngine as T } from "trigger-engine/types";
import { createQueuedSequence } from "$lib/sequenceQueue";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	target?: TargetDocuments | { x: number; y: number };
	text?: string;
	textStyle?: string;
}
interface TOutputs {
	scrollingText?: ScrollingTextSection;
}

class ScrollingTextNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "scrolling-text";
	}

	static override get category() {
		return "sequence";
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#c97bd4";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF035" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "target", type: "target", ...this.io("target") },
			{ key: "text", type: "text", ...this.io("text") },
			{
				key: "textStyle",
				type: "text",
				...this.io("textStyle"),
				field: { type: "json" },
			},
		];
	}

	static io(key: string) {
		return {
			label: this.localize(`io.${key}.title`),
			tooltip: this.localize(`io.${key}.tooltip`),
		};
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "scrollingText",
				type: "scrollingText",
				label: this.localize("io.scrollingText.title"),
				tooltip: this.localize("io.scrollingText.tooltip"),
			},
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		if (!sequence) {
			g.log("Scrolling Text Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}

		const scrollingText = sequence.scrollingText();
		this.setOutputValue("scrollingText", scrollingText);

		const targetInput = await this.getInputValue("target");
		const target = targetInput ? this.getLocation(targetInput) : undefined;
		if (target)
			scrollingText.atLocation(target);

		const text = await this.getInputValue("text");
		if (text) {
			let style: object | undefined;
			const raw = await this.getInputValue("textStyle");
			if (raw?.trim()) {
				try {
					style = JSON.parse(raw);
				} catch { /* ignore bad json */ }
			}
			scrollingText.text(text, style);
		}

		g.log("Scrolling Text Node", { sequence, target, text, scrollingText });
		g.end();

		return this.executeNext("out");
	}

	getLocation(loc: TargetDocuments | Point): TokenDocument | Point | undefined {
		if (typeof loc === "object" && "x" in loc && "y" in loc) {
			return { x: (loc).x, y: (loc).y };
		}
		return this.getTargetToken(loc);
	}
}

export { ScrollingTextNode };
