import type { TriggerEngine as T } from "trigger-engine/types";
import { defineNamedLocation } from "$lib/namedLocations";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	name?: string;
}
interface TOutputs {
	crosshair?: CrosshairSection;
	positionName?: string;
}

class CrosshairNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "crosshair";
	}

	static override get category() {
		return "sequence";
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#b8860b";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF140" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "name",
				type: "text",
				label: this.localize("io.name.title"),
				tooltip: this.localize("io.name.tooltip"),
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "crosshair",
				type: "crosshair",
				label: this.localize("io.crosshair.title"),
				tooltip: this.localize("io.crosshair.tooltip"),
			},
			{
				key: "positionName",
				type: "text",
				label: this.localize("io.positionName.title"),
				tooltip: this.localize("io.positionName.tooltip"),
			},
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = this.getContext<Sequence>("sequence");
		if (!sequence) {
			g.log("Crosshair Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}

		const name = await this.getInputValue("name");
		if (name) {
			const crosshair = new Sequence().crosshair(name);
			defineNamedLocation(this, name);
			this.setOutputValue("crosshair", crosshair);
			this.setOutputValue("positionName", name);
			sequence.thenDo(() => {
				// TODO: ughhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
				triggerAnimations.api.query(this.userContext, "showCrosshair", {});
			});

			g.log("Crosshair Node", { sequence, name, crosshair });
			g.end();
		} else {
			g.log("Crosshair Node", "no Name provided to Crosshair node!");
			g.end();
		}

		return this.executeNext("out");
	}
}

export { CrosshairNode };
