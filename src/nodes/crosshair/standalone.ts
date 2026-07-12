import type { TriggerEngine as T } from "trigger-engine/types";
import { devGroup, devLog } from "$lib/utils";

const { TriggerNode } = globalThis.triggerEngine;

interface TInputs {
	type: string;
	distance: number;
	angle: number;
	direction: number;
	width: number;
	label: string;
	borderColor: string;
	fillColor: string;
	gridHighlight: boolean;
	lockDrag: boolean;
	timeout: number;
	config: string;
}
interface TOutputs {
	location?: { x: number; y: number };
	direction?: number;
	distance?: number;
}

/**
 * This is NOT a Sequence section
 */
class CrosshairPickNode extends TriggerNode<
	"placed" | "cancelled",
	TInputs,
	TOutputs
> {
	static TIMEOUT: number = 0;

	static override get type() {
		return "crosshair-pick";
	}

	static override get aliases(): string[] {
		return ["crosshair"];
	}

	static override get category() {
		return "action";
	}

	static override get defineOuts(): T.BridgeSchemaInput[] | null {
		return [{ key: "placed" }, { key: "cancelled" }];
	}

	static localize(str: string) {
		return `trigger-animations.anim-trigger.node.${this.category}.${this.type}.${str}`;
	}

	override get headerColor() {
		return "#b8860b";
	}

	override get isEmit() {
		return true;
	}

	override get icon() {
		// Uses Font Awesome Pro unicode, top right corner.
		return { unicode: "\uF05B" };
	}

	static override get defineInputs(): T.InputEntrySchemaSource[] | null {
		return [
			{
				key: "type",
				type: "text",
				label: this.localize("io.type.title"),
				tooltip: this.localize("io.type.tooltip"),
				field: { type: "select", default: "circle", options: CONST.MEASURED_TEMPLATE_TYPES },
			},
			{
				key: "distance",
				type: "number",
				label: this.localize("io.distance.title"),
				tooltip: this.localize("io.distance.tooltip"),
				field: { default: 0, min: 0 },
			},
			{
				key: "angle",
				type: "number",
				label: this.localize("io.angle.title"),
				tooltip: this.localize("io.angle.tooltip"),
				field: { default: 0 },
			},
			{
				key: "direction",
				type: "number",
				label: this.localize("io.direction.title"),
				tooltip: this.localize("io.direction.tooltip"),
				field: { default: 0 },
			},
			{
				key: "width",
				type: "number",
				label: this.localize("io.width.title"),
				tooltip: this.localize("io.width.tooltip"),
				field: { default: 0, min: 0 },
			},
			{
				key: "label",
				type: "text",
				label: this.localize("io.label.title"),
				tooltip: this.localize("io.label.tooltip"),
			},
			{
				key: "borderColor",
				type: "text",
				label: this.localize("io.borderColor.title"),
				tooltip: this.localize("io.borderColor.tooltip"),
			},
			{
				key: "fillColor",
				type: "text",
				label: this.localize("io.fillColor.title"),
				tooltip: this.localize("io.fillColor.tooltip"),
			},
			{
				key: "gridHighlight",
				type: "boolean",
				label: this.localize("io.gridHighlight.title"),
				tooltip: this.localize("io.gridHighlight.tooltip"),
				field: { default: true },
			},
			{
				key: "lockDrag",
				type: "boolean",
				label: this.localize("io.lockDrag.title"),
				tooltip: this.localize("io.lockDrag.tooltip"),
				field: { default: true },
			},
			{
				key: "timeout",
				type: "number",
				label: this.localize("io.timeout.title"),
				tooltip: this.localize("io.timeout.tooltip"),
				field: { default: this.TIMEOUT, min: 0 },
			},
			{
				key: "config",
				type: "text",
				label: this.localize("io.config.title"),
				tooltip: this.localize("io.config.tooltip"),
				field: { type: "json" },
			},
		];
	}

	static override get defineOutputs(): T.OutputEntrySchemaSource[] | null {
		return [
			{
				key: "location",
				type: "point",
				label: this.localize("io.location.title"),
				tooltip: this.localize("io.location.tooltip"),
			},
			{
				key: "direction",
				type: "number",
				label: this.localize("io.directionOut.title"),
				tooltip: this.localize("io.directionOut.tooltip"),
			},
			{
				key: "distance",
				type: "number",
				label: this.localize("io.distanceOut.title"),
				tooltip: this.localize("io.distanceOut.tooltip"),
			},
		];
	}

	override async _execute(...args: any[]): Promise<boolean> {
		const g = devGroup(`[Execute] ${this.type}`);

		const config: Record<string, unknown> = {
			// Crosshair.show() reads `t` (a MEASURED_TEMPLATE_TYPES value), not `type`.
			t: await this.getInputValue("type"),
			gridHighlight: await this.getInputValue("gridHighlight"),
			lockDrag: await this.getInputValue("lockDrag"),
		};

		const distance = await this.getInputValue("distance");
		if (distance > 0)
			config.distance = distance;
		const angle = await this.getInputValue("angle");
		if (angle !== 0)
			config.angle = angle;
		const direction = await this.getInputValue("direction");
		if (direction !== 0)
			config.direction = direction;
		const width = await this.getInputValue("width");
		if (width > 0)
			config.width = width;
		const borderColor = await this.getInputValue("borderColor");
		if (borderColor)
			config.borderColor = borderColor;
		const fillColor = await this.getInputValue("fillColor");
		if (fillColor)
			config.fillColor = fillColor;

		const label = await this.getInputValue("label");
		if (label)
			config.label = { text: label };

		// Deep-merge the JSON escape hatch for rare nested options.
		const raw = await this.getInputValue("config");
		if (raw?.trim()) {
			try {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === "object") {
					foundry.utils.mergeObject(config, parsed);
				}
			} catch (e) {
				devLog(`[${this.type}] invalid config JSON; ignoring`, e);
			}
		}

		const timeout = await this.getInputValue("timeout");

		let result: any = false;
		try {
			result = timeout > 0
				? await this.showWithTimeout(config, timeout)
				: await Sequencer.Crosshair.show(config);
		} catch (e) {
			devLog(`[${this.type}] crosshair show failed`, e);
			result = false;
		}

		g.log("crosshair result", { config, result });
		g.end();

		if (!result)
			return this.executeNext("cancelled");

		this.setOutputValue("location", { x: result.x, y: result.y });
		this.setOutputValue("direction", result.direction);
		this.setOutputValue("distance", result.distance);

		return this.executeNext("placed");
	}

	private async showWithTimeout(config: Record<string, unknown>, timeout: number): Promise<any> {
		const text = game.i18n.localize(CrosshairPickNode.localize("progress"));
		const progress = ui.notifications.info(text, { progress: true });
		const start = Date.now();
		const total = timeout * 1000;

		const interval = setInterval(() => {
			const remaining = Math.max(0, total - (Date.now() - start));
			progress.update({
				pct: 1 - remaining / total,
				message: `${text} (${Math.ceil(remaining / 1000)})`,
			});
		}, 250);

		let timer: ReturnType<typeof setTimeout> | undefined;
		const timeoutPromise = new Promise<false>((resolve) => {
			timer = setTimeout(resolve, total, false);
		});

		try {
			const result = await Promise.race([
				Sequencer.Crosshair.show(config),
				timeoutPromise,
			]);
			if (!result)
				this.dismissCrosshair();
			return result;
		} finally {
			clearInterval(interval);
			if (timer)
				clearTimeout(timer);
			progress.update({ pct: 1 });
			ui.notifications.remove(progress);
		}
	}

	// TODO: Ask Wasp to make Crosshairs dismissable
	private dismissCrosshair(): void {
		try {
			// @ts-expect-error Correct but missing unneeded props
			canvas?.stage?.emit("pointerup", { nativeEvent: { which: 3 } });
		} catch (e) {
			devLog(`[${this.type}] could not auto-dismiss crosshair`, e);
		}
	}
}

export { CrosshairPickNode };
