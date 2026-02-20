import { json } from "@sveltejs/kit";
import { d as db } from "../../../../../../chunks/db.js";
const GET = async ({ url }) => {
  const apiKey = url.searchParams.get("key");
  const config = await db.config.get("raindrop");
  console.log("[Auth Status] Config from DB:", JSON.stringify(config));
  const hasToken = !!config?.refresh_token;
  console.log("[Auth Status] Has refresh token:", hasToken);
  const clientId = process.env.RAINDROP_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/raindrop/callback`;
  const authUrl = `https://raindrop.io/oauth/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&response_type=code&state=${encodeURIComponent(apiKey || "")}`;
  console.log("[Auth Status] Redirect URI:", redirectUri);
  console.log("[Auth Status] Returning:", { authenticated: hasToken });
  return json({
    authenticated: hasToken,
    authUrl
  });
};
export {
  GET
};
