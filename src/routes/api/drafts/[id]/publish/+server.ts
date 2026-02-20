import { json } from '@sveltejs/kit';
import { validateApiKey, unauthorized } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { getAIConfig } from '$lib/server/ai';
import type { RequestHandler } from './$types';

async function generateDescription(title: string, content: string): Promise<string> {
	const { baseUrl, apiKey, model } = await getAIConfig();
	
	if (!apiKey) {
		return content.slice(0, 150).replace(/[#*`]/g, '').trim() + '...';
	}
	
	const prompt = `Generate a brief, compelling description (1-2 sentences, max 200 characters) for this blog post. 
Only output the description text, nothing else.

Title: ${title}

Content preview:
${content.slice(0, 1000)}`;

	try {
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 100,
				temperature: 0.7,
				thinking: { type: 'disabled' }
			})
		});
		
		if (!response.ok) {
			console.error('[Publish] AI description failed:', response.status);
			return content.slice(0, 150).replace(/[#*`]/g, '').trim() + '...';
		}
		
		const data = await response.json();
		const description = data.choices?.[0]?.message?.content?.trim() || '';
		
		if (description.length > 200) {
			return description.slice(0, 197) + '...';
		}
		
		return description || content.slice(0, 150).replace(/[#*`]/g, '').trim() + '...';
	} catch (error) {
		console.error('[Publish] AI description error:', error);
		return content.slice(0, 150).replace(/[#*`]/g, '').trim() + '...';
	}
}

export const POST: RequestHandler = async ({ params, request, url }) => {
	const validation = await validateApiKey(request, url);
	if (!validation.valid) {
		return unauthorized(validation.error);
	}
	
	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid draft ID' }, { status: 400 });
	}
	
	const draft = await db.drafts.findById(id);
	if (!draft) {
		return json({ error: 'Draft not found' }, { status: 404 });
	}
	
	if (draft.status !== 'approved') {
		return json({ error: 'Draft must be approved before publishing' }, { status: 400 });
	}
	
	console.log('[Publish] Generating description for:', draft.title);
	
	const description = await generateDescription(draft.title, draft.content);
	
	await db.posts.create({
		draft_id: draft.id,
		bookmark_id: draft.bookmark_id,
		title: draft.title,
		slug: draft.slug,
		content: draft.content,
		description,
		post_type: draft.draft_type
	});
	
	await db.drafts.delete(id);
	
	console.log('[Publish] Published:', draft.slug);
	
	return json({ success: true, slug: draft.slug });
};
