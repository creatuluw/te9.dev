import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const existingConfig = await db.config.get('raindrop');
	await db.config.set('raindrop', {
		last_sync_at: existingConfig?.last_sync_at || null
	});
	
	return json({ success: true, message: 'Raindrop disconnected' });
};
