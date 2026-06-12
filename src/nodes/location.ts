import { devGroup, devLog } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerNode } = globalThis.triggerEngine;

type LocationKind = {
	points: { x: number; y: number };
	targets: { actor: Actor; token: TokenDocument };
};

type TInputs = {
	location: LocationKind[keyof LocationKind];
	effect: EffectSection;
	gridUnits: boolean;
	attachTo: true;
};
type TOutputs = {}

class LocationNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "location";
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

	static override get states(): string[] | null {
		return ["points", "targets"];
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf1c8" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "effect",
				type: "effect",
				label: this.localize("io.effect.title"),
				tooltip: this.localize("io.effect.tooltip")
			},
			{
				key: "location",
				type: "point",
				label: this.localize("io.location.title"),
				tooltip: this.localize("io.location.tooltip"),
				state: "points"
			},
			{
				key: "location",
				type: "target",
				label: this.localize("io.location.title"),
				tooltip: this.localize("io.location.tooltip"),
				state: "targets"
			},
			{
				key: "attachTo",
				type: "boolean",
				label: this.localize("io.attachTo.title"),
				tooltip: this.localize("io.attachTo.tooltip"),
				state: "targets"
			},
			{
				key: "gridUnits",
				type: "boolean",
				label: this.localize("io.gridUnits.title"),
				tooltip: this.localize("io.gridUnits.tooltip")
			}
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return null;
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`)
		const effect = await this.getInputValue("effect");
		if (effect) {
			const location = await this.getInputValue("location");
			if (location) {
				const gridUnits = await this.getInputValue("gridUnits");
				const attachTo = await this.getInputValue("attachTo");
				if (attachTo) {
					assertState("targets", location);
					g.log("location", location)
					effect.attachTo(location.token, { gridUnits });
				} else {
					effect.atLocation(location, { gridUnits });
				}
			}
		}
		g.log("Effect Node", { effect });
		g.end();

		return this.executeNext("out");
	}
}

function assertState<K extends keyof LocationKind>(
	state: K,
	location: TInputs["location"],
): asserts location is LocationKind[K] {
	const actual: keyof LocationKind = "token" in location ? "targets" : "points";
	if (actual !== state) {
		throw new Error(
			`[LocationNode] expected "${state}" location but received "${actual}".`,
		);
	}
}

export { LocationNode };