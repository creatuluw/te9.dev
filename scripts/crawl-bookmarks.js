import postgres from "postgres";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const MAX_CHARS = 8000;
const BATCH_SIZE = 50;
const DELAY_MS = 500;

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
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

turndown.remove(["script", "style", "iframe", "noscript", "svg", "img"]);

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function truncateToTokens(markdown, maxTokens) {
  const maxChars = maxTokens * 4;
  if (markdown.length <= maxChars) return markdown;

  const lines = markdown.split("\n");
  let result = "";
  for (const line of lines) {
    if ((result + "\n" + line).length > maxChars) break;
    result += (result ? "\n" : "") + line;
  }
  return result;
}

async function crawlUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; te9.dev bookmark crawler; +https://te9.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) return { error: `HTTP ${res.status}` };

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return { error: `Unsupported content type: ${contentType}` };
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      return { error: "Could not extract content" };
    }

    let markdown = turndown.turndown(article.content);
    const title = article.title || "";
    const excerpt = article.excerpt || "";

    if (title) markdown = `# ${title}\n\n${markdown}`;
    if (excerpt && !markdown.includes(excerpt)) {
      markdown = `> ${excerpt}\n\n${markdown}`;
    }

    markdown = truncateToTokens(markdown, 2000);
    const tokenCount = estimateTokens(markdown);

    return { markdown, tokenCount };
  } catch (err) {
    if (err.name === "AbortError") return { error: "Timeout (15s)" };
    return { error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function crawl() {
  console.log("Bookmark Crawler");
  console.log(
    `  DB: ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`
  );

  const sql = postgres(DATABASE_URL, {
    connect_timeout: 30,
    ssl: "require",
    max_lifetime: 0,
    idle_timeout: 0,
    max: 1,
  });

  try {
    const pending = await sql`
      SELECT b.id, b.url, b.title
      FROM te9_dev.bookmarks b
      LEFT JOIN te9_dev.bookmark_content bc ON b.id = bc.bookmark_id
      WHERE bc.id IS NULL
         OR bc.status = 'pending'
         OR (bc.status = 'failed' AND bc.crawled_at < NOW() - INTERVAL '7 days')
      ORDER BY b.raindrop_created_at DESC NULLS LAST, b.id DESC
      LIMIT 100
    `;
    console.log(`  Pending: ${pending.length} bookmarks to crawl (most recent 100)`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      const bookmark = pending[i];
      const progress = `[${i + 1}/${pending.length}]`;

      const result = await crawlUrl(bookmark.url);

      if (result.error) {
        console.log(`  ${progress} FAIL ${bookmark.url} - ${result.error}`);
        await sql`
          INSERT INTO te9_dev.bookmark_content (bookmark_id, status, error)
          VALUES (${bookmark.id}, 'failed', ${result.error})
          ON CONFLICT (bookmark_id) DO UPDATE SET
            status = EXCLUDED.status,
            error = EXCLUDED.error,
            crawled_at = NOW()
        `;
        failed++;
      } else {
        console.log(
          `  ${progress} OK   ${bookmark.url} (${result.tokenCount} tokens)`
        );
        await sql`
          INSERT INTO te9_dev.bookmark_content (bookmark_id, markdown, token_count, status)
          VALUES (${bookmark.id}, ${result.markdown}, ${result.tokenCount}, 'success')
          ON CONFLICT (bookmark_id) DO UPDATE SET
            markdown = EXCLUDED.markdown,
            token_count = EXCLUDED.token_count,
            status = EXCLUDED.status,
            error = NULL,
            crawled_at = NOW()
        `;
        success++;
      }

      if (i < pending.length - 1) await sleep(DELAY_MS);
    }

    console.log(`\n  Crawl complete: ${success} success, ${failed} failed`);
  } catch (error) {
    console.error("\n  Crawl failed:", error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

crawl().catch(() => process.exit(1));
