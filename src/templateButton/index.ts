import type { ApplicationV1HeaderButton } from "@7h3laughingman/foundry-types/client/appv1/api/_module.mjs";
import type ItemSheet from "@7h3laughingman/foundry-types/client/appv1/sheets/item-sheet.mjs";
import { devLog } from "$lib/utils";
import { id as moduleId } from "moduleJSON";
import { isRecommended } from "./templates";

// ApplicationV1
const getItemSheetHeaderButtonsId = Hooks.on("getItemSheetHeaderButtons", (
	sheet: ItemSheet<any, any>,
	buttons: ApplicationV1HeaderButton[],
) => {
	if (!sheet.item)
		return devLog("No item in sheet.");
	if (!game.settings.get(moduleId, "show-template-button"))
		return;
	buttons.unshift({ label: "TA", class: "trigger-anims", icon: "fas fa-film", onclick: async () => openTemplateDialog(sheet.item) });
});

/** Turn an item into its suggested trigger name. Fill the switch as you go. */
function suggestTriggerName(item: Item): string[] {
	const slug = (item as any).slug ?? (item as any).system?.slug ?? item.name?.slugify?.() ?? "item-slug";

	switch (game.system.id) {
		case "sf2e":
		case "pf2e": {
			switch (item.type) {
				// TODO: map item types to their suggested trigger-name prefix.
				// e.g. case "action": return `action:${slug}`;
				case "spell": return [`template:${slug}`, `attack:${slug}`, `damage:${slug}`];
				case "weapon": return [`attack:${slug}`, `damage:${slug}`];
			}
		}
	}

	return [`${item.type}:${slug}`];
}

async function openTemplateDialog(item: Item) {
	const DialogV2 = foundry.applications.api.DialogV2;
	const suggested = suggestTriggerName(item);

	const registered = triggerAnimations.api.templates;
	const templates = Object.values(registered);
	const fallback = templates[0];
	if (!fallback)
		return devLog("No templates registered.");
	// Prefer a template that fits the suggested names; fall back to the first.
	const recommended = templates.filter(t => isRecommended(t, suggested));
	const preselected = (recommended[0] ?? fallback).id;

	const options = templates.map((t) => {
		const fits = isRecommended(t, suggested);
		const selected = t.id === preselected ? " selected" : "";
		const badge = fits ? `<span class="ta-badge">Recommended</span>` : "";
		return `<option value="${t.id}"${selected}>
			<span class="ta-opt-row"><span class="ta-opt-label">${foundry.utils.escapeHTML(t.label)}</span>${badge}</span>
			<small class="ta-opt-hint">${foundry.utils.escapeHTML(t.hint)}</small>
		</option>`;
	}).join("");

	// Build the content as a real element: DialogV2 only sanitizes string content
	// (foundry.utils.cleanHTML), which strips the customizable-select markup
	// (<button>/<selectedcontent>). An HTMLDivElement is passed through untouched.
	const content = document.createElement("div");
	content.innerHTML = `
<section class="trigger-anims-template">
	<p>Creating a template animation for <strong>${foundry.utils.escapeHTML(item.name ?? "Unnamed Item")}</strong>.</p>
	<p>Item type: <code>${foundry.utils.escapeHTML(item.type)}</code></p>
	${suggested[1] ? `<p class="ta-suggestions">Additional Suggestions: ${suggested.map(s => `<code>${foundry.utils.escapeHTML(s)}</code>`).join(" ")}</p>` : ""}
	<p>
		<label>Template</label>
		<select name="template" class="ta-select">
			<button type="button"><selectedcontent></selectedcontent></button>
			${options}
		</select>
	</p>
	<p>
		<label>Suggested trigger name</label>
		<input type="text" name="triggerName" value="${foundry.utils.escapeHTML(suggested[0])}" autofocus>
	</p>
</section>`;

	const result = await DialogV2.prompt({
		window: { title: "Trigger Animations – New Template", icon: "fas fa-film" },
		// `content` accepts HTMLDivElement, but typing it as such makes
		// DeepPartial<DialogV2Configuration> recurse infinitely (TS2589).
		content,
		ok: {
			label: "Create Blueprint",
			icon: "fas fa-check",
			callback: (_event, button) => button.form ?? null,
		},
		rejectClose: false,
	});

	const form = result as HTMLFormElement | null;
	if (!form)
		return devLog("Template dialog cancelled.");

	const triggerName = (form.elements.namedItem("triggerName") as HTMLInputElement | null)?.value?.trim();
	if (!triggerName)
		return devLog("No trigger name given.");

	const templateId = (form.elements.namedItem("template") as HTMLSelectElement | null)?.value;
	const template = (templateId && registered[templateId]) || fallback;

	const trigger = template.build({
		triggerNames: triggerName.split(",").map(n => n.trim()).filter(Boolean),
		label: item.name ?? "Unnamed Item",
		uuid: item.uuid,
		folder: game.user.name,
	});

	const app = await triggerAnimations.api.openBlueprint();
	if (!app)
		return ui.notifications.error("Trigger Animations | Could not open blueprint menu.");

	app.blueprint.addTrigger(trigger, true, true);

	devLog("Created blueprint", trigger);
}

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		Hooks.off("getItemSheetHeaderButtons", getItemSheetHeaderButtonsId);
		// Hooks.off("getHeaderControlsItemSheetV2", getHeaderControlsItemId)
	});
}

/*
import { type ApplicationHeaderControlsEntry } from "@7h3laughingman/foundry-types/client/applications/_types.mjs";
import type ItemSheetV2 from "@7h3laughingman/foundry-types/client/applications/sheets/item-sheet.mjs";
import { API } from '../api';

// ApplicationV2
const getHeaderControlsItemId = Hooks.on("getHeaderControlsItemSheetV2", (
	sheet: ItemSheetV2<any>, controls: ApplicationHeaderControlsEntry[]
) => {
	devLog("headerControls", sheet, controls);
	controls.unshift({ label: "Trigger Animations", icon: "fas fa-film", action: "", visible: true, onClick: devLog })
})
*/
