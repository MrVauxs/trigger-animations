<script lang="ts">
	function checkModules(mod: string | string[]): boolean | number {
		if (!Array.isArray(mod)) mod = [mod];
		for (const [i,m] of mod.entries()) {
			if (game.modules.get(m)?.active) return i + 1;
		}
		return false;
	}

	function checkTriggers(): string {
		const {enabled, disabled} = triggerAnimations.api.setting.get()

		return disabled.length === 0 ? "All are enabled." : enabled.length === 0 ? "None are enabled!" : `${enabled.length}/${enabled.length + disabled.length} are enabled.`
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
</script>

<h3> Required Modules </h3>
<ul>
	<li class={[!checkModules("sequencer") && "error"]}>
		Sequencer: {checkModules("sequencer") ? "Active" : "Missing!"}
	</li>
	<li class={[!checkModules("trigger-engine") && "error"]}>
		Trigger Engine: {checkModules("trigger-engine") ? "Active" : "Missing!"}
	</li>
	<li class={[!checkModules(["jb2a_patreon", "JB2A_DnD5e"]) && "error"]}>
		JB2A: {checkModules("jb2a_patreon") ? "JB2A (Patreon) is active" :
		checkModules("JB2A_DnD5e") ? "JB2A (Free) is active, some animations may not play"
		: "Missing!"}
	</li>
</ul>

<h3> Often Wanted Modules </h3>
<ul>
	<li class={[!checkModules("pf2e-trigger-animations-trove") && "error"]}>
		Trigger Animation Trove: {checkModules("pf2e-trigger-animations-trove") ? "Active" : "Missing"}
	</li>
	<li class={[!checkModules("ggg") && "error"]}>
		GGG: Sequencer Sound DB Collection: {checkModules("ggg") ? "Active" : "Missing"}
	</li>
</ul>

<h3> Post-Install </h3>
<ul>
	<svelte:boundary>
			<li>
				Required <i>Trigger Engine</i> Triggers from...
				{#each Object.entries(getRequiredTriggers()) as [key, entry] (key)}
					<ul>
						<li><i>{game.modules.get(key)!.title}:</i> {entry[0] === entry[1] ? "All" : `${entry[0]} out of ${entry[1]}`} triggers are enabled!</li>
					</ul>
				{/each}
			</li>
		<li>
			Enabled <i>Trigger Animations</i> Triggers: {checkTriggers()}
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