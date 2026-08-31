import type { TriggerEngine as T } from "trigger-engine/types";
import { moduleWarn } from "$lib/utils";
import { AnimationModifierNode } from "./base";

interface TInputs {
	towards: PositionSource;
	offset: { x: number; y: number };
	closestSquare: boolean;
	snapToGrid: boolean;
	ease: string;
	delay: number;
	rotate: boolean;
	cacheLocation: boolean;
	moveSpeed: number;
	relativeToCenter: boolean;
}

type TState = "moveTowards" | "teleportTo";

class AnimationMoveNode extends AnimationModifierNode<TInputs, TState> {
	static override get type() {
		return "anim-move";
	}

	static override get aliases(): string[] {
		return ["offset", "closestSquare", "snapToGrid", "teleportTo", "moveTowards", "moveSpeed"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	static override get states(): string[] | null {
		return ["moveTowards", "teleportTo"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF0B2" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.animationInput,
			{ key: "towards", type: "position", ...this.io("towards") },
			{ key: "offset", type: "point", ...this.sharedIo("offset") },
			{ key: "closestSquare", type: "boolean", ...this.io("closestSquare") },
			{ key: "snapToGrid", type: "boolean", ...this.io("snapToGrid") },
			this.easeInput("ease", { state: "moveTowards" }),
			{
				key: "delay",
				type: "number",
				...this.sharedIo("delay"),
				field: { default: 0, min: 0 },
			},
			{
				key: "rotate",
				type: "boolean",
				...this.io("rotate"),
				state: "moveTowards",
				field: { default: true },
			},
			{
				key: "cacheLocation",
				type: "boolean",
				...this.sharedIo("cacheLocation"),
				state: "moveTowards",
			},
			{
				key: "moveSpeed",
				type: "number",
				...this.io("moveSpeed"),
				state: "moveTowards",
				field: { default: 0, min: 0 },
			},
			{
				key: "relativeToCenter",
				type: "boolean",
				...this.io("relativeToCenter"),
				state: "teleportTo",
			},
		];
	}

	protected override async apply(section: AnimationSection): Promise<void> {
		const towards = this.getLocation(await this.getInputValue("towards"));
		if (!towards) {
			moduleWarn(`[${this.type}] no destination; skipping`);
			return;
		}

		const offset = await this.getInputValue("offset");
		if (offset && (offset.x !== 0 || offset.y !== 0))
			section.offset(offset);
		if (await this.getInputValue("closestSquare"))
			section.closestSquare(true);
		if (await this.getInputValue("snapToGrid"))
			section.snapToGrid(true);

		if (this.state === "teleportTo") {
			section.teleportTo(towards, {
				delay: await this.getInputValue("delay"),
				relativeToCenter: await this.getInputValue("relativeToCenter"),
			});
		} else {
			section.moveTowards(towards, {
				ease: await this.getInputValue("ease"),
				delay: await this.getInputValue("delay"),
				// @ts-expect-error Sequencer types
				rotate: await this.getInputValue("rotate"),
				cacheLocation: await this.getInputValue("cacheLocation"),
			});

			const moveSpeed = await this.getInputValue("moveSpeed");
			if (moveSpeed > 0)
				section.moveSpeed(moveSpeed);
		}
	}
}

export { AnimationMoveNode };
