/**
 * GET /api/admin/users/invitations - Get pending invitations
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const GET: RequestHandler = async ({ request }) => {
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

		const canRead = await hasPermission(tokenResult.value.userId, '/admin/users', 'read');
		if (!canRead) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const result = await registrationService.getPendingInvitations();

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value }, { status: 200 });

	} catch (error) {
		console.error('Get pending invitations endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

