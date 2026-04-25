/**
 * Email service - SMTP email sending for te9.dev
 *
 * Provides email sending with validation, template rendering, and convenience methods.
 * Uses the server-only emailTransport module for actual SMTP delivery via emailjs.
 *
 * All methods return Result<T, AppError> for consistent error handling.
 */

import { smtpSend, type SmtpEmailData } from "$lib/server/emailTransport";
import { renderEmailTemplate } from "$lib/templates/emails";
import { ok, err, type Result } from "$lib/types/result";
import { ValidationError, NetworkError } from "$lib/types/errors";
import type { AppError } from "$lib/types/errors";
import { z } from "zod";
import { generatePlainText } from "$lib/utils/emailTemplateUtils";

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
}

// ---------------------------------------------------------------------------
// Core send
// ---------------------------------------------------------------------------

/**
 * Send an email via SMTP with input validation.
 *
 * Pipeline: validate → send → return result
 *
 * The actual SMTP delivery is handled by emailTransport.smtpSend (server-only),
 * which uses the emailjs library.
 *
 * @param emailData - Email data including recipients, subject, and body
 * @returns Result containing EmailResponse or AppError
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   html: '<p>Welcome!</p>',
 * });
 * if (result.success) {
 *   console.log('Sent:', result.value.data?.messageId);
 * }
 * ```
 */
export async function sendEmail(
  emailData: EmailData,
): Promise<Result<EmailResponse, AppError>> {
  // 1. Validate input
  const validation = EmailDataSchema.safeParse(emailData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return err(
      ValidationError.create(
        firstError?.message || "Invalid email data",
        firstError?.path.join(".") || "emailData",
        emailData,
      ),
    );
  }

  // 2. Ensure there's a body
  if (!emailData.html && !emailData.text) {
    return err(
      ValidationError.create(
        "Either html or text body is required",
        "body",
        emailData,
      ),
    );
  }

  // 3. Build SMTP payload
  const payload: SmtpEmailData = {
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
    fromEmail: emailData.fromEmail,
    fromName: emailData.fromName,
    attachments: emailData.attachments,
  };

  // 4. Send via SMTP transport
  const smtpResult = await smtpSend(payload);

  if (!smtpResult.success) {
    return err(smtpResult.error);
  }

  return ok({
    success: true,
    data: {
      messageId: smtpResult.value.messageId,
      status: smtpResult.value.status,
    },
  });
}

// ---------------------------------------------------------------------------
// Template-based send
// ---------------------------------------------------------------------------

/**
 * Send an email using a named template with variable substitution.
 *
 * Renders the template with the provided data, then sends the resulting HTML.
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param templateName - Name of the template (e.g. 'test', 'welcome', 'invitation')
 * @param templateData - Key-value pairs to substitute into the template
 * @param options - Optional email settings (fromEmail, fromName, etc.)
 * @returns Result containing EmailResponse or AppError
 *
 * @example
 * ```typescript
 * const result = await sendTemplateEmail(
 *   'user@example.com',
 *   'Welcome!',
 *   'welcome',
 *   { name: 'John', loginUrl: 'https://te9.dev/login' },
 * );
 * ```
 */
export async function sendTemplateEmail(
  to: string | string[],
  subject: string,
  templateName: string,
  templateData: Record<string, string>,
  options?: {
    fromEmail?: string;
    fromName?: string;
    text?: string;
  },
): Promise<Result<EmailResponse, AppError>> {
  let html: string;

  try {
    html = renderEmailTemplate(templateName, templateData);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to render email template";
    return err(ValidationError.create(message, "templateName", templateName));
  }

  const text = options?.text || generatePlainText(html);

  return sendEmail({
    to,
    subject,
    html,
    text,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
  });
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------

/**
 * Send a test email with sample data.
 * Useful for verifying SMTP configuration and email delivery.
 *
 * @param to - Recipient email address
 * @returns Result containing EmailResponse or AppError
 */
export async function sendTestEmail(
  to: string,
): Promise<Result<EmailResponse, AppError>> {
  if (!z.string().email().safeParse(to).success) {
    return err(ValidationError.create("Invalid email address", "to", to));
  }

  return sendTemplateEmail(to, "Test Email — te9.dev", "test", {
    timestamp: new Date().toLocaleString(),
  });
}

/**
 * Send a welcome email to a new user.
 *
 * @param to - Recipient email address
 * @param name - User's display name
 * @param loginUrl - URL to the login page
 * @returns Result containing EmailResponse or AppError
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  loginUrl: string,
): Promise<Result<EmailResponse, AppError>> {
  return sendTemplateEmail(to, "Welcome to te9.dev", "welcome", {
    name,
    loginUrl,
  });
}

/**
 * Send a password reset email.
 *
 * @param to - Recipient email address
 * @param name - User's display name
 * @param resetLink - Password reset URL (includes token)
 * @param expiresInHours - Number of hours until the link expires
 * @returns Result containing EmailResponse or AppError
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetLink: string,
  expiresInHours: string = "24",
): Promise<Result<EmailResponse, AppError>> {
  return sendTemplateEmail(to, "Reset your password", "password-reset", {
    name,
    resetLink,
    expiresInHours,
  });
}

/**
 * Send a magic link email for passwordless authentication.
 *
 * @param to - Recipient email address
 * @param magicLinkUrl - Magic link URL (includes token)
 * @returns Result containing EmailResponse or AppError
 */
export async function sendMagicLinkEmail(
  to: string,
  magicLinkUrl: string,
): Promise<Result<EmailResponse, AppError>> {
  return sendTemplateEmail(to, "Your login link", "magic-link", {
    magicLinkUrl,
  });
}

/**
 * Send an invitation email.
 *
 * @param to - Recipient email address
 * @param invitationLink - Invitation acceptance URL
 * @param expiresInHours - Number of hours until the invitation expires
 * @returns Result containing EmailResponse or AppError
 */
export async function sendInvitationEmail(
  to: string,
  invitationLink: string,
  expiresInHours: string = "48",
): Promise<Result<EmailResponse, AppError>> {
  return sendTemplateEmail(to, "You're invited!", "invitation", {
    invitationLink,
    expiresInHours,
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags to create a plain text version.
 * Delegates to generatePlainText from emailTemplateUtils.
 */
export { generatePlainText as stripHTML };
