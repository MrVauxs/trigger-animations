import { TriggerEngine as T } from "trigger-engine/types";
import { AnimationModifierNode } from "./base";

type Visibility = "" | "hide" | "show";

type TInputs = {
	opacity: number;
	fadeInDuration: number;
	fadeInEase: string;
	fadeInDelay: number;
	fadeOutDuration: number;
	fadeOutEase: string;
	fadeOutDelay: number;
	visibility: Visibility;
};

class AnimationOpacityNode extends AnimationModifierNode<TInputs> {
	static override get type() {
		return "anim-opacity";
	}

	static get aliases(): string[] {
		return ["opacity", "fadeIn", "fadeOut", "hide", "show"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf042" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.animationInput,
			{
				key: "opacity",
				type: "number",
				...this.io("opacity"),
				// -1 means "leave unset" since 0 is a meaningful opacity.
				field: { default: -1, min: -1, max: 1, step: 0.05 }
			},
			{
				key: "fadeInDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "fadeIn",
				field: { default: 0, min: 0 }
			},
			this.easeInput("fadeInEase", { group: "fadeIn" }),
			{
				key: "fadeInDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "fadeIn",
				field: { default: 0, min: 0 }
			},
			{
				key: "fadeOutDuration",
				type: "number",
				...this.sharedIo("duration"),
				group: "fadeOut",
				field: { default: 0, min: 0 }
			},
			this.easeInput("fadeOutEase", { group: "fadeOut" }),
			{
				key: "fadeOutDelay",
				type: "number",
				...this.sharedIo("delay"),
				group: "fadeOut",
				field: { default: 0, min: 0 }
			},
			{
				key: "visibility",
				type: "text",
				...this.io("visibility"),
				field: {
					type: "select",
					default: "",
					options: [
						{ value: "", label: "Unchanged" },
						{ value: "hide", label: "Hide" },
						{ value: "show", label: "Show" }
					]
				}
			}
		];
	}

	protected override async apply(section: AnimationSection): Promise<void> {
		const opacity = await this.getInputValue("opacity");
		if (opacity >= 0) section.opacity(opacity);

		const fadeInDuration = await this.getInputValue("fadeInDuration");
		if (fadeInDuration > 0) {
			section.fadeIn(fadeInDuration, {
				ease: await this.getInputValue("fadeInEase"),
				delay: await this.getInputValue("fadeInDelay")
			});
		}

		const fadeOutDuration = await this.getInputValue("fadeOutDuration");
		if (fadeOutDuration > 0) {
			section.fadeOut(fadeOutDuration, {
				ease: await this.getInputValue("fadeOutEase"),
				delay: await this.getInputValue("fadeOutDelay")
			});
		}

		const visibility = await this.getInputValue("visibility");
		if (visibility === "hide") section.hide(true);
		else if (visibility === "show") section.show(true);
	}
}

export { AnimationOpacityNode };
