import * as dv from "devalue";

const types = {
	Document: [
		(d: any) => d instanceof foundry.abstract.Document && d.uuid,
		(d: string) => fromUuidSync(d),
	],
} as const;

// Takes first and second func
const stringifyTypes = Object.fromEntries(Object.entries(types).map(([k, f]) => [k, f[0]]));
const parseTypes = Object.fromEntries(Object.entries(types).map(([k, f]) => [k, f[1]]));

/**
 * Note: uses fromUuidSync so docs from compendiums will not be fetched fully
 */
export function stringify(data: any) {
	return dv.stringify(data, stringifyTypes);
}

/**
 * Note: uses fromUuidSync so docs from compendiums will not be fetched fully
 */
export function stringifyAsync(data: any) {
	return dv.stringifyAsync(data, stringifyTypes);
}

/**
 * Note: uses fromUuidSync so docs from compendiums will not be fetched fully
 */
export function parse(data: any) {
	return dv.parse(data, parseTypes);
}
