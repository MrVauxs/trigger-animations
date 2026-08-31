import type { TriggerEngine as T } from "trigger-engine/types";
import { requestNamedLocation } from "$lib/namedLocations";
import { createQueuedSequence } from "$lib/sequenceQueue";
import { devGroup, moduleWarn } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

// Labels are plain English: game.i18n.localize() passes unknown keys through untouched.
const OUTCOME_OPTIONS = [
	{ value: "", label: "None" },
	{ value: "criticalSuccess", label: "Critical Success" },
	{ value: "success", label: "Success" },
	{ value: "failure", label: "Failure" },
	{ value: "criticalFailure", label: "Critical Failure" },
];

interface TInputs {
	source?: PositionSource;
	target?: PositionSource;
	file: string;
	item?: Item;
	attachTo: boolean;
	outcome: string;
}

interface TOutputs {
	effect?: EffectSection;
}

class EZRangedNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "ez-ranged";
	}

	static override get category() {
		return "ez";
	}

	static override get aliases(): string[] {
		return ["attack", "projectile", "shoot"];
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

	static sharedIo(key: string) {
		return {
			label: `${ROOT}.io.${key}.title`,
			tooltip: `${ROOT}.io.${key}.tooltip`,
		};
	}

	override get headerColor() {
		return "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF6B9" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "source", type: "position", ...this.io("source") },
			{ key: "target", type: "position", ...this.io("target") },
			{ key: "file", type: "text", ...this.io("file"), field: { default: "" } },
			{ key: "item", type: "item", ...this.io("item") },
			{ key: "attachTo", type: "boolean", ...this.sharedIo("attachTo") },
			{
				key: "outcome",
				type: "text",
				...this.io("outcome"),
				field: { type: "select", default: "", options: OUTCOME_OPTIONS },
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{ key: "effect", type: "effect", ...this.sharedIo("effect") },
		];
	}

	getLocation(loc: PositionSource | Point | undefined): TokenDocument | Point | RegionDocument | string | undefined {
		if (!loc)
			return loc;
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

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		if (!sequence) {
			g.log("EZ Ranged Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}

		const effect = sequence.effect();
		this.setOutputValue("effect", effect);

		const item = await this.getInputValue("item");
		if (item) {
			effect.name(item.name);
			effect.origin(item.uuid);
		}

		const file = await this.getInputValue("file");
		if (file?.trim())
			effect.file(file);

		const source = this.getLocation(await this.getInputValue("source"));
		if (source) {
			if (await this.getInputValue("attachTo")) {
				effect.attachTo(source);
			} else {
				effect.atLocation(source);
			}
		} else {
			moduleWarn(`[${this.type}] no source; effect has no starting location`);
		}

		const target = this.getLocation(await this.getInputValue("target"));
		if (target) {
			if ((await this.getInputValue("outcome")).toLowerCase().includes("fail"))
				effect.missed(true);

			effect.stretchTo(target);
		} else {
			moduleWarn(`[${this.type}] no target; skipping stretchTo`);
		}

		g.log("EZ Ranged Node", { sequence, effect, item, file });
		g.end();

		return this.executeNext("out");
	}
}

export { EZRangedNode };
