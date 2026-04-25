/**
 * Message service - Email and in-app messages
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
} from "$lib/utils/postgrest";
import * as emailService from "./emailService";
import * as eventLogService from "./eventLogService";
import { generatePlainText } from "$lib/utils/emailTemplateUtils";
import type { AppError } from "$lib/types/errors";
import { ValidationError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  CreateMessageInputSchema,
  EmailMessageInputSchema,
  CreateMessageWithMentionsInputSchema,
  type Message,
  type CreateMessageInput,
  type EmailMessageInput,
  type CreateMessageWithMentionsInput,
  type EntityReference,
} from "$lib/schemas/message";
import type { UserId } from "$lib/types/utilities";
import { parseMentions, resolveMentions } from "$lib/utils/mentionParser";
import { searchEntities } from "$lib/utils/entitySearch";
import * as userPreferencesService from "./userPreferencesService";
import * as pocketbaseService from "./pocketbaseService";
import { getCurrentUserId, getCurrentUserEmail } from "$lib/utils/userUtils";
import type { PocketBaseUser } from "$lib/schemas/user";
import {
  resolveThreadContext,
  generateConversationId,
} from "./messageThreadService";
import { parseAndResolveMentions } from "./messageParser";
import {
  createInAppNotification,
  queueEmailNotification as queueEmailNotificationService,
} from "./messageNotificationService";
import {
  isHelpPageUser,
  shouldSkipNotifications,
  shouldSkipMentionResolution,
} from "$lib/utils/helpPageHelpers";
import { dispatchSubscriptionNotifications } from "./messageSubscriptionService";

/**
 * Send a message (creates message record only, no email sent)
 *
 * @param data - Message creation data
 * @returns Result containing created message, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await sendMessage({
 *   type: 'task_assigned',
 *   recipient_email: 'user@example.com',
 *   subject: 'New Task',
 *   body: 'You have been assigned a new task'
 * });
 * if (result.success) {
 *   console.log(result.value); // Message
 * }
 * ```
 */
export async function sendMessage(
  data: CreateMessageInput,
): Promise<Result<Message, AppError>> {
  // Validate input
  const validation = validateSchema(CreateMessageInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Create message record
  const result = await insertRowResult<Message>("_bpm_messages", {
    ...data,
    msg_type: data.msg_type || "notification",
    message_text: data.message_text || data.body, // Use message_text if provided, otherwise use body
    status: "pending",
    in_app_read: false,
    created_at: new Date().toISOString(),
  });

  // Log message creation event
  if (result.success) {
    await eventLogService
      .logEvent("message_created", "message", result.value.id, {
        newValues: { type: data.type, recipient: data.recipient_email },
      })
      .catch(console.error);
  }

  return result;
}

/**
 * Send email message (creates message record AND sends email immediately)
 *
 * @param data - Email message data with HTML content
 * @returns Result containing message and email result, or error if operation fails
 *
 * @example
 * ```typescript
 * const result = await sendEmailMessage({
 *   type: 'task_activated',
 *   recipient_email: 'user@example.com',
 *   subject: 'Task Activated',
 *   html: '<p>Your task has been activated</p>'
 * });
 * if (result.success) {
 *   console.log(result.value.message); // Message
 *   console.log(result.value.emailResult); // EmailResponse
 * }
 * ```
 */
export async function sendEmailMessage(
  data: EmailMessageInput,
): Promise<
  Result<
    { message: Message; emailResult: emailService.EmailResponse },
    AppError
  >
> {
  // Validate input
  const validation = validateSchema(EmailMessageInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Create message record
  const messageResult = await insertRowResult<Message>("_bpm_messages", {
    type: data.type,
    msg_type: data.msg_type || "email",
    recipient_email: data.recipient_email,
    recipient_user_id: data.recipient_user_id,
    subject: data.subject,
    body: data.html, // Store HTML in body field for email
    message_text:
      data.message_text || data.body || generatePlainText(data.html), // Plain text for in-app display
    status: "pending",
    in_app_read: false,
    created_at: new Date().toISOString(),
  });

  if (!messageResult.success) {
    return err(messageResult.error);
  }

  const message = messageResult.value;

  // Send email immediately
  const emailResult = await emailService.sendEmail({
    to: data.recipient_email,
    subject: data.subject,
    html: data.html,
    text: data.body || generatePlainText(data.html),
  });

  // Update message status based on email result
  if (emailResult.success) {
    await emailService
      .updateNotificationStatus(
        message.id,
        emailResult.value.success ? "sent" : "failed",
        emailResult.value.error,
      )
      .catch(console.error);
  } else {
    await emailService
      .updateNotificationStatus(message.id, "failed", emailResult.error.message)
      .catch(console.error);
  }

  if (!emailResult.success) {
    return err(emailResult.error);
  }

  // Log email sent event
  await eventLogService
    .logEvent("email_sent", "message", message.id, {
      newValues: { recipient: data.recipient_email, subject: data.subject },
      metadata: { email_success: emailResult.value.success },
    })
    .catch(console.error);

  return ok({ message, emailResult: emailResult.value });
}

/**
 * Queue email message (creates message record only, for background processing)
 *
 * @param data - Message creation data
 * @returns Result containing created message, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await queueEmailMessage({
 *   type: 'task_assigned',
 *   recipient_email: 'user@example.com',
 *   subject: 'New Task',
 *   body: 'You have been assigned a new task'
 * });
 * ```
 */
export async function queueEmailMessage(
  data: CreateMessageInput,
): Promise<Result<Message, AppError>> {
  // Create message record with pending status
  // Background service will pick it up and send email
  return await sendMessage(data);
}

/**
 * Get messages for a user
 *
 * @param userId - User ID (PocketBase user ID)
 * @returns Result containing array of messages, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getUserMessages('user123');
 * if (result.success) {
 *   console.log(result.value); // Message[]
 * }
 * ```
 */
export async function getUserMessages(
  userId: string,
): Promise<Result<Message[], AppError>> {
  if (!userId || userId.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  const result = await queryTableResult<Message>("_bpm_messages", {
    filter: { recipient_user_id: `eq.${userId}` },
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get unread messages for a user
 *
 * @param userId - User ID (PocketBase user ID)
 * @returns Result containing array of unread messages, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getUnreadMessages('user123');
 * if (result.success) {
 *   console.log(`Unread: ${result.value.length}`);
 * }
 * ```
 */
export async function getUnreadMessages(
  userId: string,
): Promise<Result<Message[], AppError>> {
  const messagesResult = await getUserMessages(userId);
  if (!messagesResult.success) {
    return err(messagesResult.error);
  }

  const unread = messagesResult.value.filter((n) => !n.in_app_read);
  return ok(unread);
}

/**
 * Mark message as read
 *
 * @param id - Message ID
 * @returns Result containing updated message array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await markMessageAsRead(456);
 * if (result.success) {
 *   console.log('Message marked as read');
 * }
 * ```
 */
export async function markMessageAsRead(
  id: number,
): Promise<Result<Message[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid message ID", "id", id));
  }

  return await updateRowsResult<Message>(
    "_bpm_messages",
    { id: `eq.${id}` },
    {
      in_app_read: true,
    },
  );
}

/**
 * Mark message as unread
 *
 * @param id - Message ID
 * @returns Result containing updated message array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await markMessageAsUnread(456);
 * if (result.success) {
 *   console.log('Message marked as unread');
 * }
 * ```
 */
export async function markMessageAsUnread(
  id: number,
): Promise<Result<Message[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid message ID", "id", id));
  }

  return await updateRowsResult<Message>(
    "_bpm_messages",
    { id: `eq.${id}` },
    {
      in_app_read: false,
    },
  );
}

/**
 * Mark all messages as read for a user
 *
 * @param userId - User ID (PocketBase user ID)
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await markAllMessagesAsRead('user123');
 * if (result.success) {
 *   console.log('All messages marked as read');
 * }
 * ```
 */
export async function markAllMessagesAsRead(
  userId: string,
): Promise<Result<void, AppError>> {
  if (!userId || userId.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  const result = await updateRowsResult<Message>(
    "_bpm_messages",
    { recipient_user_id: `eq.${userId}` },
    {
      in_app_read: true,
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  return ok(undefined);
}

// Backward compatibility exports (deprecated - use message versions)
export const sendNotification = sendMessage;
export const sendEmailNotification = sendEmailMessage;
export const queueEmailNotification = queueEmailMessage;
export const getUserNotifications = getUserMessages;
export const getUnreadNotifications = getUnreadMessages;
export const markNotificationAsRead = markMessageAsRead;
export const markNotificationAsUnread = markMessageAsUnread;
export const markAllNotificationsAsRead = markAllMessagesAsRead;

/**
 * Format message for email (convert to HTML with @mentions as links)
 *
 * @param messageText - Plain text message
 * @param references - Entity references (@mentions)
 * @param sourceUrl - Source URL for links
 * @param attachments - File attachments
 * @param messageId - Optional message ID to include in the link anchor
 * @returns HTML formatted message
 */
export function formatMessageForEmail(
  messageText: string,
  references: EntityReference[],
  sourceUrl: string,
  attachments: string[] = [],
  messageId?: number,
): string {
  // Get base URL from window (client-side) or environment variable (server-side fallback)
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : import.meta.env.PUBLIC_APP_URL || import.meta.env.PUBLIC_ORIGIN || "";

  // Convert message text to HTML (keep @mentions as plain text, not links)
  let html = messageText
    .split("\n")
    .map((line) => {
      // Escape HTML but keep @mentions visible as plain text
      // Don't convert @mentions to links in emails
      return line;
    })
    .map((line) => {
      // Escape HTML special characters
      return line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    })
    .join("<br>");

  // Add attachments section if any
  if (attachments.length > 0) {
    html +=
      '<br><br><div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e4e4e7;"><strong style="color: #71717a; font-size: 14px;">Bijlagen:</strong><ul style="margin: 8px 0 0 0; padding-left: 20px;">';
    for (const attachment of attachments) {
      const fileName = attachment.split("/").pop() || "Bestand";
      html += `<li style="margin: 4px 0;"><a href="${attachment}" style="color: #2563eb; text-decoration: none;">${fileName}</a></li>`;
    }
    html += "</ul></div>";
  }

  // Build link to source with optional message anchor
  const linkUrl = messageId ? `${sourceUrl}#message-${messageId}` : sourceUrl;

  // Add link to source
  html += `<br><br><div style="margin-top: 16px;"><a href="${baseUrl}${linkUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">Bekijk bericht</a></div>`;

  return html;
}

/**
 * Get entity URL for a reference
 */
function getEntityUrl(ref: EntityReference, baseUrl: string): string {
  switch (ref.type) {
    case "user":
      return `${baseUrl}/users/${ref.id}`;
    case "project":
      return `${baseUrl}/projects/${ref.id}`;
    case "case":
      return `${baseUrl}/cases/${ref.id}`;
    case "task":
      return `${baseUrl}/work/${ref.id}`;
    case "process":
      return `${baseUrl}/processes/${ref.id}`;
    default:
      return `${baseUrl}/`;
  }
}

/**
 * Create message with @mentions and file attachments
 *
 * Parses @mentions from message text, resolves entity names to IDs,
 * creates message records for each @mentioned user, and sends emails
 * based on user preferences.
 *
 * @param data - Message creation data with @mentions
 * @returns Result containing created messages, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await createMessage({
 *   message_text: 'Hello @John Doe, check @Project Alpha',
 *   source: '/work/1333?tab=messages',
 *   attachments: ['https://...']
 * });
 * ```
 */
export async function createMessage(
  data: CreateMessageWithMentionsInput,
): Promise<Result<Message[], AppError>> {
  // Validate input
  const validation = validateSchema(CreateMessageWithMentionsInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const senderUserId = getCurrentUserId();
  const senderEmail = getCurrentUserEmail();
  // EC-5: Help page users (no auth user ID) must use createMessageFromEmail instead
  if (isHelpPageUser(senderUserId) || !senderEmail)
    return err(
      ValidationError.create("User must be authenticated", "auth", null),
    );
  // After guard above, both are guaranteed non-null
  const senderId: string = senderUserId!;
  const senderAddress: string = senderEmail!;

  const threadResult = await resolveThreadContext(
    data.source,
    data.parent_message_id,
  );
  const { conversation_id, parent_message_id, thread_depth, thread_path } =
    threadResult.success
      ? threadResult.value
      : {
          conversation_id: crypto.randomUUID(),
          parent_message_id: null as number | null,
          thread_depth: 0,
          thread_path: "",
        };

  const mentionResult = await parseAndResolveMentions(
    data.message_text,
    data.preResolvedReferences,
    async (q: string) => {
      const r = await pocketbaseService.searchUsers(q);
      return r.success
        ? r.value.map((u) => ({
            type: "user" as const,
            id: u.id,
            name: (u.name || u.username || u.email || "Unknown User") as string,
          }))
        : [];
    },
  );
  const references = mentionResult.success
    ? mentionResult.value.references
    : [];

  const sl = data.message_text.split("\n").filter((l) => l.trim());
  const subject =
    sl[0]?.length > 50
      ? sl[0].substring(0, 47) + "..."
      : sl[0] || "Nieuw bericht";

  const chatResult = await insertRowResult<Message>("_bpm_messages", {
    type: "chat",
    msg_type: "in-app",
    recipient_email: senderAddress,
    recipient_user_id: senderId,
    subject,
    body: data.message_text,
    message_text: data.message_text,
    status: "sent",
    in_app_read: false,
    source: data.source,
    entity_type: data.entity_type || null,
    entity_id: data.entity_id || null,
    attachments: data.attachments || [],
    references,
    sender_user_id: senderId,
    sender_email: senderAddress,
    conversation_id,
    parent_message_id,
    thread_depth,
    thread_path,
    delivery_status: "pending",
    delivery_attempts: 0,
    created_at: new Date().toISOString(),
  });
  if (!chatResult.success) return err(chatResult.error);

  if (references.length > 0) {
    Promise.allSettled(
      references.map(async (ref) => {
        const u = await pocketbaseService.getUserById(ref.id as string);
        if (!u.success || !u.value.email) return;
        const recipient = { userId: ref.id as string, email: u.value.email };
        await createInAppNotification({
          chatMessage: chatResult.value,
          recipient,
          sender: { userId: senderId, email: senderAddress },
          messageText: data.message_text,
          source: data.source || "",
          references,
          attachments: data.attachments || [],
        });
        await queueEmailNotificationService(chatResult.value.id, recipient);
      }),
    ).catch(console.error);
  }

  // FR-6: Dispatch subscription notifications (non-blocking)
  // Notifies all subscribers of this entity via SSE (in-app) and email,
  // excluding the message sender (EC-4)
  dispatchSubscriptionNotifications(
    chatResult.value,
    senderId,
    data.source,
  ).catch((error) => {
    console.error(
      "[createMessage] Subscription dispatch failed (non-blocking):",
      error,
    );
  });

  eventLogService
    .logEvent("message_created", "message", chatResult.value.id, {
      newValues: {
        type: chatResult.value.type,
        recipient: chatResult.value.recipient_email,
      },
    })
    .catch(console.error);

  return ok([chatResult.value]);
}

/**
 * Create message from email user (magic link authenticated)
 * For help page users who don't have PocketBase accounts
 *
 * Differences from createMessage():
 * - Does NOT require getCurrentUserId() (no PocketBase auth)
 * - Accepts senderEmail as parameter (from magic link validation)
 * - Sets sender_user_id to null (not a system user)
 * - Does NOT support @mentions (help users can't mention team)
 * - Still creates notifications for any @mentions found (team mentions)
 */
export async function createMessageFromEmail(
  data: CreateMessageWithMentionsInput & { senderEmail: string },
): Promise<Result<Message[], AppError>> {
  // Validate input
  const validation = validateSchema(CreateMessageWithMentionsInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const senderEmail = data.senderEmail;

  // Validate email format
  if (!senderEmail || !senderEmail.includes("@")) {
    return err(
      ValidationError.create(
        "Valid sender email is required",
        "senderEmail",
        senderEmail,
      ),
    );
  }

  // Parse @mentions but DON'T resolve them — help users can't mention team
  // Uses extracted parseAndResolveMentions without a search function (EC-5)
  const mentionResult = await parseAndResolveMentions(
    data.message_text,
    undefined, // No pre-resolved references for help users
    undefined, // No search function — mentions stay unresolved
  );
  const references: EntityReference[] = mentionResult.success
    ? mentionResult.value.references
    : [];

  // Log warning if mentions are found (help users shouldn't mention)
  if (
    mentionResult.success &&
    mentionResult.value.unresolvedMentions.length > 0
  ) {
    console.warn(
      "[createMessageFromEmail] Help page user included @mentions. These will be displayed as text only:",
      mentionResult.value.unresolvedMentions,
    );
  }

  // Generate conversation_id for flat threading (no parent)
  const conversation_id = generateConversationId();

  // Create subject from message
  const subjectLines = data.message_text
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const subject =
    subjectLines.length > 0
      ? subjectLines[0].length > 50
        ? subjectLines[0].substring(0, 47) + "..."
        : subjectLines[0]
      : "Nieuw bericht";

  const createdMessages: Message[] = [];

  // Create the chat message
  // sender_user_id = null (not a PocketBase user)
  // sender_email = provided email
  // Note: entity_type and entity_id are stored in the source field, not as separate columns
  const chatMessageResult = await insertRowResult<Message>("_bpm_messages", {
    type: "chat",
    msg_type: "in-app",
    recipient_email: senderEmail, // Required by DB schema
    recipient_user_id: null, // Not applicable for help users
    subject,
    body: data.message_text,
    message_text: data.message_text,
    status: "sent",
    in_app_read: false,
    source: data.source,
    entity_type: data.entity_type || null,
    entity_id: data.entity_id || null,
    attachments: data.attachments || [],
    references, // Empty for help users
    sender_user_id: null, // KEY DIFFERENCE: No PocketBase user ID
    sender_email: senderEmail, // KEY DIFFERENCE: Use provided email
    created_at: new Date().toISOString(),
    // Thread fields (flat conversation for help users)
    conversation_id,
    thread_depth: 0,
    thread_path: "",
    delivery_status: "pending",
  });

  if (!chatMessageResult.success) {
    return err(chatMessageResult.error);
  }

  const chatMessage = chatMessageResult.value;
  createdMessages.push(chatMessage);

  // Log chat message creation event
  await eventLogService
    .logEvent("message_created", "message", chatMessage.id, {
      newValues: {
        type: chatMessage.type,
        sender_email: senderEmail,
        source: data.source,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
      },
    })
    .catch(console.error);

  // FR-6: Dispatch subscription notifications (non-blocking)
  // Help page messages should also notify subscribed internal users
  dispatchSubscriptionNotifications(
    chatMessage,
    null, // No PocketBase user ID for help page users
    data.source,
  ).catch((error) => {
    console.error(
      "[createMessageFromEmail] Subscription dispatch failed (non-blocking):",
      error,
    );
  });

  // Return chat message immediately
  return ok(createdMessages);
}

/**
 * Get messages by entity (using entity_type+entity_id, with source fallback)
 *
 * @param params - Either { entityType, entityId } for direct lookup, or { sourcePattern } for legacy URL matching
 * @returns Result containing array of messages, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getMessagesByEntity({ entityType: 'task', entityId: 1815 });
 * // or legacy:
 * const result = await getMessagesByEntity({ sourcePattern: '/work/1815' });
 * ```
 */
export async function getMessagesByEntity(
  params: { entityType: string; entityId: number } | { sourcePattern: string } | string,
): Promise<Result<Message[], AppError>> {
  const hasEntity =
    typeof params === "object" &&
    params !== null &&
    "entityType" in params &&
    "entityId" in params &&
    params.entityType &&
    params.entityId;

  let result: Result<{ data: Message[] }, AppError>;

  if (hasEntity) {
    const { entityType, entityId } = params as {
      entityType: string;
      entityId: number;
    };
    const sourcePattern =
      typeof params === "object" && "sourcePattern" in params
        ? (params as { sourcePattern: string }).sourcePattern
        : "";

    // Primary: query by entity_type + entity_id
    // Also include legacy source-matched messages (for messages created before migration)
    const normalizedPattern = sourcePattern
      ? sourcePattern.split("?")[0]
      : null;

    if (normalizedPattern) {
      // Use OR to match either entity columns OR source pattern (for backward compat)
      // PostgREST requires and() for grouping AND conditions inside or=()
      result = await queryTableResult<Message>("_bpm_messages", {
        filter: {
          type: "eq.chat",
          or: `(and(entity_type.eq.${entityType},entity_id.eq.${entityId}),source.ilike.*${normalizedPattern}*)`,
        },
        order: "created_at.desc",
        limit: 100,
      });
    } else {
      result = await queryTableResult<Message>("_bpm_messages", {
        filter: {
          type: "eq.chat",
          entity_type: `eq.${entityType}`,
          entity_id: `eq.${entityId}`,
        },
        order: "created_at.desc",
        limit: 100,
      });
    }
  } else {
    // Legacy fallback: params is a source pattern string
    const sourcePattern = typeof params === "string" ? params : "";
    if (!sourcePattern || sourcePattern.trim().length === 0) {
      return err(
        ValidationError.create(
          "Source pattern or entity info is required",
          "params",
          params,
        ),
      );
    }

    const normalizedPattern = sourcePattern.split("?")[0];
    const sourceFilter = `like.*${normalizedPattern}*`;

    result = await queryTableResult<Message>("_bpm_messages", {
      filter: {
        type: "eq.chat",
        source: sourceFilter,
      },
      order: "created_at.desc",
      limit: 50,
    });
  }

  if (!result.success) {
    return err(result.error);
  }

  // Deduplicate
  const seen = new Map<string, Message>();
  const deduplicated: Message[] = [];

  for (const msg of result.value.data) {
    if (msg.type !== "chat") continue;

    const timestamp = new Date(msg.created_at);
    const roundedTimestamp =
      Math.floor(timestamp.getTime() / 1000) * 1000;
    const content = (msg.message_text || msg.body || "").trim();
    const key = `${msg.sender_user_id || msg.sender_email || "unknown"}|${content}|${roundedTimestamp}`;

    if (!seen.has(key)) {
      seen.set(key, msg);
      deduplicated.push(msg);
    } else {
      const existing = seen.get(key)!;
      if (msg.id < existing.id) {
        const index = deduplicated.indexOf(existing);
        if (index !== -1) {
          deduplicated[index] = msg;
          seen.set(key, msg);
        }
      }
    }
  }

  return ok(deduplicated);
}

/**
 * Get messages where user is @mentioned
 *
 * Filters messages where references JSONB contains user mention.
 *
 * @param userId - User ID (PocketBase user ID)
 * @returns Result containing array of messages, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getMessagesWithMentions('user123');
 * if (result.success) {
 *   console.log(result.value); // Message[]
 * }
 * ```
 */
export async function getMessagesWithMentions(
  userId: string,
): Promise<Result<Message[], AppError>> {
  if (!userId || userId.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  // Use PostgREST "cs" operator (contains / @>) for JSONB containment
  // PostgREST URL syntax: references=cs.[{"type":"user","id":"USER_ID"}]
  // Combined with type/msg_type/recipient filters for precise results
  const result = await queryTableResult<Message>("_bpm_messages", {
    filter: {
      type: "eq.notification",
      msg_type: "eq.in-app",
      recipient_user_id: `eq.${userId}`,
      references: `cs.[{"type":"user","id":"${userId}"}]`,
    },
    order: "created_at.desc",
    limit: 50,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get unread message count for a user
 *
 * Uses server-side filtering for efficiency. Returns only the count,
 * not full message objects.
 *
 * @param userId - User ID (PocketBase user ID)
 * @returns Result containing unread count, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getUnreadCount('user123');
 * if (result.success) {
 *   console.log(`Unread: ${result.value}`);
 * }
 * ```
 */
export async function getUnreadCount(
  userId: string,
): Promise<Result<number, AppError>> {
  if (!userId || userId.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  // Use minimal select for efficiency - only need to count rows
  const result = await queryTableResult<Message>("_bpm_messages", {
    select: "id",
    filter: {
      recipient_user_id: `eq.${userId}`,
      in_app_read: "eq.false",
    },
    limit: 50,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data.length);
}

/**
 * Update a message
 *
 * @param id - Message ID
 * @param data - Update data (message_text, attachments, etc.)
 * @returns Result containing updated message array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateMessage(123, { message_text: 'Updated text' });
 * if (result.success) {
 *   console.log('Message updated');
 * }
 * ```
 */
export async function updateMessage(
  id: number,
  data: { message_text?: string; attachments?: string[] },
): Promise<Result<Message[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid message ID", "id", id));
  }

  const updateData: Record<string, any> = {};
  if (data.message_text !== undefined) {
    updateData.message_text = data.message_text;
    updateData.body = data.message_text; // Also update body for consistency
  }
  if (data.attachments !== undefined) {
    updateData.attachments = data.attachments;
  }

  return await updateRowsResult<Message>(
    "_bpm_messages",
    { id: `eq.${id}` },
    updateData,
  );
}

/**
 * Delete a message
 *
 * @param id - Message ID
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await deleteMessage(123);
 * if (result.success) {
 *   console.log('Message deleted');
 * }
 * ```
 */
export async function deleteMessage(
  id: number,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid message ID", "id", id));
  }

  const result = await deleteRowsResult("_bpm_messages", { id: `eq.${id}` });

  if (!result.success) {
    return err(result.error);
  }

  // Log message deletion event
  await eventLogService
    .logEvent("message_deleted", "message", id, {})
    .catch(console.error);

  return ok(undefined);
}

// Re-export types for backward compatibility
export type { Message as Notification } from "$lib/schemas/message";
export type { CreateMessageInput as CreateNotificationInput } from "$lib/schemas/message";
export type { EmailMessageInput as EmailNotificationInput } from "$lib/schemas/message";
