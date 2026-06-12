import { id } from "moduleJSON";
import { TriggerEngine as T } from "trigger-engine/types";

export class API {
	openBlueprint(data?: T.TriggerDataInput, ...args: any[]) {
		return game.triggerEngine?.api.openBlueprintMenu(id, id, data, ...args)
	}
}
