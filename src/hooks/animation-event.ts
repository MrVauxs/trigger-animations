import { devLog } from "$lib/utils";
import { StartNodeOptions } from "../nodes";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.runFromTrigger";

	override get events() {
		return ['animation-event' as const];
	}

	#execute(data: StartNodeOptions) {
		const trigger = globalThis.triggerAnimations.api.matchTrigger(data.name);
		if (!trigger) {
			devLog("No animation-event trigger matched", data.name)
			return;
		}

		const { id, local } = trigger;

		// Sequences run for everyone by default. Local makes it run only for the person running it. So we ensure everyone plays the local sequence separately.
		if (local || game.user.isActiveGM) {
			devLog("Executing animation-event", local ? "(local)" : "", id, data)
			return this.executeTriggerEvent(id, "animation-event", data)
		} else {
			devLog("Executing animation-event via GM", id, data)
			return this.executeTriggerEventAsGM(id, "animation-event", data)
		}
	}

	override _enable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, this.#execute.bind(this));
	}

	override _disable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, () => { });
	}
}

export { StartHook }