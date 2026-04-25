/**
 * Message store - Manages message badge count with SSE real-time updates
 *
 * Uses sseClient for real-time unread count updates via Server-Sent Events.
 * Falls back to periodic polling as a safety net.
 * Follows standardized store patterns with middleware support.
 */
import { createStore, createLoggingMiddleware } from "./storeFactory";
import { authStore } from "./authStore";
import * as messageService from "$lib/services/messageService";
import {
  getSubscriptionMessages,
  getReadMessageIds,
  markAllSubscriptionMessagesAsRead,
} from "$lib/services/messageSubscriptionService";
import { sseClient } from "$lib/services/sseClient";
import { toastStore } from "./toastStore";
import { getUserMessage } from "$lib/types/errors";

interface MessageStoreData {
  unreadCount: number;
  loading: boolean;
}

interface MessageStore {
  subscribe: (callback: (data: MessageStoreData) => void) => () => void;
  loadUnreadCount: () => Promise<void>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  refresh: () => void;
  reset: () => void;
  /**
   * Mark subscription updates as seen by storing current timestamp.
   * Called when the user visits the Updates tab on /messages.
   */
  markUpdatesSeen: () => void;
}

/**
 * Create message store with SSE support
 *
 * @returns Message store instance
 */
function createMessageStore(): MessageStore {
  const store = createStore<MessageStoreData>({
    initialValue: {
      unreadCount: 0,
      loading: false,
    },
    name: "message",
    middleware: [createLoggingMiddleware("message")],
  });

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let unsubMessage: (() => void) | null = null;
  let unsubBadge: (() => void) | null = null;
  let unsubFullRefresh: (() => void) | null = null;

  return {
    subscribe: store.subscribe,

    /**
     * Load unread message count from API
     *
     * Used for initial load and as fallback when SSE is unavailable.
     *
     * @example
     * ```typescript
     * await messageStore.loadUnreadCount();
     * ```
     */
    async loadUnreadCount(): Promise<void> {
      const auth = authStore.getAuth();
      if (!auth?.user?.id) {
        store.set({ unreadCount: 0, loading: false });
        return;
      }

      store.update((state) => ({ ...state, loading: true }));

      // Count unread @mention messages
      const mentionsResult = await messageService.getMessagesWithMentions(
        auth.user.id,
      );

      // Count unread subscription messages (from /messages?tab=updates).
      // Subscription messages are chat messages shared across all subscribers,
      // so in_app_read is NOT per-user. Instead, the _bpm_subscription_message_reads
      // table tracks which messages each user has read.
      const [subsResult, readIdsResult] = await Promise.all([
        getSubscriptionMessages(auth.user.id),
        getReadMessageIds(auth.user.id),
      ]);

      const mentionUnread = mentionsResult.success
        ? mentionsResult.value.filter((msg) => !msg.in_app_read).length
        : 0;

      const subsUnread = (() => {
        if (!subsResult.success) return 0;
        if (subsResult.value.length === 0) return 0;
        const readIds = readIdsResult.success
          ? readIdsResult.value
          : new Set<number>();
        return subsResult.value.filter((m) => !readIds.has(m.id)).length;
      })();

      const unreadCount = mentionUnread + subsUnread;

      if (!mentionsResult.success) {
        console.error("Error loading unread count:", mentionsResult.error);
        if (import.meta.env.DEV) {
          toastStore.add(getUserMessage(mentionsResult.error), "error");
        }
      }

      store.set({ unreadCount, loading: false });
    },

    /**
     * Start SSE connection with fallback polling
     *
     * Connects to SSE for real-time badge and message updates.
     * Also sets up a polling interval as a safety net fallback.
     *
     * @param interval - Fallback polling interval in milliseconds (default: 60000 = 1 minute)
     *
     * @example
     * ```typescript
     * messageStore.startPolling(30000); // Poll every 30 seconds as fallback
     * ```
     */
    startPolling(interval: number = 60000): void {
      const auth = authStore.getAuth();
      if (!auth?.user?.id || !auth?.token) {
        return;
      }

      // Load immediately
      this.loadUnreadCount();

      // Register badge update handler — updates unread count on SSE push
      unsubBadge = sseClient.onBadgeUpdate((data: { unreadCount: number }) => {
        store.set({ unreadCount: data.unreadCount, loading: false });
      });

      // Register message handler — triggers full unread count refresh
      unsubMessage = sseClient.onMessage(() => {
        this.loadUnreadCount();
      });

      // Register full-refresh handler — server requests full reload when
      // SSE gap exceeds catch-up window (EC-1)
      unsubFullRefresh = sseClient.onFullRefresh(() => {
        this.refresh();
      });

      // Connect SSE with token
      sseClient.connect(auth.token);

      // Set up fallback polling interval (always active as safety net)
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      pollInterval = setInterval(() => {
        this.loadUnreadCount();
      }, interval);
    },

    /**
     * Stop SSE connection and fallback polling
     *
     * @example
     * ```typescript
     * messageStore.stopPolling();
     * ```
     */
    stopPolling(): void {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      // Unsubscribe from SSE handlers
      if (unsubMessage) {
        unsubMessage();
        unsubMessage = null;
      }
      if (unsubBadge) {
        unsubBadge();
        unsubBadge = null;
      }
      if (unsubFullRefresh) {
        unsubFullRefresh();
        unsubFullRefresh = null;
      }

      // Disconnect SSE
      sseClient.disconnect();
    },

    /**
     * Manually refresh the unread count (e.g., after marking messages as read)
     *
     * @example
     * ```typescript
     * messageStore.refresh();
     * ```
     */
    refresh(): void {
      this.loadUnreadCount();
    },

    /**
     * Reset the store to initial state and disconnect SSE
     *
     * @example
     * ```typescript
     * messageStore.reset();
     * ```
     */
    reset(): void {
      this.stopPolling();
      store.reset();
    },

    /**
     * Mark all subscription messages as read in the database.
     * Called when the user clicks "Alles als gelezen markeren" on the Updates tab.
     * The next loadUnreadCount call will reflect the updated read state.
     */
    async markUpdatesSeen(): Promise<void> {
      const auth = authStore.getAuth();
      if (!auth?.user?.id) return;
      await markAllSubscriptionMessagesAsRead(auth.user.id);
      // Refresh count immediately so badge updates
      this.loadUnreadCount();
    },
  };
}

export const messageStore = createMessageStore();

// Backward compatibility export
export const notificationStore = messageStore;
