/**
 * Raindrop.io Sync Script
 *
 * Fetches all raindrops from a collection and upserts into the bookmarks table.
 * Run with: node scripts/sync-raindrop.js
 */

import postgres from "postgres";
import { readFileSync } from "fs";

const COLLECTION_ID = 34657545;
const PER_PAGE = 50;
const RAINDROP_API = "https://api.raindrop.io/rest/v1";

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
const RAINDROP_ACCESS_TOKEN =
  process.env.RAINDROP_ACCESS_TOKEN || env.RAINDROP_ACCESS_TOKEN;

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
if (!RAINDROP_ACCESS_TOKEN) throw new Error("RAINDROP_ACCESS_TOKEN is not set");

async function fetchRaindrops(page = 0) {
  const url = `${RAINDROP_API}/raindrops/${COLLECTION_ID}?perpage=${PER_PAGE}&page=${page}&sort=-created`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${RAINDROP_ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Raindrop API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function fetchAllRaindrops() {
  const all = [];
  let page = 0;
  let total = Infinity;

  while (page * PER_PAGE < total) {
    console.log(`  Fetching page ${page}...`);
    const data = await fetchRaindrops(page);
    if (!data.items || data.items.length === 0) break;
    total = data.count;
    all.push(...data.items);
    console.log(`    Got ${data.items.length} items (${all.length}/${total})`);
    page++;
  }

  return all;
}

function mapRaindrop(item) {
  return {
    raindrop_id: item._id,
    title: item.title || "",
    url: item.link || "",
    excerpt: item.excerpt || null,
    cover: item.cover || null,
    tags: item.tags && item.tags.length > 0 ? JSON.stringify(item.tags) : null,
    type: item.type || null,
    domain: item.domain || null,
    note: item.note || null,
    raindrop_created_at: item.created ? new Date(item.created) : null,
    raindrop_updated_at: item.lastUpdate ? new Date(item.lastUpdate) : null,
    synced_at: new Date().toISOString(),
  };
}

async function sync() {
  console.log("Raindrop.io Sync");
  console.log(`  Collection: ${COLLECTION_ID}`);
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
    const raindrops = await fetchAllRaindrops();
    console.log(`\n  Total fetched: ${raindrops.length}`);

    if (raindrops.length === 0) {
      console.log("  No items to sync.");
      return;
    }

    let inserted = 0;
    let updated = 0;

    for (const item of raindrops) {
      const row = mapRaindrop(item);
      const result = await sql`
        INSERT INTO te9_dev.bookmarks ${sql(row)}
        ON CONFLICT (raindrop_id) DO UPDATE SET
          title = EXCLUDED.title,
          url = EXCLUDED.url,
          excerpt = EXCLUDED.excerpt,
          cover = EXCLUDED.cover,
          tags = EXCLUDED.tags,
          type = EXCLUDED.type,
          domain = EXCLUDED.domain,
          note = EXCLUDED.note,
          raindrop_created_at = EXCLUDED.raindrop_created_at,
          raindrop_updated_at = EXCLUDED.raindrop_updated_at,
          synced_at = EXCLUDED.synced_at
        RETURNING (xmax = 0) AS is_insert
      `;
      if (result[0]?.is_insert) {
        inserted++;
      } else {
        updated++;
      }
    }

    const count = await sql`SELECT count(*)::int as count FROM te9_dev.bookmarks`;
    console.log(`\n  Sync complete: ${inserted} new, ${updated} updated`);
    console.log(`  Total in DB: ${count[0].count}`);
  } catch (error) {
    console.error("\n  Sync failed:", error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

sync().catch(() => process.exit(1));
