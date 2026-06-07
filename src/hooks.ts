import moduleJSON from "moduleJSON";
import { dev } from "$lib/utils";

function ready() {
	if (dev) ui.notifications.info(`${moduleJSON.title} is ready!`);
}

const hooks = {
	ready: Hooks.on("ready", ready)
};

// Hot Module Replacement (HMR) used in development mode.
// https://vite.dev/guide/api-hmr
// Its simpler than you'd imagine!
if (import.meta.hot) {
	import.meta.hot.accept((newModule) => {
		if (newModule) {
			// Remove all old hooks
			Object.entries(hooks).forEach(([k, h]) => Array.isArray(h) ? h.forEach((hook) => Hooks.off(k, hook)) : Hooks.off(k, h));
		}
	})
}