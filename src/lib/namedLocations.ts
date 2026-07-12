const DEFINED_KEY = "namedLocations:defined";
const REQUESTED_KEY = "namedLocations:requested";

interface ContextNode {
	getContext: <T>(key: string) => T | undefined;
	setContext: <T>(key: string, value: T) => T;
}

function getOrCreateSet(node: ContextNode, key: string): Set<string> {
	const existing = node.getContext<Set<string>>(key);
	if (existing)
		return existing;
	return node.setContext(key, new Set<string>());
}

/** Record a name defined by a Named Location node. */
export function defineNamedLocation(node: ContextNode, name: string): void {
	getOrCreateSet(node, DEFINED_KEY).add(name);
}

/** Record a named location a consuming node is asking Sequencer to use. */
export function requestNamedLocation(node: ContextNode, name: string): void {
	getOrCreateSet(node, REQUESTED_KEY).add(name);
}

/** Requested names that no Named Location node defined; empty when all resolve. */
export function unresolvedNamedLocations(node: ContextNode): string[] {
	const defined = node.getContext<Set<string>>(DEFINED_KEY) ?? new Set<string>();
	const requested = node.getContext<Set<string>>(REQUESTED_KEY) ?? new Set<string>();
	return [...requested].filter(name => !defined.has(name));
}
