import { d as db } from "../../../../chunks/db.js";
import { redirect, error } from "@sveltejs/kit";
import { t as triggerSync } from "../../../../chunks/sync.js";
const prerender = false;
const load = async ({ params, url }) => {
  const apiKey = url.searchParams.get("key");
  if (!apiKey) {
    throw redirect(302, "/bookmarks");
  }
  const keyRecord = await db.apiKeys.findByKey(apiKey);
  if (!keyRecord) {
    throw redirect(302, "/bookmarks");
  }
  await db.apiKeys.updateLastUsed(apiKey);
  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw error(400, "Invalid bookmark ID");
  }
  const [bookmark, categories, drafts] = await Promise.all([
    db.bookmarks.findById(id),
    db.categories.findAll(),
    db.drafts.findAllByBookmarkId(id)
  ]);
  const skillDraft = drafts.find((d) => d.draft_type === "skill") || null;
  if (!bookmark) {
    throw error(404, "Bookmark not found");
  }
  return {
    apiKey,
    bookmark,
    categories,
    drafts,
    skillDraft
  };
};
const actions = {
  async update({ params, request, url }) {
    const apiKey = url.searchParams.get("key");
    if (!apiKey) return { success: false };
    const id = parseInt(params.id);
    const formData = await request.formData();
    const updates = {};
    const title = formData.get("title");
    const category = formData.get("category");
    const reason = formData.get("reason_for_bookmark");
    const blogApproved = formData.get("blog_approved");
    const tags = formData.get("tags");
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (reason) updates.reason_for_bookmark = reason;
    updates.blog_approved = blogApproved === "on";
    if (tags) {
      try {
        updates.tags = JSON.parse(tags);
      } catch {
        updates.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
    }
    await db.bookmarks.update(id, updates);
    return { success: true };
  },
  async sync({ params, url }) {
    const apiKey = url.searchParams.get("key");
    if (!apiKey) return { success: false };
    try {
      await triggerSync();
      return { success: true, message: "Sync completed" };
    } catch (e) {
      return { success: false, message: "Sync failed" };
    }
  }
};
export {
  actions,
  load,
  prerender
};
