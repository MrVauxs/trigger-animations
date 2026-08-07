import { id as moduleId } from "moduleJSON";
import { suggestTriggerName } from "../templateButton";
import { devLog } from "./utils";

/**
 * Automated Animations compatibility thing, most of it is repurposed code from A-A.
 */

const ITEM_MENUS = ["melee", "range", "ontoken", "templatefx", "aura", "preset"] as const;

interface AAMatch {
	menu: string;
	entry: any;
}

interface HandleItemOptions {
	/** The (dnd5e) activity, if any. */
	activity?: any;
	activeEffect?: boolean;
}

const clean = (name?: string | null) => name?.replace(/\s+/g, "").toLowerCase() ?? "";

export function isAutoAnimationsActive(): boolean {
	return !!game.modules.get("autoanimations")?.active;
}

export function overrideEnabled(): boolean {
	if (!isAutoAnimationsActive())
		return false;
	try {
		return !!game.settings.get(moduleId, "autoanimations-override");
	} catch {
		return false;
	}
}

/**
 * Copy of `AAAutorecFunctions.allMenuSearch`, changed to return the source menu.
 */
function allMenuSearch(name: string, activeEffect: boolean): AAMatch | null {
	const menus = (globalThis as any).AutomatedAnimations?.AutorecManager?.getAutorecEntries?.();
	if (!menus)
		return null;

	const entries = (activeEffect ? ["aefx"] : [...ITEM_MENUS])
		.flatMap(menu => (menus[menu] ?? []).map((entry: any): AAMatch => ({ menu, entry })));

	const exact = entries.find(({ entry }) => entry?.advanced?.exactMatch && entry.label === name);
	if (exact)
		return exact;

	const rinsedName = clean(name);
	const sorted = entries.sort((a, b) => clean(b.entry?.label).length - clean(a.entry?.label).length);
	return sorted.find(({ entry }) => !entry?.advanced?.exactMatch
		&& entry?.label
		&& rinsedName.includes(clean(entry.label))
		&& !(entry.advanced?.excludedTerms ?? []).some((term: string) => rinsedName.includes(clean(term)))) ?? null;
}

/**
 * Copy of `handleItem` from A-A's `src/system-handlers/findAnimation.js`, changed to return the match.
 */
export function handleItem(item: any, { activity = null, activeEffect = false }: HandleItemOptions = {}): AAMatch | null {
	if (!item || !isAutoAnimationsActive())
		return null;

	try {
		if (game.settings.get("autoanimations", "killAllAnim") === "off")
			return null;

		const activityFlags = activity?.flags?.autoanimations;
		const itemFlags = item.flags?.autoanimations;

		const killed = (flags: any) => !!flags && (!!flags.killAnim || flags.isEnabled === false);
		if (killed(activityFlags) || killed(itemFlags))
			return null;
		if (activityFlags?.isCustomized || itemFlags?.isCustomized)
			return { menu: "flags", entry: null };

		if (game.settings.get("autoanimations", "disableAutoRec"))
			return null;

		return allMenuSearch(item.name ?? item.label ?? "", activeEffect);
	} catch (error) {
		devLog("Automated Animations check failed, assuming it will not animate.", error);
		return null;
	}
}

interface CompetesOptions extends HandleItemOptions {
	targets?: number;
	hasSource?: boolean;
}

export function competes(item: any, options: CompetesOptions = {}): boolean {
	const match = handleItem(item, options);
	if (!match)
		return false;
	if (match.menu === "flags")
		return true;

	if (["melee", "range"].includes(match.menu)) {
		const targets = options.targets ?? game.user?.targets?.size ?? 0;
		const hasSource = options.hasSource ?? !!item?.actor?.getActiveTokens?.().length;
		if (!hasSource || targets < 1)
			return false;
	}

	return true;
}

function hasCompetingTrigger(item: any): boolean {
	if (!item)
		return false;
	try {
		// TODO: Replace this if below comes through
		// https://github.com/theripper93/autoanimations/pull/78
		return suggestTriggerName(item).some(name => !!triggerAnimations.api.matchTrigger(name, { literalOnly: true }));
	} catch (error) {
		devLog("Failed to guess trigger names for", item, error);
		return false;
	}
}

let overrideHook: number | undefined;

function registerAutoAnimationsHooks(): void {
	if (overrideHook !== undefined) {
		Hooks.off("AutomatedAnimations-WorkflowStart", overrideHook);
		overrideHook = undefined;
	}
	if (!isAutoAnimationsActive())
		return;

	overrideHook = Hooks.on("AutomatedAnimations-WorkflowStart", (clonedData: any, animationData: any) => {
		if (!overrideEnabled())
			return;
		if (!animationData || !clonedData)
			return;
		if (!hasCompetingTrigger(clonedData.item))
			return;
		devLog("Overriding Automated Animations for", clonedData.item?.name);
		clonedData.stopWorkflow = true;
	});
}

Hooks.once("ready", () => registerAutoAnimationsHooks());
