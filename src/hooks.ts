import { id, title } from "moduleJSON";
import { dev } from "$lib/utils";
import { API } from "./api";
import type { TriggerEngine as T } from "trigger-engine/types";

type BuiltInKeys = { [k in T.TriggerApplicationCollection]: (typeof T.BuiltInApplication)[k][number][0][] };

async function ready() {
	if (dev) {
		ui.notifications.info(`${title} is ready!`);
		console.log("Result", await triggerAnimations.api.openBlueprint());
	}
}

const hooks = {
	"ready": Hooks.once("ready", ready),
	"triggerEngine.registerApplication": Hooks.on(
		"triggerEngine.registerApplication",
		async (r: typeof T.TriggerApplication.register, builtInKeys: BuiltInKeys) => {
			try {
				const nodes = await import("./nodes/index");
				const hooks = await import("./hooks/index");
				const entries = await import("./entries/index");
				r(id, id, {
					mode: "setting",
					/*
					// TODO: Make it edit a hidden Journal Document ala Sequencer
					setting: {
						get: () => {},
						set: () => {}
					},
					*/
					entries: Object.values(entries) as (typeof T.NodeEntry)[],
					nodes: Object.values(nodes) as (typeof T.TriggerNode)[],
					hooks: Object.values(hooks) as (typeof T.TriggerHook)[],
					builtins: {
						entries: true,
						convertors: true,
						nodes: builtInKeys.nodes.filter(x => !x.includes("event")),
					},
				});
			} catch (e) {
				ui.notifications.error(`Failed to register ${title} application.`, { permanent: true });
				console.error(e);
			}
		}
	),
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