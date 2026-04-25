/**
 * GET /api/auth/api-tokens/[id]/reveal - Reveal the plaintext API token
 *
 * Decrypts and returns the full API token so the user can copy it
 * into their MCP client configuration. Only works for tokens created
 * after encrypted storage was enabled.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as apiTokenService from '$lib/services/apiTokenService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
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

		const userId = tokenResult.value.userId as string;
		const tokenId = parseInt(params.id!, 10);

		if (isNaN(tokenId)) {
			return json({ success: false, error: 'Invalid token ID' }, { status: 400 });
		}

		const result = await apiTokenService.revealToken(userId, tokenId);

		if (!result.success) {
			return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
		}

		return json({ success: true, data: { token: result.value } });

	} catch (error) {
		console.error('Reveal API token endpoint error:', error);
		return json({ success: false, error: 'An error occurred' }, { status: 500 });
	}
};
