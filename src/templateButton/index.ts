import { devLog } from "$lib/utils";
import { id as moduleId } from "moduleJSON";
import { DEFAULT_TEMPLATE } from "./templates";
import { type ApplicationV1HeaderButton } from "@7h3laughingman/foundry-types/client/appv1/api/_module.mjs";
import type ItemSheet from "@7h3laughingman/foundry-types/client/appv1/sheets/item-sheet.mjs";

/*
import { type ApplicationHeaderControlsEntry } from "@7h3laughingman/foundry-types/client/applications/_types.mjs";
import type ItemSheetV2 from "@7h3laughingman/foundry-types/client/applications/sheets/item-sheet.mjs";

// ApplicationV2
const getHeaderControlsItemId = Hooks.on("getHeaderControlsItemSheetV2", (
	sheet: ItemSheetV2<any>, controls: ApplicationHeaderControlsEntry[]
) => {
	devLog("headerControls", sheet, controls);
	controls.unshift({ label: "Trigger Animations", icon: "fas fa-film", action: "", visible: true, onClick: devLog })
})
*/

// ApplicationV1
const getItemSheetHeaderButtonsId = Hooks.on("getItemSheetHeaderButtons", (
	sheet: ItemSheet<any, any>, buttons: ApplicationV1HeaderButton[]
) => {
	if (!sheet.item) return devLog("No item in sheet.");
	if (!game.settings.get(moduleId, "show-template-button")) return;
	buttons.unshift({ label: "TA", class: "trigger-anims", icon: "fas fa-film", onclick: () => openTemplateDialog(sheet.item) })
})

/** Turn an item into its suggested trigger name. Fill the switch as you go. */
function suggestTriggerName(item: Item): string[] {
	const slug = (item as any).slug ?? (item as any).system?.slug ?? item.name?.slugify?.() ?? "item-slug";

	switch (game.system.id) {
		case "sf2e":
		case "pf2e": {
			switch (item.type) {
				// TODO: map item types to their suggested trigger-name prefix.
				// e.g. case "action": return `action:${slug}`;
				case "spell": return [`template:${slug}`, `attack:${slug}`, `damage:${slug}`]
				case "weapon": return [`attack:${slug}`, `damage:${slug}`]
			}
		}
	}

	return [`${item.type}:${slug}`];
}

async function openTemplateDialog(item: Item) {
	const DialogV2 = foundry.applications.api.DialogV2;
	const suggested = suggestTriggerName(item);

	const content = `
<section class="trigger-anims-template">
	<p>Creating a template animation for <strong>${foundry.utils.escapeHTML(item.name ?? "Unnamed Item")}</strong>.</p>
	<p>Item type: <code>${foundry.utils.escapeHTML(item.type)}</code></p>
	${suggested[1] ? `<p>Additional Suggestions: <code>${foundry.utils.escapeHTML(suggested.join(", "))}</code></p>` : ""}
	<p>
		<label>Suggested trigger name</label>
		<input type="text" name="triggerName" value="${foundry.utils.escapeHTML(suggested[0])}" autofocus>
	</p>
</section>`;

	const result = await DialogV2.prompt({
		window: { title: "Trigger Animations – New Template", icon: "fas fa-film" },
		content,
		ok: {
			label: "Create Blueprint",
			icon: "fas fa-check",
			callback: (_event, button) => button.form?.elements.namedItem("triggerName") as HTMLInputElement | null,
		},
		rejectClose: false,
	});

	const triggerName = (result as HTMLInputElement | null)?.value?.trim();
	if (!triggerName) return devLog("Template dialog cancelled.");

	const trigger = DEFAULT_TEMPLATE.build({
		triggerNames: triggerName.split(",").map((n) => n.trim()).filter(Boolean),
		label: item.name ?? "Unnamed Item",
		uuid: item.uuid,
		folder: game.user.name,
	});

	const setting = triggerAnimations.api.setting;
	const current = setting.get();
	await setting.set({
		disabled: current.disabled ?? [],
		enabled: current.enabled ?? [],
		folders: current.folders ?? {},
		sources: [...(current.sources ?? []), trigger],
	}, () => { });

	devLog("Created blueprint", trigger);
	ui.notifications.info(`Created trigger animation "${trigger.name}".`);
}

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		Hooks.off("getItemSheetHeaderButtons", getItemSheetHeaderButtonsId)
		// Hooks.off("getHeaderControlsItemSheetV2", getHeaderControlsItemId)
	});
}
