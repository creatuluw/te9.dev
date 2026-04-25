/**
 * Email service - SMTP email sending with tracking and bounce suppression
 *
 * Sends emails via the internal /api/email/send endpoint, which uses emailjs
 * for direct SMTP transport. This keeps the emailjs dependency (Node.js only)
 * safely behind a server endpoint and prevents browser-bundle leaks.
 *
 * All methods return Result<T, AppError> for consistent error handling.
 */

import { updateRowsResult } from "$lib/utils/postgrest";
import {
  injectTrackingPixel,
  rewriteLinksForTracking,
  isEmailSuppressed,
  recordTrackingEvent,
} from "./emailTrackingService";
import * as eventLogService from "./eventLogService";
import type { Notification } from "./messageService";
import type { AppError } from "$lib/types/errors";
import { ValidationError, NetworkError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { z } from "zod";
import { renderEmailTemplate } from "$lib/templates/emails";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const EmailDataSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().optional(),
  text: z.string().optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().optional(),
  messageId: z.number().int().positive().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(),
        contentType: z.string(),
      }),
    )
    .optional(),
});

export interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  /** Optional internal message ID for tracking. If provided, tracking pixel and link rewriting are applied. */
  messageId?: number;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  data?: {
    messageId: string;
    status: string;
  };
  error?: string;
  details?: string;
  suppressed?: boolean;
}

// ---------------------------------------------------------------------------
// Internal: resolve the app URL for tracking pixel / link rewriting
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
// Core send
// ---------------------------------------------------------------------------

/**
 * Send email via the internal SMTP endpoint with tracking injection and
 * suppression checks.
 *
 * Pipeline: validate → check suppression → inject tracking → send → record event
 *
 * The actual SMTP delivery is handled by POST /api/email/send (server-only),
 * which uses the emailjs library. This keeps Node.js-only code out of the
 * browser bundle.
 */
export async function sendEmail(
  emailData: EmailData,
): Promise<Result<EmailResponse, AppError>> {
  // 1. Validate input
  const validation = EmailDataSchema.safeParse(emailData);
  if (!validation.success) {
    return err(
      ValidationError.create("Invalid email data", "emailData", emailData),
    );
  }

  // 2. Check suppression list for all recipients
  const recipients = Array.isArray(emailData.to)
    ? emailData.to
    : [emailData.to];
  for (const email of recipients) {
    const suppressed = await isEmailSuppressed(email);
    if (suppressed.success && suppressed.value) {
      console.warn(`[emailService] Skipping suppressed address: ${email}`);

      if (emailData.messageId) {
        recordTrackingEvent({
          messageId: emailData.messageId,
          eventType: "suppressed",
          metadata: { email, reason: "Address is on suppression list" },
        }).catch(console.error);
      }

      return ok({
        success: true,
        suppressed: true,
        data: { messageId: "suppressed", status: "suppressed" },
      });
    }
  }

  // 3. Prepare HTML with tracking injection
  let html = emailData.html;
  if (html && emailData.messageId) {
    html = injectTrackingPixel(html, emailData.messageId);
    html = rewriteLinksForTracking(html, emailData.messageId);
  }

  // 4. Send via internal SMTP endpoint
  const appUrl = getAppUrl();
  const payload = {
    to: emailData.to,
    subject: emailData.subject,
    html,
    text: emailData.text,
    fromEmail: emailData.fromEmail,
    fromName: emailData.fromName,
    attachments: emailData.attachments,
  };

  let smtpResult: { messageId: string; status: string };

  try {
    const response = await fetch(`${appUrl}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      return err(
        new NetworkError(
          `Email send failed (${response.status}): ${body}`,
          response.status,
          `${appUrl}/api/email/send`,
        ),
      );
    }

    const body = await response.json();
    smtpResult = {
      messageId: body.messageId || `smtp-${Date.now()}`,
      status: body.status || "sent",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return err(new NetworkError(`Email send request failed: ${msg}`));
  }

  // 5. Record sent event
  if (emailData.messageId) {
    recordTrackingEvent({
      messageId: emailData.messageId,
      eventType: "sent",
      metadata: {
        smtpMessageId: smtpResult.messageId,
        to: emailData.to,
      },
    }).catch(console.error);
  }

  return ok({
    success: true,
    data: smtpResult,
  });
}

// ---------------------------------------------------------------------------
// Status updates
// ---------------------------------------------------------------------------

/**
 * Update message status after email is sent
 */
export async function updateNotificationStatus(
  messageId: number,
  status: "sent" | "failed",
  errorMessage?: string,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(messageId) || messageId <= 0) {
    return err(
      ValidationError.create("Invalid message ID", "messageId", messageId),
    );
  }

  if (status !== "sent" && status !== "failed") {
    return err(ValidationError.create("Invalid status", "status", status));
  }

  const result = await updateRowsResult<Notification>(
    "_bpm_messages",
    { id: `eq.${messageId}` },
    {
      status,
      sent_at: status === "sent" ? new Date().toISOString() : undefined,
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  await eventLogService
    .logEvent("email_status_updated", "message", messageId, {
      newValues: { status, error_message: errorMessage },
    })
    .catch(console.error);

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

/**
 * Send email from a message record (creates email from stored message data).
 */
export async function sendEmailFromMessage(
  message: Notification,
): Promise<Result<EmailResponse, AppError>> {
  const emailData: EmailData = {
    to: message.recipient_email,
    subject: message.subject,
    html: message.body,
    text: stripHTML(message.body),
    messageId: message.id,
  };

  const result = await sendEmail(emailData);

  if (result.success) {
    await updateNotificationStatus(message.id, "sent").catch(console.error);
  } else {
    await updateNotificationStatus(
      message.id,
      "failed",
      result.error.message,
    ).catch(console.error);
  }

  return result;
}

/** Backward compatibility alias */
export const sendEmailFromNotification = sendEmailFromMessage;

/**
 * Send a test email with sample data.
 */
export async function sendTestEmail(
  to: string,
): Promise<Result<EmailResponse, AppError>> {
  if (!z.string().email().safeParse(to).success) {
    return err(ValidationError.create("Invalid email address", "to", to));
  }

  const html = renderEmailTemplate("test", {
    timestamp: new Date().toLocaleString(),
  });

  return await sendEmail({
    to,
    subject: "Test Email - Kees Business Process Management",
    html,
    text: "Dit is een test e-mail van het Kees Business Process Management systeem.\n\nAls je deze e-mail hebt ontvangen, werkt de e-mailservice correct!",
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags to create plain text version
 */
function stripHTML(html: string): string {
  if (typeof window === "undefined") {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
