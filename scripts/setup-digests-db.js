import postgres from "postgres";
import { readFileSync } from "fs";

function loadEnv() {
  try {
    const envContent = readFileSync(".env", "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        if (key.trim() === "DATABASE_URL") return rest.join("=").trim();
      }
    }
  } catch {}
  return process.env.DATABASE_URL || null;
}

const DATABASE_URL = loadEnv();

async function setup() {
  console.log("Setting up digests table...");
  console.log(`URL: ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  const sql = postgres(DATABASE_URL, {
    connect_timeout: 30,
    ssl: "require",
    max_lifetime: 0,
    idle_timeout: 0,
    max: 1,
  });

  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS te9_dev.digests (
        id               serial PRIMARY KEY,
        type             text NOT NULL,
        title            text NOT NULL,
        slug             text NOT NULL UNIQUE,
        html             text NOT NULL,
        entry_count      integer NOT NULL DEFAULT 0,
        last_bookmark_id integer,
        date_range_start timestamptz,
        date_range_end   timestamptz,
        created_at       timestamptz DEFAULT now() NOT NULL,
        email_sent       boolean DEFAULT false NOT NULL,
        email_sent_at    timestamptz
      )
    `);
    console.log("  ✓ te9_dev.digests table ready");
  } catch (error) {
    console.error("  ✗ Setup failed:", error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

setup().catch(() => process.exit(1));
