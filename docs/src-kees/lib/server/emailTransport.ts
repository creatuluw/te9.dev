/**
 * Email Transport - SMTP transport module using emailjs
 *
 * Provides direct SMTP email sending, replacing the old email-backend HTTP API.
 * All methods return Result<T, AppError> for consistent error handling.
 */

import { SMTPClient, type MessageHeaders } from "emailjs";
import { ok, err, type Result } from "$lib/types/result";
import { NetworkError, ValidationError } from "$lib/types/errors";
import type { AppError } from "$lib/types/errors";

// Re-export for convenience
// Types SmtpSendResult, SmtpAttachment, SmtpEmailData are exported below

/**
 * SMTP configuration from environment variables
 */
function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || "smtp.maileroo.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || "no-reply@pippeloi.nl",
    fromName: process.env.SMTP_FROM_NAME || "Business Process Management",
  };
}

/**
 * Create an emailjs SMTP client with current configuration
 */
export function createSmtpClient(): SMTPClient {
  const config = getSmtpConfig();

  const isSSL = config.port === 465;

  return new SMTPClient({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    ssl: isSSL,
    tls: !isSSL,
    timeout: 30000,
  });
}

/**
 * SMTP send result
 */
export interface SmtpSendResult {
  messageId: string;
  status: "sent";
  to: string | string[];
  subject: string;
}

/**
 * Email attachment compatible with emailjs
 */
export interface SmtpAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
}

/**
 * Email data for SMTP sending
 */
export interface SmtpEmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  attachments?: SmtpAttachment[];
}

/**
 * Build emailjs MessageHeaders from SmtpEmailData
 */
function buildMessageHeaders(data: SmtpEmailData): MessageHeaders {
  const config = getSmtpConfig();

  const fromEmail = data.fromEmail || config.fromEmail;
  const fromName = data.fromName || config.fromName;

  const to = Array.isArray(data.to) ? data.to.join(", ") : data.to;

  const headers: MessageHeaders = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: data.subject,
  };

  if (data.text) {
    headers.text = data.text;
  }

  if (data.html) {
    headers.attachment = [
      {
        data: data.html,
        alternative: true,
        contentType: "text/html",
      },
    ];
  }

  // Add file attachments
  if (data.attachments && data.attachments.length > 0) {
    // Use a local array to avoid calling .push() on the complex union type
    const existingAttachments = Array.isArray(headers.attachment)
      ? [...(headers.attachment as Array<any>)]
      : [];

    for (const att of data.attachments) {
      // Decode base64 content to Buffer
      const buffer = Buffer.from(att.content, "base64");
      existingAttachments.push({
        data: buffer.toString("binary"),
        type: att.contentType,
        name: att.filename,
      });
    }
    headers.attachment = existingAttachments;
  }

  // If only HTML is provided, generate a basic text fallback
  if (!data.text && data.html) {
    headers.text = data.html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
  }

  return headers;
}

/**
 * Send an email via SMTP using emailjs
 *
 * @param data - Email data to send
 * @returns Result containing send result, or error
 *
 * @example
 * ```typescript
 * const result = await smtpSend({
 *   to: 'user@example.com',
 *   subject: 'Test Email',
 *   html: '<p>Hello</p>',
 * });
 * if (result.success) {
 *   console.log('Sent:', result.value.messageId);
 * }
 * ```
 */
export async function smtpSend(
  data: SmtpEmailData,
): Promise<Result<SmtpSendResult, AppError>> {
  // Validate SMTP configuration
  const config = getSmtpConfig();
  if (!config.user || !config.password) {
    return err(
      ValidationError.create(
        "SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.",
        "smtp_config",
      ),
    );
  }

  // Validate required fields
  if (!data.to || (Array.isArray(data.to) && data.to.length === 0)) {
    return err(
      ValidationError.create("Recipient (to) is required", "to", data.to),
    );
  }

  if (!data.subject) {
    return err(ValidationError.create("Subject is required", "subject"));
  }

  if (!data.html && !data.text) {
    return err(
      ValidationError.create("Either html or text body is required", "body"),
    );
  }

  // Validate email addresses
  const recipients = Array.isArray(data.to) ? data.to : [data.to];
  for (const email of recipients) {
    if (!email.includes("@") || !email.includes(".")) {
      return err(
        ValidationError.create(`Invalid email address: ${email}`, "to", email),
      );
    }
  }

  const client = createSmtpClient();

  try {
    const headers = buildMessageHeaders(data);

    const message = await client.sendAsync(headers);

    return ok({
      messageId:
        (message.header as Record<string, string | undefined>)?.[
          "message-id"
        ] || `smtp-${Date.now()}`,
      status: "sent" as const,
      to: data.to,
      subject: data.subject,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Map common SMTP errors to more descriptive messages
    let description = errorMessage;
    if (errorMessage.includes("ECONNREFUSED")) {
      description = `SMTP connection refused at ${config.host}:${config.port}. Check SMTP_HOST and SMTP_PORT.`;
    } else if (
      errorMessage.includes("EAUTH") ||
      errorMessage.includes("auth")
    ) {
      description =
        "SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD.";
    } else if (
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("timeout")
    ) {
      description = `SMTP connection timed out connecting to ${config.host}:${config.port}.`;
    } else if (errorMessage.includes("ENOTFOUND")) {
      description = `SMTP host not found: ${config.host}. Check SMTP_HOST.`;
    }

    console.error("[emailTransport] SMTP send failed:", description, {
      error: errorMessage,
    });

    return err(new NetworkError(description));
  } finally {
    try {
      client.smtp.close();
    } catch {
      // Connection may already be closed
    }
  }
}

/**
 * Test SMTP connectivity by attempting to connect
 * Useful for health checks and configuration validation
 *
 * @returns Result with connection details, or error
 */
export async function testSmtpConnection(): Promise<
  Result<{ host: string; port: number; connected: boolean }, AppError>
> {
  const config = getSmtpConfig();

  if (!config.user || !config.password) {
    return err(
      ValidationError.create("SMTP credentials not configured", "smtp_config"),
    );
  }

  const client = createSmtpClient();

  try {
    // Try to send a no-op message to test connectivity
    // emailjs will authenticate during the connection
    await client.sendAsync({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: config.fromEmail, // Send to self for testing
      subject: "__SMTP_CONNECTION_TEST__",
      text: "This is a connectivity test and can be ignored.",
    });

    return ok({
      host: config.host,
      port: config.port,
      connected: true,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return err(
      new NetworkError(`SMTP connection test failed: ${errorMessage}`),
    );
  } finally {
    try {
      client.smtp.close();
    } catch {
      // Connection may already be closed
    }
  }
}

/**
 * Get current SMTP configuration (for debugging, without exposing password)
 */
export function getSmtpStatus(): {
  host: string;
  port: number;
  user: string;
  fromEmail: string;
  fromName: string;
  configured: boolean;
} {
  const config = getSmtpConfig();
  return {
    host: config.host,
    port: config.port,
    user: config.user ? `${config.user.substring(0, 3)}***` : "(not set)",
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    configured: !!(config.user && config.password),
  };
}
