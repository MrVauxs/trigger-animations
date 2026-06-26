import { TriggerEngine as T } from "trigger-engine/types";
import { ScrollingTextModifierNode } from "./base";
import { TEXT_ANCHOR_OPTIONS } from "./constants";

type TInputs = {
	text: string;
	textStyle: string;
	anchor: string;
	direction: string;
	jitter: number;
	duration: number;
};

class ScrollingTextTextNode extends ScrollingTextModifierNode<TInputs> {
	static override get type() {
		return "scroll-text";
	}

	static get aliases(): string[] {
		return ["text", "anchor", "direction", "jitter", "duration"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf031" }
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.scrollingTextInput,
			{ key: "text", type: "text", ...this.io("text") },
			{
				key: "textStyle",
				type: "text",
				...this.io("textStyle"),
				field: { type: "json" }
			},
			{
				key: "anchor",
				type: "text",
				...this.io("anchor"),
				field: { type: "select", default: "", options: TEXT_ANCHOR_OPTIONS }
			},
			{
				key: "direction",
				type: "text",
				...this.io("direction"),
				field: { type: "select", default: "", options: TEXT_ANCHOR_OPTIONS }
			},
			{
				key: "jitter",
				type: "number",
				...this.io("jitter"),
				field: { default: 0, min: 0, max: 1, step: 0.05 }
			},
			{
				key: "duration",
				type: "number",
				...this.sharedIo("duration"),
				field: { default: 0, min: 0 }
			}
		];
	}

	protected override async apply(section: ScrollingTextSection): Promise<void> {
		const text = await this.getInputValue("text");
		if (text) {
			let style: object | undefined;
			const raw = await this.getInputValue("textStyle");
			if (raw?.trim()) {
				try { style = JSON.parse(raw); } catch { /* ignore bad json */ }
			}
			section.text(text, style);
		}

		const anchor = await this.getInputValue("anchor");
		if (anchor) section.anchor(anchor);

		const direction = await this.getInputValue("direction");
		if (direction) section.direction(direction);

		const jitter = await this.getInputValue("jitter");
		if (jitter > 0) section.jitter(jitter);

		const duration = await this.getInputValue("duration");
		if (duration > 0) section.duration(duration);
	}
}

export { ScrollingTextTextNode };
