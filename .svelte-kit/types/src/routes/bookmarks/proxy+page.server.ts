// @ts-nocheck
import { db } from '$lib/server/db';
import { fetchAllBookmarks, hasValidRefreshToken } from '$lib/server/raindrop';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load = async ({ url }: Parameters<PageServerLoad>[0]) => {
	const apiKey = url.searchParams.get('key');
	
	if (!apiKey) {
		return { error: 'API key required', bookmarks: [], categories: [], apiKey: null, raindropTotal: 0 };
	}
	
	const keyRecord = await db.apiKeys.findByKey(apiKey);
	if (!keyRecord) {
		return { error: 'Invalid API key', bookmarks: [], categories: [], apiKey: null, raindropTotal: 0 };
	}
	
	await db.apiKeys.updateLastUsed(apiKey);
	
	const days = parseInt(url.searchParams.get('days') || '30');
	const category = url.searchParams.get('category') || undefined;
	
	const [bookmarks, categories] = await Promise.all([
		db.bookmarks.findAll({ days, category }),
		db.categories.findAll()
	]);
	
	let raindropTotal = 0;
	try {
		const isAuthenticated = await hasValidRefreshToken();
		if (isAuthenticated) {
			const result = await fetchAllBookmarks({ limit: 1 });
			raindropTotal = result.total;
		}
	} catch (e) {
		console.error('[Bookmarks] Failed to fetch raindrop total:', e);
	}
	
	return {
		apiKey,
		bookmarks,
		categories,
		error: null,
		raindropTotal
	};
};
