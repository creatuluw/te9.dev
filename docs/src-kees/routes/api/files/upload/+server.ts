/**
 * File Upload API Route
 * 
 * Handles file uploads to MinIO server-side to avoid exposing credentials to the client.
 * This route accepts multipart/form-data file uploads and stores them in MinIO.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as minioService from '$lib/services/minioService';
import { ValidationError } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Log request size for debugging
		const contentLength = request.headers.get('content-length');
		if (contentLength) {
			const sizeMB = (parseInt(contentLength) / (1024 * 1024)).toFixed(2);
			console.log(`[File Upload API] Receiving file upload, size: ${sizeMB} MB (${contentLength} bytes)`);
		}
		
		// Parse form data
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const folder = formData.get('folder') as string | null;
		const entityId = formData.get('entityId') ? parseInt(formData.get('entityId') as string) : undefined;

		if (!file) {
			return json(
				{ success: false, error: 'No file provided' },
				{ status: 400 }
			);
		}

		// Upload file using server-side MinIO service
		// This uses process.env which Railway provides at runtime
		const result = await minioService.uploadFile(
			file,
			folder || undefined,
			entityId
		);

		if (!result.success) {
			return json(
				{ success: false, error: result.error.message },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			file: result.value
		});
	} catch (error) {
		console.error('[File Upload API] Error:', error);
		return json(
			{ 
				success: false, 
				error: error instanceof Error ? error.message : 'Unknown error occurred' 
			},
			{ status: 500 }
		);
	}
};

