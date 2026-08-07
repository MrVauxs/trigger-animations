import type { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";

interface TInputs {
	locally: boolean;
	users: User[];
}

class SoundUsersNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-users";
	}

	static override get aliases(): string[] {
		return ["locally", "forUsers"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF0C0" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{ key: "locally", type: "boolean", ...this.io("locally") },
			{ key: "users", type: "user", isArray: true, ...this.io("users") },
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		if (await this.getInputValue("locally"))
			// @ts-expect-error Sequencer types
			section.locally(true);

		const users = await this.getInputValue("users");
		if (users?.length) {
			const ids = users.map(u => u?.id).filter((id): id is string => !!id);
			if (ids.length)
				// @ts-expect-error Sequencer types
				section.forUsers(ids);
		}
	}
}

export { SoundUsersNode };
