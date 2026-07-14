import type { TriggerEngine as T } from "trigger-engine/types";
import { defineNamedLocation, requestNamedLocation } from "$lib/namedLocations";
import { devGroup, devLog } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	name: string;
	location: PositionSource;
}
interface TOutputs {}

class NamedLocationNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "named-location";
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
		return { unicode: "\uF02B" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "name", type: "text", ...this.io("name") },
			{ key: "location", type: "position", ...this.io("location") },
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = this.getContext<Sequence>("sequence");
		const name = await this.getInputValue("name");
		if (sequence && name) {
			const location = this.getLocation(await this.getInputValue("location"));
			if (location) {
				sequence.addNamedLocation(name, location);
				defineNamedLocation(this, name);
			} else {
				devLog(`[${this.type}] no location to name`);
			}
		}

		g.log("Named Location Node", { name });
		g.end();

		return this.executeNext("out");
	}

	getLocation(loc: PositionSource | undefined): TokenDocument | Point | RegionDocument | string | undefined {
		switch (loc?.kind) {
			case "point":
				return { x: loc.x, y: loc.y };
			case "region":
				return loc.region;
			case "target":
				return this.getTargetToken({ actor: loc.actor, token: loc.token });
			case "name":
				// Aliasing one named location to another; Sequencer resolves it at play time.
				requestNamedLocation(this, loc.name);
				return loc.name;
		}
	}
}

export { NamedLocationNode };
