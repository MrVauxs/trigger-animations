import { devGroup } from "$lib/utils";
import { requestNamedLocation } from "$lib/namedLocations";
import { TriggerEngine as T } from "trigger-engine/types";
import { EASE_OPTIONS } from "../effect/constants";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

/**
 * Base class for all nodes that modify an existing SoundSection.
 */
abstract class SoundModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
	"out",
	TInputs & { sound?: SoundSection },
	{},
	string,
	string,
	TState
> {
	static override get category() {
		return "sound";
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

	/** Label + tooltip pair shared between nodes (ease, delay, ...). */
	static sharedIo(key: string) {
		return {
			label: `${ROOT}.io.${key}.title`,
			tooltip: `${ROOT}.io.${key}.tooltip`,
		};
	}

	/** The standard sound input every modifier node lists first. */
	static get soundInput(): T.InputEntrySchemaSource {
		return { key: "sound", type: "sound", ...this.sharedIo("sound") };
	}

	/** An easing select input. "linear" matches Sequencer's default, so the value is always safe to pass. */
	static easeInput(
		key: string,
		extra?: { group?: string; state?: string },
	): T.InputEntrySchemaSource {
		return {
			key,
			type: "text",
			...this.sharedIo("ease"),
			...extra,
			field: { type: "select", default: "linear", options: EASE_OPTIONS },
		};
	}

	override get headerColor() {
		return "#2e8b57";
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	getLocation(loc: PositionSource): TokenDocument | Point | RegionDocument | string | undefined {
		switch (loc.kind) {
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

	protected abstract apply(section: SoundSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sound = await this.getInputValue("sound");
		if (sound) {
			await this.apply(sound as SoundSection);
			g.log("applied", { sound });
		} else {
			g.log("no sound connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { SoundModifierNode };
