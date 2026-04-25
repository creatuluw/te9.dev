/**
 * POST /api/auth/register/validate-token - Validate registration token
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { token } = body;

		if (!token) {
			return json({ success: false, error: 'Token is verplicht' }, { status: 400 });
		}

		const result = await registrationService.validateRegistrationToken(token);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: { email: result.value.email } });

	} catch (error) {
		console.error('Validate token endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};





