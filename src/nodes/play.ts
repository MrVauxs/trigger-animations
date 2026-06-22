import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	remote: boolean;
	preload: boolean;
	local: boolean;
}
type TOutputs = {}

class PlayNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "play";
	}

	static override get tags() {
		return ["animation", "play"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf04b" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
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
		const sequence = this.getContext<Sequence>("sequence");
		if (!sequence) {
			devLog("No sequence found in context");
			return Promise.resolve(false);
		}

		const seq = await sequence.play({
			remote: await this.getInputValue("remote"),
			preload: await this.getInputValue("preload"),
			local: await this.getInputValue("local")
		});
		devLog("Playing Sequence", seq)

		return this.executeNext("out");
	}
}

export { PlayNode };