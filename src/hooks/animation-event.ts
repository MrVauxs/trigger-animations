import type { StartNodeOptions } from "../nodes";
import { announceTriggerClaim, CLAIM_FLAG, receiveTriggerClaim } from "$lib/autoAnimations";
import { devLog } from "$lib/utils";
import { id } from "moduleJSON";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.runFromTrigger";
	static socketPath = `module.${id}`;

	override get events() {
		return ["animation-event" as const];
	}

	async #execute(data: StartNodeOptions, socket = false) {
		const trigger = globalThis.triggerAnimations.api.matchTrigger(data.name);
		if (!trigger) {
			devLog("No animation-event trigger matched", data.name);
			return;
		}

		// Automated Animations workflows for this item are waiting on this, so tell them before
		// we start doing anything asynchronous.
		announceTriggerClaim(data.item, !socket);

		const { id, local } = trigger;
		const { sequence, ...rest } = data;

		if (!rest.user)
			rest.user = game.user;

		const emitable = socket
			? rest
			: this.convertObjectToEmitable(
					rest,
					{
						actor: "target",
						item: "item",
						targets: "target",
						sources: "target",
						user: "user",
					},
					["userInputs"],
				);

		// Local:	Player -> GM -> Everyone (playLocal)
		// Global:	Player -> GM
		if (game.user.isActiveGM || socket) {
			if (local && !socket) {
				devLog("Emitting local animation-event", id, emitable);
				game.socket.emit(StartHook.socketPath, emitable, true);
			}
			if (sequence)
				(emitable as Record<string, unknown>).sequence = sequence;
			devLog("Executing animation-event", sequence ? "(from another animation)" : "", local ? "(local)" : "", socket ? "(via socket)" : "", id, emitable);
			return this.executeTriggerEvent(id, "animation-event", emitable);
		} else {
			// The GM runs it remotely (serialized), so nested Sequences can't be shared.
			devLog("Executing animation-event via GM", id, emitable);
			return this.executeTriggerEventAsGM(id, "animation-event", emitable);
		}
	}

	/** Both animation-events and A-A claims share the one module socket, so they get told apart here. */
	#onSocket(data: any, socket = false) {
		if (data?.[CLAIM_FLAG])
			return receiveTriggerClaim(data);
		return this.#execute(data, socket);
	}

	override get gmOnly() {
		return false;
	}

	override _enable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, this.#execute.bind(this));
		game.socket.on(StartHook.socketPath, this.#onSocket.bind(this));
	}

	override _disable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, () => { });
		game.socket.removeAllListeners(StartHook.socketPath);
	}
}

export { StartHook };
