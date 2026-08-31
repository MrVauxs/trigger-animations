import type { TriggerEngine as T } from "trigger-engine/types";
import { createQueuedSequence } from "$lib/sequenceQueue";
import { devGroup, moduleWarn } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

const RADIUS_SHAPE_TYPES = new Set(["circle", "ring", "emanation"]);

interface TInputs {
	template?: RegionDocument;
	file: string;
	item?: Item;
	scale: number;
	waitUntilFinished: boolean;
	waitDelay: number;
}

interface TOutputs {
	effect?: EffectSection;
}

/** Builds an effect fitted to a measured-template region. */
class EZTemplateNode extends TriggerNode<"out", TInputs, TOutputs> {
	static override get type() {
		return "ez-template";
	}

	static override get category() {
		return "ez";
	}

	static override get aliases(): string[] {
		return ["template", "burst", "area"];
	}

	static localize(str: string) {
		return `${ROOT}.node.${this.category}.${this.type}.${str}`;
	}

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
		return { unicode: "\uF5A0" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "template", type: "region", ...this.io("template") },
			{ key: "file", type: "text", ...this.io("file"), field: { default: "" } },
			{ key: "item", type: "item", ...this.io("item") },
			{
				key: "scale",
				type: "number",
				...this.io("scale"),
				field: { default: 1, min: 0 },
			},
			{ key: "waitUntilFinished", type: "boolean", ...this.io("waitUntilFinished") },
			{ key: "waitDelay", type: "number", ...this.io("waitDelay"), field: { default: 0 } },
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{ key: "effect", type: "effect", ...this.sharedIo("effect") },
		];
	}

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		if (!sequence) {
			g.log("EZ Template Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}

		const item = await this.getInputValue("item");
		const file = await this.getInputValue("file");
		const template = await this.getInputValue("template");

		const effect = sequence.effect();
		this.setOutputValue("effect", effect);

		if (item) {
			effect.name(item.name);
			effect.origin(item.uuid);
		}

		if (file?.trim())
			effect.file(file);

		if (!template) {
			moduleWarn(`[${this.type}] no template; effect has no location`);
		} else if (
			template.shapes.length !== 1
			|| !RADIUS_SHAPE_TYPES.has(template.shapes[0]!.type)
		) {
			// Rays, cones, and rectangles derive their orientation and length from
			// the region's start/end geometry, just as the Breathe Fire trigger does.
			effect.attachTo(template);
			effect.stretchTo(template, { attachTo: true });
		} else {
			// Bursts are centred on the region and fitted to its radius. Stretching
			// a circular asset would incorrectly turn it into a directional effect.
			effect.atLocation(template);
			effect.scaleToObject((await this.getInputValue("scale")) || 1);
		}

		const waitDelay = await this.getInputValue("waitDelay");
		if (await this.getInputValue("waitUntilFinished"))
			effect.waitUntilFinished(waitDelay);
		else if (waitDelay > 0)
			effect.delay(waitDelay);

		g.log("EZ Template Node", { sequence, effect, item, file, template });
		g.end();

		return this.executeNext("out");
	}
}

export { EZTemplateNode };
