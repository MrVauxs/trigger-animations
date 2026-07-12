import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	anchorX: number;
	anchorY: number;
	spriteAnchorX: number;
	spriteAnchorY: number;
	center: boolean;
	mirrorX: boolean;
	mirrorY: boolean;
	randomizeMirrorX: boolean;
	randomizeMirrorY: boolean;
	offset: { x: number; y: number };
	gridUnits: boolean;
	local: boolean;
}

// -1 means "leave unset" since 0 is a meaningful anchor; 0.5 is Sequencer's default.
const ANCHOR_FIELD = { default: -1, min: -1, max: 1, step: 0.05 };

class SpriteNode extends EffectModifierNode<TInputs> {
	static override get type() {
		return "sprite";
	}

	static override get aliases(): string[] {
		return ["anchor", "spriteAnchor", "center", "mirrorX", "mirrorY", "randomizeMirrorX", "randomizeMirrorY", "spriteOffset"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF03E" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{
				key: "anchorX",
				type: "number",
				...this.io("anchorX"),
				group: "anchor",
				field: { ...ANCHOR_FIELD },
			},
			{
				key: "anchorY",
				type: "number",
				...this.io("anchorY"),
				group: "anchor",
				field: { ...ANCHOR_FIELD },
			},
			{
				key: "spriteAnchorX",
				type: "number",
				...this.io("anchorX"),
				group: "spriteAnchor",
				field: { ...ANCHOR_FIELD },
			},
			{
				key: "spriteAnchorY",
				type: "number",
				...this.io("anchorY"),
				group: "spriteAnchor",
				field: { ...ANCHOR_FIELD },
			},
			{ key: "center", type: "boolean", ...this.io("center") },
			{ key: "mirrorX", type: "boolean", ...this.io("mirrorX"), group: "mirror" },
			{ key: "mirrorY", type: "boolean", ...this.io("mirrorY"), group: "mirror" },
			{
				key: "randomizeMirrorX",
				type: "boolean",
				...this.io("randomizeMirrorX"),
				group: "mirror",
			},
			{
				key: "randomizeMirrorY",
				type: "boolean",
				...this.io("randomizeMirrorY"),
				group: "mirror",
			},
			{ key: "offset", type: "point", ...this.sharedIo("offset"), group: "offset" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), group: "offset" },
			{ key: "local", type: "boolean", ...this.sharedIo("local"), group: "offset" },
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const anchorX = await this.getInputValue("anchorX");
		const anchorY = await this.getInputValue("anchorY");
		if (anchorX >= 0 || anchorY >= 0) {
			effect.anchor({
				x: anchorX >= 0 ? anchorX : 0.5,
				y: anchorY >= 0 ? anchorY : 0.5,
			});
		}

		const spriteAnchorX = await this.getInputValue("spriteAnchorX");
		const spriteAnchorY = await this.getInputValue("spriteAnchorY");
		if (spriteAnchorX >= 0 || spriteAnchorY >= 0) {
			effect.spriteAnchor({
				x: spriteAnchorX >= 0 ? spriteAnchorX : 0.5,
				y: spriteAnchorY >= 0 ? spriteAnchorY : 0.5,
			});
		}

		if (await this.getInputValue("center"))
			effect.center();

		if (await this.getInputValue("mirrorX"))
			effect.mirrorX(true);
		if (await this.getInputValue("mirrorY"))
			effect.mirrorY(true);
		if (await this.getInputValue("randomizeMirrorX"))
			effect.randomizeMirrorX(true);
		if (await this.getInputValue("randomizeMirrorY"))
			effect.randomizeMirrorY(true);

		const offset = await this.getInputValue("offset");
		if (offset && (offset.x !== 0 || offset.y !== 0)) {
			effect.spriteOffset(offset, {
				gridUnits: await this.getInputValue("gridUnits"),
				local: await this.getInputValue("local"),
			});
		}
	}
}

export { SpriteNode };
