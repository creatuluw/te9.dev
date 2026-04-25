/**
 * GET /api/messages/search - Search messages with full-text search
 *
 * search-002: SvelteKit API endpoint for message search.
 * Uses PostgreSQL full-text search with Dutch stemming via messageSearchService.
 *
 * Query parameters:
 * - q (required): Search query string
 * - type (optional): Message type filter (e.g., "chat", "email")
 * - from (optional): Date from (ISO string)
 * - to (optional): Date to (ISO string)
 * - cursor (optional): Pagination cursor
 *
 * Auth: Cookie-based via locals.user (set by hooks.server.ts)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchMessages } from '$lib/services/messageSearchService';
import { validateSearchParams } from '$lib/services/validateSearchParams';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Auth: require authenticated user (cookie-based via hooks)
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	// Validate and extract search parameters from URL
	const validation = validateSearchParams(url);

	if (!validation.success) {
		return json(
			{ success: false, error: validation.error.message },
			{ status: 400 }
		);
	}

	const { query, filters } = validation.value;

	// Execute search via the service
	const result = await searchMessages(locals.user.id, query, filters);

	if (!result.success) {
		return json(
			{ success: false, error: result.error.message },
			{ status: 500 }
		);
	}

	// Return standardized response format
	return json({
		success: true,
		data: {
			messages: result.value.messages,
			hasNextPage: result.value.hasNextPage,
			totalEstimate: result.value.totalEstimate
		}
	});
};
