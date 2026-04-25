/**
 * GET /tools/typebot/api/list
 * List all typebots from Typebot API
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Typebot API configuration
const TYPEBOT_API_KEY = import.meta.env.TYPEBOT_API_KEY || 'v2glvJxgwU2UZEsRg4XCcjH9';
const TYPEBOT_BASE_URL = import.meta.env.TYPEBOT_BASE_URL || 'https://builder-production-8168.up.railway.app/api/v1';
const TYPEBOT_WORKSPACE_ID = import.meta.env.TYPEBOT_WORKSPACE_ID || 'cmi309k1w000jqv4i2zq8ib5v';

export const GET: RequestHandler = async () => {
	try {
		const apiUrl = `${TYPEBOT_BASE_URL}/typebots?workspaceId=${TYPEBOT_WORKSPACE_ID}`;
		console.log('[typebot-api] Fetching typebots from:', apiUrl);
		console.log('[typebot-api] Using API key:', TYPEBOT_API_KEY ? `${TYPEBOT_API_KEY.substring(0, 10)}...` : 'MISSING');
		
		// Use direct fetch like typebot-mgr does (simpler and proven to work)
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${TYPEBOT_API_KEY}`,
				'Accept': 'application/json',
			},
		});
		
		if (!response.ok) {
			const errorText = await response.text();
			let errorMessage = `Typebot API error: ${response.status} ${response.statusText}`;
			
			try {
				const errorData = JSON.parse(errorText);
				errorMessage = errorData.message || errorData.error || errorMessage;
				console.error('[typebot-api] Typebot API error response:', {
					status: response.status,
					code: errorData.code,
					message: errorData.message,
					issues: errorData.issues,
				});
			} catch {
				console.error('[typebot-api] Error response text:', errorText);
			}
			
			return json(
				{ success: false, error: errorMessage },
				{ status: response.status >= 400 && response.status < 500 ? response.status : 500 }
			);
		}
		
		// Typebot API returns { typebots: [...] } directly (per https://docs.typebot.io/api-reference/typebot/list)
		const data = await response.json();
		console.log('[typebot-api] Response received:', {
			status: response.status,
			hasTypebots: !!data.typebots,
			typebotsCount: data.typebots?.length || 0,
		});
		
		// Validate response structure
		if (!data.typebots || !Array.isArray(data.typebots)) {
			console.error('[typebot-api] Unexpected response structure:', {
				keys: Object.keys(data),
				dataPreview: JSON.stringify(data).substring(0, 200),
			});
			return json(
				{ success: false, error: 'Invalid response format from Typebot API' },
				{ status: 500 }
			);
		}
		
		return json({
			success: true,
			typebots: data.typebots,
		});
	} catch (apiError) {
		console.error('[typebot-api] Exception during API call:', apiError);
		if (apiError instanceof Error) {
			console.error('[typebot-api] Error stack:', apiError.stack);
		}
		return json(
			{ 
				success: false, 
				error: `API call failed: ${apiError instanceof Error ? apiError.message : String(apiError)}` 
			},
			{ status: 500 }
		);
	}
};

