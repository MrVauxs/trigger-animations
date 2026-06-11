import { id, title } from "moduleJSON";
import { dev } from "$lib/utils";
import type { TriggerApplication } from "trigger-engine/src/engine/application/application";

async function ready() {
	if (dev) {
		ui.notifications.info(`${title} is ready!`);
		console.log("Result", await game.triggerEngine?.api.openBlueprintMenu(id, id, {}, { testArgs: 123 }));
	}
}

async function registerApplication(register: typeof TriggerApplication.register) {
	try {
		const nodes = await import("./nodes/index");
		const entries = await import("./entries/index");

		register(id, id, {
			mode: "setting",
			/*
			// TODO: Make it edit a hidden Journal Document ala Sequencer
			setting: {
				get: () => {},
				set: () => {}
			},
			*/
			nodes: Object.values(nodes),
			entries: Object.values(entries),
			builtins: {
				entries: true,
				convertors: true,
				nodes: [
					"await-confirm", "console-log", "create-message", "delete-item",
					"execute-script", "update-item", "if-truthy", "is-combatant", "list-contains",
					"extract-actor", "extract-item", "actors-match", "break-loop", "compare-numbers",
					"filter-targets", "format-text", "resolve-formula", "texts-match", "split-boolean",
					"split-number", "split-text", "current-combatant", "scene-targets", "user-value"
				],
			},
		});
	} catch (e) {
		ui.notifications.error(`Failed to register ${title} application.`, { permanent: true });
		console.error(e);
	}
}

const hooks = {
	"ready": Hooks.once("ready", ready),
	"triggerEngine.registerApplication": Hooks.once("triggerEngine.registerApplication", registerApplication),
};

// Hot Module Replacement (HMR) used in development mode.
if (import.meta.hot) {
	import.meta.hot.accept((newModule) => {
		if (newModule) {
			// Remove all old hooks
			Object.entries(hooks).forEach(
				([k, h]) => Array.isArray(h)
					? h.forEach((hook) => Hooks.off(k, hook))
					: Hooks.off(k, h)
			);

			ui.notifications.warn("Make sure to reload the page to re-register the trigger engine applications.")
		}
	})
}