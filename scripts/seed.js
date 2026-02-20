import pg from 'pg';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const sql = await readFile(join(__dirname, '../db/migrations/002_seed.sql'), 'utf-8');
    await pool.query(sql);
    console.log('Seed 002_seed.sql applied successfully');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
