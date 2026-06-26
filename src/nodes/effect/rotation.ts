import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type TInputs = {
	rotate: number;
	randomRotation: boolean;
	spriteRotation: number;
	randomSpriteRotation: boolean;
	zeroSpriteRotation: boolean;
	rotateInDegrees: number;
	rotateInDuration: number;
	rotateInEase: string;
	rotateInDelay: number;
	rotateOutDegrees: number;
	rotateOutDuration: number;
	rotateOutEase: string;
	rotateOutDelay: number;
};

class RotationNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "rotation";
	}

	static get aliases(): string[] {
		return ["rotate", "randomRotation", "spriteRotation", "randomSpriteRotation",
			"zeroSpriteRotation", "rotateIn", "rotateOut"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf2f1" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "rotate", type: "number", ...this.io("rotate"), field: { default: 0 } },
			{ key: "randomRotation", type: "boolean", ...this.io("randomRotation") },
			{
				key: "spriteRotation",
				type: "number",
				...this.io("spriteRotation"),
				field: { default: 0 }
			},
			{ key: "randomSpriteRotation", type: "boolean", ...this.io("randomSpriteRotation") },
			{ key: "zeroSpriteRotation", type: "boolean", ...this.io("zeroSpriteRotation") },
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

	protected override async apply(effect: EffectSection): Promise<void> {
		const rotate = await this.getInputValue("rotate");
		if (rotate !== 0) effect.rotate(rotate);

		if (await this.getInputValue("randomRotation")) effect.randomRotation(true);

		const spriteRotation = await this.getInputValue("spriteRotation");
		if (spriteRotation !== 0) effect.spriteRotation(spriteRotation);

		if (await this.getInputValue("randomSpriteRotation")) {
			// @ts-expect-error TODO: Fix Sequencer Types
			effect.randomSpriteRotation(true);
		}

		if (await this.getInputValue("zeroSpriteRotation")) effect.zeroSpriteRotation(true);

		const rotateInDuration = await this.getInputValue("rotateInDuration");
		if (rotateInDuration > 0) {
			effect.rotateIn(
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
			effect.rotateOut(
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

export { RotationNode };
