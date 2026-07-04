import { devGroup } from "$lib/utils";
import { requestNamedLocation } from "$lib/namedLocations";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

/**
 * Base class for nodes that modify an existing ScrollingTextSection.
 */
abstract class ScrollingTextModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
	"out",
	TInputs & { scrollingText?: ScrollingTextSection },
	{},
	string,
	string,
	TState
> {
	static override get category() {
		return "scrollingText";
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

	/** The standard scrolling text input every modifier node lists first. */
	static get scrollingTextInput(): T.InputEntrySchemaSource {
		return { key: "scrollingText", type: "scrollingText", ...this.sharedIo("scrollingText") };
	}

	override get headerColor() {
		return "#c97bd4";
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

	protected abstract apply(section: ScrollingTextSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const scrollingText = await this.getInputValue("scrollingText");
		if (scrollingText) {
			await this.apply(scrollingText as ScrollingTextSection);
			g.log("applied", { scrollingText });
		} else {
			g.log("no scrolling text connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { ScrollingTextModifierNode };
