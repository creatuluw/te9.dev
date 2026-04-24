/**
 * Database Setup Script
 *
 * Creates the te9_dev schema, garden_entrance table, and seeds initial data.
 * Run with: node scripts/setup-db.js
 *
 * Drop old hyphenated schema, create underscore schema, create table, seed data.
 */

import postgres from "postgres";
import { readFileSync } from "fs";

// Load DATABASE_URL from .env file
function loadEnv() {
  try {
    const envContent = readFileSync(".env", "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...rest] = trimmed.split("=");
        if (key === "DATABASE_URL") {
          return rest.join("=").trim();
        }
      }
    }
  } catch {
    // .env file not found
  }
  return process.env.DATABASE_URL || null;
}

const DATABASE_URL =
  loadEnv() ||
  "postgresql://postgres:QWvgNTqzfNibSLhAIcBSCMKFMbSWqOdD@monorail.proxy.rlwy.net:37604/railway";

const SEED_DATA = [
  {
    title: "Dev Playground",
    description:
      "Experiments, prototypes, and side projects. A sandbox for trying new technologies and approaches without constraints.",
    tag: "experiments",
    icon: "code",
    slug: "dev-playground",
    sort_order: 1,
  },
  {
    title: "Starter Kits",
    description:
      "Quick shortcuts to project templates and boilerplate. Jump-start new projects with battle-tested configurations.",
    tag: "templates",
    icon: "package",
    slug: "starter-kits",
    sort_order: 2,
  },
  {
    title: "Link Collection",
    description:
      "Curated bookmarks and resources I keep coming back to. Tools, articles, and references worth sharing.",
    tag: "bookmarks",
    icon: "link",
    slug: "link-collection",
    sort_order: 3,
  },
  {
    title: "Personal Preferences",
    description:
      "Configs, settings, and preferences I use across projects. A personal reference for consistency.",
    tag: "config",
    icon: "bookmark",
    slug: "personal-preferences",
    sort_order: 4,
  },
  {
    title: "Notes & Articles",
    description:
      "Personal notes on topics I'm exploring. From technical deep-dives to random interests and learnings.",
    tag: "knowledge",
    icon: "file-text",
    slug: "notes-articles",
    sort_order: 5,
  },
  {
    title: "Sharing & Resources",
    description:
      "Tools, thoughts, and resources shared with the world. If it helped me, maybe it'll help you too.",
    tag: "open",
    icon: "heart",
    slug: "sharing-resources",
    sort_order: 6,
  },
];

async function setup() {
  console.log("Connecting to database...");
  console.log(`URL: ${DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  const sql = postgres(DATABASE_URL, {
    connect_timeout: 30,
    ssl: "require",
    max_lifetime: 0,
    idle_timeout: 0,
    max: 1,
  });

  try {
    // 1. Test connection
    const testResult = await sql.unsafe("SELECT current_database() as db, current_user as user");
    console.log(`Connected to: ${testResult[0].db} as ${testResult[0].user}`);

    // 2. Drop old hyphenated schema if it exists
    console.log("Dropping old 'te9-dev' schema (if exists)...");
    await sql.unsafe('DROP SCHEMA IF EXISTS "te9-dev" CASCADE');
    console.log("  ✓ Old schema dropped");

    // 3. Create new schema
    console.log("Creating 'te9_dev' schema...");
    await sql.unsafe("CREATE SCHEMA IF NOT EXISTS te9_dev");
    console.log("  ✓ Schema created");

    // 4. Drop existing table (clean slate)
    await sql.unsafe("DROP TABLE IF EXISTS te9_dev.garden_entrance");

    // 5. Create table
    console.log("Creating 'garden_entrance' table...");
    await sql.unsafe(`
      CREATE TABLE te9_dev.garden_entrance (
        id          serial PRIMARY KEY NOT NULL,
        title       text NOT NULL,
        description text NOT NULL,
        tag         text NOT NULL,
        icon        text NOT NULL,
        slug        text NOT NULL UNIQUE,
        href        text,
        sort_order  integer DEFAULT 0 NOT NULL,
        is_active   boolean DEFAULT true NOT NULL,
        created_at  timestamptz DEFAULT now() NOT NULL,
        updated_at  timestamptz DEFAULT now() NOT NULL
      )
    `);
    console.log("  ✓ Table created");

    // 6. Seed data
    console.log(`Seeding ${SEED_DATA.length} garden entrances...`);
    for (const row of SEED_DATA) {
      await sql.unsafe(
        `INSERT INTO te9_dev.garden_entrance (title, description, tag, icon, slug, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [row.title, row.description, row.tag, row.icon, row.slug, row.sort_order]
      );
    }
    console.log(`  ✓ ${SEED_DATA.length} rows inserted`);

    // 7. Verify
    const count = await sql.unsafe("SELECT count(*)::int as count FROM te9_dev.garden_entrance");
    const rows = await sql.unsafe("SELECT id, title, slug, tag FROM te9_dev.garden_entrance ORDER BY sort_order");

    console.log("\n✅ Setup complete!");
    console.log(`   Schema: te9_dev`);
    console.log(`   Table:  garden_entrance (${count[0].count} rows)`);
    console.log("\n   Rows:");
    for (const r of rows) {
      console.log(`   ${r.id}. [${r.tag}] ${r.title} (${r.slug})`);
    }
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

setup().catch(() => process.exit(1));
