import type { TriggerEngine as T } from "trigger-engine/types";
import { requestNamedLocation } from "$lib/namedLocations";
import { createQueuedSequence } from "$lib/sequenceQueue";
import { devGroup, moduleWarn } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const ROOT = "trigger-animations.anim-trigger";

interface TInputs {
	target?: PositionSource;
	rotateTowards?: PositionSource;
	rotation: number;
	file: string;
	item?: Item;
	document?: unknown;
	scale: number;
	persist: boolean;
	persistTokenPrototype: boolean;
	attachTo: boolean;
	waitUntilFinished: boolean;
	waitDelay: number;
}

interface TOutputs {
	effect?: EffectSection;
}

/** Builds a basic on-target effect, including document-bound persistence. */
class EZEffectNode extends TriggerNode<"out", TInputs, TOutputs> {
	static override get type() {
		return "ez-effect";
	}

	static override get category() {
		return "ez";
	}

	static override get aliases(): string[] {
		return ["on-target", "persistent-effect", "buff"];
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
		return { unicode: "\uF132" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "target", type: "position", ...this.io("target") },
			{ key: "rotateTowards", type: "position", ...this.io("rotateTowards") },
			{ key: "rotation", type: "number", ...this.io("rotation"), field: { default: 0 } },
			{ key: "file", type: "text", ...this.io("file"), field: { default: "" } },
			{ key: "item", type: "item", ...this.io("item") },
			{ key: "document", type: "any", ...this.io("document") },
			{
				key: "scale",
				type: "number",
				...this.io("scale"),
				field: { default: 1, min: 0 },
			},
			{ key: "persist", type: "boolean", ...this.io("persist"), field: { default: true } },
			{
				key: "persistTokenPrototype",
				type: "boolean",
				...this.io("persistTokenPrototype"),
			},
			{ key: "attachTo", type: "boolean", ...this.sharedIo("attachTo"), field: { default: true } },
			{ key: "waitUntilFinished", type: "boolean", ...this.io("waitUntilFinished") },
			{ key: "waitDelay", type: "number", ...this.io("waitDelay"), field: { default: 0 } },
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [{ key: "effect", type: "effect", ...this.sharedIo("effect") }];
	}

	getLocation(location: PositionSource | undefined): TokenDocument | Point | RegionDocument | string | undefined {
		switch (location?.kind) {
			case "point":
				return { x: location.x, y: location.y };
			case "region":
				return location.region;
			case "target":
				return this.getTargetToken({ actor: location.actor, token: location.token });
			case "name":
				requestNamedLocation(this, location.name);
				return location.name;
		}
	}

	resolveDocument(value: unknown): object | undefined {
		if (!value)
			return undefined;

		const candidate = typeof value === "string"
			? fromUuidSync(value.trim())
			: this.resolveDocumentLike(value);
		return candidate instanceof foundry.abstract.Document ? candidate : undefined;
	}

	resolveDocumentLike(value: unknown): unknown {
		if (typeof value !== "object" || value === null)
			return undefined;
		const object = value as Record<string, unknown>;
		return object.document ?? (object.documentName ? object : object.token ?? object.actor);
	}

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		if (!sequence) {
			g.log("EZ Effect Node", "no Sequence in context");
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

		const target = this.getLocation(await this.getInputValue("target"));
		if (target) {
			if (await this.getInputValue("attachTo"))
				effect.attachTo(target);
			else effect.atLocation(target);
		} else {
			moduleWarn(`[${this.type}] no target; effect has no location`);
		}

		const rotateTowards = this.getLocation(await this.getInputValue("rotateTowards"));
		if (rotateTowards)
			effect.rotateTowards(rotateTowards);

		const rotation = await this.getInputValue("rotation");
		if (rotation !== 0)
			effect.rotate(rotation);

		const scale = await this.getInputValue("scale");
		if (scale > 0)
			effect.scaleToObject(scale);

		if (await this.getInputValue("persist")) {
			effect.persist(true, {
				persistTokenPrototype: await this.getInputValue("persistTokenPrototype"),
			});
		}

		const rawDocument = await this.getInputValue("document");
		const document = this.resolveDocument(rawDocument);
		if (document)
			effect.tieToDocuments(document);
		else if (rawDocument)
			moduleWarn(`[${this.type}] could not resolve the tied document`, rawDocument);

		if (await this.getInputValue("waitUntilFinished"))
			effect.waitUntilFinished(await this.getInputValue("waitDelay"));

		g.log("EZ Effect Node", { sequence, effect, item, file, target, rotateTowards, rotation, document });
		g.end();

		return this.executeNext("out");
	}
}

export { EZEffectNode };
