import type { TriggerEngine as T } from "trigger-engine/types";
import { resetSequenceQueue } from "$lib/sequenceQueue";
import { devLog } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	name: string;
	softFail: boolean;
}
type TOutputs = {
	actor?: TargetDocuments;
	targets?: TargetDocuments[];
	sources?: TargetDocuments[];
	item?: Item;
	options?: string[];
	matchedName?: string;
} & Record<string, unknown>;

interface StartNodeOptions {
	name: string;
	actor?: TargetDocuments;
	item?: Item;
	targets?: TargetDocuments[];
	sources?: TargetDocuments[];
	options?: string[];
	userInputs: { type: string; value: any }[];
	user?: User;
	// addons
	sequence?: Sequence;
	stopRecursionFor?: string[];
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
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uE29D" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "name",
				type: "text",
				label: this.localize("io.name.title"),
				tooltip: this.localize("io.name.tooltip"),
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
				tooltip: this.localize("io.actor.tooltip"),
			},
			{
				key: "sources",
				type: "target",
				isArray: true,
				label: this.localize("io.sources"),
			},
			{
				key: "targets",
				type: "target",
				isArray: true,
				label: this.localize("io.targets"),
			},
			{
				key: "item",
				type: "item",
				label: this.localize("io.item"),
			},
			{
				key: "options",
				type: "text",
				isArray: true,
				label: this.localize("io.options.title"),
				tooltip: this.localize("io.options.tooltip"),
			},
			{
				key: "matchedName",
				type: "text",
				label: this.localize("io.matchedName.title"),
				tooltip: this.localize("io.matchedName.tooltip"),
			},
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
				user: "user",
			},
			["userInputs"],
		);

		devLog("Converting emitable to converted", emitable, converted);
		return converted as StartNodeOptions;
	}

	override async _execute(emitable: any): Promise<boolean> {
		const convertedData = await this.convertStartObjectFromEmitable(emitable);
		devLog("Running animation-event", convertedData);
		const { name, item, targets, sources, actor, options, userInputs, user, sequence: passedSequence, stopRecursionFor } = convertedData;
		if (!name)
			return true;

		if (stopRecursionFor?.includes(name)) {
			ui.notifications.warn(`Trigger Animations | Loop detected in ${this.triggerName}, aborting early.`);
			return true;
		} else {
			this.setContext("recursionGuard", name);
			this.setContext("stopRecursionFor", stopRecursionFor || []);
		}

		if (user && user instanceof User)
			this.userContext = user;

		/**
		 * The name the animation-event node has.
		 * ["bow", "shortbow", "longbow"]
		 */
		const animationNames = (await this.getInputValue("name")).split(",").map(x => x.trim());
		/**
		 * The name provided by the function.
		 * "bow"
		 */
		const givenNames = name.split(",").map(x => x.trim());
		const softFail = await this.getInputValue("softFail");
		const matchesPattern = (animationName: string) => {
			// `*` matches everything; otherwise `*` is a wildcard segment (e.g. `weapon-*`).
			if (animationName === "*")
				return true;
			// Match if we happen to do something like damage:* and damage:*
			if (animationName === name)
				return true;
			if (!animationName.includes("*"))
				return givenNames.includes(animationName);
			// Turns "long*ow" into /^long.*ow$/
			const regex = new RegExp(`^${animationName.split("*").map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
			return regex.test(name);
		};
		const foundNames = animationNames.filter(matchesPattern);
		if (!foundNames.length)
			return true;
		devLog(`Found ${foundNames.join(", ")}, playing ${this.triggerName}`);

		const sequence = passedSequence instanceof Sequence
			? passedSequence
			: new Sequence({ inModuleName: this.triggerName, softFail });
		this.setContext("sequence", sequence);
		resetSequenceQueue(this);

		this.setOutputValue("targets", targets);
		this.setOutputValue("sources", sources);
		this.setOutputValue("actor", actor);
		this.setOutputValue("item", item);
		this.setOutputValue("matchedName", foundNames[0]);

		if (options)
			this.setOutputValue("options", options.concat(`animation-name:${name}`));

		this.setCustomOutputValues("path", userInputs);

		return this.executeNext("out");
	}
}

export { StartNode, type StartNodeOptions };
