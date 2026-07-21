import type { TriggerEngine as T } from "trigger-engine/types";
import { moduleError } from "$lib/utils";

const DEFAULT_CALLBACK = `/**
 * @param {{actor: Actor; token: TokenDocument}} target
 * @param {unknown[]} inputs
 * @returns {boolean}
 *
 * @example
 * const level = inputs[0];
 * return target.actor.level >= level;
 */
return true;`;

const { TriggerNode } = globalThis.triggerEngine;

type State = "callback" | "repeat";

class MassLoopNode extends TriggerNode<"out" | "outAfter", Inputs, Outputs, "input", never, State> {
	static override get category(): string {
		return "extractor";
	}

	static override get states(): string[] | null {
		return ["callback", "repeat"];
	}

	override get headerColor(): ColorSource {
		return "#86910d";
	}

	override get subtitle(): string | null {
		return null;
	}

	static override get type() {
		return "massloop" as const;
	}

	static override get defineInputs(): T.BuiltinsInputEntry[] {
		return [
			{ key: "targets", type: "target", isArray: true, state: "callback" },
			{
				key: "sources",
				type: "target",
				isArray: true,
				label: this.localize("io.sources.title"),
				state: "callback",
			},
			{
				key: "callback",
				type: "text",
				state: "callback",
				field: {
					type: "javascript",
					default: DEFAULT_CALLBACK,
				},
			},
			{
				key: "count",
				type: "number",
				label: this.localize("io.count.title"),
				tooltip: this.localize("io.count.tooltip"),
				state: "repeat",
				field: { default: 1, min: 0, step: 1 },
			},
		];
	}

	static override get defineOutputs(): T.BuiltinsOutputEntry[] {
		return [
			{ key: "target", type: "target", state: "callback" },
			{ key: "source", type: "target", label: this.localize("io.source.title"), state: "callback" },
			{
				key: "isFinal",
				type: "boolean",
				label: this.localize("io.isFinal.title"),
				tooltip: this.localize("io.isFinal.tooltip"),
			},
			{
				key: "index",
				type: "number",
				label: this.localize("io.index.title"),
				tooltip: this.localize("io.index.tooltip"),
			},
		];
	}

	static override get defineCustomInputs(): T.BuiltinsCustomEntry[] {
		return [{ slug: "input", array: true }];
	}

	override get isLoop(): boolean {
		return true;
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return [
			{ key: "out" },
			{ key: "outAfter", label: this.localize("io.outAfter.title") },
		];
	}

	override async _execute(): Promise<boolean> {
		try {
			if (this.state === "repeat")
				return await this.executeRepeat();

			return await this.executeCallback();
		} catch (error: any) {
			moduleError(
				`an error occured in the node "${this.type}" (${this.id}) of the trigger "${this.triggerPath}"`,
				error,
			);
		}

		return this.executeNext("out");
	}

	private async executeCallback(): Promise<boolean> {
		const code = (await this.getInputValue("callback")) || "return true;";
		const targets = await this.getInputValue("targets");
		const sources = await this.getInputValue("sources");
		const inputs = await this.getCustomInputsValues("input");

		const Fn = function () { }.constructor as SyncFunction;
		const callback = new Fn("target", "inputs", "index", "isFinal", code);

		for (const [i, target] of targets.entries()) {
			const isFinal = i === targets.length - 1;
			for (const source of sources) {
				const validTarget = callback(target, inputs, i, isFinal);
				if (!validTarget)
					continue;

				this.setOutputValue("target", target);
				this.setOutputValue("source", source);
				this.setOutputValue("isFinal", isFinal);
				this.setOutputValue("index", i);

				const keepExecuting = await this.executeNext("out");
				if (!keepExecuting)
					break;
			}
		}

		return this.executeNext("outAfter");
	}

	private async executeRepeat(): Promise<boolean> {
		const count = Math.max(0, Math.floor((await this.getInputValue("count")) ?? 0));

		for (let i = 0; i < count; i++) {
			const isFinal = i === count - 1;

			this.setOutputValue("isFinal", isFinal);
			this.setOutputValue("index", i);

			const keepExecuting = await this.executeNext("out");
			if (!keepExecuting)
				break;
		}

		return this.executeNext("outAfter");
	}
}

interface SyncFunction {
	new(...args: any[]): (target: TargetDocuments, inputs: unknown[], index: number, isFinal: boolean) => boolean;
}

interface Inputs {
	targets: TargetDocuments[];
	sources: TargetDocuments[];
	callback: string;
	count: number;
}

interface Outputs {
	target?: TargetDocuments;
	source?: TargetDocuments;
	isFinal: boolean;
	index: number;
}

export { MassLoopNode };
