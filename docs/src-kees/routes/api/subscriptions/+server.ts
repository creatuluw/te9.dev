/**
 * Subscriptions API - Subscribe, unsubscribe, update, and list message subscriptions
 * core-003: API endpoints for the message-subscriptions feature.
 *
 * POST   /api/subscriptions — Subscribe to entity messages
 * DELETE /api/subscriptions — Unsubscribe from entity messages
 * PATCH  /api/subscriptions — Update notification channel
 * GET    /api/subscriptions — List user's subscriptions
 *
 * Auth: Cookie-based via locals.user (set by hooks.server.ts)
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  subscribe,
  unsubscribe,
  updateChannel,
  getUserSubscriptions,
} from "$lib/services/messageSubscriptionService";
import {
  CreateSubscriptionInputSchema,
  UpdateSubscriptionInputSchema,
  EntityTypeSchema,
} from "$lib/schemas/messageSubscription";

/**
 * POST /api/subscriptions - Subscribe to entity messages
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

  // Validate input with Zod schema
  const validation = CreateSubscriptionInputSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues[0]?.message || "Validation failed";
    return json({ success: false, error: firstError }, { status: 400 });
  }

  const { entity_type, entity_id, entity_name, notification_channel } =
    validation.data;

  // Delegate to service
  const result = await subscribe(
    locals.user.id,
    entity_type,
    entity_id,
    entity_name,
    notification_channel,
  );

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true, data: result.value });
};

/**
 * DELETE /api/subscriptions - Unsubscribe from entity messages
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
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

  const { entity_type, entity_id } = body as {
    entity_type?: string;
    entity_id?: number;
  };

  if (!entity_type || entity_id === undefined) {
    return json(
      { success: false, error: "entity_type and entity_id are required" },
      { status: 400 },
    );
  }

  // Validate entity_id is a positive integer
  if (
    typeof entity_id !== "number" ||
    entity_id <= 0 ||
    !Number.isInteger(entity_id)
  ) {
    return json(
      { success: false, error: "entity_id must be a positive integer" },
      { status: 400 },
    );
  }

  // Validate entity_type against schema
  const entityTypeResult = EntityTypeSchema.safeParse(entity_type);
  if (!entityTypeResult.success) {
    return json(
      {
        success: false,
        error:
          "Invalid entity_type. Must be one of: process, case, work, task, project",
      },
      { status: 400 },
    );
  }

  const result = await unsubscribe(
    locals.user.id,
    entityTypeResult.data,
    entity_id,
  );

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true });
};

/**
 * PATCH /api/subscriptions - Update notification channel
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
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

  const { entity_type, entity_id, notification_channel } = body as {
    entity_type?: string;
    entity_id?: number;
    notification_channel?: string;
  };

  if (!entity_type || entity_id === undefined || !notification_channel) {
    return json(
      {
        success: false,
        error: "entity_type, entity_id, and notification_channel are required",
      },
      { status: 400 },
    );
  }

  // Validate entity_id is a positive integer
  if (
    typeof entity_id !== "number" ||
    entity_id <= 0 ||
    !Number.isInteger(entity_id)
  ) {
    return json(
      { success: false, error: "entity_id must be a positive integer" },
      { status: 400 },
    );
  }

  // Validate entity_type against schema
  const entityTypeResult = EntityTypeSchema.safeParse(entity_type);
  if (!entityTypeResult.success) {
    return json(
      {
        success: false,
        error:
          "Invalid entity_type. Must be one of: process, case, work, task, project",
      },
      { status: 400 },
    );
  }

  // Validate notification_channel with schema
  const validation = UpdateSubscriptionInputSchema.safeParse({
    notification_channel,
  });
  if (!validation.success) {
    const firstError =
      validation.error.issues[0]?.message || "Validation failed";
    return json({ success: false, error: firstError }, { status: 400 });
  }

  const result = await updateChannel(
    locals.user.id,
    entityTypeResult.data,
    entity_id,
    validation.data.notification_channel,
  );

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true, data: result.value });
};

/**
 * GET /api/subscriptions - List user's subscriptions
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getUserSubscriptions(locals.user.id);

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true, data: result.value });
};
