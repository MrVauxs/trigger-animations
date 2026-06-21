import { id } from "moduleJSON";
import { TriggerEngine as T } from "trigger-engine/types";
import { StartNodeOptions } from "./nodes";

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

	_db: JournalEntry | undefined
	get db() { return this._db }
	set db(db) { this._db = db }

	get setting(): Partial<T.TriggerApplicationOptions['setting']> {
		return {
			get: () => { },
			set: () => { },
			afterPrepared: () => { }
		}
	}

	async createJournalDatabase() {
		if (!game.user.isGM) return;
		let database = game.journal.getName("Trigger Animations DB");
		if (!database) {
			database = await JournalEntry.create({
				name: "Trigger Animations DB",
				ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
			});
		}
		this._db = database;
		return database;
	}
}