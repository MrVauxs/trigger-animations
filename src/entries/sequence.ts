import { devLog } from "$lib/utils";

const { NodeEntry } = globalThis.triggerEngine;

class SequenceEntry extends NodeEntry {
	static override get type() {
		return "sequence";
	}

	static override get default() {
		return new Sequence()
	}

	/** The color of the node connection. */
	static override get color(): ColorSource {
		return "#009690";
	}

	static override isValidType(value: unknown): boolean {
		return value instanceof Sequence;
	}

	static override toJSON(value: Sequence): JSONValue {
		return value.toJSON();
	}

	static override fromJSON(value: JSONValue): Promise<any> | any {
		// @ts-expect-error Wrong types, see https://github.com/fantasycalendar/FoundryVTT-Sequencer/pull/451
		return new Sequence().fromJSON(value);
	}
}

export { SequenceEntry };