/**
 * API endpoint for updating analytics page visit end_time
 * 
 * This endpoint is designed to be called via navigator.sendBeacon() for reliable
 * tracking when tabs become inactive or pages are unloaded.
 * 
 * Accepts POST requests with recordId in the request body.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateRowsResult } from '$lib/utils/postgrest';
import type { AnalyticsLog } from '$lib/schemas/analytics';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse request body - can be JSON or FormData (from sendBeacon)
		let body: { recordId: number };
		
		const contentType = request.headers.get('content-type') || '';
		
		if (contentType.includes('application/json')) {
			body = await request.json();
		} else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
			// Handle FormData from sendBeacon (multipart/form-data) or form submissions (application/x-www-form-urlencoded)
			const formData = await request.formData();
			const recordIdStr = formData.get('recordId');
			if (!recordIdStr) {
				return json({ error: 'recordId is required' }, { status: 400 });
			}
			body = { recordId: Number(recordIdStr) };
		} else {
			// Try to parse as JSON anyway (some browsers may not send content-type)
			try {
				body = await request.json();
			} catch {
				return json({ error: 'Invalid request format' }, { status: 400 });
			}
		}

		const { recordId } = body;

		if (!recordId || isNaN(recordId)) {
			return json({ error: 'Valid recordId is required' }, { status: 400 });
		}

		// Get the current record to calculate duration
		const { getRowByIdResult } = await import('$lib/utils/postgrest');
		const recordResult = await getRowByIdResult<AnalyticsLog>('_bpm_analytics_log', recordId);
		
		if (!recordResult.success) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const record = recordResult.value;
		const endTime = new Date().toISOString();
		let durationMs: number | undefined;

		if (record.start_time) {
			const startTime = new Date(record.start_time).getTime();
			const endTimeMs = new Date(endTime).getTime();
			durationMs = endTimeMs - startTime;
		}

		// Update the record
		const updateResult = await updateRowsResult<AnalyticsLog>(
			'_bpm_analytics_log',
			{ id: `eq.${recordId}` },
			{
				end_time: endTime,
				...(durationMs != null && { duration_ms: durationMs })
			}
		);

		if (!updateResult.success) {
			return json({ error: 'Failed to update record' }, { status: 500 });
		}

		return json({ success: true, updated: updateResult.value[0] });
	} catch (error) {
		console.error('Error updating analytics end_time:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

