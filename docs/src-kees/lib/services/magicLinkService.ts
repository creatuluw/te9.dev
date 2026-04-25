/**
 * Magic link service - Passwordless authentication for viewing support tickets
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  insertRowResult,
  queryTableResult,
  updateRowsResult,
  getRowByIdResult,
} from "$lib/utils/postgrest";
import * as emailService from "./emailService";
import * as eventLogService from "./eventLogService";
import type { AppError } from "$lib/types/errors";
import { ValidationError, NotFoundError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import { z } from "zod";
import type { MagicLink, CreateMagicLinkInput } from "$lib/schemas/magicLink";
import type { Task } from "$lib/schemas/task";
import { renderEmailTemplate } from "$lib/templates/emails";

/**
 * Generate a secure random token using Web Crypto API
 * Returns a URL-safe base64 encoded string
 */
function generateSecureToken(): string {
  // Generate 32 random bytes
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);

  // Convert to base64url (URL-safe base64)
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Generate magic link and send email
 *
 * @param email - Email address to send magic link to
 * @param baseUrl - Base URL for the application (e.g., https://kees.pippeloi.nl)
 * @returns Result containing magic link record, or error if generation fails
 *
 * @example
 * ```typescript
 * const result = await generateMagicLink('user@example.com', 'https://kees.pippeloi.nl');
 * if (result.success) {
 *   console.log('Magic link sent');
 * }
 * ```
 */
export async function generateMagicLink(
  email: string,
  baseUrl: string,
): Promise<Result<MagicLink, AppError>> {
  // Validate email
  const emailSchema = z.object({
    email: z.string().email("Ongeldig e-mailadres"),
  });
  const validation = emailSchema.safeParse({ email });
  if (!validation.success) {
    return err(
      ValidationError.create(
        validation.error.issues[0]?.message || "Ongeldig e-mailadres",
        "email",
        email,
      ),
    );
  }

  // Check rate limiting: max 20 requests per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentLinksResult = await queryTableResult<MagicLink>(
    "_bpm_magic_links",
    {
      filter: {
        email: `eq.${email}`,
        created_at: `gte.${oneHourAgo}`,
      },
    },
  );

  if (recentLinksResult.success && recentLinksResult.value.data.length >= 20) {
    return err(
      ValidationError.create(
        "Te veel verzoeken. Probeer het over een uur opnieuw.",
        "email",
        email,
      ),
    );
  }

  // Generate secure token
  const token = generateSecureToken();

  // Set expiration to 24 hours from now
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // Store magic link in database
  const insertResult = await insertRowResult<MagicLink>("_bpm_magic_links", {
    token,
    email,
    used: false,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });

  if (!insertResult.success) {
    return err(insertResult.error);
  }

  const magicLink = insertResult.value;

  // Generate magic link URL
  const magicLinkUrl = `${baseUrl}/help?tab=bekijken&token=${token}`;

  // Load email template
  const emailHtml = getMagicLinkEmailTemplate(magicLinkUrl);

  // Send email
  const emailResult = await emailService.sendEmail({
    to: email,
    subject: "Toegang tot uw support tickets",
    html: emailHtml,
    text: `Klik op de volgende link om uw support tickets te bekijken: ${magicLinkUrl}\n\nDeze link is 24 uur geldig en kan meerdere keren worden gebruikt binnen deze periode.`,
  });

  if (!emailResult.success) {
    // Log detailed error
    console.error("[magicLinkService] Failed to send magic link email:", {
      email,
      error: emailResult.error,
      errorMessage: emailResult.error?.message,
      errorCode: emailResult.error?.code,
      errorDetails: emailResult.error?.details,
    });

    // If email service is not configured, return error immediately
    if (
      emailResult.error?.message?.includes(
        "EMAIL_SERVICE_TOKEN is not configured",
      ) ||
      emailResult.error?.message?.includes("not configured")
    ) {
      return err(
        ValidationError.create(
          "E-mail service is niet geconfigureerd. Neem contact op met de beheerder.",
          "email_service",
          email,
        ),
      );
    }

    // For other email errors, still return success as token exists
    // User can request a new link if needed, but log the error
    console.warn(
      "[magicLinkService] Email failed but token created. User can request new link.",
    );

    // Log failed email attempt to event log
    eventLogService
      .logEvent("magic_link_email_failed", "magic_link", magicLink.id, {
        metadata: {
          email,
          error: emailResult.error?.message || "Unknown error",
          errorCode: emailResult.error?.code,
        },
        sourceUrl: baseUrl,
      })
      .catch(console.error);
  } else {
    console.log(
      "[magicLinkService] Magic link email sent successfully to:",
      email,
    );

    // Log successful email sent to event log
    eventLogService
      .logEvent("magic_link_email_sent", "magic_link", magicLink.id, {
        newValues: {
          email,
          expires_at: expiresAt,
          token: token.substring(0, 10) + "...", // Only log partial token for security
        },
        metadata: {
          expires_in_hours: 24,
        },
        sourceUrl: baseUrl,
      })
      .catch(console.error);
  }

  return ok(magicLink);
}

/**
 * Validate magic link token (reusable within expiration period)
 *
 * @param token - Magic link token to validate
 * @returns Result containing email address if token is valid, or error if invalid/expired
 *
 * @example
 * ```typescript
 * const result = await validateMagicLink('abc123...');
 * if (result.success) {
 *   const email = result.value;
 *   // Use email to fetch tickets
 * }
 * ```
 */
export async function validateMagicLink(
  token: string,
): Promise<Result<string, AppError>> {
  if (!token || token.trim() === "") {
    return err(ValidationError.create("Token is vereist", "token", token));
  }

  // Find magic link by token
  const linksResult = await queryTableResult<MagicLink>("_bpm_magic_links", {
    filter: {
      token: `eq.${token}`,
    },
    limit: 1,
  });

  if (!linksResult.success) {
    return err(linksResult.error);
  }

  if (linksResult.value.data.length === 0) {
    return err(NotFoundError.resource("Magic link", token));
  }

  const magicLink = linksResult.value.data[0];

  // Check if expired (links are reusable within expiration period)
  // Parse expires_at - handle both ISO string and Date object
  // PostgreSQL TIMESTAMP is returned as ISO string by PostgREST
  let expiresAt: Date;
  try {
    // expires_at is always a string (ISO datetime from PostgreSQL)
    expiresAt = new Date(magicLink.expires_at);

    // Validate the date is valid
    if (isNaN(expiresAt.getTime())) {
      console.error(
        "[magicLinkService] Invalid expiration date:",
        magicLink.expires_at,
      );
      return err(
        ValidationError.create(
          "Ongeldige link. Vraag een nieuwe link aan.",
          "token",
          token,
        ),
      );
    }
  } catch (error) {
    console.error(
      "[magicLinkService] Error parsing expiration date:",
      error,
      magicLink.expires_at,
    );
    return err(
      ValidationError.create(
        "Ongeldige link. Vraag een nieuwe link aan.",
        "token",
        token,
      ),
    );
  }

  const now = new Date();

  // Debug logging
  console.log("[magicLinkService] Validating magic link:", {
    token: token.substring(0, 10) + "...",
    magic_link_id: magicLink.id,
    expires_at_raw: magicLink.expires_at,
    expires_at_type: typeof magicLink.expires_at,
    expiresAt: expiresAt.toISOString(),
    now: now.toISOString(),
    isExpired: now > expiresAt,
    timeUntilExpiry_ms: expiresAt.getTime() - now.getTime(),
    hoursUntilExpiry: (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60),
    created_at: magicLink.created_at,
  });

  // Check if expired - add small buffer to account for clock skew
  if (now.getTime() > expiresAt.getTime()) {
    const diffMs = now.getTime() - expiresAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    console.log("[magicLinkService] Link expired:", {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      diff_ms: diffMs,
      diff_hours: diffHours,
      created_at: magicLink.created_at,
    });

    // Log expired link access attempt
    eventLogService
      .logEvent("magic_link_expired_access", "magic_link", magicLink.id, {
        metadata: {
          email: magicLink.email,
          expires_at: magicLink.expires_at,
          attempted_at: now.toISOString(),
          expired_by_hours: diffHours,
        },
      })
      .catch(console.error);

    return err(
      ValidationError.create(
        "Deze link is verlopen. Vraag een nieuwe link aan.",
        "token",
        token,
      ),
    );
  }

  // Log successful magic link access
  eventLogService
    .logEvent("magic_link_accessed", "magic_link", magicLink.id, {
      metadata: {
        email: magicLink.email,
        expires_at: magicLink.expires_at,
        accessed_at: now.toISOString(),
        time_until_expiry_hours:
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60),
      },
    })
    .catch(console.error);

  // Return email without marking as used (link can be reused within expiration period)
  return ok(magicLink.email);
}

/**
 * Get all tickets (work items) for an email address
 *
 * @param email - Email address to get tickets for
 * @returns Result containing array of work items where komt_van matches email
 *
 * @example
 * ```typescript
 * const result = await getTicketsByEmail('user@example.com');
 * if (result.success) {
 *   const tickets = result.value;
 * }
 * ```
 */
export async function getTicketsByEmail(
  email: string,
): Promise<Result<Task[], AppError>> {
  if (!email || !email.includes("@")) {
    return err(ValidationError.create("Ongeldig e-mailadres", "email", email));
  }

  // Get all tickets for this email with task_type = 'help'
  const result = await queryTableResult<Task>("_bpm_tasks", {
    filter: {
      komt_van: `eq.${email}`,
      task_type: "eq.help",
    },
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  // Return all tickets (already filtered by task_type='help' in the query)
  return ok(result.value.data);
}

/**
 * Generate magic link email HTML template
 */
function getMagicLinkEmailTemplate(magicLinkUrl: string): string {
  return renderEmailTemplate("magic-link", {
    magicLinkUrl,
  });
}
