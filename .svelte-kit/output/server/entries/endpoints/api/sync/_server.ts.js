import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../chunks/auth.js";
import { t as triggerSync } from "../../../../chunks/sync.js";
const POST = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const body = await request.json().catch(() => ({}));
  const limit = body.limit || 100;
  const days = body.days || 90;
  try {
    const result = await triggerSync(limit, days);
    console.log("[API] Sync result:", result);
    return json({ success: true, ...result });
  } catch (error) {
    console.error("[API] Sync error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    if (message === "NO_REFRESH_TOKEN") {
      return json({ error: "NO_REFRESH_TOKEN", message: "Please connect your Raindrop.io account first" }, { status: 401 });
    }
    if (message.includes("Rate limited")) {
      return json({ error: "RATE_LIMITED", message }, { status: 429 });
    }
    return json({ error: message }, { status: 500 });
  }
};
export {
  POST
};
