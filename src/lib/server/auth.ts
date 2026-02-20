import { db } from './db';
import { json } from '@sveltejs/kit';

export async function validateApiKey(request: Request, url: URL): Promise<{ valid: boolean; error?: string }> {
	const apiKey = url.searchParams.get('key');
	
	if (!apiKey) {
		return { valid: false, error: 'API key required. Add ?key=YOUR_API_KEY to the URL.' };
	}
	
	const keyRecord = await db.apiKeys.findByKey(apiKey);
	
	if (!keyRecord) {
		return { valid: false, error: 'Invalid API key.' };
	}
	
	await db.apiKeys.updateLastUsed(apiKey);
	
	return { valid: true };
}

export function unauthorized(message: string = 'Unauthorized') {
	return json({ error: message }, { status: 401 });
}

export function generateApiKey(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let key = 'sk_';
	for (let i = 0; i < 32; i++) {
		key += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return key;
}
