/**
 * Message list helper utilities — pure functions for computing display
 * properties for the MessageList component's threaded rendering mode.
 *
 * These functions have no side effects and no DB dependency,
 * making them straightforward to test and reuse.
 */

import type { Message } from '$lib/schemas/message';
import type { ThreadedMessage } from './messageThreading';

/**
 * A message enriched with display-related computed properties
 * for rendering in the MessageList component.
 */
export interface DisplayMessage {
	message: Message;
	indentLevel: number;
	isThreaded: boolean;
	conversationId: string | null;
	replyCount: number;
}

/**
 * Compute the visual indent level from a message's thread_depth.
 *
 * Returns 0 for top-level or invalid (negative) depths.
 */
export function computeIndentLevel(threadDepth: number): number {
	return Math.max(0, threadDepth);
}

/**
 * Determine whether a message should display thread UI elements.
 *
 * Returns true for any reply (depth > 0), false otherwise.
 */
export function shouldShowThread(threadDepth: number): boolean {
	return threadDepth > 0;
}

/**
 * Count all nested replies in a ThreadedMessage tree recursively.
 *
 * Walks the entire reply subtree and returns the total number of
 * descendant messages.
 */
export function getReplyCount(threadedMessage: ThreadedMessage): number {
	let count = 0;
	for (const reply of threadedMessage.replies) {
		count += 1 + getReplyCount(reply);
	}
	return count;
}

/**
 * Toggle the collapse state of a conversation thread.
 *
 * Returns a **new** Set — the original is never mutated.
 * If the conversationId is already in the set it is removed (expanded);
 * otherwise it is added (collapsed).
 */
export function toggleThreadCollapse(
	conversationId: string,
	collapsedThreads: Set<string>,
): Set<string> {
	const next = new Set(collapsedThreads);
	if (next.has(conversationId)) {
		next.delete(conversationId);
	} else {
		next.add(conversationId);
	}
	return next;
}

/**
 * Transform a flat Message[] into a DisplayMessage[] with computed
 * display properties for threaded or flat rendering.
 *
 * When `threaded` is false, all messages are rendered flat with
 * indentLevel=0 and isThreaded=false (backward-compatible mode).
 *
 * When `threaded` is true, each message's indentLevel comes from its
 * thread_depth, isThreaded reflects whether it belongs to a conversation,
 * and replyCount is the number of direct children.
 */
export function computeDisplayMessages(
	messages: Message[],
	threaded: boolean,
): DisplayMessage[] {
	if (messages.length === 0) return [];

	if (!threaded) {
		return messages.map((msg) => ({
			message: msg,
			indentLevel: 0,
			isThreaded: false,
			conversationId: msg.conversation_id ?? null,
			replyCount: 0,
		}));
	}

	// Build a map of parent_message_id → count of direct children
	const replyCountMap = new Map<number, number>();
	for (const msg of messages) {
		if (msg.parent_message_id != null) {
			const current = replyCountMap.get(msg.parent_message_id) ?? 0;
			replyCountMap.set(msg.parent_message_id, current + 1);
		}
	}

	return messages.map((msg) => ({
		message: msg,
		indentLevel: computeIndentLevel(msg.thread_depth),
		isThreaded: msg.conversation_id != null,
		conversationId: msg.conversation_id ?? null,
		replyCount: replyCountMap.get(msg.id) ?? 0,
	}));
}

/**
 * Find the parent message that a reply is responding to.
 *
 * Returns the parent Message if the given messageId belongs to a message
 * with a valid parent_message_id and that parent exists in the array.
 * Returns null for root messages, orphans, or unknown IDs.
 */
export function getReplyTarget(
	messageId: number,
	messages: Message[],
): Message | null {
	const message = messages.find((m) => m.id === messageId);
	if (!message || message.parent_message_id == null) {
		return null;
	}
	return messages.find((m) => m.id === message.parent_message_id) ?? null;
}
