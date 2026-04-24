import postgres from "postgres";
import { readFileSync } from "fs";

const LLM_URL =
  process.env.LLM_GATEWAY_URL || "https://llm-gateway-production-91d5.up.railway.app/v1";
const MODEL = "unsloth/Qwen3.5-2B-GGUF";
const DELAY_MS = 1000;

const SYSTEM_PROMPT = `You are a web development resource analyst. Analyze the following webpage content and respond with a JSON object containing exactly these fields:

- "relevance": 1-2 sentences explaining why this resource is relevant to web developers
- "purpose": 1-2 sentences describing what this site/app/resource does
- "how_to_use": 1-2 sentences explaining how a web developer can use this resource
- "when_to_use": 1-2 sentences describing when this resource is most valuable
- "tags": an array of 2-10 relevant, descriptive tags that categorize this resource
- "category": the single main category this resource belongs to from a web developer's perspective (e.g. "CSS Framework", "Build Tool", "Design System", "API Service", etc.)

Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object.`;

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function analyzeWithLLM(markdown, title, url) {
  const userContent = `URL: ${url}\nTitle: ${title}\n\nContent:\n${markdown}`;

  const res = await fetch(`${LLM_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  const parsed = JSON.parse(content);

  return {
    relevance: parsed.relevance || null,
    purpose: parsed.purpose || null,
    how_to_use: parsed.how_to_use || null,
    when_to_use: parsed.when_to_use || null,
    tags: Array.isArray(parsed.tags) ? JSON.stringify(parsed.tags) : parsed.tags || null,
    category: parsed.category || null,
  };
}

async function analyze() {
  console.log("Bookmark Analyzer (LLM)");
  console.log(`  LLM: ${LLM_URL}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`  DB: ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  const sql = postgres(DATABASE_URL, {
    connect_timeout: 30,
    ssl: "require",
    max_lifetime: 0,
    idle_timeout: 0,
    max: 1,
  });

  try {
    const pending = await sql`
      SELECT b.id, b.url, b.title, bc.markdown
      FROM te9_dev.bookmarks b
      JOIN te9_dev.bookmark_content bc ON b.id = bc.bookmark_id
      LEFT JOIN te9_dev.bookmark_analysis ba ON b.id = ba.bookmark_id
      WHERE bc.status = 'success' AND bc.markdown IS NOT NULL
        AND ba.id IS NULL
      ORDER BY b.raindrop_created_at DESC NULLS LAST, b.id DESC
      LIMIT 100
    `;
    console.log(`  Pending: ${pending.length} bookmarks to analyze (most recent 100)`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      const bookmark = pending[i];
      const progress = `[${i + 1}/${pending.length}]`;

      try {
        const analysis = await analyzeWithLLM(
          bookmark.markdown,
          bookmark.title,
          bookmark.url
        );

        await sql`
          INSERT INTO te9_dev.bookmark_analysis (bookmark_id, relevance, purpose, how_to_use, when_to_use, tags, category)
          VALUES (${bookmark.id}, ${analysis.relevance}, ${analysis.purpose}, ${analysis.how_to_use}, ${analysis.when_to_use}, ${analysis.tags}, ${analysis.category})
          ON CONFLICT (bookmark_id) DO UPDATE SET
            relevance = EXCLUDED.relevance,
            purpose = EXCLUDED.purpose,
            how_to_use = EXCLUDED.how_to_use,
            when_to_use = EXCLUDED.when_to_use,
            tags = EXCLUDED.tags,
            category = EXCLUDED.category,
            analyzed_at = NOW()
        `;

        console.log(
          `  ${progress} OK   ${bookmark.url} [${analysis.category}]`
        );
        success++;
      } catch (err) {
        console.log(`  ${progress} FAIL ${bookmark.url} - ${err.message}`);
        failed++;
      }

      if (i < pending.length - 1) await sleep(DELAY_MS);
    }

    console.log(`\n  Analysis complete: ${success} success, ${failed} failed`);
  } catch (error) {
    console.error("\n  Analysis failed:", error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

analyze().catch(() => process.exit(1));
