import type { StartNodeOptions } from "../nodes";
import { announceTriggerClaim, CLAIM_FLAG, receiveTriggerClaim } from "$lib/autoAnimations";
import { createCrosshairRun, CROSSHAIR_FLAG, receiveCrosshair } from "$lib/crosshairRelay";
import { devLog } from "$lib/utils";
import { id } from "moduleJSON";

const { TriggerHook } = globalThis.triggerEngine;

class StartHook extends TriggerHook {
	static executePath = "triggerAnimations.api.runFromTrigger";
	static socketPath = `module.${id}`;
	static queryPath = `${id}.animation-event`;

	override get events() {
		return ["animation-event" as const];
	}

	async #execute(data: StartNodeOptions, socket = false) {
		const trigger = globalThis.triggerAnimations.api.matchTrigger(data.name);
		if (!trigger) {
			devLog("No animation-event trigger matched", data.name);
			return;
		}

		const { id, local } = trigger;
		const { sequence, ...rest } = data;

		// Started from inside a local run, which every client is executing already. A local animation
		// stays part of that run on each client; anything else is started once, by the run's authority.
		const nested = !socket && !!rest.crosshairRun;
		if (nested && !local) {
			if (rest.crosshairRun!.authority !== game.userId)
				return;
			delete rest.crosshairRun;
		}
		const runHere = socket || (nested && local);

		// Automated Animations workflows for this item are waiting on this, so tell them before
		// we start doing anything asynchronous.
		announceTriggerClaim(data.item, !runHere);

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
		if (runHere) {
			if (sequence)
				(emitable as Record<string, unknown>).sequence = sequence;
			devLog("Executing animation-event", sequence ? "(from another animation)" : "", socket ? "(via socket)" : "(within a local run)", id, emitable);
			return this.executeTriggerEvent(id, "animation-event", emitable);
		} else if (game.user.isActiveGM) {
			return this.#runAsGM(id, local, emitable as Record<string, unknown>, sequence);
		} else if (local) {
			// Our own query rather than Trigger Engine's, so the GM sends it out to everyone instead of only running it.
			devLog("Sending local animation-event to the GM", id, emitable);
			return game.users.activeGM?.query(StartHook.queryPath, { emitable });
		} else {
			// The GM runs it remotely (serialized), so nested Sequences can't be shared.
			devLog("Executing animation-event via GM", id, emitable);
			return this.executeTriggerEventAsGM(id, "animation-event", emitable);
		}
	}

	/** Runs a trigger as the active GM, sending a local one out for every other client to run too. */
	#runAsGM(id: string, local: boolean, emitable: Record<string, unknown>, sequence?: Sequence) {
		if (local) {
			// Everyone runs this trigger; the shared run makes us the only one asking for crosshairs.
			emitable.crosshairRun = createCrosshairRun();
			devLog("Emitting local animation-event", id, emitable);
			game.socket.emit(StartHook.socketPath, emitable, true);
		}
		if (sequence)
			emitable.sequence = sequence;
		devLog("Executing animation-event", sequence ? "(from another animation)" : "", local ? "(local)" : "", id, emitable);
		return this.executeTriggerEvent(id, "animation-event", emitable);
	}

	/** A player's local animation-event, already emitable, for us to send out to everyone. */
	async #onQuery({ emitable }: { emitable: Record<string, unknown> }) {
		const trigger = typeof emitable?.name === "string"
			? globalThis.triggerAnimations.api.matchTrigger(emitable.name)
			: undefined;
		if (!trigger || !game.user.isActiveGM)
			return;
		await this.#runAsGM(trigger.id, trigger.local, emitable);
	}

	/** One module socket, so we distinguish between different calls here. */
	#onSocket(data: any, socket = false) {
		if (data?.[CLAIM_FLAG])
			return receiveTriggerClaim(data);
		if (data?.[CROSSHAIR_FLAG])
			return receiveCrosshair(data);
		return this.#execute(data, socket);
	}

	override get gmOnly() {
		return false;
	}

	override _enable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, this.#execute.bind(this));
		game.socket.on(StartHook.socketPath, this.#onSocket.bind(this));
		CONFIG.queries[StartHook.queryPath] = this.#onQuery.bind(this);
	}

	override _disable(): void {
		foundry.utils.setProperty(globalThis, StartHook.executePath, () => { });
		game.socket.removeAllListeners(StartHook.socketPath);
		CONFIG.queries[StartHook.queryPath] = async () => { };
	}
}

export { StartHook };
