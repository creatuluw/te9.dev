/**
 * POST /api/auth/register/complete - Complete registration
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { validateSchema } from '$lib/utils/validation';
import { CompleteRegistrationInputSchema } from '$lib/schemas/auth';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate input
		const validation = validateSchema(CompleteRegistrationInputSchema, body);
		if (!validation.success) {
			return json({ success: false, error: getUserMessage(validation.error) }, { status: 400 });
		}

	const { token, confirmPassword, ...registrationData } = validation.value;

	// Get origin from request to construct proper verification links
	const origin = request.headers.get('origin') || new URL(request.url).origin;

	// Complete registration
	const result = await registrationService.completeRegistration(token, registrationData, origin);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value }, { status: 201 });

	} catch (error) {
		console.error('Complete registration endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};





