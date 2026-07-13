import type { BlueprintApplication } from "triggers-menu";
import { dev, devLog, getMajorMinor } from "$lib/utils";
import { id } from "moduleJSON";
import "./module.css";
import "./register";
import "./api";
import "./settings";
import "./volume";
import "./templateButton";

Hooks.once("ready", async () => {
	displayTriggersUpdateNotice();
});

async function displayTriggersUpdateNotice() {
	if (!game.user.isGM)
		return;

	const currentVersion = dev ? "0.1.1" : game.modules.get(id)?.version;
	if (!currentVersion)
		return;

	const lastShown = dev ? "0.0.0" : game.settings.get(id, "update-notice-shown-version") as string ?? "0.0.0";

	const currentMM = getMajorMinor(currentVersion);
	const lastMM = getMajorMinor(lastShown);

	if (!currentMM)
		return;
	if (lastMM && !foundry.utils.isNewerVersion(currentMM, lastMM)) {
		if (lastShown !== currentVersion) {
			await game.settings.set(id, "update-notice-shown-version", currentVersion);
		}
		return;
	}

	await game.settings.set(id, "update-notice-shown-version", currentVersion);

	// Clean up older Sequencer update cards (keep only this newest one)
	const oldMessageIds = game.messages.filter((message) => {
		return message.content.includes("trigger-animations welcome");
	}).map(message => message.id);

	if (oldMessageIds.length) {
		await ChatMessage.deleteDocuments(oldMessageIds);
	}

	const gmIds = game.users.filter(u => u.isGM).map(u => u.id);

	await ChatMessage.create({
		whisper: gmIds,
		content: `
<div id="ta-welcome" class="trigger-animations welcome">
<img class="welcome-image" src="modules/trigger-animations/assets/TA.webp"/>
<div class="welcome-divider"></div>
<p class="welcome-title">Trigger Animations updated to v${currentVersion}</p>
<div class="welcome-divider"></div>
<div class="welcome-links">
<a target="_blank" rel="noopener noreferrer" href="https://github.com/MrVauxs/trigger-animations/blob/master/CHANGELOG.md"><i class="fa fa-list-tree"></i>Read the Changelog</a>
<a target="_blank" rel="noopener noreferrer" href="https://wiki.mrvauxs.net/reference/trigger-animations/"><i class="fa fa-book-blank"></i>Check the Wiki</a>
<a target="_blank" rel="noopener noreferrer" href="https://www.patreon.com/cw/mrvauxs"><i class="fab fa-patreon"></i><b>Support on Patreon!</b></a>
</div>
</div>`,
	});
}

Hooks.on("renderChatMessageHTML", (_msg: ChatMessage, element: HTMLElement) => injectEnableButton(element));

async function injectEnableButton(element: HTMLElement) {
	const card = element.querySelector<HTMLElement>("#ta-welcome");
	if (!card || card.querySelector(".welcome-enable") || !game.user.isGM)
		return;
	if (game.system.id !== "pf2e" && game.system.id !== "sf2e")
		return;

	const triggers = await fetch("modules/trigger-animations/dist/pf2e-trigger.json")
		.then(r => r.json()) as { id: string }[];
	const triggerSettings = game.settings.get("trigger-engine", "pf2e-trigger-triggers") as { enabled: string[] };
	const containsAll = triggers.map(t => t.id).every(x => triggerSettings.enabled.includes(x));
	devLog("Is every pf2e-trigger enabled?", containsAll);

	// Re-check after the await in case a concurrent render already injected it.
	if (containsAll || card.querySelector(".welcome-enable"))
		return;

	const reEnableFunc = async () => {
		const sheet = await game.triggerEngine?.api.openBlueprintMenu("trigger-engine", "pf2e-trigger") as BlueprintApplication;
		for (const trigger of triggers) {
			const triggerDoc = sheet.blueprint.triggers.get(`module:${trigger.id}`);
			if (triggerDoc) {
				sheet.blueprint.enableTrigger(triggerDoc, true);
			}
		}
		await sheet.blueprint.saveTriggers();
	};

	const button = document.createElement("button");
	button.type = "button";
	button.className = "welcome-enable";
	button.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span>Enable Required Triggers</span>`;
	button.addEventListener("click", async () => {
		button.disabled = true;
		try {
			await reEnableFunc();
			button.remove();
		} catch (error) {
			devLog("Failed to enable triggers", error);
			button.disabled = false;
		}
	});

	card.append(button);
}
