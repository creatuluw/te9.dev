/**
 * Message helper utilities
 *
 * Pure utility functions for message comparison and deduplication.
 * Used by tests and services to detect duplicate messages.
 */

import type { Message } from "$lib/schemas/message";

/**
 * Check if two messages are duplicates based on sender, content, and timestamp.
 *
 * Two messages are considered duplicates if they share ALL of:
 * - sender_user_id (same sender)
 * - message_text (identical content)
 * - created_at (same creation timestamp)
 *
 * This is used to detect accidental duplicate submissions, NOT to prevent
 * concurrent independent messages. Two users mentioning the same target
 * will produce messages with different sender_user_ids, so they will NOT
 * be flagged as duplicates.
 *
 * @param a - First message to compare
 * @param b - Second message to compare
 * @returns true if messages are duplicates (same sender + content + timestamp)
 */
export function isDuplicateMessage(a: Message, b: Message): boolean {
  return (
    a.sender_user_id === b.sender_user_id &&
    a.message_text === b.message_text &&
    a.created_at === b.created_at
  );
}
