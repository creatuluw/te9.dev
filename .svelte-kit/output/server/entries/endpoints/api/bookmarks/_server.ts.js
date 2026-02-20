import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../chunks/auth.js";
import { d as db } from "../../../../chunks/db.js";
const GET = async ({ url, request }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const days = parseInt(url.searchParams.get("days") || "30");
  const category = url.searchParams.get("category") || void 0;
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const showHidden = url.searchParams.get("showHidden") === "true";
  const bookmarks = await db.bookmarks.findAll({ days, category, limit, showHidden });
  return json(bookmarks);
};
export {
  GET
};
