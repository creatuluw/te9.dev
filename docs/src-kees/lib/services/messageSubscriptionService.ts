/**
 * Message Subscription Service
 * FR-3: Subscription Service — subscribe, unsubscribe, query, update
 *
 * Provides CRUD operations for user subscriptions to entity message threads.
 * Follows the Result<T, AppError> pattern for type-safe error handling.
 */

import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
} from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import { ValidationError, NotFoundError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  CreateSubscriptionInputSchema,
  UpdateSubscriptionInputSchema,
  type SubscriptionChannel,
  type EntityType,
  type MessageSubscription,
} from "$lib/schemas/messageSubscription";
import type { Message } from "$lib/schemas/message";
import { sseConnectionManager } from "$lib/services/sseConnectionManager";
import { sendEmail } from "$lib/services/emailService";
import { getUserPreferences } from "$lib/services/userPreferencesService";
import * as pocketbaseService from "$lib/services/pocketbaseService";
import { renderEmailTemplate } from "$lib/templates/emails";

const TABLE_NAME = "_bpm_message_subscriptions";
const READS_TABLE_NAME = "_bpm_subscription_message_reads";

/**
 * Subscribe a user to an entity's messages.
 * Idempotent — returns existing subscription if already subscribed.
 */
export async function subscribe(
  userId: string,
  entityType: EntityType,
  entityId: number,
  entityName?: string,
  channel?: SubscriptionChannel,
): Promise<Result<MessageSubscription, AppError>> {
  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  // Validate entityId is a positive integer
  if (
    !entityId ||
    typeof entityId !== "number" ||
    entityId <= 0 ||
    !Number.isInteger(entityId)
  ) {
    return err(
      ValidationError.create(
        "Entity ID must be a positive integer",
        "entity_id",
        entityId,
      ),
    );
  }

  // Validate entity_type and entity_id using Zod schema
  const validation = validateSchema(CreateSubscriptionInputSchema, {
    entity_type: entityType,
    entity_id: entityId,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  // Check if already subscribed (idempotent)
  const existingResult = await queryTableResult<MessageSubscription>(
    TABLE_NAME,
    {
      filter: {
        user_id: `eq.${userId}`,
        entity_type: `eq.${entityType}`,
        entity_id: `eq.${entityId}`,
      },
      limit: 1,
    },
  );

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length > 0) {
    // Already subscribed — return existing subscription (idempotent)
    return ok(existingResult.value.data[0]);
  }

  // Insert new subscription
  const insertResult = await insertRowResult<MessageSubscription>(TABLE_NAME, {
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName || null,
    notification_channel: channel || "in-app",
  });

  if (!insertResult.success) {
    return err(insertResult.error);
  }

  // Push SSE event for UI state sync (only for new subscriptions)
  try {
    sseConnectionManager.pushEvent(userId, "subscription.created", {
      id: insertResult.value.id,
      entityType: insertResult.value.entity_type,
      entityId: insertResult.value.entity_id,
      entityName: insertResult.value.entity_name,
      notificationChannel: insertResult.value.notification_channel,
    });
  } catch {
    // SSE push failure is non-blocking
  }

  return ok(insertResult.value);
}

/**
 * Unsubscribe a user from an entity's messages.
 * Idempotent — succeeds silently if subscription doesn't exist.
 */
export async function unsubscribe(
  userId: string,
  entityType: EntityType,
  entityId: number,
): Promise<Result<void, AppError>> {
  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  // Validate entityId is a positive integer
  if (
    !entityId ||
    typeof entityId !== "number" ||
    entityId <= 0 ||
    !Number.isInteger(entityId)
  ) {
    return err(
      ValidationError.create(
        "Entity ID must be a positive integer",
        "entity_id",
        entityId,
      ),
    );
  }

  // Validate entity_type using Zod schema
  const validation = validateSchema(CreateSubscriptionInputSchema, {
    entity_type: entityType,
    entity_id: entityId,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  // Delete subscription (succeeds silently if not found — PostgREST DELETE is idempotent)
  const deleteResult = await deleteRowsResult(TABLE_NAME, {
    user_id: `eq.${userId}`,
    entity_type: `eq.${entityType}`,
    entity_id: `eq.${entityId}`,
  });

  if (!deleteResult.success) {
    return err(deleteResult.error);
  }

  // Push SSE event for UI state sync
  try {
    sseConnectionManager.pushEvent(userId, "subscription.deleted", {
      entityType,
      entityId,
    });
  } catch {
    // SSE push failure is non-blocking
  }

  return ok(undefined);
}

/**
 * Get a single subscription for a user/entity combination.
 * Returns null if no subscription exists.
 */
export async function getSubscription(
  userId: string,
  entityType: EntityType,
  entityId: number,
): Promise<Result<MessageSubscription | null, AppError>> {
  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  // Validate entityId
  if (
    !entityId ||
    typeof entityId !== "number" ||
    entityId <= 0 ||
    !Number.isInteger(entityId)
  ) {
    return err(
      ValidationError.create(
        "Entity ID must be a positive integer",
        "entity_id",
        entityId,
      ),
    );
  }

  const result = await queryTableResult<MessageSubscription>(TABLE_NAME, {
    filter: {
      user_id: `eq.${userId}`,
      entity_type: `eq.${entityType}`,
      entity_id: `eq.${entityId}`,
    },
    limit: 1,
  });

  if (!result.success) {
    return err(result.error);
  }

  const subscriptions = result.value.data;
  return ok(subscriptions.length > 0 ? subscriptions[0] : null);
}

/**
 * Get all subscriptions for a user.
 * Used on the account page subscriptions tab.
 */
export async function getUserSubscriptions(
  userId: string,
): Promise<Result<MessageSubscription[], AppError>> {
  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  const result = await queryTableResult<MessageSubscription>(TABLE_NAME, {
    filter: {
      user_id: `eq.${userId}`,
    },
    order: "entity_type.asc,entity_id.asc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get all subscribers for an entity.
 * Used for notification dispatch when a new message is created.
 */
export async function getEntitySubscribers(
  entityType: EntityType,
  entityId: number,
): Promise<Result<MessageSubscription[], AppError>> {
  // Validate entity_type via schema
  const validation = validateSchema(CreateSubscriptionInputSchema, {
    entity_type: entityType,
    entity_id: entityId,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  // Validate entityId
  if (
    !entityId ||
    typeof entityId !== "number" ||
    entityId <= 0 ||
    !Number.isInteger(entityId)
  ) {
    return err(
      ValidationError.create(
        "Entity ID must be a positive integer",
        "entity_id",
        entityId,
      ),
    );
  }

  const result = await queryTableResult<MessageSubscription>(TABLE_NAME, {
    filter: {
      entity_type: `eq.${entityType}`,
      entity_id: `eq.${entityId}`,
    },
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Update the notification channel for a subscription.
 */
export async function updateChannel(
  userId: string,
  entityType: EntityType,
  entityId: number,
  channel: SubscriptionChannel,
): Promise<Result<MessageSubscription, AppError>> {
  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  // Validate entityId
  if (
    !entityId ||
    typeof entityId !== "number" ||
    entityId <= 0 ||
    !Number.isInteger(entityId)
  ) {
    return err(
      ValidationError.create(
        "Entity ID must be a positive integer",
        "entity_id",
        entityId,
      ),
    );
  }

  // Validate notification_channel via Zod schema
  const validation = validateSchema(UpdateSubscriptionInputSchema, {
    notification_channel: channel,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  const result = await updateRowsResult<MessageSubscription>(
    TABLE_NAME,
    {
      user_id: `eq.${userId}`,
      entity_type: `eq.${entityType}`,
      entity_id: `eq.${entityId}`,
    },
    {
      notification_channel: channel,
      updated_at: new Date().toISOString(),
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  if (result.value.length === 0) {
    return err(
      NotFoundError.create(
        `Subscription not found for ${entityType}/${entityId}`,
      ),
    );
  }

  return ok(result.value[0]);
}

/**
 * Get all chat messages from entities the user is subscribed to.
 * Used for the Updates feed on the /messages page.
 * Excludes messages where the user is the sender (EC-4).
 * Orders by created_at descending, limited to 200 messages.
 */
export async function getSubscriptionMessages(
  userId: string,
): Promise<Result<Message[], AppError>> {
  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  // Step 1: Get user's subscriptions
  const subscriptionsResult = await queryTableResult<MessageSubscription>(
    TABLE_NAME,
    {
      filter: {
        user_id: `eq.${userId}`,
      },
    },
  );

  if (!subscriptionsResult.success) {
    return err(subscriptionsResult.error);
  }

  const subscriptions = subscriptionsResult.value.data;

  // No subscriptions → empty messages
  if (subscriptions.length === 0) {
    return ok([]);
  }

  // Step 2: Build OR filter from subscriptions using entity_type + entity_id
  // PostgREST requires and() for grouping AND conditions inside or=()
  const entityFilters: string[] = [];
  for (const sub of subscriptions) {
    entityFilters.push(`and(entity_type.eq.${sub.entity_type},entity_id.eq.${sub.entity_id})`);
  }

  // Also include legacy source-matched patterns for messages created before migration
  const sourcePatterns: string[] = [];
  for (const sub of subscriptions) {
    switch (sub.entity_type) {
      case "work":
      case "task":
        sourcePatterns.push(`source.ilike.*/work-items/${sub.entity_id}*`);
        sourcePatterns.push(`source.ilike.*/work/${sub.entity_id}*`);
        break;
      case "case":
        sourcePatterns.push(`source.ilike.*/cases/${sub.entity_id}*`);
        break;
      case "process":
        sourcePatterns.push(`source.ilike.*/processes/${sub.entity_id}*`);
        break;
      case "project":
        sourcePatterns.push(`source.ilike.*/projects/${sub.entity_id}*`);
        break;
    }
  }

  // Combine entity-based and source-based filters
  const allFilters = [...entityFilters, ...sourcePatterns];
  const orFilter = allFilters.join(",");

  const messagesResult = await queryTableResult<Message>("_bpm_messages", {
    filter: {
      type: "eq.chat",
      or: `(${orFilter})`,
    },
    order: "created_at.desc",
    limit: 200,
  });

  if (!messagesResult.success) {
    return err(messagesResult.error);
  }

  // EC-4: Exclude messages where user is the sender (client-side because
  // PostgREST neq operator excludes NULLs, which help page messages have)
  const filtered = messagesResult.value.data.filter(
    (msg) => msg.sender_user_id !== userId,
  );

  return ok(filtered);
}

/**
 * Parse entity type and ID from a source URL.
 * Supports: /processes/{id}, /cases/{id}, /work-items/{id}, /projects/{id}
 * Returns null if the source doesn't match any known pattern.
 */
function parseEntityFromSource(
  source: string,
): { entityType: EntityType; entityId: number } | null {
  const patterns: Array<{
    regex: RegExp;
    entityType: EntityType;
  }> = [
    { regex: /\/processes\/(\d+)/, entityType: "process" },
    { regex: /\/cases\/(\d+)/, entityType: "case" },
    { regex: /\/work-items\/(\d+)/, entityType: "task" },
    { regex: /\/work\/(\d+)/, entityType: "task" },
    { regex: /\/projects\/(\d+)/, entityType: "project" },
  ];

  for (const { regex, entityType } of patterns) {
    const match = source.match(regex);
    if (match) {
      const entityId = parseInt(match[1], 10);
      if (entityId > 0) {
        return { entityType, entityId };
      }
    }
  }

  return null;
}

/**
 * Send a subscription update email to a subscriber.
 * FR-11: Uses emailService.sendEmail() for delivery.
 * Email failures are caught and logged but do not throw.
 */
async function sendSubscriptionEmail(
  subscriberEmail: string,
  senderName: string,
  messageText: string,
  entityType: string,
  entityName: string | null,
  entityUrl: string,
): Promise<void> {
  try {
    const displayEntityType =
      {
        process: "proces",
        case: "case",
        work: "werkitem",
        task: "werkitem",
        project: "project",
      }[entityType] || entityType;

    const displayName = entityName || displayEntityType;
    const subject = `Nieuw bericht op ${displayEntityType} '${displayName}'`;

    const appUrl = typeof window !== "undefined" ? window.location.origin : "";

    const html = renderEmailTemplate("subscription-notification", {
      senderName,
      messageText:
        messageText.length > 500
          ? messageText.substring(0, 500) + "..."
          : messageText,
      entityType: displayEntityType,
      entityName: displayName,
      entityUrl,
      unsubscribeUrl: `${appUrl}/account?tab=subscriptions`,
    });

    const text = `${senderName} schreef op ${displayEntityType} '${displayName}':\n\n${messageText.length > 500 ? messageText.substring(0, 500) + "..." : messageText}\n\nBekijk bericht: ${entityUrl}\n\nAbonnement opzeggen: ${appUrl}/account?tab=subscriptions`;

    await sendEmail({
      to: subscriberEmail,
      subject,
      html,
      text,
    });
  } catch (error) {
    // Email failure is caught and logged but does not block subscription flow
    console.error(
      "[subscriptionEmail] Failed to send subscription email:",
      error,
    );
  }
}

/**
 * Dispatch subscription notifications to all subscribers of an entity.
 * Called after a new chat message is created.
 * FR-6: Subscription Notification Dispatch
 *
 * - Pushes SSE 'subscription.update' to 'in-app' and 'both' subscribers
 * - Sends email to 'email' and 'both' subscribers (if global email preference enabled)
 * - Excludes the message sender (EC-4)
 * - Non-blocking: errors are caught, never thrown
 */
export async function dispatchSubscriptionNotifications(
  message: Message,
  senderUserId: string | null,
  source: string,
): Promise<void> {
  try {
    // Use stored entity_type/entity_id from message if available, otherwise parse from source
    let entityType: string | null = null;
    let entityId: number | null = null;

    if (message.entity_type && message.entity_id) {
      entityType = message.entity_type;
      entityId = message.entity_id;
    } else {
      const parsed = parseEntityFromSource(source);
      if (parsed) {
        entityType = parsed.entityType;
        entityId = parsed.entityId;
      }
    }

    if (!entityType || !entityId) return;

    // Fetch subscribers for this entity
    const subscribersResult = await queryTableResult<MessageSubscription>(
      TABLE_NAME,
      {
        filter: {
          entity_type: `eq.${entityType}`,
          entity_id: `eq.${entityId}`,
        },
      },
    );

    if (!subscribersResult.success) return;

    const subscribers = subscribersResult.value.data;

    // No subscribers → nothing to do
    if (subscribers.length === 0) return;

    // Build entity URL for email links
    const entityUrlBase =
      typeof window !== "undefined" ? window.location.origin : "";
    const entityUrlMap: Record<string, string> = {
      process: `/processes/${entityId}?tab=messages`,
      case: `/cases/${entityId}?tab=messages`,
      work: `/work/${entityId}?tab=messages`,
      task: `/work/${entityId}?tab=messages`,
      project: `/projects/${entityId}?tab=messages`,
    };
    const entityUrl = `${entityUrlBase}${entityUrlMap[entityType] || ""}`;

    // Process each subscriber (non-blocking via Promise.allSettled)
    await Promise.allSettled(
      subscribers
        .filter((sub) => sub.user_id !== (senderUserId ?? "")) // EC-4: Exclude sender
        .map(async (subscriber) => {
          // Check global email preference
          const prefsResult = await getUserPreferences(subscriber.user_id);
          const globalMethods = prefsResult.success
            ? prefsResult.value.notification_methods
            : ["in-app"];
          const globalEmailEnabled = globalMethods.includes("email");

          const channel = subscriber.notification_channel;

          // SSE push for 'in-app' and 'both' channels
          if (channel === "in-app" || channel === "both") {
            try {
              sseConnectionManager.pushEvent(
                subscriber.user_id,
                "subscription.update",
                {
                  messageId: message.id,
                  messageText: message.message_text || message.body,
                  entityType,
                  entityId,
                  entityName: subscriber.entity_name,
                  senderId: senderUserId,
                  senderEmail: message.sender_email,
                  createdAt: message.created_at,
                },
              );
            } catch {
              // SSE push failure is non-blocking
            }
          }

          // Email for 'email' and 'both' channels (if global email preference enabled)
          if (
            (channel === "email" || channel === "both") &&
            globalEmailEnabled
          ) {
            // Resolve subscriber email from user ID
            const userResult = await pocketbaseService.getUserById(
              subscriber.user_id,
            );
            if (userResult.success && userResult.value.email) {
              await sendSubscriptionEmail(
                userResult.value.email,
                message.sender_email || "Onbekend",
                message.message_text || message.body || "",
                entityType,
                subscriber.entity_name ?? null,
                entityUrl,
              );
            }
          }
        }),
    );
  } catch (error) {
    // Entire dispatch is non-blocking — never throw
    console.error(
      "[subscriptionDispatch] Failed to dispatch subscription notifications:",
      error,
    );
  }
}

// ============================================
// Subscription Message Read Tracking
// ============================================

const READS_TABLE = "_bpm_subscription_message_reads";

/**
 * Get the set of message IDs that a user has already read.
 * Used to compute unread subscription messages.
 */
export async function getReadMessageIds(
  userId: string,
): Promise<Result<Set<number>, AppError>> {
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  const result = await queryTableResult<{ message_id: number }>(READS_TABLE, {
    filter: { user_id: `eq.${userId}` },
    select: "message_id",
    limit: 10000,
  });

  if (!result.success) {
    return err(result.error);
  }

  const ids = new Set(result.value.data.map((r) => r.message_id));
  return ok(ids);
}

/**
 * Mark a single subscription message as read for a user.
 * Idempotent — if already marked, returns the existing record.
 */
export async function markMessageAsRead(
  userId: string,
  messageId: number,
): Promise<Result<void, AppError>> {
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }
  if (!Number.isInteger(messageId) || messageId <= 0) {
    return err(
      ValidationError.create(
        "Message ID must be a positive integer",
        "message_id",
        messageId,
      ),
    );
  }

  // Check if already marked read (idempotent)
  const existingResult = await queryTableResult<{ id: number }>(READS_TABLE, {
    filter: {
      user_id: `eq.${userId}`,
      message_id: `eq.${messageId}`,
    },
    limit: 1,
  });

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length > 0) {
    // Already marked as read
    return ok(undefined);
  }

  // Insert read record
  const insertResult = await insertRowResult(READS_TABLE, {
    user_id: userId,
    message_id: messageId,
  });

  if (!insertResult.success) {
    return err(insertResult.error);
  }

  return ok(undefined);
}

/**
 * Mark all subscription messages as read for a user.
 * Fetches all subscription message IDs, then inserts read records
 * for any that don't already exist.
 */
export async function markAllSubscriptionMessagesAsRead(
  userId: string,
): Promise<Result<number, AppError>> {
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("Valid user ID is required", "user_id", userId),
    );
  }

  // Get all subscription messages for this user
  const messagesResult = await getSubscriptionMessages(userId);
  if (!messagesResult.success) {
    return err(messagesResult.error);
  }

  const messages = messagesResult.value;
  if (messages.length === 0) {
    return ok(0);
  }

  // Get already-read message IDs
  const readIdsResult = await getReadMessageIds(userId);
  if (!readIdsResult.success) {
    return err(readIdsResult.error);
  }

  const readIds = readIdsResult.value;

  // Insert read records for unread messages
  const toMark = messages.filter((m) => !readIds.has(m.id));
  if (toMark.length === 0) {
    return ok(0);
  }

  // Insert in batches to avoid oversized requests
  let marked = 0;
  for (const msg of toMark) {
    const result = await insertRowResult(READS_TABLE, {
      user_id: userId,
      message_id: msg.id,
    });
    if (result.success) {
      marked++;
    }
  }

  return ok(marked);
}
