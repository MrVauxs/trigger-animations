import { devLog } from "$lib/utils";
import { id as moduleId } from "moduleJSON";

const VOLUME_KEY = "volume";
const SLIDER_ID = "trigger-animations-volume-slider";
/** Marks the authored (pre-multiplier) volume on a sound/effect data object. */
const BASE = "_taBaseVolume" as const;

interface ScalableData {
	volume?: number;
	[BASE]?: number;
	/** Present on placed/spatial sounds, absent on global ones. */
	source?: unknown;
	global?: boolean;
}

const settingString = (property: string) => `trigger-animations.settings.${VOLUME_KEY}.${property}`;

/** The current client volume multiplier. Kept in sync via {@link onVolumeChanged}. */
let currentVolume = 1;

function sanitize(value: unknown): number {
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 ? n : 1;
}

export function getVolume(): number {
	return currentVolume;
}

/**
 * Scale a freshly-created sound/effect data object by the client volume,
 * remembering the authored value the first time so re-application stays exact.
 */
function scaleData(data: ScalableData | undefined): void {
	if (!data || typeof data.volume !== "number")
		return;
	if (data[BASE] === undefined)
		data[BASE] = data.volume;
	data.volume = data[BASE] * currentVolume;
}

/** Re-apply the current volume to everything already playing, live. */
function reapplyToRunning(): void {
	for (const sound of (Sequencer.SoundManager.sounds ?? [])) {
		const data = sound?.data as ScalableData | undefined;
		if (!data || data[BASE] === undefined)
			continue;
		data.volume = (data[BASE]) * currentVolume;
		const placed = !!(data.source && !data.global);
		if (!placed && sound.sound)
			sound.sound.volume = data.volume;
	}

	const coreVolume = sanitize(game.settings.get("core", "globalInterfaceVolume"));
	for (const effect of (Sequencer.EffectManager.effects ?? [])) {
		const data = effect?.data as ScalableData | undefined;
		if (!data || data[BASE] === undefined)
			continue;
		data.volume = (data[BASE]) * currentVolume;
		if (effect.sprite)
			effect.sprite.volume = data.volume * coreVolume;
	}

	syncSlider();
}

/** Reflect the current volume in the injected playlist slider (unless the user is dragging it). */
function syncSlider(): void {
	const input = document.getElementById(SLIDER_ID) as HTMLInputElement | null;
	if (input && document.activeElement !== input)
		input.value = String(currentVolume);
}

/**
 * Called whenever the volume changes (from the setting's `onChange`, the module
 * settings menu, or the playlist slider). Updates the cached value and live audio.
 */
export function onVolumeChanged(value: number): void {
	currentVolume = sanitize(value);
	devLog("Volume changed", currentVolume);
	reapplyToRunning();
}

/**
 * Persist the volume to the setting, debounced so dragging the slider doesn't
 * spam writes. Assigned in `setup` to avoid touching `foundry.utils` at module
 * load (before the global is guaranteed to exist).
 */
let persist: (value: number) => void = () => { };

/** Inject the "Animation Volume" slider into Foundry's User Volume Controls. */
function injectSlider(root: HTMLElement | JQuery<HTMLElement>): void {
	const html = root instanceof HTMLElement ? root : root?.[0];
	if (!html)
		return devLog("No html found for volume slider.");

	const list = html.querySelector(".global-volume ol");
	if (!list || list.querySelector(`#${SLIDER_ID}`))
		return;

	const li = document.createElement("li");
	li.className = "flexrow trigger-animations-volume";
	li.dataset.tooltip = game.i18n.localize(settingString("hint"));

	const label = document.createElement("label");
	label.textContent = game.i18n.localize(settingString("short"));

	const icon = document.createElement("i");
	icon.className = "volume-icon fa-fw fa-solid fa-film";
	icon.toggleAttribute("inert", true);

	const input = document.createElement("input");
	input.id = SLIDER_ID;
	input.type = "range";
	input.min = "0";
	input.max = "2";
	input.step = "0.05";
	input.value = String(currentVolume);
	input.setAttribute("aria-label", game.i18n.localize(settingString("name")));
	input.addEventListener("input", () => {
		const value = sanitize(input.value);
		onVolumeChanged(value);
		persist(value);
	});

	// notch in ::after
	const track = document.createElement("div");
	track.className = "ta-volume-track";
	track.append(input);

	li.append(label, icon, track);
	list.append(li);
}

// Registered at module load; these only fire once animations start playing.
Hooks.on("createSequencerSound", (data: ScalableData) => scaleData(data));
Hooks.on("createSequencerEffect", (effect: { data: ScalableData }) => scaleData(effect?.data));
Hooks.on("renderPlaylistDirectory", (_app: unknown, element: HTMLElement | JQuery<HTMLElement>) => injectSlider(element));

// Settings register on "init"; read the stored value once they exist.
Hooks.once("setup", () => {
	currentVolume = sanitize(game.settings.get(moduleId, VOLUME_KEY));
	persist = foundry.utils.debounce((value: number) => {
		game.settings.set(moduleId, VOLUME_KEY, value);
	}, 250);
});
