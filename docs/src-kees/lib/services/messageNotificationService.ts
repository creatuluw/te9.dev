/**
 * Message Notification Service (core-002)
 *
 * Extracts notification creation logic from messageService into a dedicated service.
 * Handles:
 * - In-app notification creation (inserts into _bpm_messages)
 * - Email notification queueing (inserts into _bpm_email_queue)
 *
 * EC-2: Email failures do NOT affect in-app delivery.
 * EC-6: Email notifications include attachment links (not embedded files).
 *       SSE push events include attachment metadata.
 */

import type { Message, EntityReference } from "$lib/schemas/message";
import type { AppError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { insertRowResult } from "$lib/utils/postgrest";
import {
  formatEmailAttachments,
  formatSSEAttachments,
  type SSEAttachment,
} from "$lib/utils/attachmentHelpers";
import * as emailQueueService from "./emailQueueService";
import { sseConnectionManager } from "./sseConnectionManager";

/**
 * Sender information for notifications
 */
export interface SenderInfo {
  userId: string;
  email: string;
}

/**
 * Recipient information for notifications
 */
export interface RecipientInfo {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Input for creating an in-app notification
 */
export interface NotificationMessageInput {
  chatMessage: Message;
  recipient: RecipientInfo;
  sender: SenderInfo;
  messageText: string;
  source: string;
  references: EntityReference[];
  attachments: string[];
}

/**
 * SSE notification payload for real-time push events.
 * Includes attachment metadata per EC-6.
 */
export interface SSENotificationPayload {
  messageId: number;
  type: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderUserId: string;
  attachments: SSEAttachment[];
  createdAt: string;
}

/**
 * Create an in-app notification message for a recipient.
 * Inserts a notification record into _bpm_messages.
 *
 * The notification inherits threading context from the chat message
 * so it appears as a child in the conversation thread.
 *
 * @param input - Notification creation input
 * @returns Result containing the created Message or an AppError
 */
export async function createInAppNotification(
  input: NotificationMessageInput,
): Promise<Result<Message, AppError>> {
  const {
    chatMessage,
    recipient,
    sender,
    messageText,
    source,
    references,
    attachments,
  } = input;

  // Build link to source with message anchor
  const linkUrl = chatMessage.id
    ? `${source}#message-${chatMessage.id}`
    : source;

  // Format body with source link footnote
  let body = messageText;
  const baseUrl =
    import.meta.env.PUBLIC_APP_URL || import.meta.env.PUBLIC_ORIGIN || "";
  if (baseUrl && source) {
    const fullLinkUrl = `${baseUrl}${linkUrl}`;
    body += `\n\n---\nVerzonden vanaf ${source}\n${fullLinkUrl}`;
  }

  // Compute thread path: append chatMessage.id to parent's thread_path
  const threadPath = chatMessage.thread_path
    ? `${chatMessage.thread_path}${chatMessage.id}/`
    : `/${chatMessage.id}/`;

  const result = await insertRowResult<Message>("_bpm_messages", {
    type: "notification",
    msg_type: "in-app",
    recipient_email: recipient.email,
    recipient_user_id: recipient.userId,
    subject: "Je bent genoemd",
    body,
    message_text: messageText,
    status: "sent",
    in_app_read: false,
    source,
    attachments,
    references,
    sender_user_id: sender.userId,
    sender_email: sender.email,
    // Inherit conversation context from chat message for threading
    conversation_id: chatMessage.conversation_id || null,
    parent_message_id: chatMessage.id,
    thread_depth: (chatMessage.thread_depth || 0) + 1,
    thread_path: threadPath,
    // Delivery tracking
    delivery_status: "pending",
    delivery_attempts: 0,
    created_at: new Date().toISOString(),
  });

  // Push SSE events to recipient for real-time badge/message update
  // Best-effort: failures are logged but never block the notification
  if (result.success) {
    try {
      const notification = result.value;

      // Push message.new event so connected clients receive the new message
      sseConnectionManager.pushEvent(recipient.userId, "message.new", {
        messageId: notification.id,
        type: notification.type,
        subject: notification.subject,
        body: notification.body || notification.message_text,
        senderEmail: sender.email,
        senderUserId: sender.userId,
        attachments: formatSSEAttachments(attachments),
        createdAt: notification.created_at,
      });

      // Push badge.update event so header unread count updates immediately
      // We increment by 1 since we just created one new unread notification
      sseConnectionManager.pushEvent(recipient.userId, "badge.update", {
        unreadCount: 1,
        action: "increment",
      });
    } catch (sseError) {
      // Best-effort: log but never fail the notification creation
      console.error(
        "[messageNotificationService] SSE push failed (non-blocking):",
        sseError,
      );
    }
  }

  return result;
}

/**
 * Queue an email notification for a recipient.
 * Delegates to emailQueueService.enqueue() which inserts into _bpm_email_queue.
 * Email processing happens asynchronously via processQueue().
 *
 * EC-2: Email failures do NOT affect in-app notifications.
 * This function catches all exceptions and returns ok({ queued: false }) instead of throwing.
 *
 * @param messageId - ID of the message to send email for
 * @param recipient - Recipient information
 * @returns Result containing { queued: boolean } — always ok, never err (EC-2)
 */
export async function queueEmailNotification(
  messageId: number,
  recipient: RecipientInfo,
): Promise<Result<{ queued: boolean }, AppError>> {
  try {
    const result = await emailQueueService.enqueue(messageId, {
      to: recipient.email,
      subject: "Je bent genoemd",
      messageId,
    });

    if (result.success) {
      return ok({ queued: true });
    }
    // EC-2: Email queue failure logged but doesn't throw
    console.error(
      "[messageNotificationService] Failed to queue email:",
      result.error,
    );
    return ok({ queued: false });
  } catch (error) {
    console.error(
      "[messageNotificationService] Exception queueing email:",
      error,
    );
    return ok({ queued: false }); // EC-2: Never fail
  }
}

// ---------------------------------------------------------------------------
// Attachment formatting helpers (EC-6)
// ---------------------------------------------------------------------------

/**
 * Build an HTML email body that includes attachment links.
 *
 * EC-6: Email notifications include links to attachments, not embedded files.
 * Appends an attachments section with clickable links after the message body.
 *
 * @param body - The main email body HTML
 * @param attachments - Array of attachment URL strings
 * @returns HTML string with attachment links appended (or original body if no attachments)
 */
export function buildEmailWithAttachments(
  body: string,
  attachments: string[],
): string {
  const attachmentHtml = formatEmailAttachments(attachments);
  if (!attachmentHtml) {
    return body;
  }

  return `${body}<hr><h3>Bijlagen</h3>${attachmentHtml}`;
}

/**
 * Build an SSE notification payload with formatted attachment metadata.
 *
 * EC-6: SSE push events include attachment metadata (url, filename, isImage).
 *
 * @param message - The source message
 * @param attachments - Array of attachment URL strings
 * @returns SSENotificationPayload with formatted attachments
 */
export function buildSSENotificationPayload(
  message: Message,
  attachments: string[],
): SSENotificationPayload {
  return {
    messageId: message.id,
    type: message.type,
    subject: message.subject || "",
    body: message.body || message.message_text || "",
    senderEmail: message.sender_email || "",
    senderUserId: message.sender_user_id || "",
    attachments: formatSSEAttachments(attachments),
    createdAt: message.created_at || new Date().toISOString(),
  };
}

// Re-export processQueue for SSE heartbeat to trigger email delivery
export { processQueue } from "./emailQueueService";
