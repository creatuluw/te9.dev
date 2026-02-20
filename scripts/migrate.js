import pg from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const applied = await pool.query('SELECT name FROM migrations ORDER BY name');
    const appliedNames = new Set(applied.rows.map(r => r.name));

    const files = await readdir(join(__dirname, '../db/migrations'));
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      if (appliedNames.has(file)) {
        console.log(`Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`Applying ${file}...`);
      const sql = await readFile(join(__dirname, '../db/migrations', file), 'utf-8');
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
      console.log(`✓ ${file} applied successfully`);
    }

    console.log('All migrations complete');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
