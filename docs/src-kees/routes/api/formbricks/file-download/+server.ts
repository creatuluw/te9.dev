/**
 * Formbricks File Download API Route
 *
 * Proxies file requests to Formbricks storage using server-side API key.
 * This ensures files can be opened by authenticated users without requiring
 * individual API authentication on the client side.
 *
 * How it works:
 * 1. Client requests /api/formbricks/file-download?url=<formbricks-storage-url>
 * 2. We fetch that URL with the server-side x-api-key header
 * 3. Formbricks returns a 302 redirect to a pre-signed S3 URL
 * 4. fetch() automatically follows the redirect and returns the file
 * 5. We stream the file back to the client
 *
 * Usage: /api/formbricks/file-download?url=<formbricks-file-url>
 */

import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const FORMBRICKS_API_KEY = env.FORMBRICKS_API_KEY || "";

function getContentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const contentTypeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    md: "text/markdown",
    markdown: "text/markdown",
    json: "application/json",
    zip: "application/zip",
    rar: "application/vnd.rar",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };

  return contentTypeMap[extension] || "application/octet-stream";
}

/**
 * Extract a clean filename from the URL path.
 * Formbricks URLs look like: /storage/{envId}/private/testpdf--fid--uuid.pdf
 */
function extractFileName(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Last segment is the filename
    const rawName = pathParts[pathParts.length - 1] || "download";
    // Clean up Formbricks naming: "testpdf--fid--uuid.pdf" → "testpdf.pdf"
    return decodeURIComponent(rawName).replace(/--fid--[a-f0-9-]+/, "");
  } catch {
    return "download";
  }
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const fileUrl = url.searchParams.get("url");

  if (!fileUrl) {
    return error(400, "File URL is required");
  }

  console.log("[Formbricks File Download] === REQUEST START ===");
  console.log(`[Formbricks File Download] Requested URL: ${fileUrl}`);
  console.log(
    `[Formbricks File Download] User authenticated: ${!!locals.user}`,
  );

  // Must be logged in
  if (!locals.user) {
    console.error("[Formbricks File Download] Unauthorized access attempt");
    return error(401, "Unauthorized - Please login");
  }

  // Only allow Formbricks URLs
  if (
    !fileUrl.includes("bucket-production") &&
    !fileUrl.includes("formbricks-production")
  ) {
    return error(400, "Only Formbricks storage URLs are allowed");
  }

  if (!FORMBRICKS_API_KEY) {
    console.error(
      "[Formbricks File Download] FORMBRICKS_API_KEY not configured",
    );
    return error(
      500,
      "Formbricks API key not configured. Please set FORMBRICKS_API_KEY environment variable.",
    );
  }

  try {
    // Fetch the file from Formbricks with the API key.
    // For storage URLs (formbricks-production.../storage/...), Formbricks returns
    // a 302 redirect to a pre-signed S3 URL when the x-api-key is valid.
    // fetch() follows redirects automatically by default.
    // For pre-signed S3 URLs (bucket-production...), the file is fetched directly.
    console.log(
      `[Formbricks File Download] Fetching with x-api-key: ${fileUrl.split("?")[0]}`,
    );

    const response = await fetch(fileUrl, {
      headers: {
        "x-api-key": FORMBRICKS_API_KEY,
      },
      redirect: "follow",
    });

    if (!response.ok) {
      console.error(
        `[Formbricks File Download] Fetch failed: ${response.status} ${response.statusText}`,
      );

      if (response.status === 401 || response.status === 403) {
        const body = await response.text().catch(() => "");
        console.error(`[Formbricks File Download] Auth error body: ${body}`);
        return error(403, "Access denied - check API key configuration");
      }

      if (response.status === 404) {
        return error(404, "File not found");
      }

      return error(
        response.status,
        `Failed to fetch file: ${response.statusText}`,
      );
    }

    const fileName = extractFileName(fileUrl);
    const contentType =
      response.headers.get("content-type") || getContentType(fileName);
    const contentDisposition =
      response.headers.get("content-disposition") || "";

    console.log(
      `[Formbricks File Download] Serving file: ${fileName}, Content-Type: ${contentType}, Size: ${response.headers.get("content-length") || "unknown"}`,
    );

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition":
        contentDisposition || `inline; filename="${fileName}"`,
      "Cache-Control": "private, max-age=3600",
    });

    // Forward content-length if available
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    const fileBuffer = await response.arrayBuffer();

    return new Response(fileBuffer, {
      headers,
      status: 200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Formbricks File Download] Error:", message);
    return error(500, `Failed to serve file: ${message}`);
  }
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
};
