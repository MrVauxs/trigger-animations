// node_modules/sequencer/src/constants.js
// PLACEMENT_RESTRICTIONS — accepted by crosshair location().wallBehavior.
export const WALL_BEHAVIOR_OPTIONS = [
	{ value: "anywhere", label: "Anywhere" },
	{ value: "lineOfSight", label: "Line Of Sight" },
	{ value: "noCollidables", label: "No Collidables" },
];

// CONST.MEASURED_TEMPLATE_TYPES but as trigger engine options
export const TEMPLATE_TYPE_OPTIONS = Object.entries(CONST.MEASURED_TEMPLATE_TYPES).map(([key, value]) => ({
	value,
	label: key.charAt(0) + key.slice(1).toLowerCase(),
}));
