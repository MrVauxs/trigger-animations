import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.trigger-animations";

/**
 * Base class for nodes that modify an existing CrosshairSection.
 */
abstract class CrosshairModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
	"out",
	TInputs & { crosshair?: CrosshairSection },
	{},
	string,
	string,
	TState
> {
	static override get tags() {
		return ["animation"];
	}

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

	override get headerColor() {
		return "#b8860b";
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	protected abstract apply(section: CrosshairSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const crosshair = await this.getInputValue("crosshair");
		if (crosshair) {
			await this.apply(crosshair as CrosshairSection);
			g.log("applied", { crosshair });
		} else {
			g.log("no crosshair connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { CrosshairModifierNode };
