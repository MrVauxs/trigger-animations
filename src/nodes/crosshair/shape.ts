import { TriggerEngine as T } from "trigger-engine/types";
import { CrosshairModifierNode } from "./base";

type TInputs = {
	type: string;
	distance: number;
	distanceMin: number;
	distanceMax: number;
	angle: number;
	direction: number;
	width: number;
	snapPosition: number;
	snapDirection: number;
};

class CrosshairShapeNode extends CrosshairModifierNode<TInputs> {
	static override get type() {
		return "cross-shape";
	}

	static override get tags() {
		return super.tags.concat(...[
			"type", "distance", "angle", "direction", "width", "snapPosition", "snapDirection"
		])
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf5ee" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.crosshairInput,
			{
				key: "type",
				type: "text",
				...this.io("type"),
				field: { type: "select", default: "circle", options: CONST.MEASURED_TEMPLATE_TYPES }
			},
			{
				key: "distance",
				type: "number",
				...this.io("distance"),
				group: "distance",
				field: { default: 0, min: 0 }
			},
			{
				key: "distanceMin",
				type: "number",
				...this.io("distanceMin"),
				group: "distance",
				field: { default: 0, min: 0 }
			},
			{
				key: "distanceMax",
				type: "number",
				...this.io("distanceMax"),
				group: "distance",
				field: { default: 0, min: 0 }
			},
			{ key: "angle", type: "number", ...this.io("angle"), field: { default: 0 } },
			{ key: "direction", type: "number", ...this.io("direction"), field: { default: 0 } },
			{ key: "width", type: "number", ...this.io("width"), field: { default: 0, min: 0 } },
			{
				key: "snapPosition",
				type: "number",
				...this.io("snapPosition"),
				field: { default: -1, min: -1, step: 1 }
			},
			{
				key: "snapDirection",
				type: "number",
				...this.io("snapDirection"),
				field: { default: 0, min: 0 }
			}
		];
	}

	protected override async apply(section: CrosshairSection): Promise<void> {
		const type = await this.getInputValue("type");
		if (type && type !== "circle") section.type(type);

		const distance = await this.getInputValue("distance");
		if (distance > 0) {
			const min = await this.getInputValue("distanceMin");
			const max = await this.getInputValue("distanceMax");
			const opts: { min?: number; max?: number } = {};
			if (min > 0) opts.min = min;
			if (max > 0) opts.max = max;
			section.distance(distance, opts);
		}

		const angle = await this.getInputValue("angle");
		if (angle !== 0) section.angle(angle);

		const direction = await this.getInputValue("direction");
		if (direction !== 0) section.direction(direction);

		const width = await this.getInputValue("width");
		if (width > 0) section.width(width);

		const snapPosition = await this.getInputValue("snapPosition");
		if (snapPosition >= 0) section.snapPosition(snapPosition);

		const snapDirection = await this.getInputValue("snapDirection");
		if (snapDirection > 0) section.snapDirection(snapDirection);
	}
}

export { CrosshairShapeNode };
