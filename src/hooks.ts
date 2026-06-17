import { id, title } from "moduleJSON";
import { dev, devLog, log } from "$lib/utils";
import type { TriggerEngine as T } from "trigger-engine/types";
import { api } from "./api";
import * as tNodes from "./nodes"
import * as tHooks from "./hooks"
import * as tEntries from "./entries"

type BuiltInKeys = { [k in T.TriggerApplicationCollection]: (typeof T.BuiltInApplication)[k][number][0][] };

async function ready() {
	if (dev) {
		ui.notifications.info(`${title} is ready!`);
		console.log("Result", await api.openBlueprint());
	}
}

const hooks = {
	"ready": Hooks.once("ready", ready),
	"triggerEngine.registerApplication": Hooks.on(
		"triggerEngine.registerApplication",
		(r: typeof T.TriggerApplication.register, builtInKeys: BuiltInKeys) => {
			try {
				const builtins: NonNullable<Parameters<typeof r>[2]>['builtins'] = {
					// hooks: true,
					entries: true,
					convertors: true,
					nodes: builtInKeys.nodes.filter(x => !x.includes("event")),
				}

				devLog(
					"Registering trigger-animations application",
					{
						nodes: Object.keys(tNodes),
						hooks: Object.keys(tHooks),
						entries: Object.keys(tEntries),
						builtins
					}
				)

				r(id, id, {
					mode: "setting",
					/*
					// TODO: Make it edit a hidden Journal Document ala Sequencer
					setting: {
						get: () => {},
						set: () => {}
					},
					*/
					entries: Object.values(tEntries) as (typeof T.NodeEntry)[],
					nodes: Object.values(tNodes) as (typeof T.TriggerNode)[],
					hooks: Object.values(tHooks) as (typeof T.TriggerHook)[],
					builtins,
				});
			} catch (e) {
				ui.notifications.error(`Failed to register ${title} application.`, { permanent: true });
				console.error(e);
			}
		}
	),
	"triggerEngine.registerTriggers": Hooks.once("triggerEngine.registerTriggers", (registerTriggers) => {
		log(`Registering triggers for trigger-engine`)
		registerTriggers("trigger-engine", "pf2e-trigger", "modules/trigger-animations/static/pf2e-triggers.json");

		for (const mod of game.modules) {
			if (!mod.active) continue;
			const flag = (mod?.flags?.['trigger-animations'] as { triggers: string })?.triggers;
			if (!flag) continue;
			log(`Registering triggers for ${mod.id}`, flag)
			registerTriggers(id, id, flag);
		}
	})
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