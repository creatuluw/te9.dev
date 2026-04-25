import { json, type RequestHandler } from '@sveltejs/kit';
import * as apiTokenService from '$lib/services/apiTokenService';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request, params }) => {
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

        // Revoke the old token
        const revokeResult = await apiTokenService.revokeToken(userId, tokenId);
        if (!revokeResult.success) {
            return json({ success: false, error: getUserMessage(revokeResult.error) }, { status: 400 });
        }

        // Create a new token
        const createResult = await apiTokenService.createToken(userId, 'MCP Token');
        if (!createResult.success) {
            return json({ success: false, error: getUserMessage(createResult.error) }, { status: 400 });
        }

        return json({ success: true, data: createResult.value });

    } catch (error) {
        console.error('Refresh API token endpoint error:', error);
        return json({ success: false, error: 'An error occurred' }, { status: 500 });
    }
};
