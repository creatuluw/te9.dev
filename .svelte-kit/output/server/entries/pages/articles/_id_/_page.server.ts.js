import { d as db } from "../../../../chunks/db.js";
import { error } from "@sveltejs/kit";
import { marked } from "marked";
const load = async ({ params }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) throw error(400, "Invalid article ID");
  const draft = await db.drafts.findById(id);
  if (!draft) throw error(404, "Article not found");
  if (draft.status !== "approved") throw error(404, "Article not found");
  let html = await marked(draft.content);
  html = html.replace(/<h1[^>]*>.*?<\/h1>/s, "");
  return {
    meta: {
      title: draft.title,
      date: draft.created_at,
      description: draft.content.slice(0, 150).replace(/[#*`]/g, "").trim(),
      slug: draft.slug,
      _draftType: draft.draft_type
    },
    content: html
  };
};
export {
  load
};
