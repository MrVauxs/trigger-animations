const { NodeEntry } = globalThis.triggerEngine;

class SoundEntry extends NodeEntry<SoundSection> {
	static override get type() {
		return "sound";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#2e8b57";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { SoundEntry };
