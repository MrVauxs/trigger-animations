const { NodeEntry } = globalThis.triggerEngine;

class SequenceEntry extends NodeEntry<Sequence> {
	static override get type() {
		return "sequence";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#f4c430";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { SequenceEntry };
