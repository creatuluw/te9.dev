/**
 * Server-side load function for /admin/email-tracking
 * Fetches email tracking stats, recent events, and suppressed addresses.
 * Enforces permission check on every page load (including client-side navigation).
 */

import { requirePermission } from '$lib/server/requirePermission';
import { queryTableResult } from '$lib/utils/postgrest';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check permission: /admin/email-tracking with read action
	requirePermission(locals, '/admin/email-tracking', 'read');

	// Fetch all data in parallel
	const [statsResult, recentEventsResult, suppressedResult] = await Promise.all([
		// Aggregate stats: get all event_type values to count in JS
		queryTableResult<{ event_type: string }>(
			'_bpm_email_tracking',
			{
				select: 'event_type'
			}
		),

		// Recent tracking events (last 50, ordered by tracked_at desc)
		queryTableResult<{
			id: string;
			message_id: number;
			event_type: string;
			tracked_at: string;
			url?: string;
			ip_address?: string;
			user_agent?: string;
			bounce_reason?: string;
			bounce_type?: string;
		}>(
			'_bpm_email_tracking',
			{
				order: 'tracked_at.desc',
				limit: 50
			}
		),

		// Suppressed addresses (last 50)
		queryTableResult<{
			id: string;
			email: string;
			reason: string;
			bounce_type?: string;
			suppressed_at: string;
		}>(
			'_bpm_email_suppressions',
			{
				order: 'suppressed_at.desc',
				limit: 50
			}
		)
	]);

	// Build aggregate stats from event_type rows
	const stats: Record<string, number> = {
		sent: 0,
		delivered: 0,
		opened: 0,
		clicked: 0,
		bounced: 0,
		failed: 0,
		suppressed: 0,
		unknown: 0
	};

	if (statsResult.success) {
		for (const row of statsResult.value.data) {
			const type = row.event_type || 'unknown';
			stats[type] = (stats[type] || 0) + 1;
		}
	}

	// Extract recent events
	const recentEvents = recentEventsResult.success
		? recentEventsResult.value.data
		: [];

	// Extract suppressed addresses
	const suppressedAddresses = suppressedResult.success
		? suppressedResult.value.data
		: [];

	return {
		stats,
		recentEvents,
		suppressedAddresses
	};
};
