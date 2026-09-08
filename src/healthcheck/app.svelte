<script lang="ts">
  	import { i18n } from "$lib/utils";

	function checkModules(mod: string | string[]): boolean | number {
		if (!Array.isArray(mod)) mod = [mod];
		for (const [i,m] of mod.entries()) {
			if (game.modules.get(m)?.active) return i + 1;
		}
		return false;
	}

	function checkTriggers(): string {
		const {enabled, disabled} = triggerAnimations.api.setting.get()

		return disabled.length === 0 ? i18n("healthcheck.all")
			: enabled.length === 0 ? i18n("healthcheck.none")
			: i18n("healthcheck.part", { in: enabled.length, max: enabled.length + disabled.length})
	}

	function getRequiredTriggers(): object {
		const result: Record<string, [number, number]> = {};
		const triggerSettings = game.settings.get("trigger-engine", "pf2e-trigger-triggers") as { enabled: string[] };
		triggerAnimations.api.requiredTriggerEngineTriggers.forEach(({id, src}) => {
			const isIn = (triggerSettings.enabled.find(x => x === id));
			result[src] ??= [0, 0];
			if (isIn) result[src][0]++;
			result[src][1]++;
		})
		return result;
	}

	let problems: string[] = $state([]);

	if (!game.settings.get("sequencer", "effectsEnabled")) problems.push(i18n("healthcheck.unique.seqVFX"))
	if (!game.settings.get("sequencer", "soundsEnabled")) problems.push(i18n("healthcheck.unique.seqSFX"))
	if (game.settings.get('tokenmagic', 'autoTemplateEnabled')) problems.push(i18n("healthcheck.unique.tokenMagic"))
</script>

<h3> Required Modules </h3>
<ul>
	<li class={[!checkModules("sequencer") && "error"]}>
		<b>Sequencer:</b> {checkModules("sequencer") ? i18n("healthcheck.active") : i18n("healthcheck.disabled")}
	</li>
	<li class={[!checkModules("trigger-engine") && "error"]}>
		<b>Trigger Engine:</b> {checkModules("trigger-engine") ? i18n("healthcheck.active") : i18n("healthcheck.disabled")}
	</li>
	<li class={[!checkModules(["jb2a_patreon", "JB2A_DnD5e"]) && "error"]}>
		<b>Jules & Ben Animated Assets:</b> {checkModules(["jb2a_patreon", "JB2A_DnD5e"]) ? i18n("healthcheck.active") : i18n("healthcheck.disabled")}
	</li>
</ul>

<h3> Often Wanted Modules </h3>
<ul>
	<li class={[!checkModules("pf2e-trigger-animations-trove") && "error"]}>
		<b>Trigger Animation Trove:</b> {checkModules("pf2e-trigger-animations-trove") ? i18n("healthcheck.active") : i18n("healthcheck.disabled")}
	</li>
	<li class={[!checkModules("ggg") && "error"]}>
		<b>GGG: Sequencer Sound DB Collection:</b> {checkModules("ggg") ? i18n("healthcheck.active") : i18n("healthcheck.disabled")}
	</li>
	<li class={[!checkModules("tokenmagic") && "error"]}>
		<b>Token Magic FX:</b> {checkModules("tokenmagic") ? i18n("healthcheck.active") : i18n("healthcheck.disabled")}
	</li>
</ul>

<h3> Post-Install </h3>
<ul>
	<svelte:boundary>
			<li>
				<b>Required <i>Trigger Engine</i> Triggers from...</b>
				{#each Object.entries(getRequiredTriggers()) as [key, count] (key)}
					<ul>
						<li><i>{game.modules.get(key)!.title}:</i>
						{count[0] === count[1]
							? i18n("healthcheck.all")
							: i18n("healthcheck.part", { in: count[0], max: count[1] })}
						</li>
					</ul>
				{/each}
			</li>
		<li>
			<b>Enabled <i>Trigger Animations</i> Triggers:</b> {checkTriggers()}
		</li>
		<li>
			<b>Settings:</b>
			<ul>
				{#each problems as problem}
					<li>{problem}</li>
				{:else}
					<li>{i18n("healthcheck.all")}</li>
				{/each}
			</ul>
		</li>

		{#snippet pending()}
			<p>loading...</p>
		{/snippet}
		{#snippet failed(error, reset)}
			<button onclick={reset}>oops... try again</button>
		{/snippet}
	</svelte:boundary>
</ul>

<style>
	h3 {
		margin: 0;
	}

	.error {
		background: rgba(116, 5, 5, 0.5)
	}
</style>