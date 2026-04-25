/**
 * PUT /api/users/[id]/roles - Update user roles
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as userManagementService from '$lib/services/userManagementService';
import { getUserMessage } from '$lib/types/errors';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { deleteRowsResult, insertRowResult, filter } from '$lib/utils/postgrest';

/**
 * PUT /api/users/[id]/roles - Update user roles (replace all roles)
 */
export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	try {
		// Verify authentication
		const authHeader = request.headers.get('authorization');
		const token = extractTokenFromHeader(authHeader);

		if (!token) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const tokenResult = await verifyToken(token);
		if (!tokenResult.success) {
			return json({ success: false, error: getUserMessage(tokenResult.error) }, { status: 401 });
		}

		// Check permission
		const canWrite = await hasPermission(tokenResult.value.userId, '/admin/users', 'write');
		if (!canWrite) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		// Get request body
		const body = await request.json();
		const { role_ids } = body;

		if (!Array.isArray(role_ids)) {
			return json(
				{ success: false, error: 'role_ids must be an array' },
				{ status: 400 }
			);
		}

		// First, remove all existing roles
		await deleteRowsResult(
			'_auth_user_roles',
			filter().eq('user_id', id).build()
		);

		// Then add new roles
		for (const roleId of role_ids) {
			await insertRowResult('_auth_user_roles', {
				user_id: id,
				role_id: Number(roleId),
				assigned_at: new Date().toISOString(),
				assigned_by: tokenResult.value.userId
			}).catch(console.error); // Ignore duplicate errors
		}

		return json({ success: true });
	} catch (err) {
		console.error('Update user roles error:', err);
		return json(
			{ success: false, error: 'Er ging iets mis bij het bijwerken van rollen' },
			{ status: 500 }
		);
	}
};

