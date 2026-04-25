/**
 * SSE Catch-Up Service - Handles reconnection catch-up logic
 * EC-1: When SSE client reconnects, server sends missed messages or full-refresh
 *
 * Pure functions for determining catch-up vs full-refresh behavior.
 * Event ID format: ts_{timestamp}_{sequence}
 */

// ============================================================================
// Types
// ============================================================================

export interface StoredEvent {
	id: string;
	event: string;
	data: unknown;
	timestamp: number;
}

export type CatchUpAction =
	| { type: 'catch-up'; events: StoredEvent[] }
	| { type: 'full-refresh' };

export interface CatchUpOptions {
	maxGapMs?: number;
	getEventsSince?: (lastEventId: string) => StoredEvent[];
	getCurrentEventId?: () => string;
	getNow?: () => Date;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default catch-up window: 5 minutes in milliseconds.
 * Configurable via VITE_SSE_CATCHUP_WINDOW_MS environment variable.
 */
export const CATCH_UP_WINDOW_MS: number =
	import.meta.env?.VITE_SSE_CATCHUP_WINDOW_MS
		? Number(import.meta.env.VITE_SSE_CATCHUP_WINDOW_MS)
		: 300000;

// ============================================================================
// Event ID Formatting & Parsing
// ============================================================================

/**
 * Format an event ID as ts_{timestamp}_{sequence}
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param sequence - Sequence number within the same millisecond
 * @returns Formatted event ID string
 */
export function formatEventId(timestamp: number, sequence: number): string {
	return `ts_${timestamp}_${sequence}`;
}

/**
 * Parse an event ID in format ts_{timestamp}_{sequence}
 *
 * @param eventId - The event ID string to parse
 * @returns Parsed timestamp and sequence, or null for invalid formats
 */
export function parseEventId(eventId: string): { timestamp: number; sequence: number } | null {
	if (!eventId) return null;

	const parts = eventId.split('_');
	if (parts.length !== 3) return null;
	if (parts[0] !== 'ts') return null;

	const timestamp = Number(parts[1]);
	const sequence = Number(parts[2]);

	if (isNaN(timestamp) || isNaN(sequence)) return null;

	return { timestamp, sequence };
}

// ============================================================================
// Window & Refresh Checks
// ============================================================================

/**
 * Check if the gap between two event timestamps is within the catch-up window.
 *
 * @param lastEventTimestamp - Timestamp of the last received event (ms)
 * @param currentEventTimestamp - Timestamp of the current event (ms)
 * @param maxGapMs - Maximum allowed gap in milliseconds (default: CATCH_UP_WINDOW_MS)
 * @returns true if gap is within window (can catch up), false otherwise
 */
export function isCatchUpWindow(
	lastEventTimestamp: number,
	currentEventTimestamp: number,
	maxGapMs: number = CATCH_UP_WINDOW_MS
): boolean {
	const gap = currentEventTimestamp - lastEventTimestamp;
	return gap <= maxGapMs;
}

/**
 * Determine if a full refresh is needed based on when the last event was received.
 *
 * @param lastEventTimestamp - When the last event was received
 * @param now - Current time (defaults to new Date())
 * @param maxGapMs - Maximum gap in milliseconds (default: CATCH_UP_WINDOW_MS)
 * @returns true if full refresh is needed (gap exceeds window)
 */
export function shouldFullRefresh(
	lastEventTimestamp: Date,
	now?: Date,
	maxGapMs: number = CATCH_UP_WINDOW_MS
): boolean {
	const currentTime = now ?? new Date();
	const gap = currentTime.getTime() - lastEventTimestamp.getTime();
	return gap > maxGapMs;
}

// ============================================================================
// Event Filtering
// ============================================================================

/**
 * Get events that occurred after the given event ID.
 *
 * @param lastEventId - The last event ID the client received
 * @param events - Array of stored events sorted by timestamp
 * @returns Events that occurred after the given event ID
 */
export function getEventsSince(lastEventId: string, events: StoredEvent[]): StoredEvent[] {
	if (!lastEventId || events.length === 0) {
		return [...events];
	}

	const lastIndex = events.findIndex((e) => e.id === lastEventId);

	if (lastIndex === -1) {
		// Event not found - return all events as fallback
		return [...events];
	}

	// Return events after the found index
	return events.slice(lastIndex + 1);
}

// ============================================================================
// Catch-Up Handler Factory
// ============================================================================

/**
 * Create a catch-up handler closure that determines reconnection behavior.
 *
 * @param options - Configuration options for the handler
 * @returns Object with onReconnect method that returns the appropriate action
 */
export function createCatchUpHandler(options: CatchUpOptions = {}) {
	const maxGapMs = options.maxGapMs ?? CATCH_UP_WINDOW_MS;
	const getEvents = options.getEventsSince ?? (() => []);
	const getNow = options.getNow ?? (() => new Date());

	return {
		/**
		 * Determine catch-up action on SSE reconnection.
		 *
		 * @param lastEventId - The last event ID received before disconnection
		 * @returns CatchUpAction indicating whether to catch-up or full-refresh
		 */
		onReconnect(lastEventId: string): CatchUpAction {
			// Invalid or empty lastEventId triggers full refresh
			const parsed = parseEventId(lastEventId);
			if (!parsed) {
				return { type: 'full-refresh' };
			}

			// Check if the gap exceeds the catch-up window
			const now = getNow();
			if (shouldFullRefresh(new Date(parsed.timestamp), now, maxGapMs)) {
				return { type: 'full-refresh' };
			}

			// Within window - return missed events
			const events = getEvents(lastEventId);
			return { type: 'catch-up', events };
		}
	};
}
