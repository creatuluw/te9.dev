/**
 * GET/PUT /api/auth/roles/[id]/permissions - Get and update role permissions
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as roleService from '$lib/services/roleService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const GET: RequestHandler = async ({ request, params }) => {
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

		const canRead = await hasPermission(tokenResult.value.userId, '/admin/roles', 'read');
		if (!canRead) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const result = await roleService.getRolePermissions(Number(params.id));

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value });
	} catch (error) {
		console.error('Get role permissions endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, params }) => {
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
		const result = await roleService.setRolePermissions(
			Number(params.id),
			body.permission_ids,
			tokenResult.value.userId
		);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value });
	} catch (error) {
		console.error('Update role permissions endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

