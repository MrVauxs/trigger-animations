import { TriggerEngine as T } from "trigger-engine/types";
import { CrosshairModifierNode } from "./base";

type TInputs = {
	label: string;
	labelDx: number;
	labelDy: number;
	icon: string;
	iconBorderVisible: boolean;
	borderColor: string;
	borderAlpha: number;
	fillColor: string;
	fillAlpha: number;
	texture: string;
	textureAlpha: number;
	textureScale: number;
	gridHighlight: boolean;
};

// -1 means "leave unset" since 0 is a meaningful alpha.
const ALPHA_FIELD = { default: -1, min: -1, max: 1, step: 0.05 };

class CrosshairAppearanceNode extends CrosshairModifierNode<TInputs> {
	static override get type() {
		return "cross-appearance";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf53f" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.crosshairInput,
			{ key: "label", type: "text", ...this.io("label"), group: "label" },
			{ key: "labelDx", type: "number", ...this.io("labelDx"), group: "label", field: { default: 0 } },
			{ key: "labelDy", type: "number", ...this.io("labelDy"), group: "label", field: { default: 0 } },
			{ key: "icon", type: "text", ...this.io("icon"), group: "icon" },
			{ key: "iconBorderVisible", type: "boolean", ...this.io("iconBorderVisible"), group: "icon" },
			{ key: "borderColor", type: "text", ...this.io("borderColor"), group: "border" },
			{ key: "borderAlpha", type: "number", ...this.io("borderAlpha"), group: "border", field: { ...ALPHA_FIELD } },
			{ key: "fillColor", type: "text", ...this.io("fillColor"), group: "fill" },
			{ key: "fillAlpha", type: "number", ...this.io("fillAlpha"), group: "fill", field: { ...ALPHA_FIELD } },
			{ key: "texture", type: "text", ...this.io("texture"), group: "texture" },
			{ key: "textureAlpha", type: "number", ...this.io("textureAlpha"), group: "texture", field: { ...ALPHA_FIELD } },
			{ key: "textureScale", type: "number", ...this.io("textureScale"), group: "texture", field: { default: 0, min: 0, step: 0.05 } },
			{ key: "gridHighlight", type: "boolean", ...this.io("gridHighlight"), field: { default: true } }
		];
	}

	protected override async apply(section: CrosshairSection): Promise<void> {
		const label = await this.getInputValue("label");
		if (label) {
			section.label(label, {
				dx: await this.getInputValue("labelDx"),
				dy: await this.getInputValue("labelDy")
			});
		}

		const icon = await this.getInputValue("icon");
		if (icon) {
			section.icon(icon, { borderVisible: await this.getInputValue("iconBorderVisible") });
		}

		const borderColor = await this.getInputValue("borderColor");
		if (borderColor) {
			const alpha = await this.getInputValue("borderAlpha");
			// @ts-expect-error Sequencer types omit the options arg
			section.borderColor(borderColor, alpha >= 0 ? { alpha } : {});
		}

		const fillColor = await this.getInputValue("fillColor");
		if (fillColor) {
			const alpha = await this.getInputValue("fillAlpha");
			// @ts-expect-error Sequencer types omit the options arg
			section.fillColor(fillColor, alpha >= 0 ? { alpha } : {});
		}

		const texture = await this.getInputValue("texture");
		if (texture) {
			const alpha = await this.getInputValue("textureAlpha");
			const scale = await this.getInputValue("textureScale");
			const opts: { alpha?: number; scale?: number } = {};
			if (alpha >= 0) opts.alpha = alpha;
			if (scale > 0) opts.scale = scale;
			// @ts-expect-error Sequencer types require a stricter options shape
			section.texture(texture, opts);
		}

		// gridHighlight defaults true in Sequencer, so pass the value to let the
		// user turn it off.
		section.gridHighlight(await this.getInputValue("gridHighlight"));
	}
}

export { CrosshairAppearanceNode };
