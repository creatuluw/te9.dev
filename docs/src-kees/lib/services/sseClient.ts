/**
 * SSE Client - Manages EventSource connection for real-time message delivery
 * FR-1: Real-time message push via SSE
 *
 * Features:
 * - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
 * - Event handlers for message.new and badge.update events
 * - Last-Event-ID support for catch-up on reconnect (EC-1)
 * - Clean disconnect on logout
 */

type EventHandler = (data: any) => void;
type FullRefreshHandler = () => void;

interface SSEClientOptions {
  baseUrl?: string;
  maxBackoff?: number;
  initialBackoff?: number;
}

const DEFAULT_BASE_URL = "/api/messages/sse";
const DEFAULT_MAX_BACKOFF = 30000;
const DEFAULT_INITIAL_BACKOFF = 1000;

/**
 * Calculate exponential backoff delay.
 * Returns initialMs * 2^attempt, capped at maxMs.
 *
 * @param attempt - The reconnect attempt number (0-indexed)
 * @param initialMs - Initial delay in milliseconds (default: 1000)
 * @param maxMs - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  initialMs: number = DEFAULT_INITIAL_BACKOFF,
  maxMs: number = DEFAULT_MAX_BACKOFF,
): number {
  const delay = initialMs * Math.pow(2, attempt);
  return Math.min(delay, maxMs);
}

/**
 * SSE Client class for managing EventSource connections.
 *
 * Handles automatic reconnection with exponential backoff,
 * dispatches typed events to registered handlers, and supports
 * Last-Event-ID for message catch-up after reconnection.
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private messageHandlers: EventHandler[] = [];
  private badgeUpdateHandlers: EventHandler[] = [];
  private fullRefreshHandlers: FullRefreshHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private lastEventId: string = "";
  private token: string = "";
  private baseUrl: string;
  private maxBackoff: number;
  private initialBackoff: number;

  constructor(options: SSEClientOptions = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.maxBackoff = options.maxBackoff || DEFAULT_MAX_BACKOFF;
    this.initialBackoff = options.initialBackoff || DEFAULT_INITIAL_BACKOFF;
  }

  /**
   * Establish SSE connection with the given auth token.
   * If already connected, disconnects first and creates a new connection.
   *
   * @param token - Authentication token
   */
  connect(token: string): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.token = token;
    this.reconnectAttempt = 0;
    this.createConnection();
  }

  /**
   * Create the underlying EventSource connection.
   * Includes token and optionally lastEventId as query params.
   */
  private createConnection(): void {
    let url = `${this.baseUrl}?token=${encodeURIComponent(this.token)}`;
    if (this.lastEventId) {
      url += `&lastEventId=${encodeURIComponent(this.lastEventId)}`;
    }

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      if (import.meta.env.DEV) {
        console.log("[SSEClient] Connection established");
      }
      this.reconnectAttempt = 0;
    };

    this.eventSource.addEventListener("message.new", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (e.lastEventId) this.lastEventId = e.lastEventId;
      this.messageHandlers.forEach((h) => h(data));
    });

    this.eventSource.addEventListener("badge.update", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (e.lastEventId) this.lastEventId = e.lastEventId;
      this.badgeUpdateHandlers.forEach((h) => h(data));
    });

    this.eventSource.addEventListener("full-refresh", (_e: MessageEvent) => {
      if (import.meta.env.DEV) {
        console.log("[SSEClient] Full refresh requested by server");
      }
      this.fullRefreshHandlers.forEach((h) => h());
    });

    this.eventSource.onerror = () => {
      this.scheduleReconnect();
    };
  }

  /**
   * Schedule a reconnect attempt with exponential backoff.
   * Closes the current connection and sets a timer for reconnection.
   */
  private scheduleReconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const delay = calculateBackoff(
      this.reconnectAttempt,
      this.initialBackoff,
      this.maxBackoff,
    );

    if (import.meta.env.DEV) {
      console.log(
        `[SSEClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`,
      );
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.createConnection();
    }, delay);
  }

  /**
   * Disconnect from the SSE endpoint.
   * Clears all timers, closes the connection, and removes all handlers.
   * Safe to call when not connected.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnectAttempt = 0;
    this.messageHandlers = [];
    this.badgeUpdateHandlers = [];
    this.fullRefreshHandlers = [];
  }

  /**
   * Register a handler for message.new events.
   *
   * @param handler - Function called with parsed message data
   * @returns Unsubscribe function to remove the handler
   */
  onMessage(handler: EventHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register a handler for badge.update events.
   *
   * @param handler - Function called with parsed badge data
   * @returns Unsubscribe function to remove the handler
   */
  onBadgeUpdate(handler: EventHandler): () => void {
    this.badgeUpdateHandlers.push(handler);
    return () => {
      this.badgeUpdateHandlers = this.badgeUpdateHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Register a handler for full-refresh events.
   * When the server sends a full-refresh event, it indicates the client
   * should perform a full reload of data (e.g., when SSE gap exceeds catch-up window).
   *
   * @param handler - Function called when full-refresh is received
   * @returns Unsubscribe function to remove the handler
   */
  onFullRefresh(handler: FullRefreshHandler): () => void {
    this.fullRefreshHandlers.push(handler);
    return () => {
      this.fullRefreshHandlers = this.fullRefreshHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  /**
   * Get the last event ID received from the server.
   * Used for catch-up after reconnection.
   *
   * @returns The last event ID, or empty string if none received
   */
  getLastEventId(): string {
    return this.lastEventId;
  }

  /**
   * Check if the SSE connection is currently open.
   *
   * @returns True if connected and readyState is OPEN
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

/**
 * Singleton SSE client instance for use across the application.
 *
 * @example
 * ```typescript
 * import { sseClient } from '$lib/services/sseClient';
 *
 * // Connect on login
 * sseClient.connect(authToken);
 *
 * // Listen for new messages
 * const unsubscribe = sseClient.onMessage((msg) => {
 *   console.log('New message:', msg);
 * });
 *
 * // Clean up on logout
 * sseClient.disconnect();
 * unsubscribe();
 * ```
 */
export const sseClient = new SSEClient();
