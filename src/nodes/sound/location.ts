import type { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

interface TInputs {
	location: PositionSource;
	gridUnits: boolean;
	bindVisibility: boolean;
	bindElevation: boolean;
	toTarget: TargetDocuments;
	moveTowards: TargetDocuments;
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
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits") },
			{ key: "bindVisibility", type: "boolean", ...this.io("bindVisibility"), state: "attachTo", field: { default: true } },
			{ key: "bindElevation", type: "boolean", ...this.io("bindElevation"), state: "attachTo", field: { default: true } },
			{ key: "toTarget", type: "target", ...this.io("toTarget"), group: "toLocation" },
			{ key: "moveTowards", type: "target", ...this.io("moveTowards"), group: "move" },
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

	protected override async apply(section: SoundSection): Promise<void> {
		const location = this.getLocation(await this.getInputValue("location"));
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

		const toTargetValue = await this.getInputValue("toTarget");
		if (toTargetValue) {
			const toLocation = this.getLocation({ kind: "target", actor: toTargetValue.actor, token: toTargetValue.token ?? undefined });
			if (toLocation) {
				const gridUnits = await this.getInputValue("gridUnits");
				section.toLocation(toLocation, { gridUnits });
			}
		}

		const moveTowardsValue = await this.getInputValue("moveTowards");
		if (moveTowardsValue) {
			const moveTowards = this.getLocation({ kind: "target", actor: moveTowardsValue.actor, token: moveTowardsValue.token ?? undefined });
			if (moveTowards) {
				const moveEase = await this.getInputValue("moveEase");
				const moveDelay = await this.getInputValue("moveDelay");
				// @ts-expect-error Sequencer types require a target field in options
				section.moveTowards(moveTowards, { ease: moveEase, delay: moveDelay });
			}
		}

		const moveSpeed = await this.getInputValue("moveSpeed");
		if (moveSpeed > 0)
			section.moveSpeed(moveSpeed);
	}
}

export { SoundLocationNode };
