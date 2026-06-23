import { id } from "moduleJSON";
import { TriggerEngine as T } from "trigger-engine/types";
import { StartNodeOptions } from "./nodes";
import { devLog, log } from "$lib/utils";

// Dev-only: log the dev server's reply to a trigger save (see saveTriggers()).
if (import.meta.hot) {
	import.meta.hot.on("trigger-animations:saved", (result) => {
		if (result?.error) {
			ui.notifications.error("Failed to save triggers to static/. See console.")
			log("Failed to save triggers to static/", result.error);
		}
		else {
			ui.notifications.info(`Saved ${result?.written ?? "?"} trigger(s) to static/${result?.subdir ?? "anim-trigger"}`)
			devLog(`Saved ${result?.written ?? "?"} trigger(s) to static/${result?.subdir ?? "anim-trigger"}`);
		}
	});
}

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
		return game.triggerEngine?.api.openBlueprintMenu(id, "anim-trigger", data, ...args)
	}
	async endAnimation(opts: Parameters<typeof Sequencer.EffectManager.endEffects>[0]) {
		return Sequencer.EffectManager.endEffects(opts)
	}
	async endAllAnimation(scene: string) {
		return Sequencer.EffectManager.endAllEffects(scene)
	}
	async runFromTrigger(data: StartNodeOptions): Promise<void> { };

	saveTriggers(data: T.TriggerDataInput[]): void {
		import.meta.hot?.send("trigger-animations:save", { triggers: data });
	};

	_db!: JournalEntry
	get db() { return this._db }
	set db(db) { this._db = db }
	get setting() { return API.setting }

	_enabledTriggerNames: Record<string, string> = {};

	static prepareTriggers = () => { log("Prepare Triggers not set") }
	prepare() {
		devLog("Running prepareTriggers", API.prepareTriggers)
		API.prepareTriggers();
	};

	static get setting(): CustomSetting {
		return {
			menu: {
				icon: "fas fa-video",
				restricted: false,
			},
			get: () => (globalThis.triggerAnimations.api.db?.getFlag(id, "data") || {}),
			set: async (data, prepare) => {
				// TODO: Some kind of update reconciliation for multiple users?
				/*
					disabled: string[]; (string of IDs from registered triggers or sources)
					enabled: string[]; (string of IDs from registered triggers or sources)
					folders: Record<string, string>; (overrides for registered triggers <trigger id> -> new folder name)
					sources: TriggerDataInput[];
				*/
				await globalThis.triggerAnimations.api.db?.setFlag(id, "data", _replace(data));
				// prepare(); // Do not prepare, the updateJournalEntry hook takes care of it
			},
			afterPrepared: (data) => {
				devLog("afterPrepared", data)
				globalThis.triggerAnimations.api.saveTriggers(data);
				globalThis.triggerAnimations.api.databaseMount();
			}
		}
	}

	#hooks: Record<string, number> = {};
	databaseMount() {
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

	#updateHook: number | undefined;
	async createJournalDatabase() {
		const end = () => {
			this._db = database!;
			this.databaseMount();
			if (!this.#updateHook) this.#updateHook = Hooks.on("updateJournalEntry", (journal, data, log) => {
				if (journal.id === this.db.id) this.prepare();
			})
			return database;
		}
		let database = game.journal.getName("Trigger Animations DB");
		if (!JournalEntry.canUserCreate(game.user)) return end()
		if (!database) {
			database = await JournalEntry.create({
				name: "Trigger Animations DB",
				ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
			});
		}
		return end();
	}
}