import type { TriggerEngine as T } from "trigger-engine/types";
import type { ActorPF2e } from "@7h3laughingman/pf2e-types";

const positionConvertors = [
	// #region Input Position
	{
		output: "target",
		input: "position",
		convertToInput: (value: TargetDocuments): PositionSource => {
			return { kind: "target", actor: value.actor, token: value.token ?? undefined };
		},
	},
	{
		output: "region",
		input: "position",
		convertToInput: (value: RegionDocument): PositionSource => {
			return { kind: "region", region: value };
		},
	},
	{
		output: "point",
		input: "position",
		convertToInput: (value: Point): PositionSource => {
			return { kind: "point", x: value.x, y: value.y };
		},
	},
	{
		// Mirrors built-in item -> target convertor which pulls the item's actor.
		output: "item",
		input: "position",
		convertToInput: (value: Item): PositionSource | undefined => {
			const actor = value.parent;
			return actor ? { kind: "target", actor: actor as ActorPF2e } : undefined;
		},
	},
	{
		// A plain string is treated as a Sequencer named location (defined by a Named Location node earlier in the trigger).
		output: "text",
		input: "position",
		convertToInput: (value: string): PositionSource | undefined => {
			const name = value.trim();
			return name ? { kind: "name", name } : undefined;
		},
	},
	// #endregion
	// #region Output Positio
	{
		output: "position",
		input: "target",
		convertToInput: (value: PositionSource): TargetDocuments | undefined => {
			return value.kind === "target" ? { actor: value.actor, token: value.token } : undefined;
		},
	},
	{
		output: "position",
		input: "region",
		convertToInput: (value: PositionSource): RegionDocument | undefined => {
			return value.kind === "region" ? value.region : undefined;
		},
	},
	{
		output: "position",
		input: "point",
		convertToInput: (value: PositionSource): Point | undefined => {
			return value.kind === "point" ? { x: value.x, y: value.y } : undefined;
		},
	},
	{
		output: "position",
		input: "text",
		convertToInput: (value: PositionSource): string | undefined => {
			return value.kind === "name" ? value.name : undefined;
		},
	},
	// #endregion
] as const satisfies T.EntryConvertor[];

export { positionConvertors };
