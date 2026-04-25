/**
 * useReplyState composable — Reply-to state management for MessageInput
 *
 * Provides a plain TypeScript composable for managing reply state
 * in the MessageInput component. Uses closure-based state for
 * testability without requiring Svelte's reactivity system.
 *
 * Usage:
 * ```typescript
 * const replyState = createReplyState();
 * replyState.setReplyTo(42);
 * const threadContext = await replyState.getThreadContext('/source');
 * replyState.clearReply();
 * ```
 */

import type { ThreadContext } from '$lib/services/messageThreadService';
import { resolveThreadContext } from '$lib/services/messageThreadService';

/**
 * ReplyState interface for managing reply-to state in message input.
 *
 * Properties:
 * - `replyToId` — The ID of the message being replied to, or null
 * - `isReplying` — Whether a reply target is currently set
 * - `setReplyTo(messageId)` — Set the reply target
 * - `clearReply()` — Clear the reply target
 * - `getThreadContext(source)` — Resolve thread context for the current reply
 */
export interface ReplyState {
	readonly replyToId: number | null;
	readonly isReplying: boolean;
	setReplyTo: (messageId: number) => void;
	clearReply: () => void;
	getThreadContext: (source: string) => Promise<ThreadContext | null>;
}

/**
 * Create a new ReplyState instance for managing reply-to state.
 *
 * Each call creates an independent state instance, so multiple
 * MessageInput components can maintain separate reply states.
 *
 * @returns A ReplyState object with reactive-like getters and methods
 */
export function createReplyState(): ReplyState {
	let _replyToId: number | null = null;

	return {
		get replyToId(): number | null {
			return _replyToId;
		},

		get isReplying(): boolean {
			return _replyToId !== null;
		},

		setReplyTo(messageId: number): void {
			_replyToId = messageId;
		},

		clearReply(): void {
			_replyToId = null;
		},

		async getThreadContext(source: string): Promise<ThreadContext | null> {
			if (_replyToId === null) {
				return null;
			}

			const result = await resolveThreadContext(source, _replyToId);

			if (result.success) {
				return result.value;
			}

			// Graceful fallback: return null if thread resolution fails
			// The caller (MessageInput) can still send the message without
			// thread context — it will be treated as a new top-level message
			return null;
		},
	};
}
