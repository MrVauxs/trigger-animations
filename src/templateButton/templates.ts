import { TriggerEngine as T } from "trigger-engine/types";

export type TemplateContext = {
	triggerNames: string[];
	label: string;
	folder?: string;
	tags?: string[];
	priority?: number;
};

export type TriggerTemplate = {
	id: string;
	label: string;
	hint: string;
	build: (ctx: TemplateContext) => T.TriggerDataInput;
};

const rid = () => foundry.utils.randomID();

/** Node position helper — templates lay nodes out left-to-right. */
const at = (col: number, row = 0) => ({ x: col * 280, y: row * 160 });

function animationEvent(triggerNames: string[], nextId: string, id = rid()): T.NodeDataInput {
	return {
		id,
		type: "animation-event",
		position: at(0),
		inputs: {
			name: { value: triggerNames.join(",") },
		},
		outs: {
			out: { connection: `${nextId}:ins:in` },
		},
	};
}

function baseTrigger(ctx: TemplateContext, nodes: T.NodeDataInput[]): T.TriggerDataInput {
	return {
		id: rid(),
		name: ctx.label,
		folder: ctx.folder ?? "",
		priority: ctx.priority ?? 0,
		tags: ctx.tags ?? [],
		description: "",
		nodes,
	};
}

const basic: TriggerTemplate = {
	id: "basic",
	label: "Basic (effect → file → location → aim)",
	hint: "An effect placed on the source, stretched to the target.",
	build: (ctx) => {
		const eventId = rid();
		const effectId = rid();
		const fileId = rid();
		const locationId = rid();
		const aimId = rid();
		const playId = rid();

		const effect = { connection: `${effectId}:outputs:effect` };

		return baseTrigger(ctx, [
			animationEvent(ctx.triggerNames, effectId, eventId),
			{
				id: effectId,
				type: "effect",
				position: at(1),
				inputs: { name: { value: ctx.label } },
				outs: { out: { connection: `${fileId}:ins:in` } },
			},
			{
				id: fileId,
				type: "file",
				position: at(2),
				inputs: { effect, file: { value: "jb2a.fire_bolt.orange" } },
				outs: { out: { connection: `${locationId}:ins:in` } },
			},
			{
				id: locationId,
				type: "location",
				state: "targets",
				position: at(3),
				inputs: {
					effect,
					location: { connection: `${eventId}:outputs:sources` },
				},
				outs: { out: { connection: `${aimId}:ins:in` } },
			},
			{
				id: aimId,
				type: "aim",
				state: "stretchTo",
				position: at(4),
				inputs: {
					effect,
					towards: { connection: `${eventId}:outputs:targets` },
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
// Each just returns another `TriggerTemplate`; add it to TEMPLATES below.
export const TEMPLATES: Record<string, TriggerTemplate> = {
	[basic.id]: basic,
};

export const DEFAULT_TEMPLATE = basic;
