/**
 * GET /api/email/track/click/[messageId] - Click tracking redirect endpoint
 *
 * Records a 'clicked' tracking event and 302-redirects to the original URL.
 * The redirect is immediate; the tracking event is recorded fire-and-forget.
 *
 * Query params:
 *   url - The original URL to redirect to (required for meaningful tracking)
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as emailTrackingService from '$lib/services/emailTrackingService';

const APP_HOMEPAGE = 'https://kees.pippeloi.nl';

export const GET: RequestHandler = async ({ params, url, getClientAddress, request }) => {
	// Extract and clean messageId — strip .png extension if present
	let rawId = params.messageId;
	if (rawId.endsWith('.png')) {
		rawId = rawId.slice(0, -4);
	}

	const messageId = parseInt(rawId, 10);

	// Get the target URL from query params
	const targetUrl = url.searchParams.get('url');

	// Determine redirect destination — validate URL, fall back to homepage
	let destination = APP_HOMEPAGE;
	if (targetUrl) {
		try {
			const parsed = new URL(targetUrl);
			if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
				destination = targetUrl;
			}
		} catch {
			// Invalid URL — fall back to homepage
		}
	}

	// Fire-and-forget: record the tracking event without blocking the redirect
	if (messageId && !isNaN(messageId) && messageId > 0) {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || undefined;

		emailTrackingService
			.recordTrackingEvent({
				messageId,
				eventType: 'clicked',
				url: destination !== APP_HOMEPAGE ? destination : undefined,
				ipAddress,
				userAgent,
			})
			.catch((error) => {
				console.error('[email-track-click] Failed to record tracking event:', error);
			});
	} else {
		console.warn('[email-track-click] Invalid or missing messageId:', params.messageId);
	}

	// 302 redirect (temporary, not permanent)
	redirect(302, destination);
};
