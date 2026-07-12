const { NodeEntry } = globalThis.triggerEngine;

class EffectEntry extends NodeEntry<EffectSection> {
	static override get type() {
		return "effect";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#009690";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { EffectEntry };
