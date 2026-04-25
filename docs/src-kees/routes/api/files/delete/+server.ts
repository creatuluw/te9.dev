/**
 * File Delete API Route
 * 
 * Handles file deletion from MinIO server-side to avoid exposing credentials to the client.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as minioService from '$lib/services/minioService';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { key, entityId } = body;

		if (!key) {
			return json(
				{ success: false, error: 'File key is required' },
				{ status: 400 }
			);
		}

		// Delete file using server-side MinIO service
		const result = await minioService.deleteFile(key, entityId);

		if (!result.success) {
			return json(
				{ success: false, error: result.error.message },
				{ status: 500 }
			);
		}

		return json({
			success: true
		});
	} catch (error) {
		console.error('[File Delete API] Error:', error);
		return json(
			{ 
				success: false, 
				error: error instanceof Error ? error.message : 'Unknown error occurred' 
			},
			{ status: 500 }
		);
	}
};

