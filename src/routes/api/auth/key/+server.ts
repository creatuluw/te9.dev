import { json } from '@sveltejs/kit';
import { validateApiKey, generateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const body = await request.json().catch(() => ({}));
	const name = body.name || `Key ${new Date().toISOString().split('T')[0]}`;
	
	const key = generateApiKey();
	const newKey = await db.apiKeys.create(key, name);
	
	return json(newKey);
};
