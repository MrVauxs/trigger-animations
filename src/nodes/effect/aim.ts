import { devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type TInputs = {
	towards: TargetDocuments | string;
	missed: boolean;
	rotationOffset: number;
	cacheLocation: boolean;
	attachTo: boolean;
	offset: { x: number; y: number };
	randomOffset: number;
	gridUnits: boolean;
	local: boolean;
	onlyX: boolean;
	tiling: boolean;
	requiresLineOfSight: boolean;
	hideLineOfSight: boolean;
	ease: string;
	delay: number;
	rotate: boolean;
	moveSpeed: number;
};

type TState = "rotateTowards" | "stretchTo" | "moveTowards";

class AimNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "aim";
	}

	static override get tags() {
		return super.tags.concat(...[
			"missed", "moveTowards", "moveSpeed", "stretchTo", "rotateTowards", "offset"
		])
	}

	static override get states(): string[] | null {
		return ["stretchTo", "rotateTowards", "moveTowards"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf05b" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "towards", type: "any", ...this.io("towards") },
			{ key: "missed", type: "boolean", ...this.io("missed") },
			{ key: "cacheLocation", type: "boolean", ...this.sharedIo("cacheLocation") },
			{
				key: "rotationOffset",
				type: "number",
				...this.io("rotationOffset"),
				state: "rotateTowards",
				field: { default: 0 }
			},
			{ key: "attachTo", type: "boolean", ...this.sharedIo("attachTo"), state: "rotateTowards" },
			{ key: "attachTo", type: "boolean", ...this.sharedIo("attachTo"), state: "stretchTo" },
			{ key: "offset", type: "point", ...this.sharedIo("offset"), state: "rotateTowards" },
			{ key: "offset", type: "point", ...this.sharedIo("offset"), state: "stretchTo" },
			{
				key: "randomOffset",
				type: "number",
				...this.sharedIo("randomOffset"),
				state: "rotateTowards",
				field: { default: 0, min: 0, step: 0.05 }
			},
			{
				key: "randomOffset",
				type: "number",
				...this.sharedIo("randomOffset"),
				state: "stretchTo",
				field: { default: 0, min: 0, step: 0.05 }
			},
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "rotateTowards" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "stretchTo" },
			{ key: "local", type: "boolean", ...this.sharedIo("local"), state: "rotateTowards" },
			{ key: "local", type: "boolean", ...this.sharedIo("local"), state: "stretchTo" },
			{ key: "onlyX", type: "boolean", ...this.io("onlyX"), state: "stretchTo" },
			{ key: "tiling", type: "boolean", ...this.io("tiling"), state: "stretchTo" },
			{
				key: "requiresLineOfSight",
				type: "boolean",
				...this.io("requiresLineOfSight"),
				state: "stretchTo"
			},
			{
				key: "hideLineOfSight",
				type: "boolean",
				...this.io("hideLineOfSight"),
				state: "stretchTo"
			},
			this.easeInput("ease", { state: "moveTowards" }),
			{
				key: "delay",
				type: "number",
				...this.sharedIo("delay"),
				state: "moveTowards",
				field: { default: 0, min: 0 }
			},
			{
				key: "rotate",
				type: "boolean",
				...this.io("rotate"),
				state: "moveTowards",
				field: { default: true }
			},
			{
				key: "moveSpeed",
				type: "number",
				...this.io("moveSpeed"),
				state: "moveTowards",
				field: { default: 0, min: 0 }
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const towards = this.resolveObject(await this.getInputValue("towards"));
		if (!towards) {
			devLog(`[${this.type}] no aim target; skipping`);
			return;
		}

		if (await this.getInputValue("missed")) effect.missed(true);

		const cacheLocation = await this.getInputValue("cacheLocation");

		if (this.state === "moveTowards") {
			effect.moveTowards(towards, {
				ease: await this.getInputValue("ease"),
				delay: await this.getInputValue("delay"),
				// @ts-expect-error TODO: Fix Sequencer Types
				rotate: await this.getInputValue("rotate"),
				cacheLocation
			});

			const moveSpeed = await this.getInputValue("moveSpeed");
			if (moveSpeed > 0) effect.moveSpeed(moveSpeed);
			return;
		}

		const opts: Record<string, unknown> = {
			cacheLocation,
			attachTo: await this.getInputValue("attachTo"),
			gridUnits: await this.getInputValue("gridUnits"),
			local: await this.getInputValue("local")
		};

		const offset = await this.getInputValue("offset");
		if (offset && (offset.x !== 0 || offset.y !== 0)) opts.offset = offset;

		const randomOffset = await this.getInputValue("randomOffset");
		if (randomOffset > 0) opts.randomOffset = randomOffset;

		if (this.state === "stretchTo") {
			opts.onlyX = await this.getInputValue("onlyX");
			opts.tiling = await this.getInputValue("tiling");
			opts.requiresLineOfSight = await this.getInputValue("requiresLineOfSight");
			opts.hideLineOfSight = await this.getInputValue("hideLineOfSight");
			/*
				TODO: Look into adding a Sequencer option to make errors of "0" distance not show up or be restricted to console only.
				https://github.com/fantasycalendar/FoundryVTT-Sequencer/blob/master/src/canvas-effects/canvas-effect.js#L1347
				https://github.com/fantasycalendar/FoundryVTT-Sequencer/blob/master/src/canvas-effects/canvas-effect.js#L2101-L2105
			*/
			effect.stretchTo(towards, opts);
		} else {
			opts.rotationOffset = await this.getInputValue("rotationOffset");
			effect.rotateTowards(towards, opts);
		}
	}
}

export { AimNode };
