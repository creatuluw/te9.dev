/**
 * Badge Helpers - Pure functions for message badge display and SSE connection status
 *
 * Provides utilities for formatting badge counts, determining visibility,
 * and managing connection status labels in Dutch.
 */

/**
 * Connection status type representing SSE client state
 */
export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

/**
 * Badge state interface returned by createBadgeState closure
 */
export interface BadgeState {
    getCount(): number;
    setCount(n: number): void;
    increment(): void;
    decrement(): void;
    isVisible(): boolean;
    getDisplayText(): string;
    reset(): void;
}

/**
 * Format badge count for display.
 * Returns the count as a string, or "9+" when count exceeds 9.
 *
 * @param count - The unread message count
 * @returns Formatted display string
 *
 * @example
 * ```typescript
 * formatBadgeCount(0);   // "0"
 * formatBadgeCount(5);   // "5"
 * formatBadgeCount(9);   // "9"
 * formatBadgeCount(10);  // "9+"
 * formatBadgeCount(42);  // "9+"
 * ```
 */
export function formatBadgeCount(count: number): string {
    if (count > 9) {
        return "9+";
    }
    return String(count);
}

/**
 * Determine whether the badge should be visible.
 * Badge is shown when there are unread messages (count > 0).
 *
 * @param count - The unread message count
 * @returns True if badge should be displayed
 *
 * @example
 * ```typescript
 * shouldShowBadge(0);   // false
 * shouldShowBadge(1);   // true
 * shouldShowBadge(10);  // true
 * ```
 */
export function shouldShowBadge(count: number): boolean {
    return count > 0;
}

/**
 * Get Dutch display label for connection status.
 *
 * @param status - The connection status
 * @returns Dutch label string
 *
 * @example
 * ```typescript
 * getConnectionStatusLabel('connected');    // "Verbonden"
 * getConnectionStatusLabel('reconnecting'); // "Verbinden..."
 * getConnectionStatusLabel('offline');      // "Offline"
 * ```
 */
export function getConnectionStatusLabel(status: ConnectionStatus): string {
    const labels: Record<ConnectionStatus, string> = {
        connected: "Verbonden",
        reconnecting: "Verbinden...",
        offline: "Offline",
    };
    return labels[status];
}

/**
 * Compute connection status from SSE client boolean states.
 * isConnected takes precedence over isReconnecting.
 *
 * @param isConnected - Whether the SSE connection is open
 * @param isReconnecting - Whether the client is attempting to reconnect
 * @returns The computed connection status
 *
 * @example
 * ```typescript
 * computeConnectionStatus(true, false);   // "connected"
 * computeConnectionStatus(true, true);    // "connected"
 * computeConnectionStatus(false, true);   // "reconnecting"
 * computeConnectionStatus(false, false);  // "offline"
 * ```
 */
export function computeConnectionStatus(
    isConnected: boolean,
    isReconnecting: boolean
): ConnectionStatus {
    if (isConnected) {
        return 'connected';
    }
    if (isReconnecting) {
        return 'reconnecting';
    }
    return 'offline';
}

/**
 * Create a closure-based badge state manager.
 * Encapsulates count state and provides methods to manipulate it.
 *
 * @param initialCount - Starting count (default: 0)
 * @returns Badge state object with getter/setter methods
 *
 * @example
 * ```typescript
 * const badge = createBadgeState(5);
 * badge.getCount();        // 5
 * badge.isVisible();       // true
 * badge.getDisplayText();  // "5"
 * badge.increment();
 * badge.getCount();        // 6
 * badge.setCount(15);
 * badge.getDisplayText();  // "9+"
 * badge.reset();
 * badge.getCount();        // 0
 * badge.isVisible();       // false
 * ```
 */
export function createBadgeState(initialCount: number = 0): BadgeState {
    let count = initialCount;

    return {
        getCount(): number {
            return count;
        },

        setCount(n: number): void {
            count = n;
        },

        increment(): void {
            count++;
        },

        decrement(): void {
            if (count > 0) {
                count--;
            }
        },

        isVisible(): boolean {
            return shouldShowBadge(count);
        },

        getDisplayText(): string {
            return formatBadgeCount(count);
        },

        reset(): void {
            count = 0;
        },
    };
}
