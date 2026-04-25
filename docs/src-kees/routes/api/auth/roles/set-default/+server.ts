/**
 * PUT /api/auth/roles/set-default - Set default role
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as roleService from '$lib/services/roleService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const PUT: RequestHandler = async ({ request }) => {
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

		const canWrite = await hasPermission(tokenResult.value.userId, '/admin/roles', 'write');
		if (!canWrite) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { roleId } = body;

		if (!roleId || typeof roleId !== 'number') {
			return json({ success: false, error: 'Invalid role ID' }, { status: 400 });
		}

		const result = await roleService.setDefaultRole(roleId, tokenResult.value.userId);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Set default role endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

