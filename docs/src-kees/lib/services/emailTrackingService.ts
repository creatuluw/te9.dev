/**
 * Email Tracking Service - Open tracking, click tracking, bounce suppression
 *
 * Provides tracking pixel injection, link rewriting, event recording,
 * and bounce suppression for the email system.
 *
 * All methods return Result<T, AppError> for consistent error handling.
 */

import {
  insertRowResult,
  queryTableResult,
  deleteRowsResult,
} from "$lib/utils/postgrest";
import * as eventLogService from "./eventLogService";
import { ok, err, type Result } from "$lib/types/result";
import { ValidationError, NotFoundError } from "$lib/types/errors";
import type { AppError } from "$lib/types/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackingEventType =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "failed"
  | "suppressed"
  | "unknown";

export interface EmailTrackingEvent {
  id: string;
  message_id: number;
  event_type: TrackingEventType;
  tracked_at: string;
  url?: string;
  ip_address?: string;
  user_agent?: string;
  bounce_reason?: string;
  bounce_type?: "hard" | "soft";
  metadata?: Record<string, unknown>;
}

export interface EmailSuppression {
  id: string;
  email: string;
  reason: string;
  bounce_type?: "hard" | "soft";
  suppressed_at: string;
  metadata?: Record<string, unknown>;
}

export interface TrackingEventData {
  messageId: number;
  eventType: TrackingEventType;
  url?: string;
  ipAddress?: string;
  userAgent?: string;
  bounceReason?: string;
  bounceType?: "hard" | "soft";
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.ORIGIN ||
    "https://kees.pippeloi.nl"
  );
}

// ---------------------------------------------------------------------------
// Pixel Injection
// ---------------------------------------------------------------------------

/**
 * Inject a 1x1 transparent PNG tracking pixel into HTML email body.
 * The pixel is inserted just before </body>, or appended to the end if no </body> tag.
 *
 * @param html - HTML email content
 * @param messageId - Message ID for the tracking pixel URL
 * @returns HTML with tracking pixel injected
 */
export function injectTrackingPixel(html: string, messageId: number): string {
  if (!html || !messageId) return html;

  const appUrl = getAppUrl();
  const pixelUrl = `${appUrl}/api/email/track/open/${messageId}.png`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;outline:none;text-decoration:none;" />`;

  // Insert before </body> if it exists
  const bodyCloseIndex = html.toLowerCase().lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return (
      html.slice(0, bodyCloseIndex) + pixelTag + html.slice(bodyCloseIndex)
    );
  }

  // No </body> tag — append to end
  return html + pixelTag;
}

// ---------------------------------------------------------------------------
// Link Rewriting
// ---------------------------------------------------------------------------

/**
 * Rewrite all href links in HTML email to pass through the click tracking redirect.
 *
 * Links matching the app's own domain are NOT rewritten (avoid double-tracking).
 * Mailto:, tel:, and anchor-only links are skipped.
 *
 * @param html - HTML email content
 * @param messageId - Message ID for the tracking redirect URL
 * @returns HTML with rewritten links
 */
export function rewriteLinksForTracking(
  html: string,
  messageId: number,
): string {
  if (!html || !messageId) return html;

  const appUrl = getAppUrl();
  const trackBaseUrl = `${appUrl}/api/email/track/click/${messageId}`;

  // Match href="..." and href='...' attributes
  const hrefRegex = /href=["']([^"']+)["']/gi;

  return html.replace(hrefRegex, (match, url: string) => {
    // Skip non-HTTP links
    if (
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("#") ||
      url.startsWith("cid:") ||
      url.startsWith("data:")
    ) {
      return match;
    }

    // Skip URLs that are already tracking URLs (prevent double-rewriting)
    if (url.includes("/api/email/track/click/")) {
      return match;
    }

    // Encode the original URL
    const encodedUrl = encodeURIComponent(url);
    return `href="${trackBaseUrl}?url=${encodedUrl}"`;
  });
}

// ---------------------------------------------------------------------------
// Event Recording
// ---------------------------------------------------------------------------

/**
 * Record a tracking event in the database.
 *
 * @param data - Tracking event data
 * @returns Result containing the recorded event, or error
 */
export async function recordTrackingEvent(
  data: TrackingEventData,
): Promise<Result<EmailTrackingEvent, AppError>> {
  if (!data.messageId || data.messageId <= 0) {
    return err(
      ValidationError.create("Invalid message ID", "messageId", data.messageId),
    );
  }

  if (!data.eventType) {
    return err(ValidationError.create("Event type is required", "eventType"));
  }

  try {
    const row: Record<string, unknown> = {
      message_id: data.messageId,
      event_type: data.eventType,
      tracked_at: new Date().toISOString(),
    };

    if (data.url) row.url = data.url;
    if (data.ipAddress) row.ip_address = data.ipAddress;
    if (data.userAgent) row.user_agent = data.userAgent;
    if (data.bounceReason) row.bounce_reason = data.bounceReason;
    if (data.bounceType) row.bounce_type = data.bounceType;
    if (data.metadata) row.metadata = JSON.stringify(data.metadata);

    const result = await insertRowResult<EmailTrackingEvent>(
      "_bpm_email_tracking",
      row,
    );

    if (!result.success) {
      console.error(
        "[emailTrackingService] Failed to record tracking event:",
        result.error,
      );
      return err(result.error);
    }

    return ok(result.value);
  } catch (error) {
    console.error("[emailTrackingService] recordTrackingEvent error:", error);
    return err(error as AppError);
  }
}

/**
 * Get all tracking events for a specific message, ordered by tracked_at.
 *
 * @param messageId - Message ID to get events for
 * @returns Result containing array of tracking events
 */
export async function getTrackingEventsForMessage(
  messageId: number,
): Promise<Result<EmailTrackingEvent[], AppError>> {
  if (!messageId || messageId <= 0) {
    return err(
      ValidationError.create("Invalid message ID", "messageId", messageId),
    );
  }

  const result = await queryTableResult<EmailTrackingEvent>(
    "_bpm_email_tracking",
    {
      filter: { message_id: `eq.${messageId}` },
      order: "tracked_at.asc",
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get aggregate tracking statistics.
 *
 * @param options - Filter options (date range, etc.)
 * @returns Result containing aggregate counts per event type
 */
export async function getTrackingStats(options?: {
  since?: string;
  until?: string;
}): Promise<Result<Record<TrackingEventType, number>, AppError>> {
  try {
    const filter: Record<string, string> = {};
    if (options?.since) filter["tracked_at"] = `gte.${options.since}`;
    if (options?.until) {
      filter["tracked_at"] = filter["tracked_at"]
        ? `${filter["tracked_at"]},lte.${options.until}`
        : `lte.${options.until}`;
    }

    const result = await queryTableResult<EmailTrackingEvent>(
      "_bpm_email_tracking",
      { filter, select: "event_type" },
    );

    if (!result.success) {
      return err(result.error);
    }

    const stats: Record<string, number> = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      suppressed: 0,
      unknown: 0,
    };

    for (const event of result.value.data) {
      const type = event.event_type || "unknown";
      stats[type] = (stats[type] || 0) + 1;
    }

    return ok(stats as Record<TrackingEventType, number>);
  } catch (error) {
    return err(error as AppError);
  }
}

// ---------------------------------------------------------------------------
// Bounce Suppression
// ---------------------------------------------------------------------------

/**
 * Check if an email address is suppressed (should not receive emails).
 *
 * @param email - Email address to check
 * @returns Result containing boolean (true = suppressed)
 */
export async function isEmailSuppressed(
  email: string,
): Promise<Result<boolean, AppError>> {
  if (!email) {
    return err(ValidationError.create("Email is required", "email"));
  }

  const result = await queryTableResult<EmailSuppression>(
    "_bpm_email_suppressions",
    {
      filter: { email: `eq.${email.toLowerCase().trim()}` },
      limit: 1,
    },
  );

  if (!result.success) {
    console.error(
      "[emailTrackingService] isEmailSuppressed query failed:",
      result.error,
    );
    // On error, don't block sending — return false
    return ok(false);
  }

  return ok(result.value.data.length > 0);
}

/**
 * Add an email address to the suppression list.
 * Typically called when a hard bounce is received.
 *
 * @param email - Email address to suppress
 * @param reason - Reason for suppression
 * @param bounceType - 'hard' or 'soft'
 * @returns Result containing the suppression record, or error
 */
export async function suppressEmail(
  email: string,
  reason: string,
  bounceType?: "hard" | "soft",
): Promise<Result<EmailSuppression, AppError>> {
  if (!email) {
    return err(ValidationError.create("Email is required", "email"));
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already suppressed
  const existingResult = await isEmailSuppressed(normalizedEmail);
  if (existingResult.success && existingResult.value) {
    // Already suppressed — return success (idempotent)
    const existing = await queryTableResult<EmailSuppression>(
      "_bpm_email_suppressions",
      { filter: { email: `eq.${normalizedEmail}` }, limit: 1 },
    );
    if (existing.success && existing.value.data.length > 0) {
      return ok(existing.value.data[0]);
    }
  }

  const result = await insertRowResult<EmailSuppression>(
    "_bpm_email_suppressions",
    {
      email: normalizedEmail,
      reason,
      bounce_type: bounceType || "hard",
      suppressed_at: new Date().toISOString(),
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // Log the suppression event
  await eventLogService
    .logEvent("email_suppressed", "email_suppression", 0, {
      newValues: { email: normalizedEmail, reason, bounce_type: bounceType },
    })
    .catch(console.error);

  return ok(result.value);
}

/**
 * Remove an email address from the suppression list.
 * Used when an admin wants to manually allow sending to a previously bounced address.
 *
 * @param email - Email address to unsuppress
 * @returns Result indicating success
 */
export async function removeSuppression(
  email: string,
): Promise<Result<void, AppError>> {
  if (!email) {
    return err(ValidationError.create("Email is required", "email"));
  }

  const normalizedEmail = email.toLowerCase().trim();

  const result = await deleteRowsResult("_bpm_email_suppressions", {
    email: `eq.${normalizedEmail}`,
  });

  if (!result.success) {
    return err(result.error);
  }

  // Log the removal
  await eventLogService
    .logEvent("email_suppression_removed", "email_suppression", 0, {
      newValues: { email: normalizedEmail },
    })
    .catch(console.error);

  return ok(undefined);
}

/**
 * Get all suppressed email addresses.
 *
 * @param options - Pagination/filter options
 * @returns Result containing array of suppression records
 */
export async function getSuppressedAddresses(options?: {
  limit?: number;
  offset?: number;
}): Promise<Result<EmailSuppression[], AppError>> {
  const result = await queryTableResult<EmailSuppression>(
    "_bpm_email_suppressions",
    {
      order: "suppressed_at.desc",
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Process a bounce event — record it and trigger suppression if hard bounce.
 *
 * @param messageId - Message ID that bounced
 * @param email - Recipient email that bounced
 * @param bounceType - 'hard' or 'soft'
 * @param reason - Bounce reason from SMTP
 */
export async function processBounce(
  messageId: number,
  email: string,
  bounceType: "hard" | "soft",
  reason: string,
): Promise<Result<void, AppError>> {
  // Record the bounce event
  const eventResult = await recordTrackingEvent({
    messageId,
    eventType: "bounced",
    bounceType,
    bounceReason: reason,
    metadata: { email },
  });

  if (!eventResult.success) {
    console.error(
      "[emailTrackingService] Failed to record bounce event:",
      eventResult.error,
    );
  }

  // Only suppress for hard bounces
  if (bounceType === "hard") {
    const suppressResult = await suppressEmail(email, reason, bounceType);
    if (!suppressResult.success) {
      console.error(
        "[emailTrackingService] Failed to suppress email:",
        suppressResult.error,
      );
    }
  }

  return ok(undefined);
}
