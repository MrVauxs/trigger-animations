import type { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

interface TInputs {
	duration: number;
	startTime: number;
	endTime: number;
	startPerc: number;
	endPerc: number;
}

type TState = "milliseconds" | "percentage";

class SoundTimingNode extends SoundModifierNode<TInputs, TState> {
	static override get type() {
		return "snd-timing";
	}

	static override get aliases(): string[] {
		return ["duration", "startTimePerc", "endTimePerc", "timeRange", "startTime", "endTime"];
	}

	static override get states(): string[] | null {
		return ["milliseconds", "percentage"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF017" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{
				key: "duration",
				type: "number",
				...this.sharedIo("duration"),
				field: { default: 0, min: 0 },
			},
			{
				key: "startTime",
				type: "number",
				...this.io("startTime"),
				state: "milliseconds",
				field: { default: 0, min: 0 },
			},
			{
				key: "endTime",
				type: "number",
				...this.io("endTime"),
				state: "milliseconds",
				field: { default: 0, min: 0 },
			},
			{
				key: "startPerc",
				type: "number",
				...this.io("startPerc"),
				state: "percentage",
				field: { default: 0, min: 0, max: 1, step: 0.01 },
			},
			{
				key: "endPerc",
				type: "number",
				...this.io("endPerc"),
				state: "percentage",
				field: { default: 0, min: 0, max: 1, step: 0.01 },
			},
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		const duration = await this.getInputValue("duration");
		if (duration > 0)
			section.duration(duration);

		if (this.state === "percentage") {
			const startPerc = await this.getInputValue("startPerc");
			if (startPerc > 0)
				section.startTimePerc(startPerc);

			const endPerc = await this.getInputValue("endPerc");
			if (endPerc > 0)
				section.endTimePerc(endPerc);
		} else {
			const startTime = await this.getInputValue("startTime");
			const endTime = await this.getInputValue("endTime");
			if (startTime > 0 && endTime > 0)
				section.timeRange(startTime, endTime);
			else if (startTime > 0)
				section.startTime(startTime);
			else if (endTime > 0)
				section.endTime(endTime);
		}
	}
}

export { SoundTimingNode };
