import {
  pgSchema,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const te9Dev = pgSchema("te9_dev");

export const gardenEntrance = te9Dev.table("garden_entrance", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  tag: text("tag").notNull(),
  icon: text("icon").notNull(),
  slug: text("slug").notNull().unique(),
  href: text("href"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const bookmarks = te9Dev.table("bookmarks", {
  id: serial("id").primaryKey(),
  raindropId: integer("raindrop_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  excerpt: text("excerpt"),
  cover: text("cover"),
  tags: text("tags"),
  type: text("type"),
  domain: text("domain"),
  note: text("note"),
  raindropCreatedAt: timestamp("raindrop_created_at", { withTimezone: true }),
  raindropUpdatedAt: timestamp("raindrop_updated_at", { withTimezone: true }),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("bookmarks_raindrop_id_unique").on(table.raindropId),
]);

export const bookmarkContent = te9Dev.table("bookmark_content", {
  id: serial("id").primaryKey(),
  bookmarkId: integer("bookmark_id").notNull(),
  markdown: text("markdown"),
  tokenCount: integer("token_count"),
  status: text("status").notNull().default("pending"),
  error: text("error"),
  crawledAt: timestamp("crawled_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("bookmark_content_bookmark_id_unique").on(table.bookmarkId),
]);

export const bookmarkAnalysis = te9Dev.table("bookmark_analysis", {
  id: serial("id").primaryKey(),
  bookmarkId: integer("bookmark_id").notNull(),
  relevance: text("relevance"),
  purpose: text("purpose"),
  howToUse: text("how_to_use"),
  whenToUse: text("when_to_use"),
  tags: text("tags"),
  category: text("category"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("bookmark_analysis_bookmark_id_unique").on(table.bookmarkId),
]);
