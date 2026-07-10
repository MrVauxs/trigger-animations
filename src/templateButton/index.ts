import { devLog } from "$lib/utils";
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
	buttons.unshift({ label: "TA", class: "trigger-anims", icon: "fas fa-film", onclick: () => openTemplateDialog(sheet.item) })
})

function openTemplateDialog(item: Item) {
	devLog("openTemplateDialog", item);
}

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		Hooks.off("getItemSheetHeaderButtons", getItemSheetHeaderButtonsId)
		// Hooks.off("getHeaderControlsItemSheetV2", getHeaderControlsItemId)
	});
}
