import pg from "pg";
import { config } from "dotenv";
config();
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
async function query(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows;
}
async function queryOne(sql, params) {
  const result = await pool.query(sql, params);
  return result.rows[0] ?? null;
}
async function execute(sql, params) {
  const result = await pool.query(sql, params);
  return result.rowCount ?? 0;
}
const db = {
  bookmarks: {
    async findAll(options) {
      let sql = "SELECT * FROM bookmarks";
      const conditions = [];
      const params = [];
      if (!options?.showHidden) {
        conditions.push("(blog_approved = true OR blog_approved IS NULL)");
      }
      if (options?.days) {
        conditions.push(`created_at >= NOW() - INTERVAL '${options.days} days'`);
      }
      if (options?.category) {
        params.push(options.category);
        conditions.push(`category = $${params.length}`);
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      sql += " ORDER BY raindrop_created_at DESC NULLS LAST, created_at DESC";
      if (options?.limit) {
        sql += ` LIMIT ${options.limit}`;
      }
      return query(sql, params);
    },
    async findById(id) {
      return queryOne("SELECT * FROM bookmarks WHERE id = $1", [id]);
    },
    async findByRaindropId(raindropId) {
      return queryOne("SELECT * FROM bookmarks WHERE raindrop_id = $1", [raindropId]);
    },
    async create(data) {
      const sql = `INSERT INTO bookmarks 
        (raindrop_id, title, link, excerpt, cover, domain, type, tags, blog_approved, reason_for_bookmark, category, raindrop_created_at, raindrop_updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`;
      const params = [
        data.raindrop_id,
        data.title,
        data.link,
        data.excerpt,
        data.cover,
        data.domain,
        data.type,
        JSON.stringify(data.tags),
        data.blog_approved,
        data.reason_for_bookmark,
        data.category,
        data.raindrop_created_at,
        data.raindrop_updated_at
      ];
      return await queryOne(sql, params);
    },
    async update(id, data) {
      const fields = [];
      const params = [];
      let i = 1;
      for (const [key, value] of Object.entries(data)) {
        if (key === "id" || key === "created_at") continue;
        fields.push(`${key} = $${i}`);
        params.push(key === "tags" ? JSON.stringify(value) : value);
        i++;
      }
      if (fields.length === 0) return this.findById(id);
      params.push(id);
      const sql = `UPDATE bookmarks SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`;
      return queryOne(sql, params);
    },
    async delete(id) {
      const result = await execute("DELETE FROM bookmarks WHERE id = $1", [id]);
      return result > 0;
    },
    async findApprovedWithoutDraft() {
      return query(`
        SELECT b.* FROM bookmarks b
        LEFT JOIN drafts d ON b.id = d.bookmark_id
        WHERE b.blog_approved = true AND d.id IS NULL
        ORDER BY b.created_at DESC
      `);
    }
  },
  drafts: {
    async findAll(options) {
      let sql = "SELECT * FROM drafts";
      const params = [];
      if (options?.status) {
        sql += " WHERE status = $1";
        params.push(options.status);
      }
      sql += " ORDER BY created_at DESC";
      return query(sql, params);
    },
    async findById(id) {
      return queryOne("SELECT * FROM drafts WHERE id = $1", [id]);
    },
    async findByBookmarkId(bookmarkId) {
      return queryOne("SELECT * FROM drafts WHERE bookmark_id = $1 ORDER BY created_at DESC LIMIT 1", [bookmarkId]);
    },
    async findAllByBookmarkId(bookmarkId) {
      return query("SELECT * FROM drafts WHERE bookmark_id = $1 ORDER BY created_at DESC", [bookmarkId]);
    },
    async findSkillByBookmarkId(bookmarkId) {
      return queryOne("SELECT * FROM drafts WHERE bookmark_id = $1 AND draft_type = $2", [bookmarkId, "skill"]);
    },
    async create(data) {
      const sql = `INSERT INTO drafts (bookmark_id, title, slug, content, status, feedback, draft_type, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
      const params = [
        data.bookmark_id,
        data.title,
        data.slug,
        data.content,
        data.status ?? "pending",
        data.feedback ?? null,
        data.draft_type ?? "blog_post",
        data.metadata ? JSON.stringify(data.metadata) : null
      ];
      return await queryOne(sql, params);
    },
    async update(id, data) {
      const fields = ["updated_at = NOW()"];
      const params = [];
      let i = 1;
      for (const [key, value] of Object.entries(data)) {
        if (key === "id" || key === "created_at" || key === "updated_at") continue;
        fields.push(`${key} = $${i}`);
        params.push(key === "metadata" && typeof value === "object" ? JSON.stringify(value) : value);
        i++;
      }
      params.push(id);
      const sql = `UPDATE drafts SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`;
      return queryOne(sql, params);
    },
    async delete(id) {
      const result = await execute("DELETE FROM drafts WHERE id = $1", [id]);
      return result > 0;
    },
    async findApproved() {
      return query("SELECT * FROM drafts WHERE status = 'approved' ORDER BY created_at DESC");
    }
  },
  posts: {
    async findAll() {
      return query("SELECT * FROM posts ORDER BY published_at DESC");
    },
    async findById(id) {
      return queryOne("SELECT * FROM posts WHERE id = $1", [id]);
    },
    async findBySlug(slug) {
      return queryOne("SELECT * FROM posts WHERE slug = $1", [slug]);
    },
    async create(data) {
      const sql = `INSERT INTO posts (draft_id, bookmark_id, title, slug, content, description, post_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      const params = [
        data.draft_id ?? null,
        data.bookmark_id ?? null,
        data.title,
        data.slug,
        data.content,
        data.description ?? null,
        data.post_type ?? "blog_post"
      ];
      return await queryOne(sql, params);
    },
    async delete(id) {
      const result = await execute("DELETE FROM posts WHERE id = $1", [id]);
      return result > 0;
    }
  },
  categories: {
    async findAll() {
      return query("SELECT * FROM categories ORDER BY name");
    },
    async create(name, slug) {
      const sql = "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *";
      return await queryOne(sql, [name, slug]);
    },
    async delete(id) {
      const result = await execute("DELETE FROM categories WHERE id = $1", [id]);
      return result > 0;
    }
  },
  apiKeys: {
    async findAll() {
      return query("SELECT id, key, name, created_at, last_used_at FROM api_keys ORDER BY created_at DESC");
    },
    async findByKey(key) {
      return queryOne("SELECT * FROM api_keys WHERE key = $1", [key]);
    },
    async create(key, name) {
      const sql = "INSERT INTO api_keys (key, name) VALUES ($1, $2) RETURNING id, key, name, created_at, last_used_at";
      return await queryOne(sql, [key, name]);
    },
    async updateLastUsed(key) {
      await execute("UPDATE api_keys SET last_used_at = NOW() WHERE key = $1", [key]);
    },
    async delete(id) {
      const result = await execute("DELETE FROM api_keys WHERE id = $1", [id]);
      return result > 0;
    }
  },
  config: {
    async get(key) {
      const result = await queryOne("SELECT value FROM config WHERE key = $1", [key]);
      return result?.value ?? null;
    },
    async set(key, value) {
      await execute(
        "INSERT INTO config (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()",
        [key, JSON.stringify(value)]
      );
    },
    async getAll() {
      const rows = await query("SELECT key, value FROM config");
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    }
  }
};
export {
  db as d
};
