import { TriggerEngine as T } from "trigger-engine/types";
import { devLog, log } from "$lib/utils";
import { id } from 'moduleJSON';

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	name: string
	softFail: boolean
}
type TOutputs = {
	actor?: TargetDocuments
	targets?: TargetDocuments[]
	sources?: TargetDocuments[]
	item?: Item,
	options?: string[]
} & Record<string, unknown>

type StartNodeOptions = {
	name: string;
	actor?: TargetDocuments;
	item?: Item;
	targets?: TargetDocuments[]
	sources?: TargetDocuments[]
	options?: string[]
	userInputs: T.EmitableValue[]
}

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

	static override get isEvent() {
		return true;
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`
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
				label: this.localize("io.actor.title"),
				tooltip: this.localize("io.actor.tooltip")
			},
			{
				key: "sources",
				type: "any",
				isArray: true,
				label: this.localize("io.sources")
			},
			{
				key: "targets",
				type: "any",
				isArray: true,
				label: this.localize("io.targets")
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
			}
		];
	}

	static override get defineCustomOutputs(): T.BuiltinsCustomEntry[] {
		return [
			{
				slug: "path",
				types: ["any", "boolean", "item", "number", "point", "target", "text", "user", "region"],
				array: true,
				label: this.localize("io.path.title"),
				tooltip: this.localize("io.path.tooltip"),
			},
		];
	}

	private async convertStartObjectFromEmitable(emitable: Record<string, any>): Promise<StartNodeOptions> {
		const converted = await this.convertObjectFromEmitable(
			emitable,
			{
				actor: "target",
				item: "item",
				targets: "target",
				sources: "target",
			},
			["userInputs"],
		);

		devLog("Converting emitable to converted", emitable, converted);
		return converted as StartNodeOptions;
	}

	override async _execute(emitable: any): Promise<boolean> {
		const convertedData = await this.convertStartObjectFromEmitable(emitable);
		devLog("Running animation-event", convertedData)
		const { name, item, targets, sources, actor, options, userInputs } = convertedData;

		// ["bow", "shortbow", "longbow"]
		const animationName = (await this.getInputValue("name")).split(",")
		const givenNames = name.split(",").map(x => x.trim());
		const softFail = await this.getInputValue("softFail")
		const matchesPattern = (candidate: string) => {
			candidate = candidate.trim()
			// `*` matches everything; otherwise `*` is a wildcard segment (e.g. `weapon-*`).
			if (candidate === "*") return true
			if (!candidate.includes("*")) return givenNames.includes(candidate)
			const regex = new RegExp("^" + candidate.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$")
			return regex.test(name)
		}
		const foundNames = animationName.filter(matchesPattern)
		// If there is no name provided or the event name does not match the animation name, skip the animation.
		if (!name || !foundNames.length) return true;
		devLog(`Found ${foundNames.join(", ")}, playing ${this.triggerName}`);

		this.setContext("sequence", new Sequence({ inModuleName: this.triggerName, softFail }))

		this.setOutputValue("targets", targets);
		this.setOutputValue("sources", sources);
		this.setOutputValue("actor", actor);
		this.setOutputValue("item", item);

		if (options) this.setOutputValue("options", options.concat(`animation-name:${name}`));

		this.setCustomOutputValues("path", userInputs);

		return this.executeNext("out")
	}
}

export { StartNode, type StartNodeOptions };