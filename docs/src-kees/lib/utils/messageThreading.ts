/**
 * Message threading utilities — pure functions for grouping messages
 * into threaded conversation structures.
 *
 * These functions have no side effects and no DB dependency,
 * making them straightforward to test and reuse.
 */

import type { Message } from '$lib/schemas/message';

/**
 * A single message node in a threaded tree.
 */
export interface ThreadedMessage {
	message: Message;
	replies: ThreadedMessage[];
}

/**
 * A conversation group: messages sharing the same conversation_id
 * organised into a tree, or a single legacy message (conversation_id === null).
 */
export interface ThreadedConversation {
	conversation_id: string | null;
	messages: ThreadedMessage[];
}

/**
 * Group messages into threaded conversations.
 *
 * Pure function — no side effects.
 *
 * 1. Messages with a `conversation_id` are grouped together.
 * 2. Within each group a tree is built using `parent_message_id`.
 * 3. Messages without a `conversation_id` (legacy) appear as individual
 *    flat conversations with `conversation_id: null`.
 * 4. Conversations are sorted newest-first by their most recent message.
 */
export function groupMessagesByConversation(
	messages: Message[],
): ThreadedConversation[] {
	if (messages.length === 0) return [];

	// -----------------------------------------------------------
	// 1. Bucket by conversation_id
	// -----------------------------------------------------------
	const groups = new Map<string, Message[]>();
	const ungrouped: Message[] = [];

	for (const msg of messages) {
		if (msg.conversation_id) {
			if (!groups.has(msg.conversation_id)) {
				groups.set(msg.conversation_id, []);
			}
			groups.get(msg.conversation_id)!.push(msg);
		} else {
			ungrouped.push(msg);
		}
	}

	// -----------------------------------------------------------
	// 2. Build thread trees per group
	// -----------------------------------------------------------
	const result: ThreadedConversation[] = [];

	for (const [conversationId, msgs] of groups) {
		const threaded = buildThreadTree(msgs);
		result.push({ conversation_id: conversationId, messages: threaded });
	}

	// -----------------------------------------------------------
	// 3. Legacy messages — each becomes a singleton conversation
	// -----------------------------------------------------------
	for (const msg of ungrouped) {
		result.push({
			conversation_id: null,
			messages: [{ message: msg, replies: [] }],
		});
	}

	// -----------------------------------------------------------
	// 4. Sort conversations by most recent message (newest first)
	// -----------------------------------------------------------
	result.sort((a, b) => {
		const aLatest = getLatestTimestamp(a.messages);
		const bLatest = getLatestTimestamp(b.messages);
		return bLatest.localeCompare(aLatest);
	});

	return result;
}

// -----------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------

/**
 * Build a tree of ThreadedMessage from a flat list within a single
 * conversation group.
 */
function buildThreadTree(messages: Message[]): ThreadedMessage[] {
	// Sort so that lower depth comes first, then by thread_path,
	// then by created_at (newest first) within the same depth.
	const sorted = [...messages].sort((a, b) => {
		if (a.thread_depth !== b.thread_depth) {
			return a.thread_depth - b.thread_depth;
		}
		const pathCompare = (a.thread_path || '').localeCompare(
			b.thread_path || '',
		);
		if (pathCompare !== 0) return pathCompare;
		return b.created_at.localeCompare(a.created_at);
	});

	const map = new Map<number, ThreadedMessage>();
	const roots: ThreadedMessage[] = [];

	for (const msg of sorted) {
		const node: ThreadedMessage = { message: msg, replies: [] };
		map.set(msg.id, node);

		if (msg.parent_message_id && map.has(msg.parent_message_id)) {
			map.get(msg.parent_message_id)!.replies.push(node);
		} else {
			// Top-level or orphan reply → treat as root
			roots.push(node);
		}
	}

	return roots;
}

/**
 * Walk a ThreadedMessage tree and return the latest created_at timestamp.
 */
function getLatestTimestamp(messages: ThreadedMessage[]): string {
	if (messages.length === 0) return '';
	let latest = messages[0]?.message.created_at || '';
	for (const m of messages) {
		if (m.message.created_at > latest) latest = m.message.created_at;
		const childLatest = getLatestTimestamp(m.replies);
		if (childLatest > latest) latest = childLatest;
	}
	return latest;
}

/**
 * Flatten threaded conversations back to a flat Message array.
 *
 * This provides backward compatibility for existing consumers that
 * expect a plain list of messages. Traversal is depth-first so the
 * original insertion order within each thread is preserved.
 */
export function flattenThreaded(
	conversations: ThreadedConversation[],
): Message[] {
	const result: Message[] = [];
	for (const conv of conversations) {
		flattenMessages(conv.messages, result);
	}
	return result;
}

function flattenMessages(
	threaded: ThreadedMessage[],
	result: Message[],
): void {
	for (const t of threaded) {
		result.push(t.message);
		flattenMessages(t.replies, result);
	}
}
