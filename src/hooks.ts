import moduleJSON from "moduleJSON";
import { dev } from "$lib/utils";
import type { TriggerApplication } from "trigger-engine/src/engine/application/application";

async function ready() {
	if (dev) ui.notifications.info(`${moduleJSON.title} is ready!`);

	console.log(await game.triggerEngine?.api.openBlueprintMenu("trigger-animations", "trigger-animations"));
}

async function registerApplication(register: typeof TriggerApplication.register) {
	register(
		moduleJSON.id,
		moduleJSON.id,
		{
			mode: "setting",
			builtins: {
				entries: true,
				convertors: true,
				nodes: [
					"execute-event", "await-confirm", "console-log", "create-message", "delete-item",
					"execute-script", "update-item", "if-truthy", "is-combatant", "list-contains",
					"extract-actor", "extract-item", "actors-match", "break-loop", "compare-numbers",
					"filter-targets", "format-text", "resolve-formula", "texts-match", "split-boolean",
					"split-number", "split-text", "current-combatant", "scene-targets", "user-value"
				],
			},
		}
	);
}

const hooks = {
	ready: Hooks.once("ready", ready),
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
		}
	})
}