import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../chunks/auth.js";
import { d as db } from "../../../../chunks/db.js";
const GET = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const config = await db.config.getAll();
  return json(config);
};
const PATCH = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const body = await request.json();
  if (body.polling) {
    await db.config.set("polling", body.polling);
  }
  if (body.ai) {
    await db.config.set("ai", body.ai);
  }
  const config = await db.config.getAll();
  return json(config);
};
export {
  GET,
  PATCH
};
