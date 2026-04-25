/**
 * GET/POST /api/auth/api-tokens - List and create API tokens
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as apiTokenService from '$lib/services/apiTokenService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
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

		const userId = tokenResult.value.userId as string;
		const result = await apiTokenService.listTokens(userId);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value });

	} catch (error) {
		console.error('List API tokens endpoint error:', error);
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

		const userId = tokenResult.value.userId as string;

		let body = {};
		try {
			body = await request.json();
		} catch {
			// Body is optional, default name will be used
		}

		const name = (body as Record<string, unknown>).name as string | undefined;
		const result = await apiTokenService.createToken(userId, name || 'MCP Token');

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: result.value }, { status: 201 });

	} catch (error) {
		console.error('Create API token endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};
