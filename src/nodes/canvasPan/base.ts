import { devGroup } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

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
	{},
	string,
	string,
	TState
> {
	static override get tags() {
		return ["animation", "canvas-pan"];
	}

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

	getLocation(loc: TargetDocuments | Point | RegionDocument): TokenDocument | Point | RegionDocument | undefined {
		// Type-guard: if loc has x/y it's a Point, otherwise treat as TargetDocuments
		if (typeof loc === "object" && "x" in loc && "y" in loc) {
			return { x: (loc as Point).x, y: (loc as Point).y };
		}
		// It can also be a Region Document
		else if (typeof loc === "object" && "collectionName" in loc && loc.collectionName === "regions") {
			return loc as RegionDocument;
		}
		return this.getTargetToken(loc as TargetDocuments);
	}

	protected abstract apply(section: CanvasPanSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const canvasPan = await this.getInputValue("canvasPan");
		if (canvasPan) {
			await this.apply(canvasPan as CanvasPanSection);
			g.log("applied", { canvasPan });
		} else {
			g.log("no canvas pan connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { CanvasPanModifierNode };
