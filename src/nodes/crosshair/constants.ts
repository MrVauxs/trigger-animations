// node_modules/sequencer/src/constants.js
// PLACEMENT_RESTRICTIONS — accepted by crosshair location().wallBehavior.
export const WALL_BEHAVIOR_OPTIONS = [
	{ value: "anywhere", label: "Anywhere" },
	{ value: "lineOfSight", label: "Line Of Sight" },
	{ value: "noCollidables", label: "No Collidables" },
];

// CONST.MEASURED_TEMPLATE_TYPES, which is a record where select fields need an array.
export const TEMPLATE_TYPE_OPTIONS = [
	{ value: "circle", label: "Circle" },
	{ value: "cone", label: "Cone" },
	{ value: "rect", label: "Rectangle" },
	{ value: "ray", label: "Ray" },
];
