import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../chunks/auth.js";
import { d as db } from "../../../../chunks/db.js";
const GET = async ({ url, request }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const status = url.searchParams.get("status") || void 0;
  const drafts = await db.drafts.findAll({ status });
  return json(drafts);
};
export {
  GET
};
