import type { CrosshairBuilder } from "$lib/crosshairBuilder";
import type { TriggerEngine as T } from "trigger-engine/types";
import { CrosshairModifierNode } from "./base";
import { TEMPLATE_TYPE_OPTIONS } from "./constants";

interface TInputs {
	type: string;
	distance: number;
	distanceMin: number;
	distanceMax: number;
	angle: number;
	direction: number;
	width: number;
	snapPosition: number;
	snapDirection: number;
}

class CrosshairShapeNode extends CrosshairModifierNode<TInputs> {
	static override get type() {
		return "cross-shape";
	}

	static override get aliases(): string[] {
		return ["type", "distance", "angle", "direction", "width", "snapPosition", "snapDirection"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF5EE" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.crosshairInput,
			{
				key: "type",
				type: "text",
				...this.io("type"),
				field: { type: "select", default: "circle", options: TEMPLATE_TYPE_OPTIONS },
			},
			{
				key: "distance",
				type: "number",
				...this.io("distance"),
				group: "distance",
				field: { default: 0, min: 0 },
			},
			{
				key: "distanceMin",
				type: "number",
				...this.io("distanceMin"),
				group: "distance",
				field: { default: 0, min: 0 },
			},
			{
				key: "distanceMax",
				type: "number",
				...this.io("distanceMax"),
				group: "distance",
				field: { default: 0, min: 0 },
			},
			{ key: "angle", type: "number", ...this.io("angle"), field: { default: 0 } },
			{ key: "direction", type: "number", ...this.io("direction"), field: { default: 0 } },
			{ key: "width", type: "number", ...this.io("width"), field: { default: 0, min: 0 } },
			{
				key: "snapPosition",
				type: "number",
				...this.io("snapPosition"),
				field: { default: -1, min: -1, step: 1 },
			},
			{
				key: "snapDirection",
				type: "number",
				...this.io("snapDirection"),
				field: { default: 0, min: 0 },
			},
		];
	}

	protected override async apply(crosshair: CrosshairBuilder): Promise<void> {
		const type = await this.getInputValue("type");
		if (type && type !== "circle")
			crosshair.type(type);

		const distance = await this.getInputValue("distance");
		if (distance > 0) {
			const min = await this.getInputValue("distanceMin");
			const max = await this.getInputValue("distanceMax");
			const opts: { min?: number; max?: number } = {};
			if (min > 0)
				opts.min = min;
			if (max > 0)
				opts.max = max;
			crosshair.distance(distance, opts);
		}

		const angle = await this.getInputValue("angle");
		if (angle !== 0)
			crosshair.angle(angle);

		const direction = await this.getInputValue("direction");
		if (direction !== 0)
			crosshair.direction(direction);

		const width = await this.getInputValue("width");
		if (width > 0)
			crosshair.width(width);

		const snapPosition = await this.getInputValue("snapPosition");
		if (snapPosition >= 0)
			crosshair.snapPosition(snapPosition);

		const snapDirection = await this.getInputValue("snapDirection");
		if (snapDirection > 0)
			crosshair.snapDirection(snapDirection);
	}
}

export { CrosshairShapeNode };
