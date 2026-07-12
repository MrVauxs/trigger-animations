import type { TriggerEngine as T } from "trigger-engine/types";
import { CanvasPanModifierNode } from "./base";

interface TInputs {
	location: PositionSource;
	locally: boolean;
	users: User[];
}

class CanvasPanPlaceNode extends CanvasPanModifierNode<TInputs> {
	static override get type() {
		return "pan-place";
	}

	static override get aliases(): string[] {
		return ["atLocation", "locally", "forUsers"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF3C5" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.canvasPanInput,
			{ key: "location", type: "position", ...this.io("location") },
			{ key: "locally", type: "boolean", ...this.io("locally") },
			{ key: "users", type: "user", isArray: true, ...this.io("users") },
		];
	}

	protected override async apply(section: CanvasPanSection): Promise<void> {
		const location = this.getLocation(await this.getInputValue("location"));
		if (location)
			section.atLocation(location as any);

		if (await this.getInputValue("locally"))
			section.locally(true);

		const users = await this.getInputValue("users");
		if (users?.length) {
			const ids = users.map(u => u?.id).filter((id): id is string => !!id);
			if (ids.length)
				section.forUsers(ids);
		}
	}
}

export { CanvasPanPlaceNode };
