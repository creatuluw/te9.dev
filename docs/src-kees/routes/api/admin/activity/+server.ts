/**
 * GET /api/admin/activity - Get activity logs with filtering
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as auditService from '$lib/services/auditService';
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

		const canRead = await hasPermission(tokenResult.value.userId, '/admin/activity', 'read');
		if (!canRead) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		// Parse query parameters
		const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50;
		const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0;
		const userId = url.searchParams.get('user_id') || undefined;
		const activityType = url.searchParams.get('activity_type') || undefined;
		const resourceType = url.searchParams.get('resource_type') || undefined;
		const startDate = url.searchParams.get('start_date') || undefined;
		const endDate = url.searchParams.get('end_date') || undefined;

		const result = await auditService.getSystemActivityLog({
			limit,
			offset,
			userId,
			activityType,
			resourceType,
			startDate,
			endDate
		});

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value });

	} catch (error) {
		console.error('Get activity logs endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};

