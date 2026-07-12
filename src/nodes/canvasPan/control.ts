import type { TriggerEngine as T } from "trigger-engine/types";
import { CanvasPanModifierNode } from "./base";

interface TInputs {
	speed: number;
	scale: number;
	lockView: number;
	shake: boolean;
	shakeDuration: number;
	shakeStrength: number;
	shakeFrequency: number;
	shakeFadeIn: number;
	shakeFadeOut: number;
	shakeRotation: boolean;
}

class CanvasPanControlNode extends CanvasPanModifierNode<TInputs> {
	static override get type() {
		return "pan-control";
	}

	static override get aliases(): string[] {
		return ["speed", "scale", "lockView", "shake"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF547" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.canvasPanInput,
			{ key: "speed", type: "number", ...this.io("speed"), field: { default: 0, min: 0 } },
			{ key: "scale", type: "number", ...this.io("scale"), field: { default: 0, min: 0, step: 0.05 } },
			{ key: "lockView", type: "number", ...this.io("lockView"), field: { default: 0, min: 0 } },
			{ key: "shake", type: "boolean", ...this.io("shake"), group: "shake" },
			{
				key: "shakeDuration",
				type: "number",
				...this.io("shakeDuration"),
				group: "shake",
				field: { default: 250, min: 0 },
			},
			{
				key: "shakeStrength",
				type: "number",
				...this.io("shakeStrength"),
				group: "shake",
				field: { default: 20, min: 0 },
			},
			{
				key: "shakeFrequency",
				type: "number",
				...this.io("shakeFrequency"),
				group: "shake",
				field: { default: 10, min: 0 },
			},
			{
				key: "shakeFadeIn",
				type: "number",
				...this.io("shakeFadeIn"),
				group: "shake",
				field: { default: 0, min: 0 },
			},
			{
				key: "shakeFadeOut",
				type: "number",
				...this.io("shakeFadeOut"),
				group: "shake",
				field: { default: 200, min: 0 },
			},
			{
				key: "shakeRotation",
				type: "boolean",
				...this.io("shakeRotation"),
				group: "shake",
				field: { default: true },
			},
		];
	}

	protected override async apply(section: CanvasPanSection): Promise<void> {
		const speed = await this.getInputValue("speed");
		if (speed > 0)
			section.speed(speed);

		const scale = await this.getInputValue("scale");
		if (scale > 0)
			section.scale(scale);

		const lockView = await this.getInputValue("lockView");
		if (lockView > 0)
			section.lockView(lockView);

		if (await this.getInputValue("shake")) {
			section.shake({
				duration: await this.getInputValue("shakeDuration"),
				strength: await this.getInputValue("shakeStrength"),
				frequency: await this.getInputValue("shakeFrequency"),
				fadeInDuration: await this.getInputValue("shakeFadeIn"),
				fadeOutDuration: await this.getInputValue("shakeFadeOut"),
				rotation: await this.getInputValue("shakeRotation"),
			});
		}
	}
}

export { CanvasPanControlNode };
