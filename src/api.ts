import { id } from "moduleJSON";
import { TriggerEngine as T } from "trigger-engine/types";
import { StartNodeOptions } from "./nodes";

export class API {
	openBlueprint(data?: T.TriggerDataInput, ...args: any[]) {
		return game.triggerEngine?.api.openBlueprintMenu(id, id, data, ...args)
	}
	runAnimation(data: StartNodeOptions) {
		Hooks.callAll("trigger-animations.animate", data)
	}
	async endAnimation(opts: Parameters<typeof Sequencer.EffectManager.endEffects>[0]) {
		return Sequencer.EffectManager.endEffects(opts)
	}
	async endAllAnimation(scene: string) {
		return Sequencer.EffectManager.endAllEffects(scene)
	}
}
