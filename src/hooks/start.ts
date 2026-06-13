import { StartNodeOptions } from "../nodes";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.run";

	override get events() {
		return ['animation-event' as const];
	}

	#execute(data: StartNodeOptions) {
		if (game.user.isActiveGM) {
			return this.executeEvent("animation-event", data)
		} else {
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