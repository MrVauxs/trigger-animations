import { devGroup, devLog } from "$lib/utils";
import { InputEntrySchemaSource, OutputEntrySchemaSource } from "trigger-engine/src/engine";

const { TriggerNode } = globalThis.triggerEngine;

type Inputs = {
	remote: boolean;
	preload: boolean;
	local: boolean;
}
type Outputs = {}

class PlayNode extends TriggerNode<"out", Inputs, Outputs> {
	static override get type() {
		return "play";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.trigger-animations.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf04b" }
	}

	static override get defineInputs(): InputEntrySchemaSource[] | null {
		return [
			{
				key: "remote",
				type: "boolean",
				label: this.localize("io.remote.title"),
				tooltip: this.localize("io.remote.tooltip")
			},
			{
				key: "preload",
				type: "boolean",
				label: this.localize("io.preload.title"),
				tooltip: this.localize("io.preload.tooltip")
			},
			{
				key: "local",
				type: "boolean",
				label: this.localize("io.local.title"),
				tooltip: this.localize("io.local.tooltip")
			}
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const sequence: Sequence = await this.getContext<Sequence>("sequence");

		await sequence.play({
			remote: await this.getInputValue("remote"),
			preload: await this.getInputValue("preload"),
			local: await this.getInputValue("local")
		});

		return Promise.resolve(true);
	}
}

export { PlayNode };