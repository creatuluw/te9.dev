import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../../chunks/auth.js";
import { d as db } from "../../../../../chunks/db.js";
import { a as generateSlug } from "../../../../../chunks/ai.js";
const POST = async ({ params, request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return json({ error: "Invalid bookmark ID" }, { status: 400 });
  }
  const bookmark = await db.bookmarks.findById(id);
  if (!bookmark) {
    return json({ error: "Bookmark not found" }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const draftType = body.draft_type || "blog_post";
  const metadata = body.metadata || null;
  const customTitle = body.custom_title || bookmark.title;
  if (draftType === "skill") {
    const existingSkill = await db.drafts.findSkillByBookmarkId(id);
    if (existingSkill) {
      return json({ error: "A skill draft already exists for this bookmark. Each bookmark can only have one skill draft.", existingDraft: existingSkill }, { status: 409 });
    }
  }
  const title = customTitle;
  const slug = generateSlug(title);
  const draft = await db.drafts.create({
    bookmark_id: id,
    title,
    slug,
    content: "",
    status: "pending",
    feedback: null,
    draft_type: draftType,
    metadata
  });
  console.log("[Generate] Created draft:", draft.id, "type:", draftType, "for bookmark:", id);
  return json(draft);
};
export {
  POST
};
