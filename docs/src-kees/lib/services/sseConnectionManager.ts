/**
 * SSE Connection Manager - Manages active Server-Sent Events connections
 * FR-1: Real-time message delivery via SSE
 * EC-1: Catch-up for missed events with timestamp-based event IDs
 *
 * Manages per-user SSE connections with max 5 connections per user.
 * Supports event formatting, heartbeat comments, and reconnection via Last-Event-ID.
 * Event IDs use format: ts_{timestamp}_{sequence} for catch-up window calculation.
 */

import {
  formatEventId,
  parseEventId,
  isCatchUpWindow,
  getEventsSince,
  type StoredEvent,
  CATCH_UP_WINDOW_MS,
} from "./sseCatchUp";

export interface SSEConnection {
  userId: string;
  enqueue: (data: string) => void;
  lastEventId: string;
  createdAt: Date;
}

const MAX_CONNECTIONS_PER_USER = 5;

class SSEConnectionManager {
  private connections: Map<string, Set<SSEConnection>> = new Map();
  private eventBuffer: Map<string, StoredEvent[]> = new Map();
  private eventSequence = 0;
  private readonly MAX_BUFFER_SIZE = 1000;

  addConnection(
    userId: string,
    enqueue: (data: string) => void,
    lastEventId?: string,
  ): SSEConnection {
    const connection: SSEConnection = {
      userId,
      enqueue,
      lastEventId: lastEventId || "",
      createdAt: new Date(),
    };

    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    const userConnections = this.connections.get(userId)!;

    // Enforce max connections per user (drop oldest)
    if (userConnections.size >= MAX_CONNECTIONS_PER_USER) {
      const oldest = Array.from(userConnections).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      )[0];
      this.removeConnection(oldest);
    }

    userConnections.add(connection);
    return connection;
  }

  removeConnection(connection: SSEConnection): void {
    const userConnections = this.connections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connection);
      if (userConnections.size === 0) {
        this.connections.delete(connection.userId);
      }
    }
  }

  pushEvent(userId: string, event: string, data: unknown): void {
    const connections = this.connections.get(userId);
    if (!connections) return;

    const now = Date.now();
    const sequence = ++this.eventSequence;
    const id = formatEventId(now, sequence);
    const formatted = formatSSEEvent(event, data, id);

    // Store event in buffer for catch-up retrieval
    const storedEvent: StoredEvent = {
      id,
      event,
      data,
      timestamp: now,
    };
    if (!this.eventBuffer.has(userId)) {
      this.eventBuffer.set(userId, []);
    }
    const buffer = this.eventBuffer.get(userId)!;
    buffer.push(storedEvent);
    // Trim buffer if it exceeds max size
    if (buffer.length > this.MAX_BUFFER_SIZE) {
      this.eventBuffer.set(userId, buffer.slice(-this.MAX_BUFFER_SIZE));
    }

    for (const conn of connections) {
      try {
        conn.enqueue(formatted);
        conn.lastEventId = id;
      } catch {
        this.removeConnection(conn);
      }
    }
  }

  /**
   * Get missed events for a user since the given event ID.
   * Used for SSE catch-up on reconnection (EC-1).
   *
   * @param userId - The user ID to get events for
   * @param sinceEventId - The last event ID the client received
   * @returns Array of events that occurred after the given event ID
   */
  getMissedEvents(userId: string, sinceEventId: string): StoredEvent[] {
    const buffer = this.eventBuffer.get(userId);
    if (!buffer || buffer.length === 0) return [];

    return getEventsSince(sinceEventId, buffer);
  }

  /**
   * Determine if a catch-up is possible for the given last event ID.
   * Returns true if the gap is within the catch-up window.
   *
   * @param lastEventId - The last event ID received by the client
   * @returns true if catch-up is possible, false if full-refresh is needed
   */
  canCatchUp(lastEventId: string): boolean {
    const parsed = parseEventId(lastEventId);
    if (!parsed) return false;

    return isCatchUpWindow(parsed.timestamp, Date.now());
  }

  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  getTotalConnections(): number {
    let total = 0;
    for (const conns of this.connections.values()) {
      total += conns.size;
    }
    return total;
  }

  removeAllConnections(userId: string): void {
    this.connections.delete(userId);
  }
}

export function formatSSEEvent(
  event: string,
  data: unknown,
  id?: string | number,
): string {
  const lines = [`event: ${event}`];
  if (id !== undefined) {
    lines.push(`id: ${id}`);
  }
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push("", ""); // Empty line to end event
  return lines.join("\n");
}

export function formatSSEComment(comment: string): string {
  return `: ${comment}\n\n`;
}

export const sseConnectionManager = new SSEConnectionManager();
