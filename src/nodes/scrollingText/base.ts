import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.trigger-animations";

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
	static override get tags() {
		return ["animation", "scrolling-text"];
	}

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

	getLocation(loc: TargetDocuments | Point): TokenDocument | Point | undefined {
		if (typeof loc === "object" && "x" in loc && "y" in loc) {
			return { x: (loc as Point).x, y: (loc as Point).y };
		}
		return this.getTargetToken(loc as TargetDocuments);
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
