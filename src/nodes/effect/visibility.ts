import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	locally: boolean;
	private: boolean;
	xray: boolean;
	constrainedByWalls: boolean;
	users: User[];
	masks: unknown[];
	maskToSource: boolean;
	opacity: number;
	fadeInDuration: number;
	fadeInEase: string;
	fadeInDelay: number;
	fadeOutDuration: number;
	fadeOutEase: string;
	fadeOutDelay: number;
}

class VisibilityNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "visibility";
	}

	static override get aliases(): string[] {
		return ["locally", "private", "xray", "constrainedByWalls", "forUsers", "mask", "opacity", "fadeIn", "fadeOut"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF06E" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "locally", type: "boolean", ...this.io("locally") },
			{ key: "private", type: "boolean", ...this.io("private") },
			{ key: "xray", type: "boolean", ...this.io("xray") },
			{ key: "constrainedByWalls", type: "boolean", ...this.io("constrainedByWalls") },
			{ key: "users", type: "user", isArray: true, ...this.io("users") },
			{ key: "masks", type: "any", isArray: true, ...this.io("masks"), group: "mask" },
			{ key: "maskToSource", type: "boolean", ...this.io("maskToSource"), group: "mask" },
			{
				key: "opacity",
				type: "number",
				...this.io("opacity"),
				// -1 means "leave unset" since 0 is a meaningful opacity.
				field: { default: -1, min: -1, max: 1, step: 0.05 },
			},
			{
				key: "fadeInDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "fadeIn",
				field: { default: 0, min: 0 },
			},
			this.easeInput("fadeInEase", { group: "fadeIn" }),
			{
				key: "fadeInDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "fadeIn",
				field: { default: 0, min: 0 },
			},
			{
				key: "fadeOutDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "fadeOut",
				field: { default: 0, min: 0 },
			},
			this.easeInput("fadeOutEase", { group: "fadeOut" }),
			{
				key: "fadeOutDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "fadeOut",
				field: { default: 0, min: 0 },
			},
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		if (await this.getInputValue("locally"))
			effect.locally(true);
		if (await this.getInputValue("private"))
			effect.private(true);
		if (await this.getInputValue("xray"))
			effect.xray(true);
		if (await this.getInputValue("constrainedByWalls")) {
			// @ts-expect-error TODO: Fix Sequencer Types
			effect.constrainedByWalls(true);
		}

		const users = await this.getInputValue("users");
		if (users?.length) {
			const ids = users.map(u => u?.id).filter((id): id is string => !!id);
			if (ids.length)
				effect.forUsers(ids);
		}

		const masks = await this.getInputValue("masks");
		if (masks?.length) {
			for (const raw of masks) {
				const obj = this.resolveObject(raw);
				if (obj && typeof obj !== "string")
					effect.mask(obj);
			}
		}
		if (await this.getInputValue("maskToSource"))
			effect.mask();

		const opacity = await this.getInputValue("opacity");
		if (opacity >= 0)
			effect.opacity(opacity);

		const fadeInDuration = await this.getInputValue("fadeInDuration");
		if (fadeInDuration > 0) {
			effect.fadeIn(fadeInDuration, {
				ease: await this.getInputValue("fadeInEase"),
				delay: await this.getInputValue("fadeInDelay"),
			});
		}

		const fadeOutDuration = await this.getInputValue("fadeOutDuration");
		if (fadeOutDuration > 0) {
			effect.fadeOut(fadeOutDuration, {
				ease: await this.getInputValue("fadeOutEase"),
				delay: await this.getInputValue("fadeOutDelay"),
			});
		}
	}
}

export { VisibilityNode };
