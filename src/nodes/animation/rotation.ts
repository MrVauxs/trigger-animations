import { TriggerEngine as T } from "trigger-engine/types";
import { AnimationModifierNode } from "./base";

type TInputs = {
	rotate: number;
	randomRotation: boolean;
	towards: unknown;
	towardsDuration: number;
	towardsEase: string;
	towardsDelay: number;
	rotationOffset: number;
	towardsCenter: boolean;
	cacheLocation: boolean;
	rotateInDegrees: number;
	rotateInDuration: number;
	rotateInEase: string;
	rotateInDelay: number;
	rotateOutDegrees: number;
	rotateOutDuration: number;
	rotateOutEase: string;
	rotateOutDelay: number;
};

class AnimationRotationNode extends AnimationModifierNode<TInputs> {
	static override get type() {
		return "anim-rotation";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf2f1" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.animationInput,
			{ key: "rotate", type: "number", ...this.io("rotate"), field: { default: 0 } },
			{ key: "randomRotation", type: "boolean", ...this.io("randomRotation") },
			{ key: "towards", type: "any", ...this.io("towards"), group: "towards" },
			{
				key: "towardsDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "towards",
				field: { default: 0, min: 0 }
			},
			this.easeInput("towardsEase", { group: "towards" }),
			{
				key: "towardsDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "towards",
				field: { default: 0, min: 0 }
			},
			{
				key: "rotationOffset",
				type: "number",
				...this.io("rotationOffset"),
				group: "towards",
				field: { default: 0 }
			},
			{ key: "towardsCenter", type: "boolean", ...this.io("towardsCenter"), group: "towards", field: { default: true } },
			{ key: "cacheLocation", type: "boolean", ...this.sharedIo("cacheLocation"), group: "towards" },
			{
				key: "rotateInDegrees",
				type: "number",
				...this.io("degrees"),
				group: "rotateIn",
				field: { default: 0 }
			},
			{
				key: "rotateInDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "rotateIn",
				field: { default: 0, min: 0 }
			},
			this.easeInput("rotateInEase", { group: "rotateIn" }),
			{
				key: "rotateInDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "rotateIn",
				field: { default: 0, min: 0 }
			},
			{
				key: "rotateOutDegrees",
				type: "number",
				...this.io("degrees"),
				group: "rotateOut",
				field: { default: 0 }
			},
			{
				key: "rotateOutDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "rotateOut",
				field: { default: 0, min: 0 }
			},
			this.easeInput("rotateOutEase", { group: "rotateOut" }),
			{
				key: "rotateOutDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "rotateOut",
				field: { default: 0, min: 0 }
			}
		];
	}

	protected override async apply(section: AnimationSection): Promise<void> {
		const rotate = await this.getInputValue("rotate");
		if (rotate !== 0) section.rotate(rotate);

		if (await this.getInputValue("randomRotation")) section.randomRotation(true);

		const towards = this.resolveObject(await this.getInputValue("towards"));
		if (towards) {
			section.rotateTowards(towards, {
				// @ts-expect-error Sequencer types
				duration: await this.getInputValue("towardsDuration"),
				ease: await this.getInputValue("towardsEase"),
				delay: await this.getInputValue("towardsDelay"),
				rotationOffset: await this.getInputValue("rotationOffset"),
				towardsCenter: await this.getInputValue("towardsCenter"),
				cacheLocation: await this.getInputValue("cacheLocation")
			});
		}

		const rotateInDuration = await this.getInputValue("rotateInDuration");
		if (rotateInDuration > 0) {
			section.rotateIn(
				await this.getInputValue("rotateInDegrees"),
				rotateInDuration,
				{
					ease: await this.getInputValue("rotateInEase"),
					delay: await this.getInputValue("rotateInDelay")
				}
			);
		}

		const rotateOutDuration = await this.getInputValue("rotateOutDuration");
		if (rotateOutDuration > 0) {
			section.rotateOut(
				await this.getInputValue("rotateOutDegrees"),
				rotateOutDuration,
				{
					ease: await this.getInputValue("rotateOutEase"),
					delay: await this.getInputValue("rotateOutDelay")
				}
			);
		}
	}
}

export { AnimationRotationNode };
