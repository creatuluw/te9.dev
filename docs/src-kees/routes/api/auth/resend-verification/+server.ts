/**
 * POST /api/auth/resend-verification - Resend email verification
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { email } = body;

	if (!email || typeof email !== 'string') {
		return json({ success: false, error: 'E-mailadres is verplicht' }, { status: 400 });
	}

	// Get origin from request to construct proper verification links
	const origin = request.headers.get('origin') || new URL(request.url).origin;

	const result = await registrationService.resendEmailVerification(email, origin);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, message: 'Verificatie-e-mail is opnieuw verzonden' }, { status: 200 });

	} catch (error) {
		console.error('Resend verification endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

