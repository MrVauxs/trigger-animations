import type { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

interface TInputs {
	volume: number;
	fadeInDuration: number;
	fadeInEase: string;
	fadeInDelay: number;
	fadeOutDuration: number;
	fadeOutEase: string;
	fadeOutDelay: number;
}

class SoundVolumeNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-volume";
	}

	static override get aliases(): string[] {
		return ["volume", "fadeInAudio", "fadeOutAudio"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF027" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{
				key: "volume",
				type: "number",
				...this.io("volume"),
				// -1 means "leave unset" since 0 is a meaningful volume.
				field: { default: -1, min: -1, max: 1, step: 0.05 },
			},
			{
				key: "fadeInDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "fadeIn",
				field: { default: 0, min: 0 },
			},
			this.easeInput("fadeInEase", { group: "fadeIn" }),
			{
				key: "fadeInDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "fadeIn",
				field: { default: 0, min: 0 },
			},
			{
				key: "fadeOutDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "fadeOut",
				field: { default: 0, min: 0 },
			},
			this.easeInput("fadeOutEase", { group: "fadeOut" }),
			{
				key: "fadeOutDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "fadeOut",
				field: { default: 0, min: 0 },
			},
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		const volume = await this.getInputValue("volume");
		if (volume >= 0)
			section.volume(volume);

		const fadeInDuration = await this.getInputValue("fadeInDuration");
		if (fadeInDuration > 0) {
			section.fadeInAudio(fadeInDuration, {
				ease: await this.getInputValue("fadeInEase"),
				delay: await this.getInputValue("fadeInDelay"),
			});
		}

		const fadeOutDuration = await this.getInputValue("fadeOutDuration");
		if (fadeOutDuration > 0) {
			section.fadeOutAudio(fadeOutDuration, {
				ease: await this.getInputValue("fadeOutEase"),
				delay: await this.getInputValue("fadeOutDelay"),
			});
		}
	}
}

export { SoundVolumeNode };
