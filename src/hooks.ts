import { id, title } from "moduleJSON";
import { dev } from "$lib/utils";
import { API } from "./api";
import type { TriggerEngine as T } from "trigger-engine/types";

async function ready() {
	if (dev) {
		ui.notifications.info(`${title} is ready!`);
		console.log("Result", await triggerAnimations.api.openBlueprint());
	}
}

const hooks = {
	"ready": Hooks.once("ready", ready),
	"triggerEngine.registerApplication": Hooks.once("triggerEngine.registerApplication", async (r) => {
		try {
			const nodes = await import("./nodes/index");
			const hooks = await import("./hooks/index");
			r(id, id, {
				mode: "setting",
				/*
				// TODO: Make it edit a hidden Journal Document ala Sequencer
				setting: {
					get: () => {},
					set: () => {}
				},
				*/
				nodes: Object.values(nodes) as (typeof T.TriggerNode)[],
				hooks: Object.values(hooks),
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
	}),
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