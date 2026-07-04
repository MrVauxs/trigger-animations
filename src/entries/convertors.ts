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
		// An item resolves to its owner (`item.parent`), mirroring the built-in
		// item -> target convertor which pulls the item's actor.
		output: "item",
		input: "position",
		convertToInput: (value: Item): PositionSource | undefined => {
			const actor = value.parent;
			return actor ? { kind: "target", actor: actor as ActorPF2e } : undefined;
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
	// #endregion
] as const satisfies T.EntryConvertor[];

export { positionConvertors };
