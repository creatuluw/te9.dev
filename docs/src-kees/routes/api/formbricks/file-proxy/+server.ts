/**
 * Formbricks File Proxy API Route
 *
 * Proxies file requests to Formbricks storage (Railway bucket).
 * This ensures uploaded files can be accessed even when pre-signed URLs expire.
 *
 * Usage: /api/formbricks/file-proxy?url=<formbricks-file-url>
 */

import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Use $env/dynamic/private for runtime environment variables (Railway)
const FORMBRICKS_API_KEY = env.FORMBRICKS_API_KEY || '';
const FORMBRICKS_URL = env.FORMBRICKS_URL || 'https://formbricks-production-f895.up.railway.app';
const FORMBRICKS_BASE_URL = FORMBRICKS_URL;

export const GET: RequestHandler = async ({ url, locals }) => {
	const fileUrl = url.searchParams.get('url');

	if (!fileUrl) {
		return error(400, 'File URL is required');
	}

	console.log('[Formbricks File Proxy] === REQUEST START ===');
	console.log(`[Formbricks File Proxy] Requested URL: ${fileUrl}`);
	console.log(`[Formbricks File Proxy] FORMBRICKS_API_KEY configured: ${!!FORMBRICKS_API_KEY}`);
	console.log(`[Formbricks File Proxy] API key length: ${FORMBRICKS_API_KEY?.length}`);
	console.log(`[Formbricks File Proxy] FORMBRICKS_BASE_URL: ${FORMBRICKS_BASE_URL}`);

	try {
		new URL(fileUrl);
	} catch {
		return error(400, 'Invalid file URL');
	}

	if (!fileUrl.includes('bucket-production') && !fileUrl.includes('formbricks')) {
		return error(400, 'Only Formbricks bucket URLs are allowed');
	}

	try {
		console.log(`[Formbricks File Proxy] Attempting direct fetch: ${fileUrl.split('?')[0]}`);

		let response = await fetch(fileUrl);

		if (!response.ok) {
			console.log(`[Formbricks File Proxy] Direct fetch failed (${response.status}): ${response.statusText}`);
			console.log(`[Formbricks File Proxy] Response headers: ${Object.fromEntries(response.headers.entries())}`);

			if (!FORMBRICKS_API_KEY) {
				console.error('[Formbricks File Proxy] FORMBRICKS_API_KEY is not configured in environment variables');
				return error(500, 'Formbricks API key not configured. Please set FORMBRICKS_API_KEY environment variable.');
			}

			console.log(`[Formbricks File Proxy] Using API key (first 10 chars): ${FORMBRICKS_API_KEY.substring(0, 10)}...`);

			let pathMatch: RegExpMatchArray | null = fileUrl.match(/\/formbricks\/([^/]+)\/private\/([^?]+)/);
			if (!pathMatch) {
				pathMatch = fileUrl.match(/\/storage\/([^/]+)\/private\/([^?]+)/);
			}

			if (pathMatch) {
				const environmentId = pathMatch[1];
				let decodedFileName = decodeURIComponent(pathMatch[2]);

				console.log(`[Formbricks File Proxy] Extracted - Environment ID: ${environmentId}, FileName: ${decodedFileName}`);

				const fidMatch = decodedFileName.match(/^(.+?)--fid--(.+)$/);
				let actualFileName = decodedFileName;
				if (fidMatch) {
					actualFileName = fidMatch[2];
					console.log(`[Formbricks File Proxy] --fid-- prefix found, extracted actual filename: ${actualFileName}`);
				} else {
					console.log(`[Formbricks File Proxy] No --fid-- prefix, using filename as-is: ${actualFileName}`);
				}

				console.log(`[Formbricks File Proxy] Requesting fresh URL from: ${FORMBRICKS_BASE_URL}/api/v1/management/storage/file-url`);
				console.log(`[Formbricks File Proxy] Request body:`, JSON.stringify({
					environmentId,
					fileName: `private/${actualFileName}`
				}));

				const fileUrlEndpoint = `${FORMBRICKS_BASE_URL}/api/v1/management/storage/file-url`;
				const freshUrlResponse = await fetch(fileUrlEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': FORMBRICKS_API_KEY
					},
					body: JSON.stringify({
						environmentId,
						fileName: `private/${actualFileName}`
					})
				});

				console.log(`[Formbricks File Proxy] API response status: ${freshUrlResponse.status}`);

				if (!freshUrlResponse.ok) {
					console.error('[Formbricks File Proxy] Formbricks API request failed:', freshUrlResponse.status, freshUrlResponse.statusText);
					const errorText = await freshUrlResponse.text();
					console.error('[Formbricks File Proxy] API error response:', errorText);
				}

				if (freshUrlResponse.ok) {
					const freshUrlData = await freshUrlResponse.json();
					console.log('[Formbricks File Proxy] Formbricks API response data:', JSON.stringify(freshUrlData));
					const freshUrl = freshUrlData.data?.url || freshUrlData.url;
					if (freshUrl) {
						console.log('[Formbricks File Proxy] Got fresh URL, fetching file...');
						response = await fetch(freshUrl);
					} else {
						console.error('[Formbricks File Proxy] Fresh URL response missing URL field:', freshUrlData);
					}
				} else {
					console.error('[Formbricks File Proxy] Failed to get fresh URL from Formbricks API:', freshUrlResponse.status, freshUrlResponse.statusText);
				}
			} else {
				console.error('[Formbricks File Proxy] Could not extract environment ID and filename from URL:', fileUrl);
			}
		}

		if (!response.ok) {
			if (response.status === 403 || response.status === 404) {
				return error(404, 'File not found or access expired');
			}
			return error(response.status, `Failed to fetch file: ${response.statusText}`);
		}

		const contentType = response.headers.get('content-type') || 'application/octet-stream';
		const contentDisposition = response.headers.get('content-disposition') || '';
		const fileName = fileUrl.split('/').pop()?.split('?')[0] || 'download';
		const decodedFileName = decodeURIComponent(fileName);

		console.log(`[Formbricks File Proxy] Serving file: ${decodedFileName}, Content-Type: ${contentType}`);

		const headers = new Headers({
			'Content-Type': contentType,
			'Content-Disposition': contentDisposition || `inline; filename="${decodedFileName}"`,
			'Cache-Control': 'private, max-age=3600',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': '*'
		});

		const fileBuffer = await response.arrayBuffer();

		return new Response(fileBuffer, {
			headers,
			status: 200
		});
	} catch (err: any) {
		console.error('[Formbricks File Proxy] Error:', err);
		return error(500, `Failed to serve file: ${err.message || 'Unknown error'}`);
	}
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': '*',
			'Access-Control-Max-Age': '86400'
		}
	});
};
