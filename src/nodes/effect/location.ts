import { devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type LocationKind = {
	points: { x: number; y: number };
	targets: { actor: Actor; token?: TokenDocument | null };
};

type TInputs = {
	location: LocationKind[keyof LocationKind];
	gridUnits: boolean;
	attachTo: boolean;
	snapToGrid: boolean;
	aboveUI: boolean;
	position: { x: number; y: number };
	anchorX: number;
	anchorY: number;
	scale: string;
};

type TState = "points" | "targets" | "screenSpace";

class LocationNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "location";
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
			{ key: "location", type: "target", ...this.io("location"), state: "targets" },
			{ key: "attachTo", type: "boolean", ...this.sharedIo("attachTo"), state: "targets" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "points" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits"), state: "targets" },
			{ key: "snapToGrid", type: "boolean", ...this.io("snapToGrid"), state: "points" },
			{ key: "snapToGrid", type: "boolean", ...this.io("snapToGrid"), state: "targets" },
			{ key: "aboveUI", type: "boolean", ...this.io("aboveUI"), state: "screenSpace" },
			{ key: "position", type: "point", ...this.io("position"), state: "screenSpace" },
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
				field: { type: "json", width: 160 }
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

		const location = await this.getInputValue("location");
		if (location) {
			const gridUnits = await this.getInputValue("gridUnits");
			if (this.state === "targets") {
				const target = location as LocationKind["targets"];
				if (!target.token) {
					devLog(`[${this.type}] target has no token; skipping location`);
				} else if (await this.getInputValue("attachTo")) {
					effect.attachTo(target.token, { gridUnits });
				} else {
					effect.atLocation(target.token, { gridUnits });
				}
			} else {
				effect.atLocation(location as LocationKind["points"], { gridUnits });
			}
		}

		if (await this.getInputValue("snapToGrid")) effect.snapToGrid();
	}
}

export { LocationNode };
