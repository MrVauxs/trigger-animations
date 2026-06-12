import { TriggerEngine as T } from "trigger-engine/types";
import { devLog } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {}
type TOutputs = {
	actor: Actor
	targets: { actor: Actor; token?: TokenDocument | null }[]
	sources: { actor: Actor; token?: TokenDocument | null }[]
	item: Item
}

class StartNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "animation-event";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get isEvent() {
		return true;
	}

	static localize(str: string) {
		return `trigger-animations.trigger-animations.node.${this.category}.${this.type}.${str}`
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\ue29d" }
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "actor",
				type: "actor",
				label: this.localize("io.actor")
			},
			{
				key: "targets",
				type: "target",
				isArray: true,
				label: this.localize("io.targets")
			},
			{
				key: "sources",
				type: "target",
				isArray: true,
				label: this.localize("io.sources")
			},
			{
				key: "item",
				type: "item",
				label: this.localize("io.item")
			}
		];
	}

	override async _execute({ item, targets, sources, actor }: StartNodeOptions): Promise<boolean> {
		this.setContext("sequence", new Sequence())

		this.setOutputValue("targets", targets?.map(x => ({ actor: x.actor!, token: x })));
		this.setOutputValue("sources", sources?.map(x => ({ actor: x.actor!, token: x })));
		this.setOutputValue("actor", actor);
		this.setOutputValue("item", item);

		return this.executeNext("out")
	}
}

type StartNodeOptions = {
	item: Item;
	targets: TokenDocument[]
	sources: TokenDocument[]
	actor: Actor
}

export { StartNode };