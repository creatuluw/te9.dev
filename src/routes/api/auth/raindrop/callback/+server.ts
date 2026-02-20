import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	const apiKey = url.searchParams.get('state');
	
	console.log('[OAuth] Callback received', { code: code?.substring(0, 8) + '...', apiKey });
	
	if (!code) {
		console.error('[OAuth] No authorization code provided');
		return json({ error: 'No authorization code provided' }, { status: 400 });
	}
	
	const clientId = process.env.RAINDROP_CLIENT_ID;
	const clientSecret = process.env.RAINDROP_CLIENT_SECRET;
	const redirectUri = process.env.RAINDROP_REDIRECT_URI || `${url.origin}/api/auth/raindrop/callback`;
	
	console.log('[OAuth] Exchanging code for token...', {
		hasClientId: !!clientId,
		hasClientSecret: !!clientSecret,
		redirectUri
	});
	
	try {
		const response = await fetch('https://api.raindrop.io/v1/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUri
			})
		});
		
		const responseText = await response.text();
		console.log('[OAuth] Raw response status:', response.status);
		console.log('[OAuth] Raw response body:', responseText);
		
		if (!response.ok) {
			console.error('[OAuth] Token exchange failed:', responseText);
			return json({ error: 'Failed to exchange token: ' + responseText }, { status: 500 });
		}
		
		let data;
		try {
			data = JSON.parse(responseText);
		} catch (parseError) {
			console.error('[OAuth] Failed to parse JSON:', parseError);
			return json({ error: 'Invalid JSON response' }, { status: 500 });
		}
		
		console.log('[OAuth] ============ FULL RESPONSE DEBUG ============');
		console.log('[OAuth] Response status:', response.status);
		console.log('[OAuth] Full raw body:', responseText);
		console.log('[OAuth] Parsed object keys:', Object.keys(data));
		console.log('[OAuth] data.access_token:', data.access_token);
		console.log('[OAuth] data.refresh_token:', data.refresh_token);
		console.log('[OAuth] data.result:', data.result);
		console.log('[OAuth] data.status:', data.status);
		console.log('[OAuth] Full data object:', JSON.stringify(data, null, 2));
		console.log('[OAuth] ==============================================');
		
		// Check if response indicates an error
		if (data.result === false || data.status === 400) {
			console.error('[OAuth] API returned error:', data.errorMessage || data.error);
			return json({ error: data.errorMessage || data.error || 'OAuth failed' }, { status: 500 });
		}
		console.log('[OAuth] Token exchange successful!', {
			hasAccessToken: !!data.access_token,
			hasRefreshToken: !!data.refresh_token,
			expiresIn: data.expires_in,
			tokenType: data.token_type
		});
		
		const existingConfig = await db.config.get('raindrop');
		console.log('[OAuth] Existing config:', existingConfig);
		
		await db.config.set('raindrop', {
			last_sync_at: existingConfig?.last_sync_at || null,
			refresh_token: data.refresh_token
		});
		
		console.log('[OAuth] Tokens stored in database successfully');
		
		// Verify storage
		const verifyConfig = await db.config.get('raindrop');
		console.log('[OAuth] Verification - config after save:', {
			hasRefreshToken: !!(verifyConfig as Record<string, unknown>)?.refresh_token,
			lastSyncAt: (verifyConfig as Record<string, unknown>)?.last_sync_at
		});
		
		const redirectUrl = apiKey 
			? `/bookmarks?key=${apiKey}&auth=success`
			: `/bookmarks?auth=success`;
		
		console.log('[OAuth] Redirecting to:', redirectUrl);
		
		return new Response(null, {
			status: 302,
			headers: { Location: redirectUrl }
		});
	} catch (error) {
		console.error('[OAuth] Error:', error);
		return json({ error: 'OAuth failed' }, { status: 500 });
	}
};
