/**
 * ETag Utilities - Generate and manage ETags for caching and versioning
 * 
 * Uses updated_at timestamps combined with a hash for reliable versioning
 */

/**
 * Generate an ETag from data object
 * Uses updated_at timestamp as the primary version indicator
 */
export function generateEtag(data: unknown): string {
	if (!data) {
		return `W/"empty-${Date.now()}"`;
	}

	const obj = data as Record<string, unknown>;
	const timestamp = obj.updated_at || Date.now();
	const hash = simpleHash(JSON.stringify(data));
	return `W/"${timestamp}-${hash}"`;
}

/**
 * Generate a combined ETag from multiple ETags
 * Used when aggregating data from multiple sources
 */
export function generateCombinedEtag(etags: (string | undefined)[]): string {
	const validEtags = etags.filter((e): e is string => Boolean(e));
	if (validEtags.length === 0) {
		return `W/"empty-${Date.now()}"`;
	}

	const combined = validEtags.join('|');
	return `W/"${simpleHash(combined)}"`;
}

/**
 * Generate version string from timestamps
 * Used for optimistic locking
 */
export function generateVersionFromTimestamps(timestamps: (string | number | undefined)[]): string {
	const validTimestamps = timestamps.filter((t): t is string | number => Boolean(t));
	if (validTimestamps.length === 0) {
		return Date.now().toString();
	}

	const maxTimestamp = Math.max(
		...validTimestamps.map((t) => (typeof t === 'string' ? new Date(t).getTime() : t))
	);

	return maxTimestamp.toString();
}

/**
 * Parse ETag from response headers
 */
export function parseEtagFromHeaders(headers: Headers): string | null {
	const etag = headers.get('ETag');
	return etag ? etag.replace(/"/g, '') : null;
}

/**
 * Simple non-cryptographic hash function
 * Fast and sufficient for ETag generation
 */
function simpleHash(str: string): string {
	let hash = 0;

	if (str.length === 0) {
		return '0';
	}

	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(36);
}

/**
 * Compare two ETags for equality
 * Handles weak ETags (W/"...") format
 */
export function etagsEqual(etag1: string | null, etag2: string | null): boolean {
	if (!etag1 || !etag2) {
		return false;
	}

	// Normalize ETags (remove W/ prefix and quotes)
	const normalize = (etag: string) => etag.replace(/^W\//, '').replace(/"/g, '');
	return normalize(etag1) === normalize(etag2);
}

/**
 * Extract timestamp from ETag
 * Returns null if ETag doesn't contain a valid timestamp
 */
export function extractTimestampFromEtag(etag: string): number | null {
	const match = etag.match(/^W\/"(\d+)-/);
	if (match && match[1]) {
		const timestamp = parseInt(match[1], 10);
		return isNaN(timestamp) ? null : timestamp;
	}
	return null;
}
