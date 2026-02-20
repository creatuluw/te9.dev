import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const keys = await db.apiKeys.findAll();
	return json(keys);
};
