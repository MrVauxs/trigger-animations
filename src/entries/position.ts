import type { ActorPF2e, TokenDocumentPF2e } from "@7h3laughingman/pf2e-types";

const { NodeEntry } = globalThis.triggerEngine;

declare global {
	type PositionSource =
		| { kind: "region"; region: RegionDocument }
		| { kind: "target"; actor: ActorPF2e; token?: TokenDocumentPF2e }
		| { kind: "point"; x: number; y: number }
		| { kind: "name"; name: string };
}

class PositionEntry extends NodeEntry<PositionSource> {
	static override get type() {
		return "position";
	}

	static override get default() {
		return undefined;
	}

	static override get color(): ColorSource {
		return "#e07b39";
	}

	// --- Type guards ---
	static #isPlainObject(v: unknown): v is Record<string, unknown> {
		return typeof v === "object" && v !== null && !Array.isArray(v);
	}

	static #isPoint(v: unknown): v is { kind: "point"; x: number; y: number } {
		return (
			PositionEntry.#isPlainObject(v) &&
			v["kind"] === "point" &&
			typeof v["x"] === "number" &&
			typeof v["y"] === "number"
		);
	}

	static #isTarget(
		v: unknown
	): v is { kind: "target"; actor: ActorPF2e; token?: TokenDocumentPF2e } {
		return (
			PositionEntry.#isPlainObject(v) &&
			v["kind"] === "target" &&
			v["actor"] instanceof Actor
		);
	}

	static #isRegion(
		v: unknown
	): v is { kind: "region"; region: RegionDocument } {
		return (
			PositionEntry.#isPlainObject(v) &&
			v["kind"] === "region" &&
			v["region"] instanceof RegionDocument
		);
	}

	static #isName(v: unknown): v is { kind: "name"; name: string } {
		return (
			PositionEntry.#isPlainObject(v) &&
			v["kind"] === "name" &&
			typeof v["name"] === "string"
		);
	}

	static override isValidType(value: unknown): value is PositionSource {
		return (
			PositionEntry.#isPoint(value) ||
			PositionEntry.#isTarget(value) ||
			PositionEntry.#isRegion(value) ||
			PositionEntry.#isName(value)
		);
	}

	// --- Casting from foreign entry types or raw values ---
	static override castValue(value: unknown): PositionSource | undefined {
		// Already valid
		if (PositionEntry.isValidType(value)) return value;

		// Raw document instances
		if (value instanceof Actor) {
			return { kind: "target", actor: value as ActorPF2e };
		}

		if (value instanceof TokenDocument) {
			const actor = value.actor;
			if (actor) return { kind: "target", actor: actor as ActorPF2e, token: value as TokenDocumentPF2e };
		}

		if (value instanceof RegionDocument) {
			return { kind: "region", region: value };
		}

		// String — a UUID resolves to a document; anything else is a named location.
		if (typeof value === "string") {
			const doc = fromUuidSync(value);

			if (doc instanceof Actor) {
				return { kind: "target", actor: doc as ActorPF2e };
			}
			if (doc instanceof TokenDocument) {
				const actor = doc.actor;
				if (actor) return { kind: "target", actor: actor as ActorPF2e, token: doc as TokenDocumentPF2e };
			}
			if (doc instanceof RegionDocument) {
				return { kind: "region", region: doc };
			}

			const name = value.trim();
			if (name) return { kind: "name", name };
		}

		// Plain object — infer shape
		if (PositionEntry.#isPlainObject(value)) {
			// Point-like: { x: number, y: number }
			if (
				typeof value["x"] === "number" &&
				typeof value["y"] === "number"
			) {
				return { kind: "point", x: value["x"], y: value["y"] };
			}

			// Target-like: { actor: Actor }
			if (value["actor"] instanceof Actor) {
				const token =
					value["token"] instanceof TokenDocument
						? (value["token"] as TokenDocumentPF2e)
						: undefined;
				return { kind: "target", actor: value["actor"] as ActorPF2e, token };
			}

			// Target-like: { actor: "uuid" }
			if (typeof value["actor"] === "string") {
				const actor = fromUuidSync(value["actor"]);
				if (actor instanceof Actor) {
					const token =
						value["token"] instanceof TokenDocument
							? (value["token"] as TokenDocumentPF2e)
							: undefined;
					return { kind: "target", actor: actor as ActorPF2e, token };
				}
			}

			// Region-like: { region: RegionDocument }
			if (value["region"] instanceof RegionDocument) {
				return { kind: "region", region: value["region"] };
			}

			// Name-like: { name: string }
			if (typeof value["name"] === "string" && value["name"].trim()) {
				return { kind: "name", name: value["name"].trim() };
			}
		}

		return undefined;
	}

	// --- Serialization ---
	static override toJSON(value: PositionSource): JSONValue {
		switch (value.kind) {
			case "point":
				return { kind: "point", x: value.x, y: value.y };
			case "target":
				return {
					kind: "target",
					actor: value.actor.uuid,
					token: value.token?.uuid ?? null,
				};
			case "region":
				return { kind: "region", region: value.region.uuid };
			case "name":
				return { kind: "name", name: value.name };
		}
	}

	static override async fromJSON(
		value: JSONValue
	): Promise<PositionSource | undefined> {
		if (typeof value !== "object" || value === null || Array.isArray(value))
			return undefined;

		const v = value as Record<string, unknown>;

		switch (v["kind"]) {
			case "point": {
				if (
					typeof v["x"] === "number" &&
					typeof v["y"] === "number"
				) {
					return { kind: "point", x: v["x"], y: v["y"] };
				}
				return undefined;
			}
			case "target": {
				if (typeof v["actor"] !== "string") return undefined;
				const actor = await fromUuid(v["actor"]);
				if (!(actor instanceof Actor)) return undefined;
				const token =
					typeof v["token"] === "string"
						? ((await fromUuid(v["token"])) ?? undefined)
						: undefined;
				return {
					kind: "target",
					actor: actor as ActorPF2e,
					token:
						token instanceof TokenDocument ? (token as TokenDocumentPF2e) : undefined,
				};
			}
			case "region": {
				if (typeof v["region"] !== "string") return undefined;
				const region = await fromUuid(v["region"]);
				if (!(region instanceof RegionDocument)) return undefined;
				return { kind: "region", region };
			}
			case "name": {
				if (typeof v["name"] !== "string" || !v["name"].trim()) return undefined;
				return { kind: "name", name: v["name"].trim() };
			}
		}

		return undefined;
	}
}

export { PositionEntry };