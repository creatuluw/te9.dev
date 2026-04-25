/**
 * Message Thread Service — Conversation context resolution
 *
 * Provides functions for resolving thread context when creating new messages.
 * Uses a materialized path pattern for efficient tree queries.
 *
 * Thread schema:
 * - conversation_id (UUID) — groups messages into a conversation
 * - parent_message_id (INTEGER FK) — references parent message (ON DELETE SET NULL)
 * - thread_depth (INTEGER default 0) — nesting level
 * - thread_path (TEXT default '') — materialized path like /1/5/23/
 */

import type { Message } from "$lib/schemas/message";
import type { AppError } from "$lib/types/errors";
import { ok, type Result } from "$lib/types/result";
import { getRowById, queryTableResult, filter } from "$lib/utils/postgrest";
import {
  groupMessagesByConversation,
  type ThreadedConversation,
} from "$lib/utils/messageThreading";

/**
 * Maximum allowed thread nesting depth.
 * Prevents infinite nesting in deeply threaded conversations.
 */
const MAX_THREAD_DEPTH = 10;

/**
 * Thread context resolved for a new message.
 * Contains all threading fields needed to insert a message into a conversation.
 */
export interface ThreadContext {
  conversation_id: string;
  parent_message_id: number | null;
  thread_depth: number;
  thread_path: string;
}

/**
 * Generate a thread path for a child message.
 * Pure function — no side effects, easy to test.
 *
 * @param parentPath - The parent message's thread_path (e.g., '/1/5/')
 * @param parentId - The parent message's ID
 * @returns The child's thread path (e.g., '/1/5/23/')
 *
 * @example
 * generateThreadPath('', 1)        // => '1/'
 * generateThreadPath('/1/', 5)     // => '/1/5/'
 * generateThreadPath('/1/5/23/', 42) // => '/1/5/23/42/'
 */
export function generateThreadPath(
  parentPath: string,
  parentId: number,
): string {
  return `${parentPath}${parentId}/`;
}

/**
 * Generate a new unique conversation_id.
 * Uses crypto.randomUUID() available in modern browsers and Node.js 19+.
 *
 * @returns A new UUID string
 */
export function generateConversationId(): string {
  return crypto.randomUUID();
}

/**
 * Resolve thread context for a new message.
 * Determines conversation_id, thread_depth, and thread_path based on whether
 * the message is a reply to an existing message or a new top-level message.
 *
 * **Graceful fallback (EC-4)**: If the parent message is deleted or not found,
 * the function falls back to creating a new top-level conversation instead of
 * failing. This matches the database's ON DELETE SET NULL behavior on the
 * parent_message_id foreign key.
 *
 * @param source - Source URL where the message is being created from
 * @param parentMessageId - Optional parent message ID for threaded replies
 * @returns Result with ThreadContext (always Ok — errors are handled gracefully)
 */
export async function resolveThreadContext(
  source: string,
  parentMessageId?: number | null,
): Promise<Result<ThreadContext, AppError>> {
  try {
    // No parent — start a new conversation
    if (!parentMessageId) {
      return ok({
        conversation_id: generateConversationId(),
        parent_message_id: null,
        thread_depth: 0,
        thread_path: "",
      });
    }

    // Fetch parent message to inherit context
    // getRowById returns T | null (not a Result)
    const parent = await getRowById<Message>("_bpm_messages", parentMessageId);

    if (!parent) {
      // EC-4: Parent deleted or not found — treat as top-level message
      // SET NULL semantics: parent_message_id becomes null
      return ok({
        conversation_id: generateConversationId(),
        parent_message_id: null,
        thread_depth: 0,
        thread_path: "",
      });
    }

    // Inherit conversation_id from parent (or generate if parent doesn't have one)
    const conversationId = parent.conversation_id || generateConversationId();

    // Compute thread_path from parent using materialized path pattern
    const threadPath = generateThreadPath(parent.thread_path || "", parent.id);

    // Compute thread_depth, capped at MAX_THREAD_DEPTH
    const parentDepth = parent.thread_depth || 0;
    const threadDepth = Math.min(parentDepth + 1, MAX_THREAD_DEPTH);

    return ok({
      conversation_id: conversationId,
      parent_message_id: parentMessageId,
      thread_depth: threadDepth,
      thread_path: threadPath,
    });
  } catch (error) {
    // Graceful fallback — start new conversation on any unexpected error
    // This ensures the message can still be sent even if parent lookup fails
    return ok({
      conversation_id: generateConversationId(),
      parent_message_id: null,
      thread_depth: 0,
      thread_path: "",
    });
  }
}

/**
 * Fetch messages for an entity and return them grouped into threaded conversations.
 *
 * Queries the _bpm_messages table ordered by conversation_id and thread_path,
 * then groups the flat results into a ThreadedConversation[] structure using
 * the pure `groupMessagesByConversation` utility.
 *
 * @param entityType - The entity type (e.g., 'project', 'case', 'task')
 * @param entityId - The entity ID
 * @returns Grouped conversations, newest first
 */
export async function getMessagesThreaded(
  entityType: string,
  entityId: number,
): Promise<ThreadedConversation[]> {
  const result = await queryTableResult<Message>("_bpm_messages", {
    filter: filter().eq("type", entityType).eq("entity_id", entityId).build(),
    order: "conversation_id.asc,thread_path.asc,created_at.desc",
  });

  if (!result.success) {
    return [];
  }

  return groupMessagesByConversation(result.value.data);
}
