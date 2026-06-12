import { devGroup, devLog, toggleHook } from "$lib/utils";
import { TriggerEngine as T } from "trigger-engine/types";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	override get events(): string[] {
		return ['animation-event']
	}

	#hook = toggleHook("on", "trigger-animations.animate", (args: object) => {
		if (game.user.isActiveGM) this.executeEvent("animation-event", { ...args })
	})

	override _enable() {
		this.#hook.activate();
	}

	override _disable() {
		this.#hook.deactivate();
	}
}

export { StartHook }