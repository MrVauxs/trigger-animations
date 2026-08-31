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
	/** Appended after `entries`, for sections that must close out the Sequence. */
	tailEntries: QueueEntry[];
	bySequence: WeakMap<Sequence, QueueEntry>;
	nextIndex: number;
	nextTailIndex: number;
}

function createQueue(): SequenceQueue {
	return {
		entries: [],
		tailEntries: [],
		bySequence: new WeakMap(),
		nextIndex: 0,
		nextTailIndex: 0,
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
	return enqueue(node, "entries");
}

/**
 * Same as {@link createQueuedSequence}, but the sections land after every other
 * queued section, no matter when this is called.
 *
 * Use it for teardown that has to happen as part of the Sequence: `play()` can
 * resolve while sections are still running, and a persistent section parks the
 * Sequence until it is killed, so only a tail section is reliably "the end".
 */
export function createTailSequence(node: ContextNode): Sequence | undefined {
	return enqueue(node, "tailEntries");
}

function enqueue(node: ContextNode, list: "entries" | "tailEntries"): Sequence | undefined {
	if (!node.getContext<Sequence>("sequence"))
		return undefined;

	const sequence = new Sequence();
	const queue = getOrCreateQueue(node);
	const entry: QueueEntry = { sequence, state: "pending" };
	queue[list].push(entry);
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

/** Append all newly queued, non-aborted child Sequences in creation order, tail last. */
export function flushSequenceQueue(node: ContextNode, target: Sequence): void {
	const queue = getOrCreateQueue(node);
	for (; queue.nextIndex < queue.entries.length; queue.nextIndex++) {
		appendEntry(target, queue.entries[queue.nextIndex]!);
	}
	for (; queue.nextTailIndex < queue.tailEntries.length; queue.nextTailIndex++) {
		appendEntry(target, queue.tailEntries[queue.nextTailIndex]!);
	}
}

function appendEntry(target: Sequence, entry: QueueEntry): void {
	if (entry.state !== "pending")
		return;
	target.addSequence(entry.sequence);
	entry.state = "appended";
}
