import { devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";
import { ALIGN_OPTIONS, EDGE_OPTIONS } from "./constants";

type LocationKind = {
	points: Point;
	targets: any;
};

type TInputs = {
	location: LocationKind[keyof LocationKind];
	gridUnits: boolean;
	attachTo: boolean;
	cacheLocation: boolean;
	randomOffset: number;
	snapToGrid: boolean;
	aboveUI: boolean;
	position: { x: number; y: number };
	offset: { x: number; y: number };
	local: boolean;
	align: string;
	edge: string;
	bindVisibility: boolean;
	bindAlpha: boolean;
	bindScale: boolean;
	bindRotation: boolean;
	bindElevation: boolean;
	anchorX: number;
	anchorY: number;
	scale: string;
};

type TState = "points" | "targets" | "screenSpace";

class LocationNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "location";
	}

	static get aliases(): string[] {
		return ["atLocation", "attachTo", "snapToGrid", "screenSpace", "screenSpaceAboveUI",
			"screenSpacePosition", "screenSpaceAnchor", "screenSpaceScale"];
	}

	// World location and screen space are mutually exclusive, so screen space
	// lives here as a third state rather than as its own node.
	static override get states(): string[] | null {
		return ["targets", "points", "screenSpace"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf3c5" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{ key: "location", type: "point", ...this.io("location"), state: "points" },
			{ key: "location", type: "any", ...this.io("location"), state: "targets" },
			{ key: "attachTo", type: "boolean", ...this.sharedIo("attachTo"), state: "targets" },
			{ key: "cacheLocation", type: "boolean", ...this.sharedIo("cacheLocation"), state: "targets" },
			{ key: "cacheLocation", type: "boolean", ...this.sharedIo("cacheLocation"), state: "points" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "points" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "targets" },
			{ key: "snapToGrid", type: "boolean", ...this.io("snapToGrid"), state: "points" },
			{ key: "snapToGrid", type: "boolean", ...this.io("snapToGrid"), state: "targets" },
			{ key: "aboveUI", type: "boolean", ...this.io("aboveUI"), state: "screenSpace" },
			{ key: "position", type: "point", ...this.io("position"), state: "screenSpace" },
			{ key: "offset", type: "point", ...this.sharedIo("offset"), state: "targets" },
			{ key: "offset", type: "point", ...this.sharedIo("offset"), state: "points" },
			{
				key: "randomOffset",
				type: "number",
				...this.sharedIo("randomOffset"),
				state: "targets",
				field: { default: 0, min: 0, step: 0.05 }
			},
			{
				key: "randomOffset",
				type: "number",
				...this.sharedIo("randomOffset"),
				state: "points",
				field: { default: 0, min: 0, step: 0.05 }
			},
			{ key: "local", type: "boolean", ...this.sharedIo("local"), state: "targets" },
			{ key: "local", type: "boolean", ...this.sharedIo("local"), state: "points" },
			{
				key: "align",
				type: "text",
				...this.io("align"),
				state: "targets",
				group: "attach",
				field: { type: "select", default: "center", options: ALIGN_OPTIONS }
			},
			{
				key: "edge",
				type: "text",
				...this.io("edge"),
				state: "targets",
				group: "attach",
				field: { type: "select", default: "on", options: EDGE_OPTIONS }
			},
			{
				key: "bindVisibility",
				type: "boolean",
				...this.io("bindVisibility"),
				state: "targets",
				group: "attach",
				field: { default: true }
			},
			{
				key: "bindAlpha",
				type: "boolean",
				...this.io("bindAlpha"),
				state: "targets",
				group: "attach",
				field: { default: true }
			},
			{
				key: "bindScale",
				type: "boolean",
				...this.io("bindScale"),
				state: "targets",
				group: "attach",
				field: { default: true }
			},
			{
				key: "bindRotation",
				type: "boolean",
				...this.io("bindRotation"),
				state: "targets",
				group: "attach",
				field: { default: true }
			},
			{
				key: "bindElevation",
				type: "boolean",
				...this.io("bindElevation"),
				state: "targets",
				group: "attach",
				field: { default: true }
			},
			{
				key: "anchorX",
				type: "number",
				...this.io("anchorX"),
				state: "screenSpace",
				field: { default: -1, min: -1, max: 1, step: 0.05 }
			},
			{
				key: "anchorY",
				type: "number",
				...this.io("anchorY"),
				state: "screenSpace",
				field: { default: -1, min: -1, max: 1, step: 0.05 }
			},
			{
				key: "scale",
				type: "text",
				...this.io("scale"),
				state: "screenSpace",
				field: { type: "json" }
			}
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		if (this.state === "screenSpace") {
			effect.screenSpace();
			if (await this.getInputValue("aboveUI")) effect.screenSpaceAboveUI();

			const position = await this.getInputValue("position");
			if (position && (position.x !== 0 || position.y !== 0)) {
				effect.screenSpacePosition(position);
			}

			const anchorX = await this.getInputValue("anchorX");
			const anchorY = await this.getInputValue("anchorY");
			if (anchorX >= 0 || anchorY >= 0) {
				effect.screenSpaceAnchor({
					x: anchorX >= 0 ? anchorX : 0.5,
					y: anchorY >= 0 ? anchorY : 0.5
				});
			}

			const scale = this.parseJson(await this.getInputValue("scale"), "scale");
			if (scale) effect.screenSpaceScale(scale);
			return;
		}

		const location = this.getLocation(await this.getInputValue("location"));
		if (location) {
			const opts: Record<string, unknown> = {
				cacheLocation: await this.getInputValue("cacheLocation"),
				gridUnits: await this.getInputValue("gridUnits"),
				local: await this.getInputValue("local")
			};

			const offset = await this.getInputValue("offset");
			if (offset && (offset.x !== 0 || offset.y !== 0)) opts.offset = offset;

			const randomOffset = await this.getInputValue("randomOffset");
			if (randomOffset > 0) opts.randomOffset = randomOffset;

			if (this.state === "targets") {
				if (await this.getInputValue("attachTo")) {
					opts.align = await this.getInputValue("align");
					opts.edge = await this.getInputValue("edge");
					opts.bindVisibility = await this.getInputValue("bindVisibility");
					opts.bindAlpha = await this.getInputValue("bindAlpha");
					opts.bindScale = await this.getInputValue("bindScale");
					opts.bindRotation = await this.getInputValue("bindRotation");
					opts.bindElevation = await this.getInputValue("bindElevation");
					effect.attachTo(location, opts);
				} else {
					effect.atLocation(location, opts);
				}
			} else {
				// `local` only applies to attached/target locations; harmless but unused on points.
				effect.atLocation(location, opts);
			}
		}

		if (await this.getInputValue("snapToGrid")) effect.snapToGrid();
	}
}

export { LocationNode };
