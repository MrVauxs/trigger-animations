import type { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

interface TInputs {
	duration: number;
	playbackRate: number;
	startTime: number;
	endTime: number;
	startPerc: number;
	endPerc: number;
}

type TState = "milliseconds" | "percentage";

class TimingNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "timing";
	}

	static override get aliases(): string[] {
		return ["duration", "playbackRate", "startTimePerc", "endTimePerc", "timeRange", "startTime", "endTime"];
	}

	static override get states(): string[] | null {
		return ["milliseconds", "percentage"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF017" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{
				key: "duration",
				type: "number",
				...this.sharedIo("duration"),
				field: { default: 0, min: 0 },
			},
			{
				key: "playbackRate",
				type: "number",
				...this.io("playbackRate"),
				field: { default: 1, min: 0, step: 0.05 },
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

	protected override async apply(effect: EffectSection): Promise<void> {
		const duration = await this.getInputValue("duration");
		if (duration > 0)
			effect.duration(duration);

		const playbackRate = await this.getInputValue("playbackRate");
		if (playbackRate !== 1)
			effect.playbackRate(playbackRate);

		if (this.state === "percentage") {
			const startPerc = await this.getInputValue("startPerc");
			if (startPerc > 0)
				effect.startTimePerc(startPerc);

			const endPerc = await this.getInputValue("endPerc");
			if (endPerc > 0)
				effect.endTimePerc(endPerc);
		} else {
			const startTime = await this.getInputValue("startTime");
			const endTime = await this.getInputValue("endTime");
			if (startTime > 0 && endTime > 0)
				effect.timeRange(startTime, endTime);
			else if (startTime > 0)
				effect.startTime(startTime);
			else if (endTime > 0)
				effect.endTime(endTime);
		}
	}
}

export { TimingNode };
