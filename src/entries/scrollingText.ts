const { NodeEntry } = globalThis.triggerEngine;

class ScrollingTextEntry extends NodeEntry<ScrollingTextSection> {
	static override get type() {
		return "scrollingText";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#c97bd4";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { ScrollingTextEntry };
