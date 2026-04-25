/**
 * Queue Monitor - Pure functions and factory for email queue overflow handling (EC-2)
 *
 * Email queue overflow (>500 pending) triggers admin warning.
 * Queue processes FIFO (oldest next_attempt_at first).
 * New items can still be enqueued even when over threshold (soft limit).
 *
 * All helpers are pure functions — easy to test.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of checking queue overflow threshold
 */
export interface OverflowStatus {
  isOverThreshold: boolean;
  warning?: string;
}

/**
 * Queue metrics snapshot for monitoring
 */
export interface QueueMetrics {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  dead: number;
  total: number;
  isOverThreshold: boolean;
}

/**
 * Queue monitor interface returned by createQueueMonitor()
 */
export interface QueueMonitor {
  getMetrics(): QueueMetrics;
  recordEnqueue(): void;
  recordProcess(status: string): void;
  reset(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default overflow threshold — warns when pending count exceeds this */
const DEFAULT_OVERFLOW_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Check if the email queue is over the overflow threshold.
 *
 * EC-2: Email queue overflow (>500 pending) triggers admin warning.
 * This is a soft limit — it warns but does NOT block new enqueue operations.
 *
 * @param pendingCount - Current number of pending jobs in the queue
 * @param threshold - Overflow threshold (default: 500). Warning triggers when pendingCount > threshold.
 * @returns OverflowStatus with isOverThreshold flag and optional warning message
 */
export function checkQueueOverflow(
  pendingCount: number,
  threshold: number = DEFAULT_OVERFLOW_THRESHOLD,
): OverflowStatus {
  if (pendingCount > threshold) {
    return {
      isOverThreshold: true,
      warning: `Queue overflow warning: ${pendingCount} pending emails exceed threshold of ${threshold}. Admin action may be needed.`,
    };
  }

  return { isOverThreshold: false };
}

/**
 * Sort queue items by FIFO order (oldest next_attempt_at first).
 *
 * EC-2: Queue processes FIFO — items with the earliest next_attempt_at
 * are processed first. This is a simple ascending date comparison.
 *
 * Does not mutate the original array — returns a new sorted array.
 *
 * @param items - Array of items with next_attempt_at field
 * @returns New array sorted ascending by next_attempt_at (oldest first)
 */
export function sortQueueByFIFO<T extends { next_attempt_at: string }>(
  items: T[],
): T[] {
  if (items.length <= 1) {
    return [...items];
  }

  return [...items].sort((a, b) => {
    // Compare ISO date strings lexicographically (works for ISO 8601)
    return a.next_attempt_at.localeCompare(b.next_attempt_at);
  });
}

// ---------------------------------------------------------------------------
// Queue monitor factory
// ---------------------------------------------------------------------------

/**
 * Create a new queue monitor instance for tracking queue metrics.
 *
 * Each instance maintains its own independent state.
 * Use getMetrics() to get a snapshot of current counts.
 *
 * Threshold for isOverThreshold defaults to 500 (DEFAULT_OVERFLOW_THRESHOLD).
 *
 * @returns QueueMonitor instance with getMetrics, recordEnqueue, recordProcess, reset
 */
export function createQueueMonitor(): QueueMonitor {
  let pending = 0;
  let processing = 0;
  let sent = 0;
  let failed = 0;
  let dead = 0;
  let total = 0;

  return {
    getMetrics(): QueueMetrics {
      return {
        pending,
        processing,
        sent,
        failed,
        dead,
        total,
        isOverThreshold: pending > DEFAULT_OVERFLOW_THRESHOLD,
      };
    },

    recordEnqueue(): void {
      pending++;
      total++;
    },

    recordProcess(status: string): void {
      // Decrement pending (but not below zero)
      if (pending > 0) {
        pending--;
      }

      // Increment the target status counter
      switch (status) {
        case "processing":
          processing++;
          break;
        case "sent":
          sent++;
          break;
        case "failed":
          failed++;
          break;
        case "dead":
          dead++;
          break;
        // Unknown statuses: pending already decremented, nothing else to track
      }
    },

    reset(): void {
      pending = 0;
      processing = 0;
      sent = 0;
      failed = 0;
      dead = 0;
      total = 0;
    },
  };
}
