import { isAutoAnimationsActive } from "$lib/autoAnimations";
import { id as moduleId } from "moduleJSON";
import { onVolumeChanged } from "./volume";

const settingString = (id: string, property: string) => `trigger-animations.settings.${id}.${property}`;

Hooks.on("init", () => {
	game.settings.register(moduleId, "autoanimations-override", {
		name: settingString("autoanimations-override", "name"),
		hint: settingString("autoanimations-override", "hint"),
		type: Boolean,
		default: true,
		config: isAutoAnimationsActive(),
		scope: "world",
	});
	game.settings.register(moduleId, "autoanimations-override-timeout", {
		name: settingString("autoanimations-override-timeout", "name"),
		hint: settingString("autoanimations-override-timeout", "hint"),
		type: Number,
		default: 500,
		range: { min: 0, max: 3000, step: 50 } as never,
		config: isAutoAnimationsActive(),
		scope: "world",
	});
	game.settings.register(moduleId, "volume", {
		name: settingString("volume", "name"),
		hint: settingString("volume", "hint"),
		type: Number,
		default: 1,
		range: { min: 0, max: 2, step: 0.05 } as never,
		config: true,
		scope: "client",
		onChange: value => onVolumeChanged(Number(value)),
	});
	game.settings.register(moduleId, "quality", {
		name: settingString("quality", "name"),
		type: String,
		default: "medium",
		choices: {
			minimal: settingString("quality", "choices.minimal"),
			low: settingString("quality", "choices.low"),
			medium: settingString("quality", "choices.medium"),
			high: settingString("quality", "choices.high"),
		},
		config: true,
		scope: "user",
		hint: settingString("quality", "hint"),
	});
	game.settings.register(moduleId, "show-template-button", {
		name: settingString("show-template-button", "name"),
		hint: settingString("show-template-button", "hint"),
		type: Boolean,
		default: true,
		config: true,
		scope: "user",
	});
	game.settings.register(moduleId, "database-edit-role", {
		name: settingString("database-edit-role", "name"),
		hint: settingString("database-edit-role", "hint"),
		type: Number,
		default: CONST.USER_ROLES.PLAYER,
		choices: {
			[CONST.USER_ROLES.PLAYER]: settingString("database-edit-role", "choices.player"),
			[CONST.USER_ROLES.TRUSTED]: settingString("database-edit-role", "choices.trusted"),
			[CONST.USER_ROLES.ASSISTANT]: settingString("database-edit-role", "choices.assistant"),
			[CONST.USER_ROLES.GAMEMASTER]: settingString("database-edit-role", "choices.gamemaster"),
		} as never,
		config: true,
		scope: "world",
		onChange: value => triggerAnimations?.api?.applyDatabaseOwnership(Number(value)),
	});
	game.settings.register(moduleId, "update-notice-shown-version", {
		type: String,
		name: "update-notice-shown-version",
		config: false,
		scope: "world",
	});
});
