const { NodeEntry } = globalThis.triggerEngine;

class CanvasPanEntry extends NodeEntry<CanvasPanSection> {
	static override get type() {
		return "canvasPan";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#4a90d9";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { CanvasPanEntry };
