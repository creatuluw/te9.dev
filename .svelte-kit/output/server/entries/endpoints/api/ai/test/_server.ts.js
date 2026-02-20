import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../../chunks/auth.js";
import { t as testAIConnection } from "../../../../../chunks/ai.js";
const GET = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const result = await testAIConnection();
  return json(result);
};
export {
  GET
};
