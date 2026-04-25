/**
 * Send a test email using the email service
 *
 * Usage:
 *   npx tsx scripts/send-test-email.ts
 *   npx tsx scripts/send-test-email.ts recipient@example.com
 *
 * Defaults to creatuluw@gmail.com if no recipient is provided.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SMTPClient, type MessageHeaders } from "emailjs";

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const envPath = resolve(projectRoot, ".env");

function loadEnv(): void {
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.error(`Failed to load .env from ${envPath}:`, err);
    process.exit(1);
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SMTP_HOST = process.env.SMTP_HOST || "smtp.maileroo.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "no-reply@te9.dev";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "te9.dev";

const RECIPIENT = process.argv[2] || "creatuluw@gmail.com";

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

const templatePath = resolve(
  projectRoot,
  "src/lib/templates/emails/test.html"
);

function renderTemplate(
  template: string,
  data: Record<string, string>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("── te9.dev Email Test ──────────────────────");
  console.log(`  SMTP:   ${SMTP_USER}@${SMTP_HOST}:${SMTP_PORT}`);
  console.log(`  From:   ${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`);
  console.log(`  To:     ${RECIPIENT}`);
  console.log("────────────────────────────────────────────");

  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error(
      "ERROR: SMTP_USER and SMTP_PASSWORD must be set in .env"
    );
    process.exit(1);
  }

  // Read and render template
  const rawTemplate = readFileSync(templatePath, "utf-8");
  const html = renderTemplate(rawTemplate, {
    timestamp: new Date().toLocaleString(),
  });

  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .trim();

  // Build SMTP message
  const isSSL = SMTP_PORT === 465;
  const client = new SMTPClient({
    user: SMTP_USER,
    password: SMTP_PASSWORD,
    host: SMTP_HOST,
    port: SMTP_PORT,
    ssl: isSSL,
    tls: !isSSL,
    timeout: 30000,
  });

  const headers: MessageHeaders = {
    from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
    to: RECIPIENT,
    subject: "Test Email — te9.dev",
    text,
    attachment: [
      {
        data: html,
        alternative: true,
        contentType: "text/html",
      },
    ],
  };

  try {
    console.log("\nSending...");
    const message = await client.sendAsync(headers);
    const messageId =
      (message.header as Record<string, string | undefined>)?.[
        "message-id"
      ] || "(unknown)";

    console.log("\n✅ Email sent successfully!");
    console.log(`   Message-ID: ${messageId}`);
    console.log(`   Recipient:  ${RECIPIENT}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("\n❌ Failed to send email:", msg);
    process.exit(1);
  } finally {
    try {
      client.smtp.close();
    } catch {
      // ignore
    }
  }
}

main();
