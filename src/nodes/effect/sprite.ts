import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	anchor: Point;
	spriteAnchor: Point;
	center: boolean;
	mirrorX: boolean;
	mirrorY: boolean;
	randomizeMirrorX: boolean;
	randomizeMirrorY: boolean;
	offset: { x: number; y: number };
	gridUnits: boolean;
	local: boolean;
}

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
			this.anchorInput("anchor", { group: "anchor" }),
			this.anchorInput("spriteAnchor", { group: "anchor" }),
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
		effect.anchor(await this.getInputValue("anchor"));
		effect.spriteAnchor(await this.getInputValue("spriteAnchor"));

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
