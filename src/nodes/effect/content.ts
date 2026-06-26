import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";
import { SHAPE_OPTIONS } from "./constants";

type TInputs = {
	text: string;
	textStyle: string;
	shapeType: Shapes;
	shapeOptions: string;
	from: TargetDocuments;
	cacheLocation: boolean;
	gridUnits: boolean;
	local: boolean;
	offset: { x: number; y: number };
	randomOffset: number;
	tilingScale: { x: number; y: number };
	tilingPosition: { x: number; y: number };
	templateGridSize: number;
	templateStartPoint: number;
	templateEndPoint: number;
};

type TState = "text" | "shape" | "copySprite" | "tiling" | "template";

class ContentNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "content";
	}

	static get aliases(): string[] {
		return ["text", "shape", "copySprite", "tilingTexture", "template"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	static override get states(): string[] | null {
		return ["text", "shape", "copySprite", "tiling", "template"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf61f" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "text", type: "text", ...this.io("text"), state: "text" },
			{
				key: "textStyle",
				type: "text",
				...this.io("textStyle"),
				state: "text",
				field: { type: "json" }
			},
			{
				key: "shapeType",
				type: "text",
				...this.io("shapeType"),
				state: "shape",
				field: { type: "select", default: "circle", options: SHAPE_OPTIONS }
			},
			{
				key: "shapeOptions",
				type: "text",
				...this.io("shapeOptions"),
				state: "shape",
				field: { type: "json" }
			},
			{ key: "from", type: "target", ...this.io("from"), state: "copySprite" },
			{
				key: "cacheLocation",
				type: "boolean",
				...this.sharedIo("cacheLocation"),
				state: "copySprite"
			},
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "copySprite" },
			{ key: "local", type: "boolean", ...this.sharedIo("local"), state: "copySprite" },
			{ key: "offset", type: "point", ...this.sharedIo("offset"), state: "copySprite" },
			{
				key: "randomOffset",
				type: "number",
				...this.sharedIo("randomOffset"),
				state: "copySprite",
				field: { default: 0, min: 0, step: 0.05 }
			},
			{ key: "tilingScale", type: "point", ...this.io("tilingScale"), state: "tiling" },
			{
				key: "tilingPosition",
				type: "point",
				...this.io("tilingPosition"),
				state: "tiling"
			},
			{
				key: "templateGridSize",
				type: "number",
				...this.io("templateGridSize"),
				state: "template",
				field: { default: 0, min: 0 }
			},
			{
				key: "templateStartPoint",
				type: "number",
				...this.io("templateStartPoint"),
				state: "template",
				field: { default: 0, min: 0 }
			},
			{
				key: "templateEndPoint",
				type: "number",
				...this.io("templateEndPoint"),
				state: "template",
				field: { default: 0, min: 0 }
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		switch (this.state) {
			case "text": {
				const text = await this.getInputValue("text");
				if (!text) return;
				const style = this.parseJson(await this.getInputValue("textStyle"), "textStyle");
				effect.text(text, style ?? {});
				return;
			}
			case "shape": {
				const options = this.parseJson(await this.getInputValue("shapeOptions"), "shapeOptions");
				if (!options) return;
				effect.shape((await this.getInputValue("shapeType")), options);
				return;
			}
			case "copySprite": {
				const from = await this.getInputValue("from");
				if (!from?.token) return;
				const opts: Record<string, unknown> = {
					cacheLocation: await this.getInputValue("cacheLocation"),
					gridUnits: await this.getInputValue("gridUnits"),
					local: await this.getInputValue("local")
				};
				const offset = await this.getInputValue("offset");
				if (offset && (offset.x !== 0 || offset.y !== 0)) opts.offset = offset;
				const randomOffset = await this.getInputValue("randomOffset");
				if (randomOffset > 0) opts.randomOffset = randomOffset;
				effect.copySprite(from.token, opts);
				return;
			}
			case "tiling": {
				const scale = await this.getInputValue("tilingScale");
				const position = await this.getInputValue("tilingPosition");
				effect.tilingTexture(
					{ x: scale?.x || 1, y: scale?.y || 1 },
					position ?? { x: 0, y: 0 }
				);
				return;
			}
			case "template": {
				const gridSize = await this.getInputValue("templateGridSize");
				if (gridSize <= 0) return;
				effect.template({
					gridSize,
					startPoint: await this.getInputValue("templateStartPoint"),
					endPoint: await this.getInputValue("templateEndPoint")
				});
				return;
			}
		}
	}
}

export { ContentNode };
