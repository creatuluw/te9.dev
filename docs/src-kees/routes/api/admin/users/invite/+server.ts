/**
 * POST /api/admin/users/invite - Send registration invitation
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		const token = extractTokenFromHeader(authHeader);

		if (!token) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const tokenResult = await verifyToken(token);
		if (!tokenResult.success) {
			return json({ success: false, error: getUserMessage(tokenResult.error) }, { status: 401 });
		}

		const canWrite = await hasPermission(tokenResult.value.userId, '/admin/users', 'write');
		if (!canWrite) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { email } = body;

		if (!email) {
			return json({ success: false, error: 'E-mailadres is verplicht' }, { status: 400 });
		}

	// Get origin from request to construct proper registration links
	const origin = request.headers.get('origin') || new URL(request.url).origin;
	
	const result = await registrationService.sendRegistrationInvitation(
		email,
		tokenResult.value.userId,
		origin
	);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value }, { status: 201 });

	} catch (error) {
		console.error('Send invitation endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};


