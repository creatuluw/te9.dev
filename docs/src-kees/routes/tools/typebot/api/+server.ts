/**
 * POST /tools/typebot/api/send
 * Send typebot links to employees via email
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as typebotService from '$lib/services/typebotService';
import { getUserMessage } from '$lib/types/errors';

/**
 * POST /tools/typebot/api/send
 * Send typebot links to employees via email
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		// Use the service to send emails
		const result = await typebotService.sendTypebotLinks(body);
		
		if (!result.success) {
			return json(
				{ success: false, error: getUserMessage(result.error) },
				{ status: 400 }
			);
		}
		
		return json({
			success: true,
			sent: result.value.sent,
			failed: result.value.failed,
		});
	} catch (error) {
		console.error('[typebot-api] Send error:', error);
		return json(
			{ success: false, error: 'Er is een fout opgetreden bij het versturen van de e-mails.' },
			{ status: 500 }
		);
	}
};

