import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../../chunks/auth.js";
import { d as db } from "../../../../../chunks/db.js";
const GET = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const keys = await db.apiKeys.findAll();
  return json(keys);
};
export {
  GET
};
