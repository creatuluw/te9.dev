/**
 * POST /api/email/send - Server-only SMTP send endpoint
 *
 * This is the actual email delivery point. It uses emailjs for direct SMTP
 * transport and is kept as a server-only route so the emailjs Node.js
 * dependency never leaks into the browser bundle.
 *
 * The emailService.ts calls this endpoint via fetch() from both server-side
 * and client-side code, keeping the transport layer cleanly separated.
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { SMTPClient, type MessageHeaders } from "emailjs";
import { env } from "$env/dynamic/private";

// ---------------------------------------------------------------------------
// SMTP Configuration
// ---------------------------------------------------------------------------

function getSmtpConfig() {
  return {
    host: env.SMTP_HOST || "smtp.maileroo.com",
    port: parseInt(env.SMTP_PORT || "587", 10),
    user: env.SMTP_USER || "",
    password: env.SMTP_PASSWORD || "",
    fromEmail: env.SMTP_FROM_EMAIL || "no-reply@pippeloi.nl",
    fromName: env.SMTP_FROM_NAME || "Business Process Management",
  };
}

// ---------------------------------------------------------------------------
// Request body type
// ---------------------------------------------------------------------------

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    contentType: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHeaders(data: SendEmailRequest): MessageHeaders {
  const cfg = getSmtpConfig();
  const fromEmail = data.fromEmail || cfg.fromEmail;
  const fromName = data.fromName || cfg.fromName;
  const to = Array.isArray(data.to) ? data.to.join(", ") : data.to;

  const headers: MessageHeaders = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: data.subject,
  };

  if (data.text) {
    headers.text = data.text;
  }

  // Build attachments array separately to avoid complex union type issues
  const attachments: Array<{
    data: string;
    alternative?: boolean;
    contentType?: string;
    type?: string;
    name?: string;
  }> = [];

  if (data.html) {
    attachments.push({
      data: data.html,
      alternative: true,
      contentType: "text/html",
    });
  }

  if (data.attachments && data.attachments.length > 0) {
    for (const att of data.attachments) {
      const buffer = Buffer.from(att.content, "base64");
      attachments.push({
        data: buffer.toString("binary"),
        type: att.contentType,
        name: att.filename,
      });
    }
  }

  if (attachments.length > 0) {
    headers.attachment = attachments;
  }

  // Auto-generate plain text fallback from HTML
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

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const POST: RequestHandler = async ({ request }) => {
  const cfg = getSmtpConfig();

  // Validate SMTP credentials
  if (!cfg.user || !cfg.password) {
    return json(
      {
        error: "SMTP not configured",
        details: "Set SMTP_USER and SMTP_PASSWORD environment variables",
      },
      { status: 503 },
    );
  }

  // Parse request body
  let body: SendEmailRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.to) {
    return json({ error: "Missing required field: to" }, { status: 400 });
  }
  if (!body.subject) {
    return json({ error: "Missing required field: subject" }, { status: 400 });
  }
  if (!body.html && !body.text) {
    return json(
      { error: "Missing required field: html or text" },
      { status: 400 },
    );
  }

  // Create SMTP client
  const isSSL = cfg.port === 465;
  const client = new SMTPClient({
    user: cfg.user,
    password: cfg.password,
    host: cfg.host,
    port: cfg.port,
    ssl: isSSL,
    tls: !isSSL,
    timeout: 30000,
  });

  try {
    const headers = buildHeaders(body);
    const message = await client.sendAsync(headers);

    const messageId =
      (message.header as Record<string, string | undefined>)?.["message-id"] ||
      `smtp-${Date.now()}`;

    return json({
      success: true,
      messageId,
      status: "sent",
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // Map common SMTP errors to user-friendly messages
    let description = errMsg;
    if (errMsg.includes("ECONNREFUSED")) {
      description = `SMTP connection refused at ${cfg.host}:${cfg.port}`;
    } else if (errMsg.includes("EAUTH") || errMsg.includes("auth")) {
      description =
        "SMTP authentication failed — check SMTP_USER and SMTP_PASSWORD";
    } else if (errMsg.includes("ETIMEDOUT") || errMsg.includes("timeout")) {
      description = `SMTP connection timed out (${cfg.host}:${cfg.port})`;
    } else if (errMsg.includes("ENOTFOUND")) {
      description = `SMTP host not found: ${cfg.host}`;
    }

    console.error("[/api/email/send] SMTP send failed:", description);

    return json({ error: description, details: errMsg }, { status: 502 });
  } finally {
    try {
      client.smtp.close();
    } catch {
      // Connection may already be closed
    }
  }
};
