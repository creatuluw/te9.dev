/**
 * GET /api/email/track/open/[messageId] - Open tracking pixel endpoint
 *
 * Returns a 1x1 transparent GIF pixel and records an 'opened' tracking event.
 * The pixel is returned immediately; the tracking event is recorded fire-and-forget.
 */

import type { RequestHandler } from "./$types";
import * as emailTrackingService from "$lib/services/emailTrackingService";

// 1x1 transparent GIF (43 bytes) — decoded from base64 without Buffer
const TRACKING_PIXEL_BASE64 =
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const TRACKING_PIXEL = (() => {
  const binary = atob(TRACKING_PIXEL_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
})();

const PIXEL_HEADERS = {
  "Content-Type": "image/gif",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Content-Length": TRACKING_PIXEL.length.toString(),
};

export const GET: RequestHandler = async ({
  params,
  getClientAddress,
  request,
}) => {
  // Extract and clean messageId — strip .png extension if present
  let rawId = params.messageId;
  if (rawId.endsWith(".png")) {
    rawId = rawId.slice(0, -4);
  }

  const messageId = parseInt(rawId, 10);

  // Return the pixel immediately — fast response
  const response = new Response(TRACKING_PIXEL, {
    status: 200,
    headers: PIXEL_HEADERS,
  });

  // Fire-and-forget: record the tracking event without blocking the response
  if (!messageId || isNaN(messageId) || messageId <= 0) {
    console.warn(
      "[email-track-open] Invalid or missing messageId:",
      params.messageId,
    );
    return response;
  }

  const ipAddress = getClientAddress();
  const userAgent = request.headers.get("user-agent") || undefined;

  emailTrackingService
    .recordTrackingEvent({
      messageId,
      eventType: "opened",
      ipAddress,
      userAgent,
    })
    .catch((error) => {
      console.error(
        "[email-track-open] Failed to record tracking event:",
        error,
      );
    });

  return response;
};
