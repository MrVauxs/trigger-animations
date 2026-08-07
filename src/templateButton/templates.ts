import type { TriggerEngine as T } from "trigger-engine/types";

export interface TemplateContext {
	triggerNames: string[];
	label: string;
	uuid: string;
	folder?: string;
	tags?: string[];
	priority?: number;
}

export interface TriggerTemplate {
	id: string;
	label: string;
	hint: string;
	prefixes: string[];
	build: (ctx: TemplateContext) => T.TriggerDataInput;
}

const rid = () => foundry.utils.randomID();
const at = (col: number, row = 0) => ({ x: col * 280, y: row * 160 });
function pathOut(id: string, input: string, label: string, type = "text") {
	return { id, input, label, slug: "path", isArray: false, type };
}

function animationEvent(
	triggerNames: string[],
	nextId: string,
	id: string,
	customOutputs?: Record<string, ReturnType<typeof pathOut>>,
): T.NodeDataInput {
	return {
		id,
		type: "animation-event",
		position: at(0),
		...(customOutputs ? { custom: { outputs: customOutputs } } : {}),
		inputs: { name: { value: triggerNames.join(",") } },
		outs: { out: { connection: `${nextId}:ins:in` } },
	};
}

function extractItem(eventId: string, id: string, nextId: string, col: number) {
	const nameOutId = rid();
	const uuidOutId = rid();
	const node: T.NodeDataInput = {
		id,
		type: "extract-item",
		position: at(col),
		custom: {
			outputs: {
				[nameOutId]: pathOut(nameOutId, "name", "Name"),
				[uuidOutId]: pathOut(uuidOutId, "uuid", "UUID"),
			},
		},
		inputs: { input: { connection: `${eventId}:outputs:item` } },
		outs: { out: { connection: `${nextId}:ins:in` } },
	};
	return { node, nameOutId, uuidOutId };
}

function effectNode(extractId: string, nameOutId: string, uuidOutId: string, id: string, nextId: string, col: number): T.NodeDataInput {
	return {
		id,
		type: "effect",
		position: at(col),
		inputs: {
			name: { connection: `${extractId}:outputs:${nameOutId}` },
			origin: { connection: `${extractId}:outputs:${uuidOutId}` },
		},
		outs: { out: { connection: `${nextId}:ins:in` } },
	};
}

function baseTrigger(ctx: TemplateContext, nodes: T.NodeDataInput[]): T.TriggerDataInput {
	return {
		id: rid(),
		name: ctx.label,
		folder: ctx.folder ?? "",
		priority: ctx.priority ?? 0,
		tags: ctx.tags ?? [],
		description: `Generated from ${ctx.label} (${ctx.uuid}). Trigger: ${ctx.triggerNames.join(",")}`,
		nodes,
	};
}

/**
 * Attack projectile: animation-event => massloop(source/target pairs) => ez-ranged, then play once the loop is done.
 * Mirrors the example weapon triggers (static/anim-trigger/weapon-group-bow.json).
 */
const attack: TriggerTemplate = {
	id: "attack",
	label: "Attack",
	hint: "Effect on the source, stretched to the target. Misses on a failed outcome.",
	prefixes: ["attack", "damage"],
	build: (ctx) => {
		const eventId = rid();
		const loopId = rid();
		const rangedId = rid();
		const playId = rid();

		const outcomeOutId = rid();

		return baseTrigger(ctx, [
			animationEvent(ctx.triggerNames, loopId, eventId, {
				[outcomeOutId]: pathOut(outcomeOutId, "outcome", "Outcome"),
			}),
			{
				id: loopId,
				type: "massloop",
				position: at(1),
				inputs: {
					targets: { connection: `${eventId}:outputs:targets` },
					sources: { connection: `${eventId}:outputs:sources` },
				},
				outs: {
					out: { connection: `${rangedId}:ins:in` },
					// Preloading and playing happens once, after every pair was set up.
					outAfter: { connection: `${playId}:ins:in` },
				},
			},
			{
				id: rangedId,
				type: "ez-ranged",
				position: at(2),
				inputs: {
					file: { value: "jb2a.fire_bolt.orange" },
					item: { connection: `${eventId}:outputs:item` },
					outcome: { connection: `${eventId}:outputs:${outcomeOutId}` },
					source: { connection: `${loopId}:outputs:source` },
					target: { connection: `${loopId}:outputs:target` },
				},
			},
			{
				id: playId,
				type: "play",
				position: at(3),
				inputs: { preload: { value: true } },
			},
		]);
	},
};

/**
 * Region/template placement: animation-event(+Region) => extract-item => effect => file => location(region) => play.
 */
const region: TriggerTemplate = {
	id: "region",
	label: "Region",
	hint: "Effect on a placed measured template. Good for area spells.",
	prefixes: ["template"],
	build: (ctx) => {
		const eventId = rid();
		const extractId = rid();
		const effectId = rid();
		const fileId = rid();
		const locationId = rid();
		const playId = rid();

		const regionOutId = rid();
		const effect = { connection: `${effectId}:outputs:effect` };
		const extract = extractItem(eventId, extractId, effectId, 1);

		return baseTrigger({ ...ctx, tags: [...(ctx.tags ?? []), "template"] }, [
			animationEvent(ctx.triggerNames, extractId, eventId, {
				[regionOutId]: pathOut(regionOutId, "region", "Region", "region"),
			}),
			extract.node,
			effectNode(extractId, extract.nameOutId, extract.uuidOutId, effectId, fileId, 2),
			{
				id: fileId,
				type: "file",
				position: at(3),
				inputs: { effect, file: { value: "jb2a.fireball.explosion.orange" } },
				outs: { out: { connection: `${locationId}:ins:in` } },
			},
			{
				id: locationId,
				type: "location",
				state: "targets",
				position: at(4),
				inputs: {
					effect,
					// Place the effect directly on the event's measured template/region.
					location: { connection: `${eventId}:outputs:${regionOutId}` },
				},
				outs: { out: { connection: `${playId}:ins:in` } },
			},
			{
				id: playId,
				type: "play",
				position: at(5),
				inputs: { preload: { value: true } },
			},
		]);
	},
};

// TODO: richer templates (on-target burst, persistent effect, projectile-per-target, ...).
export const BUILTIN_TEMPLATES: Record<string, TriggerTemplate> = {
	[attack.id]: attack,
	[region.id]: region,
};

/** Is this template a fit for the given suggested trigger names? */
export function isRecommended(template: TriggerTemplate, suggestedNames: string[]): boolean {
	const prefixes = suggestedNames.map(n => n.split(":")[0]);
	return template.prefixes.some(p => prefixes.includes(p));
}
