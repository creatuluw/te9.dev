import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const categories = await db.categories.findAll();
	return json(categories);
};

export const POST: RequestHandler = async ({ request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const body = await request.json();
	if (!body.name || !body.slug) {
		return json({ error: 'Name and slug are required' }, { status: 400 });
	}
	
	try {
		const category = await db.categories.create(body.name, body.slug);
		return json(category);
	} catch {
		return json({ error: 'Category already exists' }, { status: 409 });
	}
};
