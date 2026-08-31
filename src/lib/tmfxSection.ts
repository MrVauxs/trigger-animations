import type { AnyDocument, TMFXPreset } from "$lib/tmfxRegistry";
import { acquire, filterKey, hasFilter, leaseIds, owns, release, whenReleased } from "$lib/tmfxRegistry";
import { devLog, moduleError, moduleWarn } from "$lib/utils";

// This entire file could probably be moved to its own module somewhere in the future.
// Who knows. Vauxs would probably sooner make his own version of TMFX.

export const TMFX_SECTION = "tokenMagic";

export type TokenMagicAction = "add" | "release";

export interface TokenMagicSectionOptions {
	action?: TokenMagicAction;
	/** UUID of the token or region document the filter sits on. */
	uuid?: string;
	filterId?: string;
	/**
	 * Identifies the claim on the filter, so nodes sharing a `filterId` cannot
	 * release each other's. A `release` without one is a Remove node working from
	 * hand-typed inputs rather than undoing a specific Add node.
	 */
	leaseId?: string;
	/** Resolved preset object; `togglePreset` needs it for both add and remove. */
	preset?: TMFXPreset;
	/** Force the client-only filter, whatever the Sequence itself does. */
	local?: boolean;
	/** Whether the containing Sequence waits for this section to finish. */
	waitUntilFinished?: boolean;
	/** Keep the filter after the Sequence ends. */
	persist?: boolean;
	duration?: number;
	/** UUIDs whose deletion releases the filter. */
	tieTo?: string[];
}

interface SerializedTokenMagicSection extends Record<string, unknown> {
	type: string;
	tokenMagic: TokenMagicSectionOptions;
}

/**
 * The shipped Sequencer typings expose `BaseSection` as an instance rather than a
 * class, and leave out the protected members a custom section overrides.
 */
interface SequencerBaseSection {
	sequence: Sequence;
	_waitUntilFinished: boolean;
	/* eslint-disable ts/method-signature-style -- a class may only override methods declared as methods (TS2425). */
	run(): Promise<void>;
	_serialize(): Promise<Record<string, unknown>>;
	_deserialize(data: Record<string, unknown>): unknown;
	_abortSection(): void;
	/* eslint-enable ts/method-signature-style */
}

interface SequencerBaseSectionConstructor {
	new (sequence: Sequence): SequencerBaseSection;
	niceName: string;
}

declare global {
	interface Sequence {
		/** Set by `play({ local })` and forced on by `fromJSON`. */
		local?: boolean;
		/** The same flag under its name in older Sequencer builds. */
		localOnly?: boolean;
		/** Registered by {@link registerTokenMagicSection}. */
		tokenMagic: (options?: TokenMagicSectionOptions) => Sequence;
	}
}

let registered = false;

export function registerTokenMagicSection(): void {
	if (registered || typeof Sequencer === "undefined")
		return;
	try {
		Sequencer.SectionManager.registerSection(
			"trigger-animations",
			TMFX_SECTION,
			createTokenMagicSection() as unknown as AnySection,
		);
		registered = true;
	} catch (e) {
		moduleError(`[tmfx] could not register the "${TMFX_SECTION}" section`, e);
	}
}

function createTokenMagicSection(): SequencerBaseSectionConstructor {
	const BaseSection = Sequencer.BaseSection as unknown as SequencerBaseSectionConstructor;

	return class TokenMagicSection extends BaseSection {
		static override niceName = "Token Magic FX";

		/**
		 * A plain property rather than a `#private` field: `Sequence.addSequence`
		 * re-homes a section with `Object.assign(Object.create(proto), section)`,
		 * which copies own enumerable properties only.
		 */
		_options: TokenMagicSectionOptions = {};

		/** `fromJSON` builds the section with no arguments before `_deserialize` runs. */
		constructor(sequence: Sequence, options: TokenMagicSectionOptions = {}) {
			super(sequence);
			this._options = options;
			this._syncWait();
		}

		/**
		 * A filter with a lifetime of its own runs for that lifetime, so the rest of
		 * Sequencer works on it the way it works on an effect: the section sits in the
		 * manager until the filter comes down, `.waitUntilFinished()` and `.wait()`
		 * order around it, and a persisting one parks the Sequence when it is last.
		 *
		 * A filter that ends with the Sequence cannot wait on itself, since the
		 * section that releases it comes later in the same Sequence. It only waits
		 * for the filter to land, matching the `thenDo` it replaced.
		 */
		get _awaitsLifetime(): boolean {
			return this._options.action === "add" && (!!this._options.persist || (this._options.duration ?? 0) > 0);
		}

		_syncWait(): void {
			this._waitUntilFinished = !!this._options.waitUntilFinished;
		}

		get _key(): string {
			return filterKey(this._options.uuid ?? "", this._options.filterId ?? "");
		}

		/**
		 * Client-only unless the Sequence is going out to everyone. `play()` sets the
		 * flag before any section runs, and `fromJSON` forces it on, so a remotely
		 * played Sequence paints a sprite filter on each client.
		 */
		get _transient(): boolean {
			return !!(this._options.local || this.sequence.local || this.sequence.localOnly);
		}

		_resolvePlaceable(): AnyDocument | undefined {
			const doc = this._options.uuid ? fromUuidSync(this._options.uuid) as AnyDocument | null : null;
			if (!doc?.documentName) {
				moduleWarn(`[tmfx] could not resolve ${this._options.uuid || "an empty uuid"}`);
				return undefined;
			}
			return doc;
		}

		override async run(): Promise<void> {
			const { action = "add", filterId, leaseId } = this._options;
			if (!filterId || (action === "add" && !leaseId)) {
				moduleWarn(`[tmfx] incomplete section`, this._options);
				return;
			}
			if (action === "add")
				await this._add(leaseId!);
			else
				await this._release(leaseId, leaseId ? "Sequence ended" : "Remove node");
		}

		async _add(leaseId: string): Promise<void> {
			const { preset, filterId, duration, tieTo } = this._options;
			const placeable = this._resolvePlaceable();
			if (!placeable || !preset || !filterId)
				return;

			const applied = await acquire(leaseId, {
				placeable,
				preset,
				filterId,
				transient: this._transient,
				duration,
				tieTo,
			});

			if (applied && this._awaitsLifetime)
				await whenReleased(this._key, leaseId);
		}

		async _release(leaseId: string | undefined, reason: string): Promise<void> {
			const key = this._key;

			if (leaseId) {
				if (owns(key, leaseId))
					await release(key, leaseId, reason);
				else
					devLog(`[tmfx] nothing of ours left on "${key}" (${reason})`);
				return;
			}

			// Hand-typed Remove inputs address a filter by target and preset, which
			// says nothing about who put it there. Taking down a filter another node,
			// module or session owns is the stacking bug this section exists to fix,
			// so anything but a single unambiguous claim of ours is left alone.
			const { filterId, preset } = this._options;
			const claims = leaseIds(key);
			if (claims.length === 1) {
				await release(key, claims[0]!, reason);
				return;
			}

			const placeable = this._resolvePlaceable();
			const where = placeable?.uuid ?? this._options.uuid;
			if (claims.length > 1) {
				moduleWarn(`[tmfx] "${filterId}" on ${where} is held by ${claims.length} nodes; connect the Filter output to remove one`);
			} else if (placeable && preset && filterId && hasFilter(placeable, filterId, this._transient)) {
				moduleWarn(`[tmfx] "${filterId}" on ${where} was not applied by this node; leaving it alone`);
			} else {
				moduleWarn(`[tmfx] "${filterId}" is not on ${where}; nothing to remove`);
			}
		}

		/**
		 * `Sequence._abort()` flips the status before walking the sections, so a
		 * queued section never runs. Both halves of the pair have to clean up from
		 * here instead: a teardown section that will never run, and an Add section
		 * whose filter has no teardown at all because it persists or has a duration.
		 *
		 * Called in a plain `for` loop with no `await`, so start the removal and let
		 * it settle on its own.
		 */
		override _abortSection(): void {
			super._abortSection();
			const { leaseId } = this._options;
			if (leaseId)
				void this._release(leaseId, "Sequence aborted");
		}

		override async _serialize(): Promise<SerializedTokenMagicSection> {
			return {
				...await super._serialize(),
				type: TMFX_SECTION,
				tokenMagic: this._options,
			};
		}

		override _deserialize(data: Record<string, unknown>): this {
			super._deserialize(data);
			this._options = (data.tokenMagic ?? {}) as TokenMagicSectionOptions;
			this._syncWait();
			return this;
		}
	};
}
