import type { TriggerEngine as T } from "trigger-engine/types";
import type { BlueprintApplication } from "triggers-menu";
import type { StartNodeOptions } from "./nodes";
import type { TriggerTemplate } from "./templateButton/templates";
import { competes, handleItem, overrideEnabled } from "$lib/autoAnimations";
import * as s from "$lib/serialize";
import { dev, devLog, log } from "$lib/utils";
import { id } from "moduleJSON";
import { BUILTIN_TEMPLATES } from "./templateButton/templates";

// Dev-only: log the dev server's reply to a trigger save (see saveTriggers()).
if (import.meta.hot) {
	import.meta.hot.on("trigger-animations:saved", (result) => {
		if (result?.error) {
			ui.notifications.error("Failed to save triggers to static/. See console.");
			log("Failed to save triggers to static/", result.error);
		} else {
			ui.notifications.info(`Saved ${result?.written ?? "?"} trigger(s) to static/${result?.subdir ?? "anim-trigger"}`);
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

type OwnershipLevel = (typeof CONST.DOCUMENT_OWNERSHIP_LEVELS)[keyof typeof CONST.DOCUMENT_OWNERSHIP_LEVELS];

interface CachedTrigger {
	id: string;
	patterns: string[] | null;
	priority: number;
	specificity: number;
	local: boolean;
}

function patternSpecificity(pattern: string): number {
	if (pattern === "*")
		return 0;
	// Score by the number of non-wildcard characters. A wildcard is less worth than a full string so `bow` beats `bow*`
	const literalLength = pattern.replace(/\*/g, "").length;
	return pattern.includes("*") ? literalLength - 0.5 : literalLength;
}

function patternMatches(pattern: string, name: string, givenNames: string[]): boolean {
	// `*` matches everything; otherwise `*` is a wildcard segment (e.g. `weapon-*`).
	if (pattern === "*")
		return true;
	if (!pattern.includes("*"))
		return givenNames.includes(pattern);
	const regex = new RegExp(`^${pattern.split("*").map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
	return regex.test(name);
}

export class API {
	constructor() {
		globalThis.triggerAnimations = { api: this };
		for (const query in this.queries) {
			CONFIG.queries[`${id}.${query}`] = this.queries[query as keyof typeof this.queries];
		}
		this.ready = true;
	}

	ready = false;
	setReady() {
		this.ready = true;
		Hooks.callAll("triggerAnimations.ready", triggerAnimations.api);
		devLog("API is ready.", this.ready);
	}

	get dev() {
		return dev();
	}

	private queries = {
		showCrosshair: async (data: { serialized: string }) => {
			const crosshairData = s.parse(data.serialized) as Parameters<typeof Sequencer.Crosshair.show>[0];
			devLog("Received query showCrosshair", crosshairData);

			const template = await Sequencer.Crosshair.show(crosshairData);
			return JSON.stringify(template);
		},
	} as const;

	async query<T extends keyof typeof this.queries>(user: User, type: T, data: any, options: Record<string, any> = {}) {
		options.timeout ??= 30 * 1000; // 30 second timeout
		if (!CONFIG.queries[type])
			type = `${id}.${type}` as T;

		devLog(`Running query ${type} for ${user.name}`, data);
		const query = await user.query(type, { serialized: s.stringify(data) }, options) as string;
		return JSON.parse(query);
	}

	async openBlueprint(data?: T.TriggerDataInput, ...args: any[]) {
		return game.triggerEngine?.api.openBlueprintMenu(id, "anim-trigger", data, ...args) as Promise<BlueprintApplication>;
	}

	async endAnimation(opts: Parameters<typeof Sequencer.EffectManager.endEffects>[0]) {
		return Sequencer.EffectManager.endEffects(opts);
	}

	async endAllAnimation(scene: string) {
		return Sequencer.EffectManager.endAllEffects(scene);
	}

	async runFromTrigger(data: StartNodeOptions): Promise<void> { };

	autoAnimations = {
		competes,
		handleItem,
		get override() { return overrideEnabled(); },
	};

	saveTriggers(data: T.TriggerDataInput[]): void {
		if (import.meta.hot)
			import.meta.hot?.send("trigger-animations:save", { triggers: data });
	};

	_db!: JournalEntry;
	get db() { return this._db; }
	set db(db) { this._db = db; }
	get setting() { return API.setting; }

	_templates: Record<string, TriggerTemplate> = { ...BUILTIN_TEMPLATES };
	get templates() { return this._templates; }
	set templates(value: Record<string, TriggerTemplate>) { this._templates = value; }

	/** Register (or overwrite) a template other modules can use in the dialog. */
	registerTemplate(template: TriggerTemplate) {
		this._templates[template.id] = template;
		return template;
	}

	_triggerCache: CachedTrigger[] = [];

	/** Build {@link _triggerCache} from prepared trigger data. */
	cacheTriggers(triggerData: T.TriggerDataInput[]) {
		this._triggerCache = triggerData
			.flatMap((trigger) => {
				const id = trigger.id;
				if (!id)
					return [];
				const nodes = trigger.nodes ?? [];
				// A trigger plays locally if any of its `play` nodes has `local: true`.
				const local = nodes.some(node => node.type === "play" && node.inputs?.local?.value === true);
				return nodes
					.filter(node => node.type === "animation-event")
					.map((node): CachedTrigger => {
						const input = node.inputs?.name;
						// A wired input is only resolved at runtime, so it can always match.
						const raw = input && !input.connection && typeof input.value === "string"
							? input.value
							: null;
						const patterns = raw === null
							? null
							: raw.split(",").map(p => p.trim()).filter(Boolean);
						const specificity = patterns === null
							? Infinity // dynamic patterns are treated as maximally specific
							: Math.max(0, ...patterns.map(patternSpecificity));
						return { id, patterns, priority: trigger.priority ?? 0, specificity, local };
					});
			})
			.sort((a, b) => b.priority - a.priority || b.specificity - a.specificity);
		devLog("Cached animation-event triggers", this._triggerCache);
	}

	/**
	 * `literalOnly` counts only triggers that name this event outright and not wildcards. Exists because Trigger Animations Trove has its damn "damage:*" triggers.
	 */
	matchTrigger(name: string, { literalOnly = false }: { literalOnly?: boolean } = {}): CachedTrigger | undefined {
		if (!name)
			return undefined;
		const givenNames = name.split(",").map(x => x.trim());
		return this._triggerCache.find(({ patterns }) => {
			if (patterns === null)
				return !literalOnly;
			return patterns.some(pattern => (!literalOnly || !pattern.includes("*"))
				&& patternMatches(pattern, name, givenNames));
		});
	}

	static prepareTriggers = () => { log("Prepare Triggers not set"); };
	prepare() {
		devLog("Running prepareTriggers", API.prepareTriggers);
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
				await globalThis.triggerAnimations.api.db?.setFlag(id, "data", _replace(data));
				// prepare(); // Do not prepare, the updateJournalEntry hook takes care of it
			},
			afterPrepared: async (triggerData) => {
				devLog("afterPrepared", triggerData);
				globalThis.triggerAnimations.api.saveTriggers(triggerData);
				globalThis.triggerAnimations.api.cacheTriggers(triggerData);
				globalThis.triggerAnimations.api.databaseMount();
			},
		};
	}

	databaseOwnership(minRole?: number): Record<string, OwnershipLevel> {
		const role = Number(minRole ?? game.settings.get(id, "database-edit-role"));
		const { OWNER, OBSERVER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;
		const ownership: Record<string, OwnershipLevel> = { default: OBSERVER };
		for (const user of game.users) {
			if (!user.id || user.isGM)
				continue;
			ownership[user.id] = user.role >= role ? OWNER : OBSERVER;
		}
		return ownership;
	}

	/** Push {@link databaseOwnership} onto the database journal. Only the active GM writes. */
	async applyDatabaseOwnership(minRole?: number) {
		if (!this.db || !game.user.isActiveGM)
			return;
		const ownership = this.databaseOwnership(minRole);
		devLog("Applying database ownership", ownership);
		await this.db.update({ ownership });
	}

	#hooks: Record<string, number> = {};
	databaseMount() {
		devLog("DB Mount Hook", this.db);
		if (!this.db)
			return;
		if (this.#hooks.renderJournalDirectory)
			Hooks.off("renderJournalDirectory", this.#hooks.renderJournalDirectory);
		this.#hooks.renderJournalDirectory = Hooks.on("renderJournalDirectory", (app) => {
			if (!this.db)
				return;
			const element = app.element.querySelector(`[data-entry-id="${this.db.id}"]`);
			if (element)
				element.remove();
		});

		const style = document.createElement("style");
		style.id = `trigger-animations-${this.db.id}`;
		style.textContent = `[data-entry-id="${this.db.id}"] { display: none !important; }`;
		document.head.appendChild(style);

		if (this.#hooks.preDeleteJournalEntry)
			Hooks.off("preDeleteJournalEntry", this.#hooks.preDeleteJournalEntry);
		this.#hooks.preDeleteJournalEntry = Hooks.on("preDeleteJournalEntry", (doc) => {
			if (!this.db)
				return;
			return doc !== this.db;
		});
	}

	#updateHook: number | undefined;
	async createJournalDatabase() {
		let database = game.journal.getName("Trigger Animations DB");
		const end = () => {
			this._db = database!;
			this.databaseMount();
			if (!this.#updateHook) {
				this.#updateHook = Hooks.on("updateJournalEntry", (journal, data, log) => {
					if (journal.id === this.db.id)
						this.prepare();
				});
			}
			return database;
		};
		if (!JournalEntry.canUserCreate(game.user))
			return end();
		if (!database) {
			database = await JournalEntry.create({
				name: "Trigger Animations DB",
				ownership: this.databaseOwnership(),
			});
		}
		return end();
	}
}
