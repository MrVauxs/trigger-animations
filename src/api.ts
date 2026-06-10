import { id } from "moduleJSON";
import type { TriggerDataInput } from "trigger-engine/src/engine";

export class API {
	openBlueprint(data: TriggerDataInput, ...args: any[]) {
		return game.triggerEngine?.api.openBlueprintMenu(id, id, data, ...args)
	}
}
