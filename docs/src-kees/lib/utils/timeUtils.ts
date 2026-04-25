/**
 * Time utility functions for formatting dates and relative times
 * Handles timezone differences between server and client properly
 */

/**
 * Parse a timestamp string, ensuring it's treated as UTC if no timezone is specified
 * PostgreSQL TIMESTAMP (without timezone) should be treated as UTC
 * 
 * @param timestamp - Timestamp string from database
 * @returns Date object parsed correctly
 */
function parseTimestamp(timestamp: string): Date {
	// If timestamp doesn't have timezone info (no Z or +/-), assume it's UTC
	// PostgreSQL TIMESTAMP without timezone should be treated as UTC
	if (!timestamp.includes('Z') && !timestamp.match(/[+-]\d{2}:\d{2}$/)) {
		// Add 'Z' to indicate UTC
		return new Date(timestamp + 'Z');
	}
	return new Date(timestamp);
}

/**
 * Analyze time difference between client and server
 * Logs diagnostic information to help debug timezone issues
 * 
 * @param serverTimestamp - Timestamp from server (ISO string)
 * @param label - Optional label for logging
 */
export function analyzeTimeDifference(serverTimestamp: string, label = 'Message'): void {
	if (!import.meta.env.DEV) return; // Only log in development
	
	const serverDateParsed = parseTimestamp(serverTimestamp);
	const serverDateNaive = new Date(serverTimestamp); // Without our parsing
	const clientNow = new Date();
	const diffMsParsed = clientNow.getTime() - serverDateParsed.getTime();
	const diffMsNaive = clientNow.getTime() - serverDateNaive.getTime();
	
	console.log(`[Time Analysis] ${label}:`, {
		serverTimestamp,
		hasTimezone: serverTimestamp.includes('Z') || !!serverTimestamp.match(/[+-]\d{2}:\d{2}$/),
		serverDateParsedISO: serverDateParsed.toISOString(),
		serverDateParsedLocal: serverDateParsed.toLocaleString('nl-NL'),
		serverDateNaiveISO: serverDateNaive.toISOString(),
		serverDateNaiveLocal: serverDateNaive.toLocaleString('nl-NL'),
		clientNowISO: clientNow.toISOString(),
		clientNowLocal: clientNow.toLocaleString('nl-NL'),
		diffMsParsed,
		diffMsNaive,
		diffSecondsParsed: Math.floor(diffMsParsed / 1000),
		diffMinutesParsed: Math.floor(diffMsParsed / 60000),
		diffHoursParsed: Math.floor(diffMsParsed / 3600000),
		diffFormatted: formatRelativeTime(serverTimestamp),
		timezoneOffset: new Date().getTimezoneOffset(), // Minutes offset from UTC
		clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
	});
}

/**
 * Format relative time (e.g., "zojuist", "2 minuten geleden", "1 uur geleden")
 * Properly handles timezone differences and provides accurate relative time
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted relative time string in Dutch
 * 
 * @example
 * ```typescript
 * formatRelativeTime('2025-01-26T10:30:00Z') // "zojuist" or "2 minuten geleden"
 * ```
 */
export function formatRelativeTime(date: Date | string): string {
	// Parse the date - ensure timestamps without timezone are treated as UTC
	const messageDate = typeof date === 'string' ? parseTimestamp(date) : date;
	const now = new Date();
	
	// Calculate difference in milliseconds
	const diffMs = now.getTime() - messageDate.getTime();
	
	// Debug logging in development
	if (import.meta.env.DEV && typeof date === 'string') {
		// Only log for very recent messages to avoid spam
		if (Math.abs(diffMs) < 5 * 60 * 1000) { // Within 5 minutes
			console.log('[formatRelativeTime]', {
				originalString: date,
				parsedDate: messageDate.toISOString(),
				parsedLocal: messageDate.toLocaleString('nl-NL'),
				nowISO: now.toISOString(),
				nowLocal: now.toLocaleString('nl-NL'),
				diffMs,
				diffSeconds: Math.floor(diffMs / 1000),
				diffMinutes: Math.floor(diffMs / 60000)
			});
		}
	}
	
	// Handle negative differences (future dates) - should not happen but handle gracefully
	if (diffMs < 0) {
		if (import.meta.env.DEV) {
			console.warn('[formatRelativeTime] Negative time difference detected:', {
				date,
				diffMs,
				messageDate: messageDate.toISOString(),
				now: now.toISOString()
			});
		}
		return 'zojuist';
	}
	
	// Calculate time units
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);
	
	// Format relative time with proper Dutch grammar
	// Follow common patterns used by modern apps (Twitter, Slack, etc.)
	
	// Just now / seconds ago
	if (diffSeconds < 10) {
		return 'zojuist';
	}
	if (diffSeconds < 60) {
		return `${diffSeconds} ${diffSeconds === 1 ? 'seconde' : 'seconden'} geleden`;
	}
	
	// Minutes ago
	if (diffMinutes === 1) {
		return '1 minuut geleden';
	}
	if (diffMinutes < 60) {
		return `${diffMinutes} minuten geleden`;
	}
	
	// Hours ago
	if (diffHours === 1) {
		return '1 uur geleden';
	}
	if (diffHours < 24) {
		return `${diffHours} uur geleden`;
	}
	
	// Days ago
	if (diffDays === 1) {
		return 'gisteren';
	}
	if (diffDays < 7) {
		return `${diffDays} dagen geleden`;
	}
	
	// Weeks ago
	if (diffWeeks === 1) {
		return '1 week geleden';
	}
	if (diffWeeks < 4) {
		return `${diffWeeks} weken geleden`;
	}
	
	// Months ago
	if (diffMonths === 1) {
		return '1 maand geleden';
	}
	if (diffMonths < 12) {
		return `${diffMonths} maanden geleden`;
	}
	
	// Years ago
	if (diffYears === 1) {
		return '1 jaar geleden';
	}
	
	// Fallback to formatted date for very old messages
	return messageDate.toLocaleDateString('nl-NL', { 
		day: 'numeric', 
		month: 'short', 
		year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
	});
}

/**
 * Format time for chat display (e.g., "08:25")
 * Properly handles timestamps from PostgreSQL (treats as UTC if no timezone specified)
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted time string (HH:mm) in local timezone
 */
export function formatTime(date: Date | string): string {
	const d = typeof date === 'string' ? parseTimestamp(date) : date;
	return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date for chat display (e.g., "Vandaag", "Gisteren", or formatted date)
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? parseTimestamp(date) : date;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const msgDate = new Date(d);
	msgDate.setHours(0, 0, 0, 0);
	
	if (msgDate.getTime() === today.getTime()) {
		return 'Vandaag';
	}
	
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	if (msgDate.getTime() === yesterday.getTime()) {
		return 'Gisteren';
	}
	
	return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/**
 * Check if a date is today
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns True if the date is today
 */
export function isToday(date: Date | string): boolean {
	const d = typeof date === 'string' ? parseTimestamp(date) : date;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const msgDate = new Date(d);
	msgDate.setHours(0, 0, 0, 0);
	return msgDate.getTime() === today.getTime();
}

/**
 * Check if a date is yesterday
 * 
 * @param date - Date string (ISO format) or Date object
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
	const d = typeof date === 'string' ? parseTimestamp(date) : date;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const msgDate = new Date(d);
	msgDate.setHours(0, 0, 0, 0);
	return msgDate.getTime() === yesterday.getTime();
}

