import type { TriggerEngine as T } from "trigger-engine/types";
import { requestNamedLocation } from "$lib/namedLocations";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

/**
 * Base class for nodes that modify an existing CanvasPanSection.
 */
abstract class CanvasPanModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
		"out",
	TInputs & { canvasPan?: CanvasPanSection },
	object,
	string,
	string,
	TState
	> {
	static override get category() {
		return "canvasPan";
	}

	static localize(str: string) {
		return `${ROOT}.node.${this.category}.${this.type}.${str}`;
	}

	/** Label + tooltip pair for one of this node's own io entries. */
	static io(key: string) {
		return {
			label: this.localize(`io.${key}.title`),
			tooltip: this.localize(`io.${key}.tooltip`),
		};
	}

	/** Label + tooltip pair shared between nodes. */
	static sharedIo(key: string) {
		return {
			label: `${ROOT}.io.${key}.title`,
			tooltip: `${ROOT}.io.${key}.tooltip`,
		};
	}

	/** The standard canvas pan input every modifier node lists first. */
	static get canvasPanInput(): T.InputEntrySchemaSource {
		return { key: "canvasPan", type: "canvasPan", ...this.sharedIo("canvasPan") };
	}

	override get headerColor() {
		return "#4a90d9";
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
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

	protected abstract apply(section: CanvasPanSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const canvasPan = await this.getInputValue("canvasPan");
		if (canvasPan) {
			await this.apply(canvasPan);
			g.log("applied", { canvasPan });
		} else {
			g.log("no canvas pan connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { CanvasPanModifierNode };
