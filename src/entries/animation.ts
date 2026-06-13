const { NodeEntry } = globalThis.triggerEngine;

class AnimationEntry extends NodeEntry<AnimationSection> {
	static override get type() {
		return "animation";
	}

	static override get default() {
		return undefined;
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#6a5acd";
	}

	static override isValidType(value: unknown): boolean {
		return true;
	}
}

export { AnimationEntry };
