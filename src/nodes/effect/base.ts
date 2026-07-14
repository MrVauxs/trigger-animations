import type { TriggerEngine as T } from "trigger-engine/types";
import { requestNamedLocation } from "$lib/namedLocations";
import { dev, devGroup, devLog, log } from "$lib/utils";
import { EASE_OPTIONS } from "./constants";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

/**
 * Base class for all nodes that modify an existing EffectSection.
 */
abstract class EffectModifierNode<
	TInputs extends Record<string, any> = Record<string, any>,
	TState extends string = string,
> extends TriggerNode<
		"out",
	TInputs & { effect?: EffectSection },
	object,
	string,
	string,
	TState
	> {
	static override get category() {
		return "effect";
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

	/** Label + tooltip pair shared between nodes (ease, delay, gridUnits, ...). */
	static sharedIo(key: string) {
		return {
			label: `${ROOT}.io.${key}.title`,
			tooltip: `${ROOT}.io.${key}.tooltip`,
		};
	}

	/** The standard effect input every modifier node lists first. */
	static get effectInput(): T.InputEntrySchemaSource {
		return { key: "effect", type: "effect", ...this.sharedIo("effect") };
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
		return "#009690";
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	/**
	 * Parse a json text field. Returns undefined (= skip) for empty input,
	 * the field's untouched "{}" default, or malformed JSON.
	 */
	protected parseJson<TVal = Record<string, unknown>>(
		raw: string | undefined,
		what: string,
	): TVal | undefined {
		if (!raw?.trim())
			return undefined;
		try {
			const parsed = JSON.parse(raw);
			if (
				parsed
				&& typeof parsed === "object"
				&& Object.keys(parsed).length === 0
			) {
				return undefined;
			}
			return parsed as TVal;
		} catch (e) {
			devLog(`[${this.type}] invalid JSON for ${what}`, e);
			return undefined;
		}
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

	/**
	 * Normalize an "any"-typed input into something Sequencer location
	 * methods accept: a name string, a {x,y} point, or a document/placeable.
	 * `target` entries ({ actor, token }) are unwrapped to their token.
	 */
	protected resolveObject(value: unknown): object | string | undefined {
		if (!value)
			return undefined;
		if (typeof value === "string")
			return value.trim() || undefined;
		if (typeof value !== "object")
			return undefined;
		const obj = value as Record<string, unknown>;
		// A target entry wrapper, as opposed to a raw document (which has x/y).
		if ("actor" in obj && !("x" in obj)) {
			if ("token" in obj)
				return obj.token as object;
		}
		return obj;
	}

	protected abstract apply(effect: EffectSection): Promise<void> | void;

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const effect = await this.getInputValue("effect");
		if (effect) {
			if (dev) {
				const definedInputs = (this.constructor as typeof TriggerNode).defineInputs;
				const inputs = Object.fromEntries(
					await Promise.all(
						(definedInputs ?? []).map(async x => [
							x.key,
							await this.getInputValue(x.key),
						] as const),
					),
				);
				g.log("applied", { effect, inputs });
			}
			try {
				await this.apply(effect);
			} catch (e) {
				g.end();
				log(`[${this.type}] error applying effect`, e);
				return false;
			}
		} else {
			g.log("no effect connected; skipping");
		}
		g.end();

		return this.executeNext("out");
	}
}

export { EffectModifierNode };
