/**
 * POST /api/email/webhooks/maileroo - Maileroo webhook handler
 *
 * Accepts webhook payloads from Maileroo for delivery status updates.
 * Validates the webhook secret, then processes events asynchronously.
 *
 * Supported events: delivered, bounced, failed, complained
 * Hard bounces trigger email suppression via processBounce().
 * All other events are recorded via recordTrackingEvent().
 *
 * Returns 200 quickly to acknowledge receipt — event processing is fire-and-forget.
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { queryTableResult } from "$lib/utils/postgrest";
import * as emailTrackingService from "$lib/services/emailTrackingService";
import type { TrackingEventType } from "$lib/services/emailTrackingService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MailerooWebhookPayload {
  event: string;
  email: string;
  message_id: string;
  timestamp: string;
  reason?: string;
  bounce_type?: "hard" | "soft";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map Maileroo event names to internal tracking event types.
 * Unknown events are mapped to 'unknown' for graceful handling.
 */
function mapEventType(mailerooEvent: string): TrackingEventType {
  switch (mailerooEvent) {
    case "delivered":
      return "delivered";
    case "bounced":
      return "bounced";
    case "failed":
      return "failed";
    case "complained":
      // Spam complaints are treated as suppression events
      return "suppressed";
    default:
      return "unknown";
  }
}

/**
 * Resolve the internal numeric message ID from the SMTP message_id
 * provided by Maileroo.
 *
 * Strategy:
 * 1. Try to find a message in _bpm_messages whose references field
 *    contains the SMTP message ID (the email service stores SMTP IDs there).
 * 2. Fall back to extracting a numeric ID from the SMTP message_id string.
 * 3. Return null if no match is found.
 */
async function resolveInternalMessageId(
  smtpMessageId: string,
): Promise<number | null> {
  if (!smtpMessageId) return null;

  // Attempt 1: Search _bpm_messages for a matching SMTP message ID in references
  try {
    const lookupResult = await queryTableResult<{ id: number }>(
      "_bpm_messages",
      {
        select: "id",
        filter: { references: `like.%${smtpMessageId}%` },
        limit: 1,
      },
    );

    if (lookupResult.success && lookupResult.value.data.length > 0) {
      return lookupResult.value.data[0].id;
    }
  } catch (error) {
    console.warn(
      "[maileroo-webhook] Message lookup by references failed:",
      error,
    );
  }

  // Attempt 2: Extract numeric ID from SMTP message_id format
  // Common formats: <12345@domain.com>, message-12345@domain.com, 12345@domain.com
  const numericMatch = smtpMessageId.replace(/[<>]/g, "").match(/(\d+)/);
  if (numericMatch) {
    const candidateId = parseInt(numericMatch[1], 10);
    if (candidateId > 0 && candidateId < Number.MAX_SAFE_INTEGER) {
      return candidateId;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const POST: RequestHandler = async ({ request }) => {
  // --- Log all incoming headers for debugging ---
  const allHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    allHeaders[key] = value;
  });
  console.log(
    "[maileroo-webhook] Incoming request headers:",
    JSON.stringify(allHeaders, null, 2),
  );

  // --- Validate webhook secret ---
  // Maileroo may send the secret via different header names depending on their version
  // Check multiple possible header names
  const webhookSecret =
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-webhook-token") ||
    request.headers.get("x-maileroo-token") ||
    request.headers.get("authorization");
  const expectedSecret = process.env.WEBHOOK_MAILEROO_SECRET;

  console.log("[maileroo-webhook] Secret validation:", {
    received: webhookSecret
      ? `${webhookSecret.substring(0, 8)}...${webhookSecret.substring(webhookSecret.length - 8)}`
      : "(none)",
    expected: expectedSecret
      ? `${expectedSecret.substring(0, 8)}...${expectedSecret.substring(expectedSecret.length - 8)}`
      : "(not configured)",
    match: webhookSecret === expectedSecret,
  });

  if (!expectedSecret) {
    console.error(
      "[maileroo-webhook] WEBHOOK_MAILEROO_SECRET is not configured",
    );
    return json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (webhookSecret !== expectedSecret) {
    console.warn("[maileroo-webhook] Unauthorized - secret mismatch");
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse payload ---
  let payload: MailerooWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const {
    event: rawEvent,
    email,
    message_id: smtpMessageId,
    timestamp,
    reason,
    bounce_type,
  } = payload;

  if (!rawEvent) {
    return json({ error: "Missing event type" }, { status: 400 });
  }

  const eventType = mapEventType(rawEvent);

  // Acknowledge receipt immediately — 200 OK
  const response = json({ received: true, event: rawEvent, timestamp });

  // --- Process event fire-and-forget ---
  (async () => {
    try {
      const internalMessageId = await resolveInternalMessageId(
        smtpMessageId || "",
      );

      if (!internalMessageId) {
        console.warn(
          `[maileroo-webhook] Could not resolve internal message ID for SMTP message_id "${smtpMessageId}". ` +
            `Event "${rawEvent}" for "${email}" will be recorded with ID 0.`,
        );
      }

      const messageId = internalMessageId || 0;

      // Hard bounces get special handling: record event + suppress email
      if (rawEvent === "bounced" && bounce_type === "hard") {
        await emailTrackingService.processBounce(
          messageId,
          email || "",
          bounce_type,
          reason || "Hard bounce",
        );
        return;
      }

      // Spam complaints: suppress the email in addition to recording the event
      if (rawEvent === "complained" && email) {
        await emailTrackingService
          .suppressEmail(
            email,
            reason || "Spam complaint via Maileroo webhook",
            "hard",
          )
          .catch((err) => {
            console.error(
              "[maileroo-webhook] Failed to suppress complained email:",
              err,
            );
          });
      }

      // All other events: standard tracking record
      await emailTrackingService.recordTrackingEvent({
        messageId,
        eventType,
        bounceReason: reason,
        bounceType: bounce_type,
        metadata: {
          email,
          smtp_message_id: smtpMessageId,
          timestamp,
          source: "maileroo_webhook",
          original_event: rawEvent,
        },
      });
    } catch (error) {
      console.error("[maileroo-webhook] Error processing event:", error);
    }
  })();

  return response;
};
