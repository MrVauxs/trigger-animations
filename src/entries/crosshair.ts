const { NodeEntry } = globalThis.triggerEngine;

class CrosshairEntry extends NodeEntry<CrosshairSection> {
	static override get type() {
		return "crosshair";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#b8860b";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { CrosshairEntry };
