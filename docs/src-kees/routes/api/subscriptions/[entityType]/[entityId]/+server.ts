/**
 * Subscription Status API - Check subscription status for a specific entity
 * core-003: API endpoint for the message-subscriptions feature.
 *
 * GET /api/subscriptions/[entityType]/[entityId] — Check subscription status
 *
 * Auth: Cookie-based via locals.user (set by hooks.server.ts)
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getSubscription } from "$lib/services/messageSubscriptionService";
import { EntityTypeSchema } from "$lib/schemas/messageSubscription";

/**
 * GET /api/subscriptions/[entityType]/[entityId] - Check subscription status
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { entityType } = params;
  const entityId = Number(params.entityId);

  // Validate entityId is a valid positive integer
  if (
    !entityId ||
    isNaN(entityId) ||
    entityId <= 0 ||
    !Number.isInteger(entityId)
  ) {
    return json(
      { success: false, error: "entity_id must be a positive integer" },
      { status: 400 },
    );
  }

  // Validate entity_type against schema
  const entityTypeResult = EntityTypeSchema.safeParse(entityType);
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

  const result = await getSubscription(
    locals.user.id,
    entityTypeResult.data,
    entityId,
  );

  if (!result.success) {
    return json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  }

  return json({ success: true, data: result.value });
};
