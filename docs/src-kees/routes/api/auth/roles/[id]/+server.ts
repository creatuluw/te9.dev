/**
 * GET/PUT/DELETE /api/auth/roles/[id] - Get, update or delete role
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

		const result = await roleService.getRoleById(Number(params.id));

		if (!result.success) {
			return json(
				{ success: false, error: getUserMessage(result.error) },
				{ status: result.error.name === 'NotFoundError' ? 404 : 400 }
			);
		}

		return json({ success: true, data: result.value });
	} catch (error) {
		console.error('Get role endpoint error:', error);
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
		const result = await roleService.updateRole(
			Number(params.id),
			body,
			tokenResult.value.userId
		);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value });
	} catch (error) {
		console.error('Update role endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
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

		const canDelete = await hasPermission(tokenResult.value.userId, '/admin/roles', 'delete');
		if (!canDelete) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const result = await roleService.deleteRole(Number(params.id), tokenResult.value.userId);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Delete role endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

