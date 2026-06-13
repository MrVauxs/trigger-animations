import { devLog } from "$lib/utils";
import { StartNodeOptions } from "../nodes";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.run";

	override get events() {
		return ['animation-event' as const];
	}

	#execute(data: StartNodeOptions) {
		if (game.user.isActiveGM) {
			devLog("Executing animation-event", data)
			return this.executeEvent("animation-event", data)
		} else {
			devLog("Executing animation-event via GM", data)
			return this.executeEventAsGM("animation-event", data)
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