import { d as db } from "../../../../chunks/db.js";
import { redirect, error } from "@sveltejs/kit";
const prerender = false;
const load = async ({ params, url }) => {
  const apiKey = url.searchParams.get("key");
  if (!apiKey) {
    throw redirect(302, "/drafts");
  }
  const keyRecord = await db.apiKeys.findByKey(apiKey);
  if (!keyRecord) {
    throw redirect(302, "/drafts");
  }
  await db.apiKeys.updateLastUsed(apiKey);
  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw error(400, "Invalid draft ID");
  }
  const [draft, bookmark] = await Promise.all([
    db.drafts.findById(id),
    db.drafts.findById(id).then((d) => d ? db.bookmarks.findById(d.bookmark_id) : null)
  ]);
  if (!draft) {
    throw error(404, "Draft not found");
  }
  return {
    apiKey,
    draft,
    bookmark
  };
};
const actions = {
  async approve({ params, url }) {
    const apiKey = url.searchParams.get("key");
    if (!apiKey) return { success: false };
    const id = parseInt(params.id);
    await db.drafts.update(id, { status: "approved" });
    return { success: true };
  },
  async reject({ params, request, url }) {
    const apiKey = url.searchParams.get("key");
    if (!apiKey) return { success: false };
    const id = parseInt(params.id);
    const formData = await request.formData();
    const feedback = formData.get("feedback");
    await db.drafts.update(id, { status: "rejected", feedback });
    return { success: true };
  },
  async publish({ params, url }) {
    const apiKey = url.searchParams.get("key");
    if (!apiKey) return { success: false };
    const id = parseInt(params.id);
    const draft = await db.drafts.findById(id);
    if (!draft || draft.status !== "approved") {
      return { success: false, error: "Draft must be approved first" };
    }
    return { success: true, canPublish: true };
  }
};
export {
  actions,
  load,
  prerender
};
