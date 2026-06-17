// Foundry audio output channels (music, interface, environment)
export function audioChannelOptions(): { value: string; label: string }[] {
	const channels = Object.entries(game.audio ?? {})
		.filter(([, ctx]) => ctx instanceof AudioContext)
		.map(([key]) => ({ value: key, label: key }));
	return [{ value: "", label: "Default" }, ...channels];
}
