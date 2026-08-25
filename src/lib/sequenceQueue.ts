const QUEUE_KEY = "sequence:queue";

interface ContextNode {
	getContext: <T>(key: string) => T | undefined;
	setContext: <T>(key: string, value: T) => T;
}

/** Individual .effect(), .sound(), etc. */
interface QueueEntry {
	sequence: Sequence;
	state: "pending" | "aborted" | "appended";
}

interface SequenceQueue {
	entries: QueueEntry[];
	bySequence: WeakMap<Sequence, QueueEntry>;
	nextIndex: number;
}

function createQueue(): SequenceQueue {
	return {
		entries: [],
		bySequence: new WeakMap(),
		nextIndex: 0,
	};
}

function getOrCreateQueue(node: ContextNode): SequenceQueue {
	const existing = node.getContext<SequenceQueue>(QUEUE_KEY);
	if (existing)
		return existing;
	return node.setContext(QUEUE_KEY, createQueue());
}

/** Start a fresh ordered staging queue for one trigger execution. */
export function resetSequenceQueue(node: ContextNode): void {
	node.setContext(QUEUE_KEY, createQueue());
}

/** Create and enqueue a child Sequence whose sections are appended at Play time. */
export function createQueuedSequence(node: ContextNode): Sequence | undefined {
	if (!node.getContext<Sequence>("sequence"))
		return undefined;

	const sequence = new Sequence();
	const queue = getOrCreateQueue(node);
	const entry: QueueEntry = { sequence, state: "pending" };
	queue.entries.push(entry);
	queue.bySequence.set(sequence, entry);
	return sequence;
}

/** Mark the child Sequence containing this section as locally aborted. */
export function abortQueuedSection(node: ContextNode, section: Section<unknown>): boolean {
	const entry = getOrCreateQueue(node).bySequence.get(section.sequence);
	if (!entry || entry.state !== "pending")
		return false;
	entry.state = "aborted";
	return true;
}

/** Whether the child Sequence containing this section has already been aborted. */
export function isQueuedSectionAborted(node: ContextNode, section: Section<unknown>): boolean {
	return getOrCreateQueue(node).bySequence.get(section.sequence)?.state === "aborted";
}

/** Append all newly queued, non-aborted child Sequences in creation order. */
export function flushSequenceQueue(node: ContextNode, target: Sequence): void {
	const queue = getOrCreateQueue(node);
	for (; queue.nextIndex < queue.entries.length; queue.nextIndex++) {
		const entry = queue.entries[queue.nextIndex]!;
		if (entry.state !== "pending")
			continue;
		target.addSequence(entry.sequence);
		entry.state = "appended";
	}
}
