import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../../../chunks/auth.js";
import { d as db } from "../../../../../../chunks/db.js";
const POST = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const existingConfig = await db.config.get("raindrop");
  await db.config.set("raindrop", {
    last_sync_at: existingConfig?.last_sync_at || null
  });
  return json({ success: true, message: "Raindrop disconnected" });
};
export {
  POST
};
