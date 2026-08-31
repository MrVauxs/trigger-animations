import type { AnyDocument, TMFXParams, TMFXPreset } from "$lib/tmfxRegistry";
import type { TriggerEngine as T } from "trigger-engine/types";
import { createQueuedSequence, createTailSequence } from "$lib/sequenceQueue";
import { filterKey, getTokenMagic, PRESET_LIBRARIES, release } from "$lib/tmfxRegistry";
import { devGroup, devLog, moduleError, moduleWarn } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

const DEFAULT_PARAMS = `[

]`;

/** Anything a `tieTo` input might hold, narrowed down to the document itself. */
function resolveDocument(value: unknown): AnyDocument | undefined {
	if (!value)
		return undefined;

	const candidate = typeof value === "string"
		? fromUuidSync(value.trim())
		: resolveDocumentLike(value);

	return (candidate as AnyDocument)?.documentName ? candidate as AnyDocument : undefined;
}

function resolveDocumentLike(value: unknown): unknown {
	if (typeof value !== "object" || value === null)
		return undefined;
	const obj = value as Record<string, unknown>;
	// A placeable wraps its document; a document names itself; a target entry has neither.
	return obj.document ?? (obj.documentName ? obj : obj.token ?? obj.actor);
}

interface TInputs {
	target?: PositionSource;
	preset: string;
	params: string;
	local: boolean;
	waitUntilFinished: boolean;
	persist: boolean;
	duration: number;
	tieTo: string;
	tieToDocs: unknown[];
	filter?: TMFXFilterHandle;
}
interface TOutputs {
	filter?: TMFXFilterHandle;
}

type TState = "add" | "remove";

class TokenMagicNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs,
	string,
	string,
	TState
> {
	static override get type() {
		return "token-magic";
	}

	static override get category() {
		return "sequence";
	}

	static override get aliases(): string[] {
		return ["tmfx"];
	}

	static override get states(): string[] | null {
		return ["add", "remove"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	static io(key: string) {
		return {
			label: this.localize(`io.${key}.title`),
			tooltip: this.localize(`io.${key}.tooltip`),
		};
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF72B" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "filter", type: "tmfx-filter", ...this.io("filter"), state: "remove" },
			{ key: "target", type: "position", ...this.io("target") },
			{ key: "preset", type: "text", ...this.io("preset") },
			{
				key: "params",
				type: "text",
				...this.io("params"),
				field: { type: "json", default: DEFAULT_PARAMS },
			},
			{ key: "local", type: "boolean", ...this.io("local") },
			{
				key: "waitUntilFinished",
				type: "boolean",
				...this.io("waitUntilFinished"),
				group: "wait",
			},
			{ key: "persist", type: "boolean", ...this.io("persist"), group: "lifetime", state: "add" },
			{
				key: "duration",
				type: "number",
				...this.io("duration"),
				group: "lifetime",
				state: "add",
				field: { default: 0, min: 0 },
			},
			{ key: "tieTo", type: "text", ...this.io("tieTo"), group: "lifetime", state: "add" },
			{
				key: "tieToDocs",
				type: "any",
				isArray: true,
				...this.io("tieToDocs"),
				group: "lifetime",
				state: "add",
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [{ key: "filter", type: "tmfx-filter", ...this.io("filter"), state: "add" }];
	}

	/** Documents whose deletion should take the filter with them. */
	async getTiedDocuments(): Promise<AnyDocument[]> {
		const raw = await this.getInputValue("tieTo");
		const uuids = raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : [];
		const values = [...uuids, ...(await this.getInputValue("tieToDocs")) ?? []];

		const docs: AnyDocument[] = [];
		for (const value of values) {
			const doc = resolveDocument(value);
			if (!doc)
				moduleWarn(`[${this.type}] could not resolve the tied document`, value);
			else if (!docs.includes(doc))
				docs.push(doc);
		}
		return docs;
	}

	/** Token Magic FX only understands placeables, so points and named locations are out. */
	getPlaceable(source: PositionSource | undefined): TokenDocument | RegionDocument | undefined {
		switch (source?.kind) {
			case "target":
				return this.getTargetToken({ actor: source.actor, token: source.token });
			case "region":
				return source.region;
			default:
				return undefined;
		}
	}

	/**
	 * Custom params win over the preset name. Either way we hand `togglePreset` a
	 * preset object so we know the filter id used for the add/remove pair.
	 */
	resolvePreset(name: string, params: string): { preset: TMFXPreset; filterId: string } | undefined {
		const raw = params?.trim();
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				const list: TMFXParams[] = Array.isArray(parsed) ? parsed : [parsed];
				if (list.length)
					return this.#withFilterId({ name: name || undefined, params: list });
			} catch (e) {
				moduleError(`[${this.type}] invalid params JSON; falling back to the preset name`, e);
			}
		}

		if (!name)
			return undefined;

		const magic = getTokenMagic();
		for (const library of PRESET_LIBRARIES) {
			const found = magic?.getPresets(library).find(preset => preset.name === name);
			if (found?.params?.length)
				return this.#withFilterId(foundry.utils.deepClone(found));
		}

		moduleWarn(`[${this.type}] no Token Magic FX preset named "${name}"`);
		ui.notifications.warn(`Trigger Animations: no Token Magic FX preset named "${name}"`);
		return undefined;
	}

	/** `togglePreset` keys everything off `params[0].filterId`, so it must exist. */
	#withFilterId(preset: TMFXPreset): { preset: TMFXPreset; filterId: string } {
		const filterId = preset.params[0]!.filterId ?? `${this.type}-${foundry.utils.randomID()}`;
		for (const param of preset.params)
			param.filterId ??= filterId;
		return { preset, filterId };
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = createQueuedSequence(this);
		const magic = getTokenMagic();

		if (!sequence || !magic || typeof sequence.tokenMagic !== "function") {
			if (!sequence) {
				devLog(`[${this.type}] no Sequence in context`);
			} else if (!magic) {
				// Either the module is off, or it predates `togglePreset`.
				moduleWarn(`[${this.type}] Token Magic FX is not active, or is too old for this node`);
				ui.notifications.warn("Trigger Animations: the Token Magic node needs an up to date Token Magic FX");
			} else {
				moduleError(`[${this.type}] the Token Magic Sequencer section was never registered`);
			}
			g.end();
			return this.executeNext("out");
		}

		const waitUntilFinished = await this.getInputValue("waitUntilFinished");

		// A handle carries everything needed, so the manual inputs are only a fallback
		// for filters this trigger execution did not apply itself.
		if (this.state === "remove") {
			const handle = await this.getInputValue("filter");
			if (handle) {
				sequence.tokenMagic({
					action: "release",
					uuid: handle.uuid,
					filterId: handle.filterId,
					leaseId: handle.leaseId,
					waitUntilFinished,
				});

				g.log("Token Magic Node", { state: this.state, handle });
				g.end();
				return this.executeNext("out");
			}
		}

		const target = await this.getInputValue("target");
		const placeable = this.getPlaceable(target);
		// `resolvePreset` reports its own failures.
		const resolved = this.resolvePreset(
			await this.getInputValue("preset"),
			await this.getInputValue("params"),
		);

		if (!placeable) {
			moduleWarn(
				`[${this.type}] needs a token or a region;`,
				target?.kind ? `a "${target.kind}" position has neither` : "no target was given",
			);
		}

		if (!placeable || !resolved) {
			g.end();
			return this.executeNext("out");
		}

		// Sections address the placeable by UUID, so it has to be a saved document.
		const uuid = placeable.uuid;
		if (!uuid) {
			moduleWarn(`[${this.type}] the target has no UUID; it is not a saved document`);
			g.end();
			return this.executeNext("out");
		}

		const { preset, filterId } = resolved;
		const forceLocal = await this.getInputValue("local");

		if (this.state === "remove") {
			// No lease: this is removing whatever is there, not undoing an Add node.
			sequence.tokenMagic({
				action: "release",
				uuid,
				filterId,
				preset,
				local: forceLocal,
				waitUntilFinished,
			});

			g.log("Token Magic Node", { state: this.state, placeable, preset, forceLocal });
			g.end();
			return this.executeNext("out");
		}

		const persist = await this.getInputValue("persist");
		const duration = await this.getInputValue("duration");
		const tied = await this.getTiedDocuments();
		// Either of those means the filter is meant to outlive the Sequence.
		const endsWithSequence = !persist && duration <= 0;
		const leaseId = `${this.type}-${foundry.utils.randomID()}`;

		sequence.tokenMagic({
			action: "add",
			uuid,
			filterId,
			leaseId,
			preset,
			local: forceLocal,
			waitUntilFinished,
			persist,
			duration,
			tieTo: tied.map(doc => doc.uuid),
		});

		if (endsWithSequence) {
			// Tail section, so the filter outlives every other section of the Sequence
			// (including persistent ones, which park it until they are killed). It also
			// releases when the Sequence is aborted before ever reaching it.
			createTailSequence(this)?.tokenMagic({
				action: "release",
				uuid,
				filterId,
				leaseId,
			});
		}

		// The registry key and lease, not a closure, so a Remove node in another
		// section can still release exactly what this node applied.
		const key = filterKey(uuid, filterId);
		this.setOutputValue("filter", {
			filterId,
			key,
			uuid,
			leaseId,
			placeable,
			remove: (reason = "Remove node") => release(key, leaseId, reason),
		});

		g.log("Token Magic Node", {
			state: this.state,
			placeable,
			preset,
			forceLocal,
			waitUntilFinished,
			persist,
			duration,
			tied,
			endsWithSequence,
		});
		g.end();

		return this.executeNext("out");
	}
}

export { TokenMagicNode };
