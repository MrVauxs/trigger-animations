import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	scale: number;
	scaleMax: number;
	objectScale: number;
	uniform: boolean;
	considerTokenScale: boolean;
	width: number;
	height: number;
	gridUnits: boolean;
	spriteScale: number;
	spriteScaleMax: number;
	spriteScalePoint: { x: number; y: number };
	scaleInScale: number;
	scaleInScalePoint: { x: number; y: number };
	scaleInDuration: number;
	scaleInEase: string;
	scaleInDelay: number;
	scaleOutScale: number;
	scaleOutScalePoint: { x: number; y: number };
	scaleOutDuration: number;
	scaleOutEase: string;
	scaleOutDelay: number;
}

type TState = "factor" | "object" | "size" | "spritePoint";

/** States where scale amounts are uniform numbers instead of Points. */
const UNIFORM_SCALE_STATES = ["factor", "object", "size"];

class ScaleNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "scale";
	}

	static override get aliases(): string[] {
		return ["scale", "scaleToObject", "size", "spriteScale", "scaleIn", "scaleOut"];
	}

	static override get states(): string[] | null {
		return ["factor", "object", "size", "spritePoint"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF424" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{
				key: "scale",
				type: "number",
				...this.io("scale"),
				state: "factor",
				field: { default: 0, min: 0 },
			},
			{
				key: "scaleMax",
				type: "number",
				...this.io("scaleMax"),
				state: "factor",
				field: { default: 0, min: 0 },
			},
			{
				key: "objectScale",
				type: "number",
				...this.io("objectScale"),
				state: "object",
				field: { default: 1, min: 0 },
			},
			{ key: "uniform", type: "boolean", ...this.io("uniform"), state: "object" },
			{
				key: "considerTokenScale",
				type: "boolean",
				...this.io("considerTokenScale"),
				state: "object",
			},
			{
				key: "width",
				type: "number",
				...this.io("width"),
				state: "size",
				field: { default: 0, min: 0 },
			},
			{
				key: "height",
				type: "number",
				...this.io("height"),
				state: "size",
				field: { default: 0, min: 0 },
			},
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "size" },
			{
				key: "spriteScale",
				type: "number",
				...this.io("spriteScale"),
				state: UNIFORM_SCALE_STATES,
				field: { default: 0, min: 0 },
			},
			{
				key: "spriteScaleMax",
				type: "number",
				...this.io("spriteScaleMax"),
				state: UNIFORM_SCALE_STATES,
				field: { default: 0, min: 0 },
			},
			{
				key: "spriteScalePoint",
				type: "point",
				...this.io("spriteScalePoint"),
				state: "spritePoint",
				field: { x: 0, y: 0 },
			},
			{
				key: "scaleInScale",
				type: "number",
				...this.io("fadeScale"),
				group: "scaleIn",
				state: UNIFORM_SCALE_STATES,
				field: { default: 0, min: 0 },
			},
			{
				key: "scaleInScalePoint",
				type: "point",
				...this.io("fadeScalePoint"),
				group: "scaleIn",
				state: "spritePoint",
				field: { x: 0, y: 0 },
			},
			{
				key: "scaleInDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "scaleIn",
				field: { default: 0, min: 0 },
			},
			this.easeInput("scaleInEase", { group: "scaleIn" }),
			{
				key: "scaleInDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "scaleIn",
				field: { default: 0, min: 0 },
			},
			{
				key: "scaleOutScale",
				type: "number",
				...this.io("fadeScale"),
				group: "scaleOut",
				state: UNIFORM_SCALE_STATES,
				field: { default: 0, min: 0 },
			},
			{
				key: "scaleOutScalePoint",
				type: "point",
				...this.io("fadeScalePoint"),
				group: "scaleOut",
				state: "spritePoint",
				field: { x: 0, y: 0 },
			},
			{
				key: "scaleOutDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "scaleOut",
				field: { default: 0, min: 0 },
			},
			this.easeInput("scaleOutEase", { group: "scaleOut" }),
			{
				key: "scaleOutDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "scaleOut",
				field: { default: 0, min: 0 },
			},
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		if (this.state === "factor") {
			const scale = await this.getInputValue("scale");
			if (scale > 0) {
				const scaleMax = await this.getInputValue("scaleMax");
				if (scaleMax > 0)
					effect.scale(scale, scaleMax);
				else effect.scale(scale);
			}
		} else if (this.state === "object") {
			effect.scaleToObject(
				(await this.getInputValue("objectScale")) || 1,
				{
					uniform: await this.getInputValue("uniform"),
					considerTokenScale: await this.getInputValue("considerTokenScale"),
				},
			);
		} else if (this.state === "size") {
			const width = await this.getInputValue("width");
			const height = await this.getInputValue("height");
			const gridUnits = await this.getInputValue("gridUnits");
			// Passing only one dimension lets Sequencer set the other to "auto",
			// preserving aspect ratio; a bare number would make a square instead.
			if (width > 0 && height > 0)
				effect.size({ width, height }, { gridUnits });
			else if (width > 0)
				// @ts-expect-error TODO: Fix Sequencer Types
				effect.size({ width }, { gridUnits });
			else if (height > 0)
			// @ts-expect-error TODO: Fix Sequencer Types
				effect.size({ height }, { gridUnits });
		}

		if (this.state === "spritePoint") {
			const spriteScalePoint = await this.getInputValue("spriteScalePoint");
			if (spriteScalePoint && (spriteScalePoint.x !== 0 || spriteScalePoint.y !== 0))
				effect.spriteScale(spriteScalePoint);
		} else {
			const spriteScale = await this.getInputValue("spriteScale");
			if (spriteScale > 0) {
				const spriteScaleMax = await this.getInputValue("spriteScaleMax");
				if (spriteScaleMax > 0)
					effect.spriteScale(spriteScale, spriteScaleMax);
				else effect.spriteScale(spriteScale);
			}
		}

		const scaleInDuration = await this.getInputValue("scaleInDuration");
		if (scaleInDuration > 0) {
			effect.scaleIn(
				this.state === "spritePoint"
					? await this.getInputValue("scaleInScalePoint")
					: await this.getInputValue("scaleInScale"),
				scaleInDuration,
				{
					ease: await this.getInputValue("scaleInEase"),
					delay: await this.getInputValue("scaleInDelay"),
				},
			);
		}

		const scaleOutDuration = await this.getInputValue("scaleOutDuration");
		if (scaleOutDuration > 0) {
			effect.scaleOut(
				this.state === "spritePoint"
					? await this.getInputValue("scaleOutScalePoint")
					: await this.getInputValue("scaleOutScale"),
				scaleOutDuration,
				{
					ease: await this.getInputValue("scaleOutEase"),
					delay: await this.getInputValue("scaleOutDelay"),
				},
			);
		}
	}
}

export { ScaleNode };
