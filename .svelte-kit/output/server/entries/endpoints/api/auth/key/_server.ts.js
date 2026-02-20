import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized, g as generateApiKey } from "../../../../../chunks/auth.js";
import { d as db } from "../../../../../chunks/db.js";
const POST = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const body = await request.json().catch(() => ({}));
  const name = body.name || `Key ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`;
  const key = generateApiKey();
  const newKey = await db.apiKeys.create(key, name);
  return json(newKey);
};
export {
  POST
};
