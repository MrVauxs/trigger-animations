import type { TriggerEngine as T } from "trigger-engine/types";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	list: string;
	min: number;
	max: number;
	type: "integer" | "float";
	any: any[];
	recurse: boolean;
}

interface TOutputs {
	value: string | number | any;
}

type TState = "list" | "between" | "any";

class RandomListNode extends TriggerNode<never, TInputs, TOutputs, never, never, TState> {
	static override get type() {
		return "random-list" as const;
	}

	static override get category() {
		return "value";
	}

	static override get states(): string[] | null {
		return ["list", "between", "any"];
	}

	override get title(): string | null {
		return `${this.localize("title")} (${this.state})`;
	}

	// Query nodes have no incoming bridge nor outgoing bridges.
	static override get hasIn(): boolean {
		return false;
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return null;
	}

	override get headerColor() {
		return "#6b5646";
	}

	override get subtitle(): string | null {
		return null;
	}

	override get icon() {
		// Font Awesome Pro unicode (dice), top right corner.
		return { unicode: "\uF522" };
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	static io(key: string) {
		return {
			label: this.localize(`io.${key}.title`),
			tooltip: this.localize(`io.${key}.tooltip`),
		};
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "list", type: "text", ...this.io("list"), state: "list" },
			{ key: "any", type: "any", ...this.io("any"), state: "any", isArray: true },
			{ key: "recurse", type: "boolean", ...this.io("recurse"), state: "any", field: { default: false } },
			{
				key: "min",
				type: "number",
				...this.io("min"),
				state: "between",
				field: { default: 0 },
			},
			{
				key: "max",
				type: "number",
				...this.io("max"),
				state: "between",
				field: { default: 5 },
			},
			{
				key: "type",
				type: "text",
				...this.io("type"),
				state: "between",
				field: {
					type: "select",
					default: "integer",
					options: ["integer", "float"],
				},
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{ key: "value", type: "text", ...this.io("value"), state: "list" },
			{ key: "value", type: "any", ...this.io("value"), state: "any" },
			{ key: "value", type: "number", ...this.io("value"), state: "between" },
		];
	}

	/**
	 * Uses Sequencer's random helpers
	 * @see https://fantasycomputer.works/FoundryVTT-Sequencer/#/helpers
	 */
	override async _query(key: string): Promise<TOutputs["value"] | undefined> {
		const g = devGroup(`[Query] ${this.type}`);

		let result: TOutputs["value"] | undefined;
		if (this.state === "any") {
			const array = await this.getInputValue("any");
			const recurse = await this.getInputValue("recurse");
			result = Sequencer.Helpers.random_array_element(array, { recurse });
		} else if (this.state === "between") {
			const min = await this.getInputValue("min");
			const max = await this.getInputValue("max");
			const type = await this.getInputValue("type");
			if (type === "integer")
				result = Sequencer.Helpers.random_int_between(Math.min(min, max), Math.max(min, max));
			if (type === "float")
				result = Sequencer.Helpers.random_float_between(Math.min(min, max), Math.max(min, max));
		} else {
			const list = await this.getInputValue("list");
			const candidates = (list ?? "")
				.split(",")
				.map(entry => entry.trim())
				.filter(entry => entry.length > 0);
			result = candidates.length ? Sequencer.Helpers.random_array_element(candidates) : undefined;
		}

		g.log("Random List Node", { key, state: this.state, result });
		g.end();

		return result;
	}
}

export { RandomListNode };
