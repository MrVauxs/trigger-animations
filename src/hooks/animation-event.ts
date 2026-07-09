import { devLog } from "$lib/utils";
import { StartNodeOptions } from "../nodes";
import { id } from "moduleJSON";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.runFromTrigger";
	static socketPath = `module.${id}`

	override get events() {
		return ['animation-event' as const];
	}

	async #execute(data: StartNodeOptions, socket = false) {
		const trigger = globalThis.triggerAnimations.api.matchTrigger(data.name);
		if (!trigger) {
			devLog("No animation-event trigger matched", data.name)
			return;
		}

		const { id, local } = trigger;
		const { sequence, ...rest } = data;

		const emitable = socket ? rest : this.convertObjectToEmitable(
			rest,
			{
				actor: "target",
				item: "item",
				targets: "target",
				sources: "target",
			},
			["userInputs"],
		)

		// Local:	Player -> GM -> Everyone (playLocal)
		// Global:	Player -> GM
		if (game.user.isActiveGM || socket) {
			if (local && !socket) {
				devLog("Emitting local animation-event", id, emitable)
				game.socket.emit(StartHook.socketPath, emitable, true);
			}
			if (sequence) (emitable as Record<string, unknown>).sequence = sequence;
			devLog("Executing animation-event", sequence ? "(from another animation)" : "", local ? "(local)" : "", socket ? "(via socket)" : "", id, emitable)
			return this.executeTriggerEvent(id, "animation-event", emitable)
		} else {
			// The GM runs it remotely (serialized), so nested Sequences can't be shared.
			devLog("Executing animation-event via GM", id, emitable)
			return this.executeTriggerEventAsGM(id, "animation-event", emitable)
		}
	}

	override get gmOnly() {
		return false;
	}

	override _enable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, this.#execute.bind(this));
		game.socket.on(StartHook.socketPath, this.#execute.bind(this))
	}

	override _disable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, () => { });
		game.socket.removeAllListeners(StartHook.socketPath)
	}
}

export { StartHook }