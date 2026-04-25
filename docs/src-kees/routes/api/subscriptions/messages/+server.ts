/**
 * Subscription Messages API - Get subscription messages and manage read state
 *
 * GET   /api/subscriptions/messages — Get subscription messages with read IDs for Updates feed
 * POST  /api/subscriptions/messages — Mark a single subscription message as read
 * PATCH /api/subscriptions/messages — Mark all subscription messages as read
 *
 * Auth: Cookie-based via locals.user (set by hooks.server.ts)
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  getSubscriptionMessages,
  getReadMessageIds,
  markMessageAsRead,
  markAllSubscriptionMessagesAsRead,
  getUserSubscriptions,
} from "$lib/services/messageSubscriptionService";

/**
 * GET /api/subscriptions/messages
 * Get subscription messages for Updates feed, along with the set of message IDs
 * the user has already read. This lets the UI distinguish read from unread without
 * a per-user `in_app_read` column on the shared messages table.
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [messagesResult, readIdsResult, subsResult] = await Promise.all([
    getSubscriptionMessages(locals.user.id),
    getReadMessageIds(locals.user.id),
    getUserSubscriptions(locals.user.id),
  ]);

  if (!messagesResult.success) {
    return json(
      { success: false, error: messagesResult.error.message },
      { status: 500 },
    );
  }

  const readIds = readIdsResult.success
    ? readIdsResult.value
    : new Set<number>();

  const entityNames: Record<string, string> = {};
  if (subsResult.success) {
    for (const sub of subsResult.value) {
      const key = `${sub.entity_type}:${sub.entity_id}`;
      if (sub.entity_name) {
        entityNames[key] = sub.entity_name;
      }
    }
  }

  return json({
    success: true,
    data: {
      messages: messagesResult.value,
      readIds: Array.from(readIds),
      entityNames,
    },
  });
};

/**
 * POST /api/subscriptions/messages
 * Mark a single subscription message as read.
 * Body: { message_id: number }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { message_id } = body as { message_id?: number };

  if (
    !message_id ||
    typeof message_id !== "number" ||
    !Number.isInteger(message_id) ||
    message_id <= 0
  ) {
    return json(
      { success: false, error: "message_id must be a positive integer" },
      { status: 400 },
    );
  }

  const result = await markMessageAsRead(locals.user.id, message_id);

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true });
};

/**
 * PATCH /api/subscriptions/messages
 * Mark all subscription messages as read for the current user.
 * No body required.
 */
export const PATCH: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await markAllSubscriptionMessagesAsRead(locals.user.id);

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true, data: { marked: result.value } });
};
