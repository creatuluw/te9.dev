import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid key ID' }, { status: 400 });
	}
	
	const deleted = await db.apiKeys.delete(id);
	if (!deleted) {
		return json({ error: 'Key not found' }, { status: 404 });
	}
	
	return json({ success: true });
};
