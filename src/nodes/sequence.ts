import { TriggerEngine as T } from "trigger-engine/types";
import { devLog } from "$lib/utils";
import { id } from 'moduleJSON';

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	name: string
	softFail: boolean
}
type TOutputs = {
	actor?: Actor
	targets?: { actor: Actor; token?: TokenDocument | null }[]
	sources?: { actor: Actor; token?: TokenDocument | null }[]
	item?: Item,
	options?: string[]
} & Record<string, unknown>

class StartNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs,
	never,
	"path"
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

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "name",
				type: "text",
				label: this.localize("io.name.title"),
				tooltip: this.localize("io.name.tooltip")
			},
			{
				key: "softFail",
				type: "boolean",
				label: this.localize("io.softFail.title"),
				tooltip: this.localize("io.softFail.tooltip"),
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "actor",
				type: "target",
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
			},
			{
				key: "options",
				type: "text",
				isArray: true,
				label: this.localize("io.options.title"),
				tooltip: this.localize("io.options.tooltip")
			},
		];
	}

	static override get defineCustomOutputs(): T.BuiltinsCustomEntry[] {
		return [
			{
				slug: "path",
				types: ["any", "boolean", "item", "number", "point", "target", "text", "user"],
				array: true,
				label: this.localize("io.path.title"),
				tooltip: this.localize("io.path.tooltip"),
				input: {
					label: this.localize("io.path.title"),
				}
			},
		];
	}

	override async _execute({ name, item, targets, sources, actor, options, ...args }: StartNodeOptions): Promise<boolean> {
		const animationName = await this.getInputValue("name")
		const softFail = await this.getInputValue("softFail")
		// If there is no name provided or the event name does not match the animation name, skip the animation.
		if (!name || (animationName !== name)) return true

		this.setContext("sequence", new Sequence({ inModuleName: this.triggerName, softFail }))

		this.setOutputValue("targets", targets?.map(x => ({ actor: x.actor!, token: x })));
		this.setOutputValue("sources", sources?.map(x => ({ actor: x.actor!, token: x })));
		this.setOutputValue("actor", actor);
		this.setOutputValue("item", item);
		this.setOutputValue("options", options);

		const entries = this.getCustomOutputs("path");
		for (const { key, input } of entries) {
			const value = typeof input === "string" ? foundry.utils.getProperty(args, input) : undefined;
			this.setOutputValue(key, value);
		}

		return this.executeNext("out")
	}
}

type StartNodeOptions = {
	name: string;
	actor?: Actor
	item?: Item;
	targets?: TokenDocument[]
	sources?: TokenDocument[]
	options?: string[]
} & Record<string, unknown>

export { StartNode, type StartNodeOptions };