/**
 * Search UI helper functions for MessagesTab
 * ui-003: Pure logic for message search interface
 *
 * Provides:
 * - SearchParams type for search query parameters
 * - buildSearchQuery — builds URL query string from SearchParams
 * - parseSearchUrl — parses URL back to SearchParams
 * - validateSearchInput — validates search input text
 * - createSearchState — closure-based search state manager
 * - getMessageTypeOptions — Dutch message type filter options
 * - createDebouncedSearchCallback — debounced search trigger
 */

/**
 * Search parameters for message search queries
 */
export interface SearchParams {
	q?: string;
	type?: string;
	from?: string;
	to?: string;
	cursor?: string;
	limit?: number;
}

/**
 * Validation result for search input
 */
export interface SearchInputValidation {
	valid: boolean;
	error?: string;
}

/**
 * Message type option for filter dropdown
 */
export interface MessageTypeOption {
	value: string;
	label: string;
}

/**
 * Build a URL query string from SearchParams.
 * Omits undefined parameters and URL-encodes values.
 *
 * @param params - Search parameters
 * @returns Query string like "?q=test&type=email" or "" for empty params
 */
export function buildSearchQuery(params: SearchParams): string {
	const searchParams = new URLSearchParams();

	if (params.q !== undefined && params.q !== null) {
		searchParams.set("q", params.q);
	}
	if (params.type !== undefined && params.type !== null) {
		searchParams.set("type", params.type);
	}
	if (params.from !== undefined && params.from !== null) {
		searchParams.set("from", params.from);
	}
	if (params.to !== undefined && params.to !== null) {
		searchParams.set("to", params.to);
	}
	if (params.cursor !== undefined && params.cursor !== null) {
		searchParams.set("cursor", params.cursor);
	}
	if (params.limit !== undefined && params.limit !== null) {
		searchParams.set("limit", String(params.limit));
	}

	const str = searchParams.toString();
	return str ? "?" + str : "";
}

/**
 * Parse a URL string back into SearchParams.
 * Decodes URL-encoded values and converts limit to number.
 *
 * @param url - Full URL string with optional query parameters
 * @returns SearchParams object with parsed values
 */
export function parseSearchUrl(url: string): SearchParams {
	const parsed = new URL(url);
	const result: SearchParams = {};

	const q = parsed.searchParams.get("q");
	if (q !== null) {
		result.q = q;
	}

	const type = parsed.searchParams.get("type");
	if (type !== null) {
		result.type = type;
	}

	const from = parsed.searchParams.get("from");
	if (from !== null) {
		result.from = from;
	}

	const to = parsed.searchParams.get("to");
	if (to !== null) {
		result.to = to;
	}

	const cursor = parsed.searchParams.get("cursor");
	if (cursor !== null) {
		result.cursor = cursor;
	}

	const limit = parsed.searchParams.get("limit");
	if (limit !== null) {
		result.limit = parseInt(limit, 10);
	}

	return result;
}

/**
 * Validate search input text.
 * A valid query must contain at least one alphanumeric character
 * (letters a-z, A-Z, digits 0-9, and accented characters for Dutch support).
 *
 * @param query - The search input to validate
 * @returns Validation result with valid flag and optional error message
 */
export function validateSearchInput(query: string): SearchInputValidation {
	// Check for empty or whitespace-only input
	if (!query || query.trim().length === 0) {
		return { valid: false, error: "Zoekopdracht mag niet leeg zijn" };
	}

	// Check for at least one alphanumeric character (including accented chars for Dutch)
	const hasAlphanumeric = /[a-zA-Z0-9À-ÿ]/.test(query);

	if (!hasAlphanumeric) {
		return {
			valid: false,
			error: "Zoekopdracht moet minimaal één letter of cijfer bevatten",
		};
	}

	return { valid: true };
}

/**
 * Create a closure-based search state manager.
 * Manages query text, message type filter, and date range with
 * get/set methods, active state checking, reset, and conversion to SearchParams.
 *
 * @returns Search state manager object
 */
export function createSearchState() {
	let query = "";
	let type = "";
	let dateRange: { from?: string; to?: string } = {};

	return {
		getQuery(): string {
			return query;
		},

		setQuery(q: string): void {
			query = q;
		},

		getType(): string {
			return type;
		},

		setType(t: string): void {
			type = t;
		},

		getDateRange(): { from?: string; to?: string } {
			return { ...dateRange };
		},

		setDateRange(range: { from?: string; to?: string }): void {
			dateRange = { ...range };
		},

		isActive(): boolean {
			return query.trim().length > 0;
		},

		reset(): void {
			query = "";
			type = "";
			dateRange = {};
		},

		toSearchParams(): SearchParams {
			const params: SearchParams = {};

			if (query.trim()) {
				params.q = query;
			}
			if (type) {
				params.type = type;
			}
			if (dateRange.from) {
				params.from = dateRange.from;
			}
			if (dateRange.to) {
				params.to = dateRange.to;
			}

			return params;
		},
	};
}

/**
 * Get message type options for the search filter dropdown.
 * Returns Dutch labels for message types.
 *
 * @returns Array of message type options with value and label
 */
export function getMessageTypeOptions(): MessageTypeOption[] {
	return [
		{ value: "", label: "Alle types" },
		{ value: "email", label: "E-mail" },
		{ value: "in_app", label: "In-app" },
		{ value: "chat", label: "Chat" },
	];
}

/**
 * Create a debounced search callback.
 * Delays invoking the callback until after the specified wait time
 * has elapsed since the last time it was invoked.
 *
 * @param callback - Function to call with SearchParams after debounce
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns Object with search and cancel functions
 */
export function createDebouncedSearchCallback(
	callback: (params: SearchParams) => void,
	delay: number = 300,
): {
	search: (params: SearchParams) => void;
	cancel: () => void;
} {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return {
		search(params: SearchParams) {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				timeoutId = null;
				callback(params);
			}, delay);
		},

		cancel() {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		},
	};
}
