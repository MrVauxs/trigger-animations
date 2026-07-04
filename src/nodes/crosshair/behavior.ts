import { TriggerEngine as T } from "trigger-engine/types";
import { CrosshairModifierNode } from "./base";
import { WALL_BEHAVIOR_OPTIONS } from "./constants";

type TInputs = {
	location: PositionSource;
	limitMinRange: number;
	limitMaxRange: number;
	showRange: boolean;
	lockToEdge: boolean;
	lockToEdgeDirection: boolean;
	offset: { x: number; y: number };
	wallBehavior: string;
	lockDrag: boolean;
	lockManualRotation: boolean;
	persist: boolean;
};

class CrosshairBehaviorNode extends CrosshairModifierNode<TInputs> {
	static override get type() {
		return "cross-behavior";
	}

	static get aliases(): string[] {
		return ["location", "lockDrag", "lockManualRotation", "persist"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf1de" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.crosshairInput,
			{ key: "location", type: "position", ...this.io("location"), group: "location" },
			{
				key: "limitMinRange",
				type: "number",
				...this.io("limitMinRange"),
				group: "location",
				field: { default: 0, min: 0 }
			},
			{
				key: "limitMaxRange",
				type: "number",
				...this.io("limitMaxRange"),
				group: "location",
				field: { default: 0, min: 0 }
			},
			{ key: "showRange", type: "boolean", ...this.io("showRange"), group: "location" },
			{ key: "lockToEdge", type: "boolean", ...this.io("lockToEdge"), group: "location" },
			{
				key: "lockToEdgeDirection",
				type: "boolean",
				...this.io("lockToEdgeDirection"),
				group: "location"
			},
			{ key: "offset", type: "point", ...this.sharedIo("offset"), group: "location" },
			{
				key: "wallBehavior",
				type: "text",
				...this.io("wallBehavior"),
				group: "location",
				field: { type: "select", default: "anywhere", options: WALL_BEHAVIOR_OPTIONS }
			},
			{ key: "lockDrag", type: "boolean", ...this.io("lockDrag"), field: { default: true } },
			{ key: "lockManualRotation", type: "boolean", ...this.io("lockManualRotation") },
			{ key: "persist", type: "boolean", ...this.io("persist") }
		];
	}

	protected override async apply(section: CrosshairSection): Promise<void> {

		const location = this.getLocation(await this.getInputValue("location"));
		if (location) {
			const opts: Record<string, unknown> = {
				showRange: await this.getInputValue("showRange"),
				lockToEdge: await this.getInputValue("lockToEdge"),
				lockToEdgeDirection: await this.getInputValue("lockToEdgeDirection"),
				wallBehavior: await this.getInputValue("wallBehavior")
			};
			const min = await this.getInputValue("limitMinRange");
			if (min > 0) opts.limitMinRange = min;
			const max = await this.getInputValue("limitMaxRange");
			if (max > 0) opts.limitMaxRange = max;
			const offset = await this.getInputValue("offset");
			if (offset && (offset.x !== 0 || offset.y !== 0)) opts.offset = offset;
			section.location(location, opts);
		}

		// lockDrag defaults true in Sequencer, let the user turn it off.
		section.lockDrag(await this.getInputValue("lockDrag"));

		if (await this.getInputValue("lockManualRotation")) section.lockManualRotation(true);
		if (await this.getInputValue("persist")) section.persist(true);
	}
}

export { CrosshairBehaviorNode };
