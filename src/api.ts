import { id } from "moduleJSON";
import { TriggerEngine as T } from "trigger-engine/types";
import { StartNodeOptions } from "./nodes";
import { devLog } from "$lib/utils";

type CustomSetting = Extract<
	T.TriggerApplicationOptions["setting"],
	{
		get: unknown;
		set: unknown;
	}
>;

export class API {
	constructor() {
		globalThis.triggerAnimations = { api: this };
	}

	openBlueprint(data?: T.TriggerDataInput, ...args: any[]) {
		return game.triggerEngine?.api.openBlueprintMenu(id, id, data, ...args)
	}
	async endAnimation(opts: Parameters<typeof Sequencer.EffectManager.endEffects>[0]) {
		return Sequencer.EffectManager.endEffects(opts)
	}
	async endAllAnimation(scene: string) {
		return Sequencer.EffectManager.endAllEffects(scene)
	}
	async runFromTrigger(data: StartNodeOptions): Promise<void> { };

	_db!: JournalEntry
	get db() { return this._db }
	set db(db) { this._db = db }
	get setting() { return API.setting }

	static get setting(): CustomSetting {
		return {
			get: () => (globalThis.triggerAnimations.api.db.getFlag(id, "data") || {}),
			set: async (data, prepare) => {
				await globalThis.triggerAnimations.api.db.setFlag(id, "data", data);
				prepare();
			},
			afterPrepared: (data) => {
				devLog("afterPrepared", data)
				globalThis.triggerAnimations.api.settingsMount();
			}
		}
	}

	#hooks: Record<string, number> = {};
	settingsMount() {
		devLog("DB Mount Hook", this.db)
		if (!this.db) return;
		if (this.#hooks.renderJournalDirectory) Hooks.off("renderJournalDirectory", this.#hooks.renderJournalDirectory)
		this.#hooks.renderJournalDirectory = Hooks.on("renderJournalDirectory", (app) => {
			if (!this.db) return;
			const element = app.element.querySelector(`[data-entry-id="${this.db.id}"]`);
			if (element) element.remove();
		})


		const style = document.createElement("style");
		style.id = `trigger-animations-${this.db.id}`;
		style.textContent = `[data-entry-id="${this.db.id}"] { display: none !important; }`;
		document.head.appendChild(style);

		if (this.#hooks.preDeleteJournalEntry) Hooks.off("preDeleteJournalEntry", this.#hooks.preDeleteJournalEntry)
		this.#hooks.preDeleteJournalEntry = Hooks.on("preDeleteJournalEntry", (doc) => {
			if (!this.db) return;
			return doc !== this.db;
		})
	}

	async createJournalDatabase() {
		let database = game.journal.getName("Trigger Animations DB");
		if (!game.user?.isGM) return database;
		if (!database) {
			database = await JournalEntry.create({
				name: "Trigger Animations DB",
				ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
			});
		}
		this._db = database!;
		return database;
	}
}