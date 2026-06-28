import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	target?: TargetDocuments | { x: number; y: number };
	duration: number;
	scale: number;
}
type TOutputs = {
	canvasPan?: CanvasPanSection;
}

class CanvasPanNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "canvas-pan";
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
		return this.isEvent ? "#C40000" : "#4a90d9";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf065" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "target", type: "target", ...this.io("target") },
			{
				key: "duration",
				type: "number",
				...this.io("duration"),
				field: { default: 0, min: 0 }
			},
			{
				key: "scale",
				type: "number",
				...this.io("scale"),
				field: { default: 0, min: 0, step: 0.05 }
			}
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "canvasPan",
				type: "canvasPan",
				label: this.localize("io.canvasPan.title"),
				tooltip: this.localize("io.canvasPan.tooltip")
			}
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence = this.getContext<Sequence>("sequence");
		if (!sequence) {
			g.log("Canvas Pan Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}

		const canvasPan = sequence.canvasPan();
		this.setOutputValue("canvasPan", canvasPan);

		const targetInput = await this.getInputValue("target");
		const target = targetInput ? this.getLocation(targetInput) : undefined;
		if (target) canvasPan.atLocation(target as any);

		const duration = await this.getInputValue("duration");
		if (duration > 0) canvasPan.duration(duration);

		const scale = await this.getInputValue("scale");
		if (scale > 0) canvasPan.scale(scale);

		g.log("Canvas Pan Node", { sequence, target, duration, scale, canvasPan });
		g.end();

		return this.executeNext("out");
	}

	getLocation(loc: TargetDocuments | Point): TokenDocument | Point | undefined {
		if (typeof loc === "object" && "x" in loc && "y" in loc) {
			return { x: (loc as Point).x, y: (loc as Point).y };
		}
		return this.getTargetToken(loc as TargetDocuments);
	}
}

export { CanvasPanNode };
