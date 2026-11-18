import type { CrosshairBuilder, CrosshairLocationRef } from "$lib/crosshairBuilder";
import type { TriggerEngine as T } from "trigger-engine/types";
import { toLocationRef } from "$lib/crosshairBuilder";
import { requestNamedLocation } from "$lib/namedLocations";
import { devGroup, moduleWarn } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

/**
 * Base class for nodes that configure a Crosshair node's crosshair.
 */
abstract class CrosshairModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
		"out",
	TInputs & { crosshair?: CrosshairBuilder },
	{ crosshair?: CrosshairBuilder },
	string,
	string,
	TState
	> {
	static override get category() {
		return "crosshair";
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

	/** Label + tooltip pair shared between nodes (offset, ...). */
	static sharedIo(key: string) {
		return {
			label: `${ROOT}.io.${key}.title`,
			tooltip: `${ROOT}.io.${key}.tooltip`,
		};
	}

	/** The standard crosshair input every modifier node lists first. */
	static get crosshairInput(): T.InputEntrySchemaSource {
		return { key: "crosshair", type: "crosshair", ...this.sharedIo("crosshair") };
	}

	/** The crosshair passed back out, mirroring {@link crosshairInput}. */
	static get crosshairOutput(): T.OutputEntrySchemaSource {
		return { key: "crosshair", type: "crosshair", ...this.sharedIo("crosshair") };
	}

	override get headerColor() {
		return "#b8860b";
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [this.crosshairOutput];
	}

	protected abstract apply(crosshair: CrosshairBuilder): Promise<void> | void;

	getLocation(loc: PositionSource | undefined): CrosshairLocationRef | undefined {
		switch (loc?.kind) {
			case "point":
				return { x: loc.x, y: loc.y };
			case "region":
				return toLocationRef(loc.region);
			case "target":
				return toLocationRef(this.getTargetToken({ actor: loc.actor, token: loc.token }));
			case "name":
				// Looked up when the crosshair is shown, so it may come from an earlier crosshair.
				requestNamedLocation(this, loc.name);
				return { name: loc.name };
		}
	}

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const crosshair = await this.getInputValue("crosshair");
		if (crosshair?.sealed) {
			moduleWarn(`[${this.type}] the crosshair was already shown; connect this node to the Crosshair node's Configure output`);
		} else if (crosshair) {
			await this.apply(crosshair);
			this.setOutputValue("crosshair", crosshair);
			g.log("applied", { crosshair });
		} else {
			g.log("no crosshair connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { CrosshairModifierNode };
