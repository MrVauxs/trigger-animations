import { SvelteApplicationMixin } from "$lib/SvelteMixin.svelte";
import Root from "./app.svelte";

const { ApplicationV2 } = foundry.applications.api;

// Button to open is defined in settings.ts and index.ts
class HealthcheckMenu extends SvelteApplicationMixin(ApplicationV2) {
	static override DEFAULT_OPTIONS = {
		id: "ta-healthcheck",
		position: {
			width: 650,
			height: 500,
		},
		window: {
			icon: "fa-solid fa-user-nurse",
			title: "Trigger Animations Healthcheck",
			resizable: true,
		},
	};

	protected override root = Root;
}

export { HealthcheckMenu };

if (import.meta.hot) {
	import.meta.hot.accept(async (newModule) => {
		if (!newModule)
			return;

		const reopenedDocuments: HealthcheckMenu[] = [];

		for (const [_id, docClass] of foundry.applications.instances) {
			if (docClass.constructor.name === HealthcheckMenu.name) {
				await docClass.close();
				reopenedDocuments.push(docClass as HealthcheckMenu);
			};
		}

		for (const doc of reopenedDocuments) {
			new newModule.HealthcheckMenu(doc.options).render({ force: true });
		}
	});
}
