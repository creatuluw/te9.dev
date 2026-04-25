/**
 * GET /api/auth/verify-email/[token] - Verify email address
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { getUserMessage } from '$lib/types/errors';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { token } = params;

		if (!token) {
			return json({ success: false, error: 'Token is verplicht' }, { status: 400 });
		}

		const result = await registrationService.verifyEmail(token);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, message: 'E-mailadres succesvol geverifieerd' });

	} catch (error) {
		console.error('Verify email endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};





