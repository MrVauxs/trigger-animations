import type { TriggerEngine as T } from "trigger-engine/types";
import { requestNamedLocation } from "$lib/namedLocations";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	target?: PositionSource;
	duration: number;
	scale: number;
}
interface TOutputs {
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
		return this.isEvent ? "#C40000" : "#4a90d9";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF065" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "target", type: "position", ...this.io("target") },
			{
				key: "duration",
				type: "number",
				...this.io("duration"),
				field: { default: 0, min: 0 },
			},
			{
				key: "scale",
				type: "number",
				...this.io("scale"),
				field: { default: 0, min: 0 },
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "canvasPan",
				type: "canvasPan",
				label: this.localize("io.canvasPan.title"),
				tooltip: this.localize("io.canvasPan.tooltip"),
			},
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
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
		if (target)
			canvasPan.atLocation(target);

		const duration = await this.getInputValue("duration");
		if (duration > 0)
			canvasPan.duration(duration);

		const scale = await this.getInputValue("scale");
		if (scale > 0)
			canvasPan.scale(scale);

		g.log("Canvas Pan Node", { sequence, target, duration, scale, canvasPan });
		g.end();

		return this.executeNext("out");
	}

	getLocation(loc: PositionSource | Point | undefined): TokenDocument | Point | RegionDocument | string | undefined {
		if (!loc)
			return loc;
		// Points state feeds a raw Point (type: "point"); targets state feeds a PositionSource (type: "position").
		if (!("kind" in loc))
			return { x: loc.x, y: loc.y };

		switch (loc?.kind) {
			case "point":
				return { x: loc.x, y: loc.y };
			case "region":
				return loc.region;
			case "target":
				return this.getTargetToken({ actor: loc.actor, token: loc.token });
			case "name":
				requestNamedLocation(this, loc.name);
				return loc.name;
		}
	}
}

export { CanvasPanNode };
