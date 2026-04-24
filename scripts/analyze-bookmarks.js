import postgres from "postgres";
import { readFileSync } from "fs";

// ---------------------------------------------------------------------------
// LLM Provider Configuration
// ---------------------------------------------------------------------------
// Primary: z.ai (GLM-5) — fast, high quality
// Fallback: Railway-hosted Qwen3.5-2B — always available backup

const PROVIDERS = {
  primary: {
    url: process.env.ZAI_LLM_URL || "https://api.z.ai/api/coding/paas/v4",
    apiKey: process.env.ZAI_API_KEY || "",
    model: "glm-5",
    name: "z.ai",
  },
  fallback: {
    url:
      process.env.LLM_GATEWAY_URL ||
      "https://llm-gateway-production-91d5.up.railway.app/v1",
    apiKey: "",
    model: "unsloth/Qwen3.5-2B-GGUF",
    name: "Railway Qwen",
  },
};

const DELAY_MS = 1000;

const SYSTEM_PROMPT = `You are a web development resource analyst. Analyze the following webpage content and respond with a JSON object containing exactly these fields:

- "relevance": 1-2 sentences explaining why this resource is relevant to web developers
- "purpose": 1-2 sentences describing what this site/app/resource does
- "how_to_use": 1-2 sentences explaining how a web developer can use this resource
- "when_to_use": 1-2 sentences describing when this resource is most valuable
- "tags": an array of 2-10 relevant, descriptive tags that categorize this resource
- "category": the single main category this resource belongs to from a web developer's perspective (e.g. "CSS Framework", "Build Tool", "Design System", "API Service", etc.)

Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object.`;

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

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

// Merge .env values into provider configs (env vars take precedence)
PROVIDERS.primary.url =
  process.env.ZAI_LLM_URL || env.ZAI_LLM_URL || PROVIDERS.primary.url;
PROVIDERS.primary.apiKey =
  process.env.ZAI_API_KEY || env.ZAI_API_KEY || PROVIDERS.primary.apiKey;
PROVIDERS.fallback.url =
  process.env.LLM_GATEWAY_URL || env.LLM_GATEWAY_URL || PROVIDERS.fallback.url;

const DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

// ---------------------------------------------------------------------------
// LLM call with automatic failover
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Call a single LLM provider and return the parsed analysis.
 * Throws on any error so the caller can fall back to the next provider.
 */
async function callLLM(provider, markdown, title, url) {
  const userContent = `URL: ${url}\nTitle: ${title}\n\nContent:\n${markdown}`;

  const headers = { "Content-Type": "application/json" };
  if (provider.apiKey) {
    headers["Authorization"] = `Bearer ${provider.apiKey}`;
  }

  const res = await fetch(`${provider.url}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${provider.name} API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name}: Empty LLM response`);

  const parsed = JSON.parse(content);

  return {
    relevance: parsed.relevance || null,
    purpose: parsed.purpose || null,
    how_to_use: parsed.how_to_use || null,
    when_to_use: parsed.when_to_use || null,
    tags: Array.isArray(parsed.tags)
      ? JSON.stringify(parsed.tags)
      : parsed.tags || null,
    category: parsed.category || null,
  };
}

/**
 * Try primary LLM first; fall back to the secondary if it fails.
 */
async function analyzeWithLLM(markdown, title, url) {
  // --- Try primary (z.ai) ---
  if (PROVIDERS.primary.apiKey) {
    try {
      const result = await callLLM(PROVIDERS.primary, markdown, title, url);
      return { ...result, _provider: PROVIDERS.primary.name };
    } catch (err) {
      console.log(
        `    ⚠ Primary (${PROVIDERS.primary.name}) failed: ${err.message}`,
      );
      console.log(`    ↻ Falling back to ${PROVIDERS.fallback.name}...`);
    }
  } else {
    console.log(`    ℹ No ZAI_API_KEY set — skipping primary, using fallback`);
  }

  // --- Fallback (Railway Qwen) ---
  const result = await callLLM(PROVIDERS.fallback, markdown, title, url);
  return { ...result, _provider: PROVIDERS.fallback.name };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function analyze() {
  console.log("Bookmark Analyzer (LLM)");
  console.log(
    `  Primary : ${PROVIDERS.primary.name} @ ${PROVIDERS.primary.url} (${PROVIDERS.primary.model})`,
  );
  console.log(
    `  Fallback: ${PROVIDERS.fallback.name} @ ${PROVIDERS.fallback.url} (${PROVIDERS.fallback.model})`,
  );
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
    console.log(
      `  Pending: ${pending.length} bookmarks to analyze (most recent 100)`,
    );

    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      const bookmark = pending[i];
      const progress = `[${i + 1}/${pending.length}]`;

      try {
        const analysis = await analyzeWithLLM(
          bookmark.markdown,
          bookmark.title,
          bookmark.url,
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
          `  ${progress} OK   ${bookmark.url} [${analysis.category}] via ${analysis._provider}`,
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
