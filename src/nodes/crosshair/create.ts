import type { TriggerEngine as T } from "trigger-engine/types";
import { CrosshairBuilder } from "$lib/crosshairBuilder";
import { defineNamedLocation } from "$lib/namedLocations";
import { crosshairNamedLocation, resolveCrosshair } from "$lib/remoteCrosshair";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	name?: string;
	user?: User;
	timeout: number;
}
interface TOutputs {
	crosshair?: CrosshairBuilder;
	positionName?: string;
	location?: Point;
	direction?: number;
	distance?: number;
}

/**
 * Has a user place a crosshair while the trigger runs, so everything after it is built around a known placement.
 *
 * Modifier nodes go on the Configure output, which finishes before the crosshair is shown.
 */
class CrosshairNode extends TriggerNode<
	"configure" | "placed" | "cancelled",
	TInputs,
	TOutputs
> {
	static TIMEOUT: number = 0;

	static override get type() {
		return "crosshair";
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
		return this.isEvent ? "#C40000" : "#b8860b";
	}

	override get isEmit() {
		return true;
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "" };
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return [
			{ key: "configure", ...this.io("configure") },
			{ key: "placed", ...this.io("placed") },
			{ key: "cancelled", ...this.io("cancelled") },
		];
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "name", type: "text", ...this.io("name") },
			{ key: "user", type: "user", ...this.io("user") },
			{ key: "timeout", type: "number", ...this.io("timeout"), field: { default: this.TIMEOUT, min: 0 } },
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{ key: "crosshair", type: "crosshair", ...this.io("crosshair") },
			{ key: "positionName", type: "text", ...this.io("positionName") },
			{ key: "location", type: "point", ...this.io("location") },
			{ key: "direction", type: "number", ...this.io("direction") },
			{ key: "distance", type: "number", ...this.io("distance") },
		];
	}

	override async _execute(): Promise<boolean> {
		const name = await this.getInputValue("name");
		const crosshair = new CrosshairBuilder();
		this.setOutputValue("crosshair", crosshair);
		this.setOutputValue("positionName", name);

		await this.executeNext("configure");
		crosshair.sealed = true;

		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = this.getContext<Sequence>("sequence");
		const request = crosshair.toRequest(sequence, await this.getInputValue("timeout"));
		const result = await resolveCrosshair(this, await this.getInputValue("user"), request);
		g.log("Crosshair Node", { name, request, result });
		g.end();

		if (!result)
			return this.executeNext("cancelled");

		this.setOutputValue("location", { x: result.x, y: result.y });
		this.setOutputValue("direction", result.direction);
		this.setOutputValue("distance", result.distance);

		if (name && sequence) {
			// Onto the Sequence that gets played: `addSequence` only carries sections over, not named locations.
			sequence.addNamedLocation(name, crosshairNamedLocation(result));
			defineNamedLocation(this, name);
		}

		return this.executeNext("placed");
	}
}

export { CrosshairNode };
