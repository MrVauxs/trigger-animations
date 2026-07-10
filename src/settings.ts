import { id as moduleId } from 'moduleJSON';
import { onVolumeChanged } from './volume';

const settingString = (id: string, property: string) => `trigger-animations.settings.${id}.${property}`

Hooks.on("init", () => {
	game.settings.register(moduleId, "volume", {
		name: settingString("volume", "name"),
		hint: settingString("volume", "hint"),
		type: Number,
		default: 1,
		range: { min: 0, max: 2, step: 0.05 } as never,
		config: true,
		scope: "client",
		onChange: (value) => onVolumeChanged(Number(value)),
	})
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
	})
	game.settings.register(moduleId, "show-template-button", {
		name: settingString("show-template-button", "name"),
		hint: settingString("show-template-button", "hint"),
		type: Boolean,
		default: true,
		config: true,
		scope: "user",
	})
	game.settings.register(moduleId, "update-notice-shown-version", {
		type: String,
		name: "update-notice-shown-version",
		config: false,
		scope: "world",
	})
})