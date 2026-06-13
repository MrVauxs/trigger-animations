import { devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";
import { EffectModifierNode } from "./base";

type TInputs = {
	target: string;
	property: string;
	duration: number;
	from: number;
	to: number;
	delay: number;
	ease: string;
	fromEnd: boolean;
	gridUnits: boolean;
	screenSpace: boolean;
	absolute: boolean;
	values: string;
	loops: number;
	pingPong: boolean;
};

type TState = "animate" | "loop";

class AnimateNode extends EffectModifierNode<TInputs, TState> {
	static override get type() {
		return "animate";
	}

	static override get states(): string[] | null {
		return ["animate", "loop"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\ue2ca" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.effectInput,
			{
				key: "target",
				type: "text",
				...this.io("target"),
				field: { default: "sprite" }
			},
			{ key: "property", type: "text", ...this.io("property") },
			{
				key: "duration",
				type: "number",
				...this.sharedIo("duration"),
				field: { default: 0, min: 0 }
			},
			{ key: "from", type: "number", ...this.io("from"), field: { default: 0 } },
			{ key: "to", type: "number", ...this.io("to"), field: { default: 0 } },
			{
				key: "delay",
				type: "number",
				...this.sharedIo("delay"),
				field: { default: 0 }
			},
			this.easeInput("ease"),
			{ key: "fromEnd", type: "boolean", ...this.io("fromEnd"), state: "animate" },
			{ key: "gridUnits", type: "boolean", ...this.sharedIo("gridUnits") },
			{ key: "screenSpace", type: "boolean", ...this.io("screenSpace") },
			{ key: "absolute", type: "boolean", ...this.io("absolute") },
			{
				key: "values",
				type: "text",
				...this.io("values"),
				state: "loop",
				field: { type: "json", width: 160 }
			},
			{
				key: "loops",
				type: "number",
				...this.io("loops"),
				state: "loop",
				field: { default: 0, min: 0, step: 1 }
			},
			{ key: "pingPong", type: "boolean", ...this.io("pingPong"), state: "loop" }
		];
	}

	protected override async apply(effect: EffectSection): Promise<void> {
		const property = await this.getInputValue("property");
		const duration = await this.getInputValue("duration");
		if (!property || duration <= 0) {
			devLog(`[${this.type}] needs a property and a duration > 0; skipping`);
			return;
		}

		const target = (await this.getInputValue("target")) || "sprite";
		const base = {
			duration,
			delay: await this.getInputValue("delay"),
			ease: await this.getInputValue("ease"),
			gridUnits: await this.getInputValue("gridUnits"),
			screenSpace: await this.getInputValue("screenSpace"),
			absolute: await this.getInputValue("absolute")
		};

		if (this.state === "loop") {
			const values = this.parseJson<number[]>(await this.getInputValue("values"), "values");
			const loops = await this.getInputValue("loops");
			effect.loopProperty(target, property, {
				...base,
				pingPong: await this.getInputValue("pingPong"),
				...(loops > 0 ? { loops } : {}),
				...(Array.isArray(values) && values.length
					? { values }
					: {
						from: await this.getInputValue("from"),
						to: await this.getInputValue("to")
					})
			});
		} else {
			effect.animateProperty(target, property, {
				...base,
				from: await this.getInputValue("from"),
				to: await this.getInputValue("to"),
				fromEnd: await this.getInputValue("fromEnd")
			});
		}
	}
}

export { AnimateNode };
