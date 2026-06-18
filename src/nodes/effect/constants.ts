// Shared select-field option lists for effect modifier nodes.
// Sequencer doesn't export these in a way that is statically available when
// defineInputs runs, so they are hardcoded against the pinned sequencer version.

// node_modules/sequencer/src/canvas-effects/ease.js (easeFunctions)
export const EASE_OPTIONS = [
	"linear",
	"easeInSine", "easeOutSine", "easeInOutSine",
	"easeInQuad", "easeOutQuad", "easeInOutQuad",
	"easeInCubic", "easeOutCubic", "easeInOutCubic",
	"easeInQuart", "easeOutQuart", "easeInOutQuart",
	"easeInQuint", "easeOutQuint", "easeInOutQuint",
	"easeInExpo", "easeOutExpo", "easeInOutExpo",
	"easeInCirc", "easeOutCirc", "easeInOutCirc",
	"easeInBack", "easeOutBack", "easeInOutBack",
	"easeInElastic", "easeOutElastic", "easeInOutElastic",
	"easeInBounce", "easeOutBounce", "easeInOutBounce",
];

// node_modules/sequencer/src/constants.js (BLEND_MODES); modes past "erase" are
// accepted by Sequencer but composite as "normal" under PIXI v7.
export const BLEND_MODE_OPTIONS = [
	"normal", "add", "multiply", "screen", "subtract", "erase",
	"overlay", "darken", "lighten", "color_dodge", "color_burn",
	"hard_light", "soft_light", "difference", "exclusion",
	"hue", "saturation", "color", "luminosity",
	"normal_npm", "add_npm", "screen_npm", "none",
];

// node_modules/sequencer/src/lib/filters.js
export const FILTER_OPTIONS = [
	{ value: "", label: "None" },
	"ColorMatrix", "Blur", "Noise", "Glow", "Clip",
];

// node_modules/sequencer/src/constants.js (SHAPES)
export const SHAPE_OPTIONS = ["circle", "rectangle", "polygon", "ellipse", "roundedRect"];

// node_modules/sequencer/src/lib/canvas-lib.js (alignments); used by .attachTo({ align }).
export const ALIGN_OPTIONS = [
	"center",
	"top-left", "top", "top-right",
	"left", "right",
	"bottom-left", "bottom", "bottom-right",
];

// node_modules/sequencer/src/sections/effect.js (.attachTo edge validation).
export const EDGE_OPTIONS = ["on", "inner", "outer"];
