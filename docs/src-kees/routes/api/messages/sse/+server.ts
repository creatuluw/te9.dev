/**
 * GET /api/messages/sse - SSE endpoint for real-time message push
 *
 * Establishes an SSE connection for authenticated users.
 * Pushes `message.new` events when user is a recipient or @mentioned.
 * Pushes `badge.update` events when unread count changes.
 *
 * Auth: JWT token passed as query parameter (EventSource can't send custom headers)
 * Reconnection: Supports Last-Event-ID header for catch-up (EC-1)
 * Heartbeat: Every 30 seconds
 * Max connections: 5 per user (oldest dropped)
 */

import type { RequestHandler } from "./$types";
import { verifyToken } from "$lib/utils/jwt";
import { processQueue } from "$lib/services/emailQueueService";
import {
  sseConnectionManager,
  formatSSEComment,
} from "$lib/services/sseConnectionManager";
import { formatSSEEvent } from "$lib/services/sseConnectionManager";

export const GET: RequestHandler = async ({ url, request }) => {
  // Auth: JWT from query param (EventSource can't send headers)
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Unauthorized: No token provided", { status: 401 });
  }

  const tokenResult = await verifyToken(token);
  if (!tokenResult.success) {
    return new Response("Unauthorized: Invalid token", { status: 401 });
  }

  const userId = tokenResult.value.userId as string;

  // EC-5: Help page users (no _auth_users record) cannot use SSE
  // They have a valid magic link token but no userId in the system
  if (!userId) {
    return new Response(
      "Forbidden: SSE is not available for help page users. Use polling instead.",
      { status: 403 },
    );
  }

  // Parse Last-Event-ID for catch-up on reconnect (EC-1)
  const lastEventId = request.headers.get("Last-Event-ID") || "";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Determine catch-up vs full-refresh based on gap (EC-1)
      if (lastEventId && !sseConnectionManager.canCatchUp(lastEventId)) {
        // Gap exceeds catch-up window — send full-refresh event
        const refreshEvent = formatSSEEvent("full-refresh", {
          reason: "gap_exceeded",
        });
        controller.enqueue(encoder.encode(refreshEvent));
      } else if (lastEventId) {
        // Within catch-up window — send missed events
        const missedEvents = sseConnectionManager.getMissedEvents(
          userId,
          lastEventId,
        );
        for (const stored of missedEvents) {
          const catchUpEvent = formatSSEEvent(
            stored.event,
            stored.data,
            stored.id,
          );
          controller.enqueue(encoder.encode(catchUpEvent));
        }
      }

      // Register connection with manager
      const connection = sseConnectionManager.addConnection(
        userId,
        (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            sseConnectionManager.removeConnection(connection);
          }
        },
        lastEventId,
      );

      // Send initial connected event with reconnection info
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ userId, lastEventId })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Heartbeat every 30 seconds to keep connection alive
      // Also processes the email queue so pending notification emails get sent
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(formatSSEComment("heartbeat")));
          // Process email queue on heartbeat (fire-and-forget, non-blocking)
          processQueue().catch((err) => {
            console.error(
              "[SSE heartbeat] Email queue processing failed:",
              err,
            );
          });
        } catch {
          clearInterval(heartbeat);
          sseConnectionManager.removeConnection(connection);
        }
      }, 30000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        sseConnectionManager.removeConnection(connection);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
