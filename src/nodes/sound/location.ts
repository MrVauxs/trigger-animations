import type { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

interface TInputs {
	location: PositionSource;
	exitOnEmpty: "exit" | "global" | boolean;
	gridUnits: boolean;
	bindVisibility: boolean;
	bindElevation: boolean;
	toTarget: PositionSource;
	moveTowards: PositionSource;
	moveSpeed: number;
	moveEase: string;
	moveDelay: number;
}

type TState = "atLocation" | "attachTo";

class SoundLocationNode extends SoundModifierNode<TInputs, TState> {
	static override get type() {
		return "snd-location";
	}

	static override get aliases(): string[] {
		return ["atLocation", "attachTo", "toLocation", "moveTowards", "moveSpeed"];
	}

	static override get states(): string[] | null {
		return ["atLocation", "attachTo"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF3C5" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{ key: "location", type: "position", ...this.io("location") },
			{
				key: "exitOnEmpty",
				type: "text",
				...this.io("exitOnEmpty"),
				field: {
					type: "select",
					default: "exit",
					options: [
						{ value: "exit", label: this.localize("io.exitOnEmpty.options.exit") },
						{ value: "global", label: this.localize("io.exitOnEmpty.options.global") },
					],
				},
			},
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits") },
			{ key: "bindVisibility", type: "boolean", ...this.io("bindVisibility"), state: "attachTo", field: { default: true } },
			{ key: "bindElevation", type: "boolean", ...this.io("bindElevation"), state: "attachTo", field: { default: true } },
			{ key: "toTarget", type: "position", ...this.io("toTarget"), group: "toLocation" },
			{ key: "moveTowards", type: "position", ...this.io("moveTowards"), group: "move" },
			{
				key: "moveSpeed",
				type: "number",
				...this.io("moveSpeed"),
				group: "move",
				field: { default: 0, min: 0 },
			},
			this.easeInput("moveEase", { group: "move" }),
			{
				key: "moveDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "move",
				field: { default: 0, min: 0 },
			},
		];
	}

	protected override async apply(section: SoundSection): Promise<void | boolean> {
		const location = this.getLocation(await this.getInputValue("location"));
		const emptyBehavior = await this.getInputValue("exitOnEmpty");
		if (!location && (emptyBehavior === "exit" || emptyBehavior === true))
			return false;

		if (location) {
			const gridUnits = await this.getInputValue("gridUnits");
			if (this.state === "attachTo") {
				const bindVisibility = await this.getInputValue("bindVisibility");
				const bindElevation = await this.getInputValue("bindElevation");
				section.attachTo(location, { bindVisibility, bindElevation });
			} else {
				section.atLocation(location, { gridUnits });
			}
		}

		const toLocation = this.getLocation(await this.getInputValue("toTarget"));
		if (toLocation) {
			const gridUnits = await this.getInputValue("gridUnits");
			section.toLocation(toLocation, { gridUnits });
		}

		const moveTowards = this.getLocation(await this.getInputValue("moveTowards"));
		if (moveTowards) {
			const moveEase = await this.getInputValue("moveEase");
			const moveDelay = await this.getInputValue("moveDelay");
			// @ts-expect-error Sequencer types require a target field in options
			section.moveTowards(moveTowards, { ease: moveEase, delay: moveDelay });
		}

		const moveSpeed = await this.getInputValue("moveSpeed");
		if (moveSpeed > 0)
			section.moveSpeed(moveSpeed);
	}
}

export { SoundLocationNode };
