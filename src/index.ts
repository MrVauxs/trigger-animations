import "./module.css";
import "./register"
import "./api"
import "./settings"
import "./volume"
import { id } from 'moduleJSON';
import { dev, getMajorMinor } from "$lib/utils";

Hooks.once("ready", async () => {
	displayTriggersUpdateNotice();
});

async function displayTriggersUpdateNotice() {
	if (!game.user.isGM) return;

	const currentVersion = dev ? "0.1.1" : game.modules.get(id)?.version;
	if (!currentVersion) return;

	const lastShown = dev ? "0.0.0" : game.settings.get(id, "update-notice-shown-version") as string ?? "0.0.0";

	const currentMM = getMajorMinor(currentVersion);
	const lastMM = getMajorMinor(lastShown);

	if (!currentMM) return;
	if (lastMM && !foundry.utils.isNewerVersion(currentMM, lastMM)) {
		if (lastShown !== currentVersion) {
			await game.settings.set(id, "update-notice-shown-version", currentVersion);
		}
		return;
	}

	await game.settings.set(id, "update-notice-shown-version", currentVersion);

	// Clean up older Sequencer update cards (keep only this newest one)
	const oldMessageIds = game.messages.filter(message => {
		return message.content.includes("trigger-animations welcome");
	}).map(message => message.id);

	if (oldMessageIds.length) {
		await ChatMessage.deleteDocuments(oldMessageIds);
	}

	const gmIds = game.users.filter(u => u.isGM).map(u => u.id);

	await ChatMessage.create({
		whisper: gmIds,
		content: `
<div class="trigger-animations welcome">
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