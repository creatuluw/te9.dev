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
