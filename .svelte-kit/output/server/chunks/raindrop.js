import { d as db } from "./db.js";
import { config } from "dotenv";
config();
const RAINDROP_API = "https://api.raindrop.io/rest/v1";
let accessToken = null;
let tokenExpiresAt = 0;
async function getStoredTokens() {
  const raindropConfig = await db.config.get("raindrop");
  return {
    refresh_token: raindropConfig?.refresh_token || null
  };
}
async function hasValidRefreshToken() {
  const tokens = await getStoredTokens();
  return !!tokens.refresh_token;
}
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }
  const clientId = process.env.RAINDROP_CLIENT_ID;
  const clientSecret = process.env.RAINDROP_CLIENT_SECRET;
  const tokens = await getStoredTokens();
  const refreshToken = tokens.refresh_token;
  console.log("[Raindrop] Checking credentials...", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken
  });
  if (!clientId || !clientSecret) {
    throw new Error("Missing Raindrop.io credentials. Set RAINDROP_CLIENT_ID and RAINDROP_CLIENT_SECRET in .env");
  }
  if (!refreshToken) {
    throw new Error("NO_REFRESH_TOKEN");
  }
  console.log("[Raindrop] Refreshing access token...");
  const response = await fetch("https://api.raindrop.io/v1/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("[Raindrop] Token refresh failed:", text);
    throw new Error(`Failed to refresh Raindrop token: ${text}`);
  }
  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1e3 - 6e4;
  console.log("[Raindrop] Access token refreshed successfully");
  return accessToken;
}
async function fetchAllBookmarks(options) {
  const token = await getAccessToken();
  const allBookmarks = [];
  let page = 0;
  const perPage = 50;
  const limit = options?.limit || 100;
  let total = 0;
  const searchParams = [];
  if (options?.days) {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() - options.days);
    searchParams.push(`lastUpdate:>${date.toISOString().split("T")[0]}`);
  }
  console.log("[Raindrop] Fetching bookmarks...", { limit, perPage, days: options?.days, search: searchParams.join(" ") });
  while (true) {
    const params = new URLSearchParams({
      page: page.toString(),
      perpage: perPage.toString(),
      sort: "-lastUpdate"
    });
    if (searchParams.length > 0) {
      params.set("search", searchParams.join(" "));
    }
    const url = `${RAINDROP_API}/raindrops/0?${params}`;
    console.log("[Raindrop] Requesting page", page);
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") || "60";
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds.`);
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Raindrop] Error:", response.status, errorText);
      throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
    }
    const data = await response.json();
    total = data.count || 0;
    const items = data.items;
    if (!items || items.length === 0) {
      console.log("[Raindrop] No items returned, breaking");
      break;
    }
    allBookmarks.push(...items);
    console.log(`[Raindrop] Page ${page}: ${items.length} items, total fetched: ${allBookmarks.length}`);
    if (allBookmarks.length >= limit) {
      console.log(`[Raindrop] Reached limit of ${limit}`);
      break;
    }
    if (items.length < perPage) break;
    page++;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const hasMore = total > allBookmarks.length;
  console.log(`[Raindrop] Total: ${total}, Fetched: ${allBookmarks.length}, Has more: ${hasMore}`);
  return {
    items: allBookmarks.slice(0, limit),
    hasMore,
    total
  };
}
async function syncBookmarks(options) {
  console.log("[Sync] Starting sync...", { limit: options?.limit, days: options?.days });
  let result;
  try {
    result = await fetchAllBookmarks({ limit: options?.limit || 100, days: options?.days });
    console.log("[Sync] Fetched items:", result.items.length, "hasMore:", result.hasMore);
  } catch (error) {
    console.error("[Sync] Failed to fetch from Raindrop:", error);
    throw error;
  }
  const raindropItems = result.items;
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (let i = 0; i < raindropItems.length; i++) {
    const item = raindropItems[i];
    console.log(`[Sync] Processing ${i + 1}/${raindropItems.length}:`, item._id, item.title);
    const existing = await db.bookmarks.findByRaindropId(item._id);
    const wasModified = item.created !== item.lastUpdate;
    if (existing) {
      if (wasModified) {
        console.log("[Sync] Updating modified bookmark");
        await db.bookmarks.update(existing.id, {
          title: item.title,
          excerpt: item.excerpt || null,
          cover: item.cover || null,
          tags: item.tags || [],
          raindrop_updated_at: item.lastUpdate || null
        });
        updated++;
      } else {
        console.log("[Sync] Skipping unchanged bookmark");
        skipped++;
      }
      continue;
    }
    const bookmarkData = {
      raindrop_id: item._id,
      title: item.title,
      link: item.link,
      excerpt: item.excerpt || null,
      cover: item.cover || null,
      domain: item.domain || null,
      type: item.type || "link",
      tags: item.tags || [],
      blog_approved: null,
      reason_for_bookmark: null,
      category: "Uncategorized",
      raindrop_created_at: item.created || null,
      raindrop_updated_at: item.lastUpdate || null
    };
    console.log("[Sync] Creating new bookmark");
    const created = await db.bookmarks.create(bookmarkData);
    console.log("[Sync] Created bookmark id:", created.id);
    added++;
  }
  console.log(`[Sync] Complete: ${added} added, ${updated} updated, ${skipped} skipped, hasMore: ${result.hasMore}`);
  return { added, updated, skipped, hasMore: result.hasMore, total: result.total };
}
export {
  fetchAllBookmarks as f,
  hasValidRefreshToken as h,
  syncBookmarks as s
};
