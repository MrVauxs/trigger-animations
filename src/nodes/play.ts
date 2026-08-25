import type { TriggerEngine as T } from "trigger-engine/types";
import { getNamedLocations, unresolvedNamedLocations } from "$lib/namedLocations";
import { flushSequenceQueue } from "$lib/sequenceQueue";
import { devLog, log } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	remote: boolean;
	preload: boolean;
	local: boolean;
}
interface TOutputs {}

class PlayNode extends TriggerNode<
	"out",
	TInputs,
	TOutputs
> {
	static override get type() {
		return "play";
	}

	static override get category() {
		return "sequence";
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	override get headerColor() {
		return this.isEvent ? "#C40000" : "#009690";
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF04B" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "remote",
				type: "boolean",
				label: this.localize("io.remote.title"),
				tooltip: this.localize("io.remote.tooltip"),
			},
			{
				key: "preload",
				type: "boolean",
				field: { default: true },
				label: this.localize("io.preload.title"),
				tooltip: this.localize("io.preload.tooltip"),
			},
			{
				key: "local",
				type: "boolean",
				label: this.localize("io.local.title"),
				tooltip: this.localize("io.local.tooltip"),
			},
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const sequence = this.getContext<Sequence>("sequence");
		if (!sequence) {
			devLog("No sequence found in context");
			return Promise.resolve(false);
		}

		flushSequenceQueue(this, sequence);

		// Sequencer silently no-ops if named location is invalid. So we warn here.
		const unresolved = unresolvedNamedLocations(this);
		if (unresolved.length) {
			const list = unresolved.join(", ");
			log(`[${this.type}] named location(s) never defined; effects using them will not play: ${list}`);
			ui.notifications.warn(`Trigger Animations: named location(s) not found: ${list}`);
		} else {
			devLog(`[${this.type}] Named Locations`, getNamedLocations(this));
		}

		await sequence.play({
			remote: await this.getInputValue("remote"),
			preload: await this.getInputValue("preload"),
			local: await this.getInputValue("local"),
		});
		devLog("Playing Sequence", sequence);

		return this.executeNext("out");
	}
}

export { PlayNode };
