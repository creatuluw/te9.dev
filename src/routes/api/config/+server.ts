import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const config = await db.config.getAll();
	return json(config);
};

export const PATCH: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const body = await request.json();
	
	if (body.polling) {
		await db.config.set('polling', body.polling);
	}
	if (body.ai) {
		await db.config.set('ai', body.ai);
	}
	
	const config = await db.config.getAll();
	return json(config);
};
