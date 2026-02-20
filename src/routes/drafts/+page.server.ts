import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	const apiKey = url.searchParams.get('key');
	
	if (!apiKey) {
		return { error: 'API key required', drafts: [] };
	}
	
	const keyRecord = await db.apiKeys.findByKey(apiKey);
	if (!keyRecord) {
		return { error: 'Invalid API key', drafts: [] };
	}
	
	await db.apiKeys.updateLastUsed(apiKey);
	
	const status = url.searchParams.get('status') || undefined;
	const drafts = await db.drafts.findAll({ status });
	
	const bookmarkIds = [...new Set(drafts.map(d => d.bookmark_id))];
	const bookmarks = await Promise.all(
		bookmarkIds.map(id => db.bookmarks.findById(id))
	);
	const bookmarkMap = Object.fromEntries(
		bookmarks.filter(Boolean).map(b => [b!.id, b])
	);
	
	return {
		apiKey,
		drafts,
		bookmarkMap,
		error: null
	};
};
