import { moduleWarn } from "$lib/utils";

/**
 * Where a crosshair is anchored, kept JSON-safe so it can be sent to whoever places it.
 *
 * The placing client uses the placeable behind `uuid` when it has it on its canvas, and falls
 * back to `x`/`y`. `name` is a Sequencer named location, swapped for where it is when the
 * request gets built.
 */
export interface CrosshairLocationRef {
	uuid?: string;
	x?: number;
	y?: number;
	name?: string;
}

/** Options for {@link CrosshairBuilder#location}, as Sequencer's crosshair `location()` takes them. */
export interface CrosshairLocationOptions {
	limitMinRange?: number;
	limitMaxRange?: number;
	showRange?: boolean;
	lockToEdge?: boolean;
	lockToEdgeDirection?: boolean;
	offset?: { x: number; y: number };
	wallBehavior?: string;
}

/** What gets sent to the placing client. */
export interface CrosshairRequest {
	/** A `Sequencer.Crosshair.show()` config, with `location.obj` as a {@link CrosshairLocationRef}. */
	config: Record<string, any>;
	/** Seconds before the placing client gives up; 0 waits for as long as it takes. */
	timeout: number;
	/** Whether to create a measured template matching the placed crosshair. */
	persist?: boolean;
}

/**
 * Collects the settings of a Crosshair node and its modifier nodes.
 *
 * The methods are named after Sequencer's CrosshairSection, but everything is kept as plain
 * data since the crosshair is shown on another client.
 */
export class CrosshairBuilder {
	config: Record<string, any> = {};
	persistTemplate = false;
	/** Set once the crosshair is shown. Anything changed afterwards would be lost. */
	sealed = false;

	type(type: string): this {
		this.config.t = type;
		return this;
	}

	distance(distance: number, { min, max }: { min?: number; max?: number } = {}): this {
		this.config.distance = distance;
		if (min !== undefined)
			this.config.distanceMin = min;
		if (max !== undefined)
			this.config.distanceMax = max;
		return this;
	}

	angle(angle: number): this {
		this.config.angle = angle;
		return this;
	}

	direction(direction: number): this {
		this.config.direction = direction;
		return this;
	}

	width(width: number): this {
		this.config.width = width;
		return this;
	}

	snapPosition(mode: number): this {
		this.config.snap = { ...this.config.snap, position: mode };
		return this;
	}

	snapDirection(degrees: number): this {
		this.config.snap = { ...this.config.snap, direction: degrees };
		return this;
	}

	label(text: string, { dx = 0, dy = 0 }: { dx?: number; dy?: number } = {}): this {
		this.config.label = { text, dx, dy };
		return this;
	}

	icon(texture: string, { borderVisible = false }: { borderVisible?: boolean } = {}): this {
		this.config.icon = { texture, borderVisible };
		return this;
	}

	borderColor(color: string, { alpha }: { alpha?: number } = {}): this {
		const css = validColor(color, "borderColor");
		if (css)
			this.config.borderColor = css;
		if (alpha !== undefined)
			this.config.borderAlpha = alpha;
		return this;
	}

	fillColor(color: string, { alpha }: { alpha?: number } = {}): this {
		const css = validColor(color, "fillColor");
		if (css)
			this.config.fillColor = css;
		if (alpha !== undefined)
			this.config.fillAlpha = alpha;
		return this;
	}

	texture(texture: string, { alpha, scale }: { alpha?: number; scale?: number } = {}): this {
		this.config.texture = texture;
		if (alpha !== undefined)
			this.config.textureAlpha = alpha;
		if (scale !== undefined)
			this.config.textureScale = scale;
		return this;
	}

	location(obj: CrosshairLocationRef, options: CrosshairLocationOptions = {}): this {
		this.config.location = { ...options, obj };
		return this;
	}

	lockDrag(lock = true): this {
		this.config.lockDrag = lock;
		return this;
	}

	lockManualRotation(lock = true): this {
		this.config.lockManualRotation = lock;
		return this;
	}

	gridHighlight(highlight = true): this {
		this.config.gridHighlight = highlight;
		return this;
	}

	persist(persist = true): this {
		this.persistTemplate = persist;
		return this;
	}

	/** A JSON-safe request, with a named anchor swapped for where that location is now. */
	toRequest(sequence: Sequence | undefined, timeout: number): CrosshairRequest {
		const config = foundry.utils.deepClone(this.config);
		const name = (config.location?.obj as CrosshairLocationRef | undefined)?.name;
		if (name) {
			const ref = namedLocationRef(sequence, name);
			if (ref) {
				config.location.obj = ref;
			} else {
				moduleWarn(`[crosshair] named location "${name}" is not known yet; showing the crosshair without an anchor`);
				delete config.location;
			}
		}
		return { config, timeout, persist: this.persistTemplate };
	}
}

/** A {@link CrosshairLocationRef} for a document, placeable or point. */
export function toLocationRef(value: unknown): CrosshairLocationRef | undefined {
	if (!value || typeof value !== "object")
		return undefined;

	const object = value as { uuid?: unknown; document?: { uuid?: unknown }; x?: unknown; y?: unknown };
	const uuid = typeof object.uuid === "string"
		? object.uuid
		: typeof object.document?.uuid === "string" ? object.document.uuid : undefined;
	const center = centerOf(value);
	const x = center?.x ?? object.x;
	const y = center?.y ?? object.y;
	const ref: CrosshairLocationRef = {};
	if (uuid)
		ref.uuid = uuid;
	if (typeof x === "number" && typeof y === "number") {
		ref.x = x;
		ref.y = y;
	}
	return ref.uuid || ref.x !== undefined ? ref : undefined;
}

function centerOf(value: object): Point | undefined {
	const placeable = value instanceof foundry.abstract.Document
		? (value as { object?: { center?: Point } | null }).object
		: value as { center?: Point };
	if (placeable?.center)
		return { x: placeable.center.x, y: placeable.center.y };

	// A token on a scene this client is not viewing has no placeable to ask.
	if (value instanceof TokenDocument) {
		const size = value.parent?.grid.size ?? 0;
		return { x: value.x + (value.width * size) / 2, y: value.y + (value.height * size) / 2 };
	}
}

function namedLocationRef(sequence: Sequence | undefined, name: string): CrosshairLocationRef | undefined {
	const offsets = (sequence as { nameOffsetMap?: Record<string, { source?: unknown }> | false } | undefined)?.nameOffsetMap;
	const source = offsets ? offsets[name]?.source : undefined;
	if (typeof source === "string")
		return toLocationRef(fromUuidSync(source)) ?? { uuid: source };
	return toLocationRef(source);
}

function validColor(color: string, input: string): string | undefined {
	const parsed = foundry.utils.Color.fromString(color);
	if (parsed.valid)
		return parsed.css;
	moduleWarn(`[crosshair] ${input} "${color}" is not a valid color; using the default`);
}
