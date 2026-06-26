import { devLog } from "$lib/utils";
import { StartNodeOptions } from "../nodes";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.runFromTrigger";

	override get events() {
		return ['animation-event' as const];
	}

	#execute(data: StartNodeOptions) {
		const triggerId = globalThis.triggerAnimations.api.matchTrigger(data.name);
		if (!triggerId) {
			devLog("No animation-event trigger matched", data.name)
			return;
		}

		if (game.user.isActiveGM) {
			devLog("Executing animation-event", triggerId, data)
			return this.executeTriggerEvent(triggerId, "animation-event", data)
		} else {
			devLog("Executing animation-event via GM", triggerId, data)
			return this.executeTriggerEventAsGM(triggerId, "animation-event", data)
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