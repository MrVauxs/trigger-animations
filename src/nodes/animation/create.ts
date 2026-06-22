import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	target?: TargetDocuments;
}
type TOutputs = {
	animation?: AnimationSection;
}

class AnimationNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "animation";
	}

	static override get tags() {
		return ["animation", "on"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#6a5acd";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf70c" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "target",
				type: "target",
				label: this.localize("io.target.title"),
				tooltip: this.localize("io.target.tooltip")
			}
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "animation",
				type: "animation",
				label: this.localize("io.animation.title"),
				tooltip: this.localize("io.animation.tooltip")
			}
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence = this.getContext<Sequence>("sequence");
		if (!sequence) {
			g.log("Animation Node", "no Sequence in context");
			g.end();
			return this.executeNext("out");
		}
		const animation = sequence.animation();
		this.setOutputValue("animation", animation);

		const targetInput = await this.getInputValue("target");
		const target = this.getTargetToken(targetInput);
		if (target) animation.on(target);
		else if (target) devLog(`[${this.type}] target has no token; nothing to animate`);

		g.log("Animation Node", { sequence, target, animation });
		g.end();

		return this.executeNext("out");
	}
}

export { AnimationNode };
