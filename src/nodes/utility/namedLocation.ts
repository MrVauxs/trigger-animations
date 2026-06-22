import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type TInputs = {
	name: string;
	location: TargetDocuments | { x: number; y: number };
}
type TOutputs = {}

class NamedLocationNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "named-location";
	}

	static override get tags() {
		return ["animation"];
	}

	static override get category() {
		return "sequence"
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`
	}

	static io(key: string) {
		return {
			label: this.localize(`io.${key}.title`),
			tooltip: this.localize(`io.${key}.tooltip`),
		};
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf02b" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{ key: "name", type: "text", ...this.io("name") },
			{ key: "location", type: "any", ...this.io("location") }
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const sequence = this.getContext<Sequence>("sequence");
		const name = await this.getInputValue("name");
		if (sequence && name) {
			const location = this.getLocation(await this.getInputValue("location"));
			if (location) sequence.addNamedLocation(name, location as any);
			else devLog(`[${this.type}] no location to name`);
		}

		g.log("Named Location Node", { name });
		g.end();

		return this.executeNext("out");
	}

	getLocation(loc: TargetDocuments | Point): TokenDocument | Point | undefined {
		if (typeof loc === "object" && "x" in loc && "y" in loc) {
			return { x: (loc as Point).x, y: (loc as Point).y };
		}
		return this.getTargetToken(loc as TargetDocuments);
	}
}

export { NamedLocationNode };
