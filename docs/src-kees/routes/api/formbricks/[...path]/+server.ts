/**
 * Formbricks API Proxy
 *
 * Proxies requests to Formbricks API to avoid CORS issues and keep API key server-side.
 * This route handles all Formbricks API endpoints by forwarding requests to the actual API.
 */

import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";

/**
 * Get Formbricks configuration from environment
 */
function getFormbricksConfig() {
  const baseUrl =
    env.FORMBRICKS_URL ||
    process.env.FORMBRICKS_URL ||
    "https://formbricks-production-f895.up.railway.app";
  const apiKey = env.FORMBRICKS_API_KEY || process.env.FORMBRICKS_API_KEY || "";

  if (!apiKey) {
    console.warn(
      "[Formbricks Proxy] FORMBRICKS_API_KEY is not configured in environment variables",
    );
    console.warn(
      "[Formbricks Proxy] Available env keys:",
      Object.keys(env).filter((k) => k.includes("FORM")),
    );
    console.warn("[Formbricks Proxy] Requests may fail with 401 Unauthorized");
  }

  return { baseUrl, apiKey };
}

/**
 * Handle all HTTP methods (GET, POST, PUT, PATCH, DELETE)
 */
async function handleRequest(event: {
  request: Request;
  params: { path?: string };
}) {
  try {
    const { baseUrl, apiKey } = getFormbricksConfig();
    const { request, params } = event;

    // Build target URL - params.path contains the full path after /api/formbricks/
    const path = params.path || "";
    const url = new URL(request.url);

    // Construct the full target URL
    const targetUrl = new URL(`${baseUrl}/api/v1/${path}${url.search}`);

    // Log request details (development only)
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log("[Formbricks Proxy] Request:", {
        method: request.method,
        originalUrl: request.url,
        paramsPath: params.path,
        constructedPath: path,
        targetUrl: targetUrl.toString(),
        hasApiKey: !!apiKey,
      });
    }

    // Forward headers (excluding host and origin)
    const forwardHeaders = new Headers();
    forwardHeaders.set("x-api-key", apiKey);
    forwardHeaders.set("Content-Type", "application/json");

    // Copy relevant headers from original request
    const relevantHeaders = ["accept", "accept-language", "cache-control"];
    for (const header of relevantHeaders) {
      const value = request.headers.get(header);
      if (value) {
        forwardHeaders.set(header, value);
      }
    }

    // Build request config with timeout for Railway cold starts
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000); // 60 second timeout for Railway cold starts

    const requestConfig: RequestInit = {
      method: request.method,
      headers: forwardHeaders,
      signal: controller.signal,
    };

    // Include body for non-GET requests
    if (request.method !== "GET" && request.method !== "HEAD") {
      const body = await request.text();
      if (body) {
        requestConfig.body = body;
      }
    }

    // Make request to Formbricks API
    let response;
    try {
      response = await fetch(targetUrl.toString(), requestConfig);
    } finally {
      clearTimeout(timeout);
    }

    // Get response body
    const contentType = response.headers.get("content-type");
    let data: unknown;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Log response (development only)
    if (import.meta.env.DEV) {
      console.log("[Formbricks Proxy] Response:", {
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        dataType: typeof data,
        dataKeys: data && typeof data === "object" ? Object.keys(data) : "N/A",
      });
      if (path === "surveys") {
        console.log(
          "[Formbricks Proxy] Surveys response data:",
          JSON.stringify(data, null, 2).substring(0, 500),
        );
      }
    }

    // Return response with same status
    if (!response.ok) {
      console.error("[Formbricks Proxy] Error response:", {
        status: response.status,
        statusText: response.statusText,
        path,
        data,
      });

      return json(
        {
          error: "Formbricks API request failed",
          details: data,
          status: response.status,
        },
        { status: response.status },
      );
    }

    return json(data, { status: response.status });
  } catch (err) {
    console.error("[Formbricks Proxy] Request failed:", err);

    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return json(
      { error: "Failed to proxy request to Formbricks", details: errorMessage },
      { status: 500 },
    );
  }
}

// Export handlers for all HTTP methods
export const GET: RequestHandler = handleRequest;
export const POST: RequestHandler = handleRequest;
export const PUT: RequestHandler = handleRequest;
export const PATCH: RequestHandler = handleRequest;
export const DELETE: RequestHandler = handleRequest;
