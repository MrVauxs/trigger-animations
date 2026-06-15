import { id } from "moduleJSON";
import { TriggerEngine as T } from "trigger-engine/types";
import { StartNodeOptions } from "./nodes";

class API {
	openBlueprint(data?: T.TriggerDataInput, ...args: any[]) {
		return game.triggerEngine?.api.openBlueprintMenu(id, id, data, ...args)
	}
	async endAnimation(opts: Parameters<typeof Sequencer.EffectManager.endEffects>[0]) {
		return Sequencer.EffectManager.endEffects(opts)
	}
	async endAllAnimation(scene: string) {
		return Sequencer.EffectManager.endAllEffects(scene)
	}
	async runFromTrigger(data: StartNodeOptions): Promise<void> { };
}

export const api = new API();

// Expose the API on the module's global namespace
globalThis.triggerAnimations = { api };