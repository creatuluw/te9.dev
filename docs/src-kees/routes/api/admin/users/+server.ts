/**
 * GET/POST /api/admin/users - List users and create new user
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as userManagementService from '$lib/services/userManagementService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const GET: RequestHandler = async ({ request, url }) => {
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

		// Parse query parameters
		const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;
		const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined;
		const isActive = url.searchParams.get('is_active') ? url.searchParams.get('is_active') === 'true' : undefined;
		const search = url.searchParams.get('search') || undefined;

		const result = await userManagementService.getAllUsers({
			limit,
			offset,
			isActive,
			search
		});

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value });

	} catch (error) {
		console.error('Get users endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

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
		const result = await userManagementService.createUser(body, tokenResult.value.userId);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value }, { status: 201 });

	} catch (error) {
		console.error('Create user endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

