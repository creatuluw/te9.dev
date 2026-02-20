import { d as db } from "./db.js";
import { json } from "@sveltejs/kit";
async function validateApiKey(request, url) {
  const apiKey = url.searchParams.get("key");
  if (!apiKey) {
    return { valid: false, error: "API key required. Add ?key=YOUR_API_KEY to the URL." };
  }
  const keyRecord = await db.apiKeys.findByKey(apiKey);
  if (!keyRecord) {
    return { valid: false, error: "Invalid API key." };
  }
  await db.apiKeys.updateLastUsed(apiKey);
  return { valid: true };
}
function unauthorized(message = "Unauthorized") {
  return json({ error: message }, { status: 401 });
}
function generateApiKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "sk_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
export {
  generateApiKey as g,
  unauthorized as u,
  validateApiKey as v
};
