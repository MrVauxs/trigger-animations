import type { TriggerEngine as T } from "trigger-engine/types";
import { devGroup } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	sequence?: Sequence;
	name: string;
	actor?: TargetDocuments;
	sources: any[];
	targets: any[];
	item?: Item;
	options: string[];
	await: boolean;
	user: User;
}

interface TOutputs {
	sequence?: Sequence;
}

class ExecuteAnimationNode extends TriggerNode<"out", TInputs, TOutputs, "input"> {
	static override get type() {
		return "execute-animation" as const;
	}

	static override get category() {
		return "action";
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

	override get headerColor() {
		// Matches the built-in action nodes' blue header.
		return "#2162bd";
	}

	override get icon() {
		// Font Awesome Pro unicode (film), top right corner.
		return { unicode: "\uF03D" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			// TODO: Make Sequence entry have a BooleanField so it uses this.getContext
			{ key: "sequence", type: "sequence", ...this.io("sequence") },
			{ key: "name", type: "text", ...this.io("name") },
			{ key: "actor", type: "target", ...this.io("actor") },
			{ key: "sources", type: "target", isArray: true, ...this.io("sources") },
			{ key: "targets", type: "target", isArray: true, ...this.io("targets") },
			{ key: "item", type: "item", ...this.io("item") },
			{ key: "options", type: "text", isArray: true, ...this.io("options") },
			{ key: "await", type: "boolean", ...this.io("await") },
			{ key: "user", type: "user" },
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{ key: "sequence", type: "sequence", ...this.io("sequence") },
		];
	}

	static override get defineCustomInputs(): T.BuiltinsCustomEntry[] {
		return [{ slug: "input", array: true, ...this.io("input") }];
	}

	override async _execute(): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);
		const sequence = (await this.getInputValue("sequence"));
		if (sequence) {
			this.setOutputValue("sequence", sequence);
		}

		const stopRecursionFor = this.getContext<string[]>("stopRecursionFor")!;
		const recursionGuard = this.getContext<string>("recursionGuard")!;

		const run = globalThis.triggerAnimations.api.runFromTrigger;
		const payload = {
			name: await this.getInputValue("name"),
			actor: await this.getInputValue("actor"),
			item: await this.getInputValue("item"),
			options: await this.getInputValue("options"),
			sources: await this.getInputValue("sources"),
			targets: await this.getInputValue("targets"),
			userInputs: await this.getCustomInputs("input"),
			user: await this.getInputValue("user") ?? this.userContext,
			// addons
			sequence,
			stopRecursionFor: [recursionGuard, ...stopRecursionFor],
		};

		const animationCall = run(payload);
		if (await this.getInputValue("await") || sequence) {
			await animationCall;
		}

		g.log("Execute Animation Node", { hasSequence: !!sequence });
		g.end();

		return this.executeNext("out");
	}
}

export { ExecuteAnimationNode };
