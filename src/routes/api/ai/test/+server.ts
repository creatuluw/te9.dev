import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { testAIConnection } from '$lib/server/ai';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const result = await testAIConnection();
	return json(result);
};
