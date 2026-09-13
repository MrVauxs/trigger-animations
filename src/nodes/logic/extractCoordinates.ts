import type { TriggerEngine as T } from "trigger-engine/types";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	target?: TargetDocuments;
}

interface TOutputs {
	coordinates?: Point;
}

/**
 * Captures a target's current canvas coordinates as a point.
 *
 * Resolving the token while this node executes is intentional. The resulting point is detached from the target so it gets effectively cached.
 */
class ExtractCoordinatesNode extends TriggerNode<"out", TInputs, TOutputs> {
	static override get type() {
		return "extract-coordinates";
	}

	static override get category() {
		return "extractor";
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

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [{ key: "target", type: "target", ...this.io("target") }];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [{ key: "coordinates", type: "point", ...this.io("coordinates") }];
	}

	override get headerColor() {
		return "#86910d";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode (crosshairs), top right corner.
		return { unicode: "\uF05B" };
	}

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const target = await this.getInputValue("target");
		const token = this.getTargetToken(target);

		if (token) {
			const coordinates = { x: token.x, y: token.y };
			this.setOutputValue("coordinates", coordinates);
			g.log("Extract Coordinates Node", { coordinates });
		} else {
			g.log("Extract Coordinates Node", "no target token");
		}

		g.end();
		return this.executeNext("out");
	}
}

export { ExtractCoordinatesNode };
