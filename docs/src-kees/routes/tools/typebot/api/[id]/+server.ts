/**
 * GET /tools/typebot/api/:id
 * Get typebot by ID from Typebot API
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Typebot API configuration
const TYPEBOT_API_KEY = import.meta.env.TYPEBOT_API_KEY || 'v2glvJxgwU2UZEsRg4XCcjH9';
const TYPEBOT_BASE_URL = import.meta.env.TYPEBOT_BASE_URL || 'https://builder-production-8168.up.railway.app/api/v1';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const typebotId = params.id;
		
		if (!typebotId) {
			return json(
				{ success: false, error: 'Typebot ID is required' },
				{ status: 400 }
			);
		}
		
		const apiUrl = `${TYPEBOT_BASE_URL}/typebots/${typebotId}`;
		console.log('[typebot-api] Fetching typebot:', apiUrl);
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
		
		// Typebot API returns { typebot: {...} } directly
		const data = await response.json();
		console.log('[typebot-api] Response received:', {
			status: response.status,
			hasTypebot: !!data.typebot,
			hasData: !!data,
			keys: Object.keys(data),
		});
		
		const typebot = data.typebot || data;
		
		if (!typebot) {
			console.error('[typebot-api] Typebot not found in response:', {
				keys: Object.keys(data),
				dataPreview: JSON.stringify(data).substring(0, 200),
			});
			return json(
				{ success: false, error: 'Typebot not found in response' },
				{ status: 500 }
			);
		}
		
		return json({
			success: true,
			typebot,
		});
	} catch (error) {
		console.error('[typebot-api] Error:', error);
		if (error instanceof Error) {
			console.error('[typebot-api] Error stack:', error.stack);
		}
		return json(
			{ 
				success: false, 
				error: error instanceof Error ? error.message : 'Er is een fout opgetreden bij het ophalen van de typebot.' 
			},
			{ status: 500 }
		);
	}
};

