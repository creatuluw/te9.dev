import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, request }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const days = parseInt(url.searchParams.get('days') || '30');
	const category = url.searchParams.get('category') || undefined;
	const limit = parseInt(url.searchParams.get('limit') || '100');
	const showHidden = url.searchParams.get('showHidden') === 'true';
	
	const bookmarks = await db.bookmarks.findAll({ days, category, limit, showHidden });
	return json(bookmarks);
};
