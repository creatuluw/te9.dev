import postgres from "postgres";
import { readFileSync } from "fs";
import { SMTPClient } from "emailjs";

const args = process.argv.slice(2);
const type = args.includes("--type") ? args[args.indexOf("--type") + 1] : null;
const shouldSend = args.includes("--send");
const force = args.includes("--force");

if (!type || !["last10", "weekly"].includes(type)) {
  console.error("Usage: node scripts/generate-digest.js --type <last10|weekly> [--send] [--force]");
  process.exit(1);
}

function loadEnv() {
  const env = {};
  try {
    const content = readFileSync(".env", "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {}
  return env;
}

const env = loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
const DIGEST_RECIPIENT = process.env.DIGEST_RECIPIENT || env.DIGEST_RECIPIENT || "creatuluw@gmail.com";
const DIGEST_BASE_URL = process.env.DIGEST_BASE_URL || env.DIGEST_BASE_URL || "https://te9.dev";
const SMTP_HOST = process.env.SMTP_HOST || env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || env.SMTP_PASSWORD;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || env.SMTP_FROM_EMAIL || "no-reply@pippeloi.nl";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || env.SMTP_FROM_NAME || "te9.dev";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseTags(tagsJson) {
  try {
    const tags = JSON.parse(tagsJson);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

function renderTags(tagsJson) {
  const tags = parseTags(tagsJson);
  return tags
    .map((tag, i) => {
      const cls = i === 0 ? "tag-accent" : i < 3 ? "tag-default" : "tag-muted";
      return `<span class="tag ${cls}">${escapeHtml(tag)}</span>`;
    })
    .join("\n          ");
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function getDigestStyles() {
  return `
    :root {
      --color-accent: #ff9500;
      --color-accent-subtle: rgba(255, 149, 0, 0.1);
      --color-success-text: #00cc6a;
      --color-success-muted: rgba(0, 255, 136, 0.1);
      --color-bg: #0a0a0a;
      --color-bg-card-start: #1a1a1a;
      --color-text: #e8e8e8;
      --color-text-secondary: #888888;
      --color-text-tertiary: #666666;
      --color-border-default: #2a2a2a;
      --font-display: 'Bricolage Grotesque', sans-serif;
      --font-body: 'Lekton', monospace;
      --font-mono: 'JetBrains Mono', monospace;
      --text-xs: 0.6875rem;
      --text-sm: 0.8125rem;
      --text-base: 0.875rem;
      --text-md: 1rem;
      --text-lg: 1.25rem;
      --text-2xl: 2.5rem;
      --leading-snug: 1.2;
      --leading-relaxed: 1.7;
      --space-1: 0.25rem;
      --space-2: 0.5rem;
      --space-3: 0.75rem;
      --space-4: 1rem;
      --space-6: 1.5rem;
      --space-8: 2rem;
      --space-12: 3rem;
      --space-16: 4rem;
      --radius-xs: 2px;
      --gutter: clamp(1rem, 3vw, 2rem);
    }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    body { font-family: var(--font-body); font-size: var(--text-base); line-height: 1.5; color: var(--color-text); background: var(--color-bg); }
    ::selection { background-color: #10b981; color: var(--color-bg); }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .entrance { animation: slideUp 600ms cubic-bezier(0.16,1,0.3,1) both; }
    .ed1 { animation-delay: 60ms; } .ed2 { animation-delay: 120ms; } .ed3 { animation-delay: 180ms; }
    .ed4 { animation-delay: 240ms; } .ed5 { animation-delay: 300ms; } .ed6 { animation-delay: 360ms; }
    .ed7 { animation-delay: 420ms; } .ed8 { animation-delay: 480ms; } .ed9 { animation-delay: 540ms; }
    .ed10 { animation-delay: 600ms; } .ed11 { animation-delay: 660ms; } .ed12 { animation-delay: 720ms; }
    @media (prefers-reduced-motion: reduce) {
      .entrance,.ed1,.ed2,.ed3,.ed4,.ed5,.ed6,.ed7,.ed8,.ed9,.ed10,.ed11,.ed12 { animation: none; opacity: 1; }
    }
    .digest-top-nav {
      max-width: 820px; margin: 0 auto;
      padding: 1.5rem var(--gutter) 0;
      display: flex; justify-content: space-between; align-items: center;
    }
    .digest-top-nav a {
      font-family: var(--font-body); font-size: var(--text-sm);
      color: var(--color-text-tertiary); text-decoration: none;
      transition: color 300ms ease;
    }
    .digest-top-nav a:hover { color: var(--color-accent); }
    .digest-brand {
      font-family: var(--font-mono); font-size: var(--text-sm);
      font-weight: 700; color: var(--color-accent);
    }
    .page { max-width: 820px; margin: 0 auto; padding: var(--space-16) var(--gutter); }
    .masthead { margin-bottom: var(--space-12); }
    .masthead-label {
      display: block; font-family: var(--font-mono); font-size: var(--text-xs);
      letter-spacing: 0.1em; text-transform: lowercase;
      color: var(--color-accent); margin-bottom: var(--space-4);
    }
    .masthead-title {
      font-family: var(--font-display); font-size: var(--text-2xl);
      font-weight: 700; line-height: 1.05; color: var(--color-text);
      margin-bottom: var(--space-4);
    }
    .masthead-title .dot { color: var(--color-accent); }
    .masthead-desc {
      font-size: var(--text-md); color: var(--color-text-secondary);
      line-height: var(--leading-relaxed); max-width: 60ch;
    }
    .masthead-desc .accent-word { color: var(--color-accent); font-weight: 500; }
    .divider { border: none; height: 1px; background: var(--color-border-default); margin: var(--space-8) 0; }
    .divider-dashed { border: none; height: 0; border-top: 1px dashed var(--color-border-default); margin: var(--space-8) 0; }
    .entry { padding: var(--space-8) 0; }
    .entry-header { margin-bottom: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
    .entry-meta { display: flex; align-items: center; gap: var(--space-2); }
    .entry-number {
      font-family: var(--font-mono); font-size: var(--text-xs);
      letter-spacing: 0.1em; color: var(--color-accent);
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--color-accent-subtle);
      border-radius: var(--radius-xs); background: var(--color-accent-subtle);
      display: inline-flex; align-items: center; line-height: 1;
    }
    .entry-sep { color: var(--color-text-tertiary); font-size: var(--text-sm); line-height: 1; }
    .entry-meta .tag { line-height: 1; }
    .entry-title {
      font-family: var(--font-display); font-size: var(--text-lg);
      font-weight: 600; color: var(--color-text);
      line-height: var(--leading-snug); margin-bottom: var(--space-1);
    }
    .entry-title a {
      color: var(--color-text); text-decoration: none; position: relative;
      transition: color 300ms ease;
    }
    .entry-title a::after {
      content: ''; position: absolute; bottom: -2px; left: 0;
      width: 0; height: 1px; background: var(--color-accent);
      transition: width 300ms ease;
    }
    .entry-title a:hover { color: var(--color-accent); }
    .entry-title a:hover::after { width: 100%; }
    .entry-body { display: flex; flex-direction: column; gap: var(--space-4); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field-label {
      font-family: var(--font-mono); font-size: 9px; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-accent);
    }
    .field-value { font-size: var(--text-base); color: var(--color-text-secondary); line-height: var(--leading-relaxed); }
    .tag-row { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-1); }
    .tag {
      display: inline-block; padding: 0.25rem 0.75rem;
      font-size: var(--text-xs); font-family: var(--font-body);
      text-transform: lowercase; letter-spacing: 0.05em; border-radius: var(--radius-xs);
    }
    .tag-default { color: var(--color-success-text); background: var(--color-success-muted); }
    .tag-accent { color: var(--color-accent); background: var(--color-accent-subtle); }
    .tag-muted { color: var(--color-text-secondary); background: var(--color-bg-card-start); }
    .entry-footer { display: flex; align-items: center; justify-content: flex-start; margin-top: var(--space-4); }
    .entry-date { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-tertiary); letter-spacing: 0.04em; }
    .page-footer {
      margin-top: var(--space-16); padding-top: var(--space-8);
      border-top: 1px solid var(--color-border-default);
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: var(--space-4);
    }
    .page-footer-brand { font-family: var(--font-mono); font-size: var(--text-md); font-weight: 700; color: var(--color-accent); }
    .page-footer-meta { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; color: var(--color-text-tertiary); }
    .page-footer-link {
      font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em;
      color: var(--color-accent); text-decoration: none;
    }
    .page-footer-link:hover { text-decoration: underline; }
    @media (max-width: 768px) {
      .masthead-title { font-size: 2rem; }
      .page { padding: var(--space-8) var(--space-4); }
    }
  `;
}

function renderEntry(entry, index) {
  const date = entry.raindrop_created_at ? new Date(entry.raindrop_created_at) : new Date();
  return `
      <article class="entry entrance ed${Math.min(index + 2, 12)}">
        <div class="entry-header">
          <div class="entry-meta">
            <span class="entry-number">#${pad(index + 1)}</span>
            <span class="entry-sep">\u00b7</span>
            <span class="tag tag-default">${escapeHtml(entry.category || "Uncategorized")}</span>
          </div>
          <h2 class="entry-title"><a href="${escapeHtml(entry.url)}">${escapeHtml(entry.title)}</a></h2>
        </div>
        <div class="entry-body">
          <div class="field">
            <span class="field-label">purpose</span>
            <p class="field-value">${escapeHtml(entry.purpose)}</p>
          </div>
          <div class="field">
            <span class="field-label">when to use</span>
            <p class="field-value">${escapeHtml(entry.when_to_use)}</p>
          </div>
          <div class="field">
            <span class="field-label">tags</span>
            <div class="tag-row">
          ${renderTags(entry.tags)}
            </div>
          </div>
        </div>
        <div class="entry-footer">
          <span class="entry-date">${formatDate(date)}</span>
        </div>
      </article>`;
}

function renderStandalone(entries, meta) {
  const entryHtml = entries.map((e, i) => renderEntry(e, i)).join("\n    <hr class=\"divider-dashed\">");
  const now = new Date();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)} — te9.dev</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Lekton:wght@400;700&display=swap" rel="stylesheet">
  <style>${getDigestStyles()}</style>
</head>
<body>

<div class="digest-top-nav">
  <a href="${meta.baseUrl}/digest">\u2190 digests</a>
  <span class="digest-brand">\u203a te9.dev</span>
</div>

<div class="page">
  <header class="masthead entrance">
    <span class="masthead-label">[ digest / ${meta.typeLabel} ]</span>
    <h1 class="masthead-title">${escapeHtml(meta.title)}<span class="dot">.</span></h1>
    <p class="masthead-desc">
      ${meta.description}
    </p>
  </header>

  <hr class="divider entrance ed1">

  ${entryHtml}

  <hr class="divider entrance ed12">

  <footer class="page-footer entrance ed12">
    <span class="page-footer-brand"><span style="color:var(--color-accent)">\u203a</span> te9<span style="color:var(--color-accent)">.</span>dev</span>
    <span class="page-footer-meta">${meta.entryCount} entries \u00b7 ${formatDate(now)} \u00b7 <a href="${meta.baseUrl}/digest" class="page-footer-link">view all digests</a></span>
  </footer>
</div>

</body>
</html>`;
}

async function generate() {
  console.log(`\n  Digest Generator (${type})`);

  const sql = postgres(DATABASE_URL, {
    connect_timeout: 30,
    ssl: "require",
    max_lifetime: 0,
    idle_timeout: 0,
    max: 1,
  });

  try {
    let entries;
    let dateRangeStart = null;
    let dateRangeEnd = new Date();
    let title;
    let description;
    let typeLabel;

    if (type === "last10") {
      const last = await sql`
        SELECT last_bookmark_id FROM te9_dev.digests
        WHERE type = 'last10' ORDER BY created_at DESC LIMIT 1
      `;
      const lastBookmarkId = last.length ? last[0].last_bookmark_id : 0;

      const countResult = await sql`
        SELECT count(*)::int as count FROM te9_dev.bookmark_analysis
        WHERE bookmark_id > ${lastBookmarkId}
      `;
      const count = countResult[0].count;

      if (!force && count < 10) {
        console.log(`  Only ${count} new entries since last digest. Need 10. Use --force to override.`);
        await sql.end();
        return;
      }

      entries = await sql`
        SELECT ba.id, ba.bookmark_id, ba.relevance, ba.purpose, ba.how_to_use,
               ba.when_to_use, ba.tags, ba.category, ba.analyzed_at,
               b.url, b.title, b.raindrop_created_at
        FROM te9_dev.bookmark_analysis ba
        JOIN te9_dev.bookmarks b ON ba.bookmark_id = b.id
        WHERE ba.bookmark_id > ${lastBookmarkId}
        ORDER BY b.raindrop_created_at DESC NULLS LAST
        LIMIT 10
      `;

      title = `Last ${entries.length} Analyzed`;
      description = `The <span class="accent-word">${entries.length} most recently analyzed</span> bookmarks from the te9.dev archive. Each entry has been crawled, parsed, and annotated by an LLM for relevance, purpose, and practical use.`;
      typeLabel = "last-10";

    } else {
      const weekStart = getWeekStart(new Date());

      if (!force) {
        const existing = await sql`
          SELECT id FROM te9_dev.digests
          WHERE type = 'weekly' AND created_at > ${weekStart.toISOString()}
          LIMIT 1
        `;
        if (existing.length) {
          console.log("  Weekly digest already exists for this week. Use --force to override.");
          await sql.end();
          return;
        }
      }

      dateRangeStart = weekStart;

      entries = await sql`
        SELECT ba.id, ba.bookmark_id, ba.relevance, ba.purpose, ba.how_to_use,
               ba.when_to_use, ba.tags, ba.category, ba.analyzed_at,
               b.url, b.title, b.raindrop_created_at
        FROM te9_dev.bookmark_analysis ba
        JOIN te9_dev.bookmarks b ON ba.bookmark_id = b.id
        WHERE b.raindrop_created_at >= ${weekStart.toISOString()}
        ORDER BY b.raindrop_created_at DESC NULLS LAST
        LIMIT 50
      `;

      title = `Weekly Digest \u2014 ${formatDate(weekStart)}`;
      description = `All <span class="accent-word">analyzed bookmarks from the past week</span> in the te9.dev archive. Each entry has been crawled, parsed, and annotated by an LLM for relevance, purpose, and practical use.`;
      typeLabel = "weekly";
    }

    if (!entries.length) {
      console.log("  No entries found for this digest.");
      await sql.end();
      return;
    }

    const now = new Date();
    const slug = `${type}-${formatIsoDate(now)}`;
    const meta = {
      type,
      typeLabel,
      title,
      slug,
      baseUrl: DIGEST_BASE_URL,
      entryCount: entries.length,
      description,
    };

    const html = renderStandalone(entries, meta);
    const lastBookmarkId = Math.max(...entries.map((e) => e.bookmark_id));

    await sql`
      INSERT INTO te9_dev.digests (type, title, slug, html, entry_count, last_bookmark_id, date_range_start, date_range_end)
      VALUES (${type}, ${title}, ${slug}, ${html}, ${entries.length}, ${lastBookmarkId},
        ${dateRangeStart ? dateRangeStart.toISOString() : null}, ${dateRangeEnd.toISOString()})
      ON CONFLICT (slug) DO UPDATE SET
        html = EXCLUDED.html,
        entry_count = EXCLUDED.entry_count,
        last_bookmark_id = EXCLUDED.last_bookmark_id,
        title = EXCLUDED.title
    `;

    console.log(`  \u2713 Digest generated: ${slug} (${entries.length} entries)`);
    console.log(`  \u2713 View at: ${DIGEST_BASE_URL}/digest/${slug}`);

    if (shouldSend) {
      if (!SMTP_USER || !SMTP_PASSWORD) {
        console.log("  \u2717 SMTP not configured, skipping email");
        await sql.end();
        return;
      }

      const subject = type === "last10"
        ? `Digest: Last ${entries.length} Analyzed \u2014 ${formatDate(now)} \u2014 te9.dev`
        : `Weekly Digest \u2014 ${formatDate(dateRangeStart || now)} \u2014 te9.dev`;

      const client = new SMTPClient({
        user: SMTP_USER,
        password: SMTP_PASSWORD,
        host: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
      });

      try {
        await client.sendAsync({
          from: `${SMTP_FROM_NAME} <${SMTP_FROM_EMAIL}>`,
          to: DIGEST_RECIPIENT,
          subject,
          attachment: [
            { data: html, alternative: true, contentType: "text/html" },
          ],
        });

        await sql`
          UPDATE te9_dev.digests
          SET email_sent = true, email_sent_at = NOW()
          WHERE slug = ${slug}
        `;

        console.log(`  \u2713 Email sent to ${DIGEST_RECIPIENT}`);
      } catch (err) {
        console.log(`  \u2717 Email failed: ${err.message}`);
      } finally {
        try { client.smtp.close(); } catch {}
      }
    }

  } catch (error) {
    console.error("\n  Generation failed:", error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

generate().catch(() => process.exit(1));
