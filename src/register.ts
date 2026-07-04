import { id, title } from "moduleJSON";
import { dev, devLog, log } from "$lib/utils";
import type { TriggerEngine as T } from "trigger-engine/types";
import { API } from "./api";
import * as tNodes from "./nodes/index"
import * as tEntries from "./entries/index"
import * as tHooks from "./hooks/index"
import { positionConvertors } from "./entries/convertors"

type BuiltInKeys = { [k in T.TriggerApplicationCollection]: (typeof T.BuiltInApplication)[k][number][0][] };

Hooks.once("ready", async () => {
	const api = new API();
	await api.createJournalDatabase()

	if (dev) setTimeout(() => api.openBlueprint(), 1000);
});

Hooks.on(
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

			const { prepareTriggers } = r(id, "anim-trigger", {
				mode: "setting",
				setting: API.setting,
				entries: Object.values(tEntries) as (typeof T.NodeEntry)[],
				nodes: Object.values(tNodes) as (typeof T.TriggerNode)[],
				hooks: Object.values(tHooks) as (typeof T.TriggerHook)[],
				convertors: [...positionConvertors],
				builtins,
			})!;
			API.prepareTriggers = prepareTriggers;
		} catch (e) {
			ui.notifications.error(`Failed to register ${title} application.`, { permanent: true });
			console.error(e);
		}
	}
);

Hooks.once("triggerEngine.registerTriggers", (registerTriggers) => {
	log(`Registering triggers for trigger-engine`)
	registerTriggers("trigger-engine", "pf2e-trigger", "modules/trigger-animations/dist/pf2e-trigger.json");

	for (const mod of game.modules) {
		if (!mod.active) continue;
		const flag = (mod?.flags?.['trigger-animations'] as { triggers: string })?.triggers;
		if (!flag) continue;
		log(`Registering triggers for ${mod.id}`, flag)
		registerTriggers(id, "anim-trigger", flag);
	}
});