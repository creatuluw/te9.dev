/**
 * DELETE /api/admin/users/invitations/[id] - Delete invitation
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as registrationService from '$lib/services/registrationService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const DELETE: RequestHandler = async ({ request, params }) => {
	console.log('[DELETE /api/admin/users/invitations/[id]] Route handler called', { id: params.id });
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

		const invitationId = parseInt(params.id || '0');
		if (!invitationId || isNaN(invitationId)) {
			return json({ success: false, error: 'Invalid invitation ID' }, { status: 400 });
		}

		const result = await registrationService.deleteRegistrationInvitation(
			invitationId,
			tokenResult.value.userId
		);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true }, { status: 200 });

	} catch (error) {
		console.error('Delete invitation endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

