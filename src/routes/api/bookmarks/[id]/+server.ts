import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid bookmark ID' }, { status: 400 });
	}
	
	const bookmark = await db.bookmarks.findById(id);
	if (!bookmark) {
		return json({ error: 'Bookmark not found' }, { status: 404 });
	}
	
	return json(bookmark);
};

export const PATCH: RequestHandler = async ({ params, request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid bookmark ID' }, { status: 400 });
	}
	
	const body = await request.json();
	const allowedFields = ['title', 'tags', 'blog_approved', 'reason_for_bookmark', 'category', 'excerpt'];
	const updates: Record<string, unknown> = {};
	
	for (const field of allowedFields) {
		if (body[field] !== undefined) {
			updates[field] = body[field];
		}
	}
	
	if (Object.keys(updates).length === 0) {
		return json({ error: 'No valid fields to update' }, { status: 400 });
	}
	
	const bookmark = await db.bookmarks.update(id, updates);
	if (!bookmark) {
		return json({ error: 'Bookmark not found' }, { status: 404 });
	}
	
	return json(bookmark);
};

export const DELETE: RequestHandler = async ({ params, request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid bookmark ID' }, { status: 400 });
	}
	
	const deleted = await db.bookmarks.delete(id);
	if (!deleted) {
		return json({ error: 'Bookmark not found' }, { status: 404 });
	}
	
	return json({ success: true });
};
