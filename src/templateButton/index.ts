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

/** Turn an item into its suggested trigger name. */
export function suggestTriggerName(item: Item): string[] {
	const slug = (item as any).slug ?? (item as any).system?.slug ?? item.name?.slugify?.() ?? "item-slug";

	switch (game.system.id) {
		case "sf2e":
		case "pf2e": {
			switch (item.type) {
				// TODO: map item types to their suggested trigger-name prefix.
				// e.g. case "action": return `action:${slug}`;
				case "spell": return [
					`template:${slug}`,
					`attack:${slug}`,
					`damage:${slug}`,
					`template:${item.uuid}`,
					`attack:${item.uuid}`,
					`damage:${item.uuid}`,
				];
				case "weapon": {
					const i = item as any;
					const strings = [`attack:${slug}`, `damage:${slug}`, `attack:${item.uuid}`, `damage:${item.uuid}`];
					if (i?.system?.baseItem)
						strings.push(`attack:${i.system.baseItem}`);
					if (i?.system?.group)
						strings.push(`attack:${i.system.group}`);
					if (i?.baseItem)
						strings.push(`attack:${i.baseItem}`);
					if (i?.group)
						strings.push(`attack:${i.group}`);
					return [...new Set(strings)];
				};
				case "effect": return [`effect:${slug}`, `effect:${item.uuid}`];
				case "condition": return [`condition:${slug}`, `condition:${item.uuid}`];
			}
		}
	}

	return [`unknown-trigger:${slug}`];
}

function wireTriggerNameChips(root: HTMLElement) {
	const section = root.querySelector<HTMLElement>(".trigger-anims-template");
	const input = root.querySelector<HTMLInputElement>("input[name='triggerName']");
	const chips = [...root.querySelectorAll<HTMLButtonElement>(".ta-chip")];
	if (!section || !input || section.dataset.taWired)
		return;
	section.dataset.taWired = "true";

	const tokens = () => input.value.split(",").map(t => t.trim()).filter(Boolean);

	function sync() {
		const active = new Set(tokens());
		for (const chip of chips) {
			const on = active.has(chip.dataset.name ?? "");
			chip.classList.toggle("active", on);
			const icon = chip.querySelector("i");
			if (icon)
				icon.className = on ? "fas fa-check" : "fas fa-plus";
		}
	}

	for (const chip of chips) {
		chip.addEventListener("click", () => {
			const name = chip.dataset.name ?? "";
			const current = tokens();
			const next = current.includes(name) ? current.filter(t => t !== name) : [...current, name];
			input.value = next.join(", ");
			sync();
		});
	}

	input.addEventListener("input", sync);
	sync();
}

async function openTemplateDialog(item: Item) {
	const DialogV2 = foundry.applications.api.DialogV2;
	const suggested = suggestTriggerName(item);

	const registered = triggerAnimations.api.templates;
	const templates = Object.values(registered);
	const fallback = templates[0];
	if (!fallback)
		return devLog("No templates registered.");
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

	const escape = foundry.utils.escapeHTML;
	// UUIDs are too long so we cut 'em
	const chipLabel = (name: string) => name.endsWith(item.uuid) ? `${name.slice(0, -item.uuid.length)}UUID` : name;

	const chips = suggested.map(name => `<button type="button" class="ta-chip" data-name="${escape(name)}" title="${escape(name)}">
		<i class="fas fa-plus"></i><span>${escape(chipLabel(name))}</span>
	</button>`).join("");

	const content = document.createElement("div");
	content.innerHTML = `
<section class="trigger-anims-template">
	<p class="ta-intro">Template animation for <strong>${escape(item.name ?? "Unnamed Item")}</strong> <code>${escape(item.type)}</code></p>
	<div class="ta-field">
		<label>Template</label>
		<select name="template" class="ta-select">
			<button type="button"><selectedcontent></selectedcontent></button>
			${options}
		</select>
	</div>
	<div class="ta-field">
		<label>Trigger names</label>
		<div class="ta-chips">${chips}</div>
		<input type="text" name="triggerName" value="${escape(suggested[0])}" spellcheck="false" autocomplete="off" autofocus>
		<small class="ta-help">Click a suggestion to add or remove it. Comma-separated.</small>
	</div>
</section>`;

	const result = await DialogV2.prompt({
		window: { title: "Trigger Animations – New Template", icon: "fas fa-film" },
		position: { width: 480 },
		render: (_event: Event, dialog: any) => wireTriggerNameChips(dialog?.element ?? dialog),
		// `content` accepts HTMLDivElement, but typing it as such makes
		// DeepPartial<DialogV2Configuration> recurse infinitely (TS2589).
		// Might compute right the first time and then you save it and fucks up :augh:
		content: content as any,
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
