import { TriggerEngine as T } from "trigger-engine/types";
import { SoundModifierNode } from "./base";
import { audioChannelOptions } from "./constants";

type TInputs = {
	radius: number;
	constrainedByWalls: boolean;
	distanceEasing: boolean;
	audioChannel: string;
	alwaysForGMs: boolean;
	globalSound: boolean;
	panSound: boolean;
	panDistanceToEase: number;
	baseEffectType: string;
	baseEffectIntensity: number;
	muffledEffectType: string;
	muffledEffectIntensity: number;
	elevation: number;
	absolute: boolean;
	levels: string;
};

class SoundSpatialNode extends SoundModifierNode<TInputs> {
	static override get type() {
		return "snd-spatial";
	}

	static get aliases(): string[] {
		return ["radius",
			"constrainedByWalls",
			"distanceEasing",
			"audioChannel",
			"alwaysForGMs",
			"globalSound",
			"panSound",
			"baseEffect",
			"muffledEffect",
			"elevation",
			"onLevels"];
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uf1e0" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			this.soundInput,
			{
				key: "radius",
				type: "number",
				...this.io("radius"),
				field: { default: 0, min: 0 }
			},
			{
				key: "constrainedByWalls",
				type: "boolean",
				...this.io("constrainedByWalls"),
				field: { default: false }
			},
			{
				key: "distanceEasing",
				type: "boolean",
				...this.io("distanceEasing"),
				field: { default: true }
			},
			{
				key: "audioChannel",
				type: "text",
				...this.io("audioChannel"),
				field: { type: "select", default: "", options: audioChannelOptions() }
			},
			{
				key: "alwaysForGMs",
				type: "boolean",
				...this.io("alwaysForGMs"),
				field: { default: false }
			},
			{
				key: "globalSound",
				type: "boolean",
				...this.io("globalSound"),
				field: { default: false }
			},
			{
				key: "panSound",
				type: "boolean",
				...this.io("panSound"),
				group: "pan",
				field: { default: false }
			},
			{
				key: "panDistanceToEase",
				type: "number",
				...this.io("panDistanceToEase"),
				group: "pan",
				field: { default: 0, min: 0 }
			},
			{
				key: "baseEffectType",
				type: "text",
				...this.io("baseEffectType"),
				group: "baseEffect",
				field: {
					type: "select",
					default: "",
					options: [{ value: "", label: "None" }, ...Object.keys((CONFIG as any).soundEffects ?? {})]
				}
			},
			{
				key: "baseEffectIntensity",
				type: "number",
				...this.io("baseEffectIntensity"),
				group: "baseEffect",
				field: { default: 0, min: 0 }
			},
			{
				key: "muffledEffectType",
				type: "text",
				...this.io("muffledEffectType"),
				group: "muffledEffect",
				field: {
					type: "select",
					default: "",
					options: [{ value: "", label: "None" }, ...Object.keys((CONFIG as any).soundEffects ?? {})]
				}
			},
			{
				key: "muffledEffectIntensity",
				type: "number",
				...this.io("muffledEffectIntensity"),
				group: "muffledEffect",
				field: { default: 0, min: 0 }
			},
			{
				key: "elevation",
				type: "number",
				...this.io("elevation"),
				group: "elevation",
				field: { default: 0 }
			},
			{
				key: "absolute",
				type: "boolean",
				...this.io("absolute"),
				group: "elevation",
				field: { default: false }
			},
			{
				key: "levels",
				type: "text",
				...this.io("levels"),
				field: { type: "text" }
			}
		];
	}

	protected override async apply(section: SoundSection): Promise<void> {
		const radius = await this.getInputValue("radius");
		if (radius > 0) section.radius(radius);

		const constrainedByWalls = await this.getInputValue("constrainedByWalls");
		if (constrainedByWalls) section.constrainedByWalls(true);

		const distanceEasing = await this.getInputValue("distanceEasing");
		section.distanceEasing(distanceEasing);

		const audioChannel = await this.getInputValue("audioChannel");
		if (audioChannel) section.audioChannel(audioChannel);

		const alwaysForGMs = await this.getInputValue("alwaysForGMs");
		if (alwaysForGMs) section.alwaysForGMs(true);

		const globalSound = await this.getInputValue("globalSound");
		if (globalSound) section.globalSound(true);

		const panSound = await this.getInputValue("panSound");
		if (panSound) {
			const panDistanceToEase = await this.getInputValue("panDistanceToEase");
			// @ts-expect-error Sequencer types use distanceToEase but runtime uses outerEaseDistance
			section.panSound(true, { outerEaseDistance: panDistanceToEase });
		}

		const baseEffectType = await this.getInputValue("baseEffectType");
		if (baseEffectType) {
			const baseEffectIntensity = await this.getInputValue("baseEffectIntensity");
			section.baseEffect({ type: baseEffectType, intensity: baseEffectIntensity });
		}

		const muffledEffectType = await this.getInputValue("muffledEffectType");
		if (muffledEffectType) {
			const muffledEffectIntensity = await this.getInputValue("muffledEffectIntensity");
			section.muffledEffect({ type: muffledEffectType, intensity: muffledEffectIntensity });
		}

		const elevation = await this.getInputValue("elevation");
		const absolute = await this.getInputValue("absolute");
		if (elevation !== 0 || absolute) {
			section.elevation(elevation, { absolute });
		}

		const levels = await this.getInputValue("levels");
		if (levels) {
			const levelArray = levels.split(",").map((s: string) => s.trim()).filter((s: string) => s);
			if (levelArray.length > 0) {
				section.onLevels(levelArray.length === 1 ? levelArray[0]! : levelArray);
			}
		}
	}
}

export { SoundSpatialNode };
