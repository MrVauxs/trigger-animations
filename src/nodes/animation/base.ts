import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { EASE_OPTIONS } from "../effect/constants";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

/**
 * Base class for all nodes that modify an existing AnimationSection.
 */
abstract class AnimationModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
	"out",
	TInputs & { animation?: AnimationSection },
	{},
	string,
	string,
	TState
> {


	static override get category() {
		return "animation";
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

	/** The standard animation input every modifier node lists first. */
	static get animationInput(): T.InputEntrySchemaSource {
		return { key: "animation", type: "animation", ...this.sharedIo("animation") };
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
		return "#6a5acd";
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	/**
	 * Normalize an "any"-typed input into something Sequencer location
	 * methods accept: a name string, a {x,y} point, or a document/placeable.
	 * `target` entries ({ actor, token }) are unwrapped to their token.
	 */
	protected resolveObject(value: unknown): object | string | undefined {
		if (!value) return undefined;
		if (typeof value === "string") return value.trim() || undefined;
		if (typeof value !== "object") return undefined;
		const obj = value as Record<string, any>;
		// A target entry wrapper, as opposed to a raw document (which has x/y).
		if ("actor" in obj && !("x" in obj)) {
			return this.getTargetToken(obj as TargetDocuments);
		}
		return obj;
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

	protected abstract apply(section: AnimationSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const animation = await this.getInputValue("animation");
		if (animation) {
			await this.apply(animation as AnimationSection);
			g.log("applied", { animation });
		} else {
			g.log("no animation connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { AnimationModifierNode };
