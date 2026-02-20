import { db } from './db';
import type { Bookmark } from '$lib/types';

interface BlogGenerationResult {
	title: string;
	slug: string;
	content: string;
}

interface GenerateBlogPostOptions {
	bookmark: {
		title: string;
		link: string;
		excerpt: string | null;
		reason_for_bookmark: string | null;
	};
}

async function getAIConfig(): Promise<{ baseUrl: string; apiKey: string; model: string }> {
	const config = await db.config.get('ai');
	
	const baseUrl = process.env.AI_BASE_URL || (config?.base_url as string) || 'https://api.openai.com/v1';
	const apiKey = process.env.AI_API_KEY || (config?.api_key as string) || '';
	const model = process.env.AI_MODEL || (config?.model as string) || 'gpt-4o';
	
	return { baseUrl, apiKey, model };
}

export { getAIConfig };

function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.substring(0, 80);
}

export { generateSlug as generateBlogPostSlug };

export async function generateBlogPost(options: GenerateBlogPostOptions): Promise<BlogGenerationResult> {
	const { bookmark } = options;
	const { baseUrl, apiKey, model } = await getAIConfig();
	
	if (!apiKey) {
		throw new Error('AI API key not configured. Set AI_API_KEY in environment or ai config.');
	}
	
	const systemPrompt = `You are a skilled technical writer who creates engaging blog posts from bookmarked content. 
Write in a clear, conversational style that's easy to understand.
Include practical examples and insights where relevant.
Format the content in Markdown with proper headings, lists, and code blocks when appropriate.
The post should be informative and valuable to readers interested in technology and development.`;

	const userPrompt = `Create a blog post based on this bookmarked content:

Title: ${bookmark.title}
URL: ${bookmark.link}
${bookmark.excerpt ? `Summary: ${bookmark.excerpt}` : ''}
${bookmark.reason_for_bookmark ? `Why bookmarked: ${bookmark.reason_for_bookmark}` : ''}

Requirements:
1. Create an engaging blog post title (different from the bookmark title)
2. Write a comprehensive article (800-1500 words)
3. Include an introduction that hooks the reader
4. Cover the main concepts/ideas from the source
5. Add practical takeaways or insights
6. End with a brief conclusion
7. Format in clean Markdown

Respond in this exact JSON format:
{
  "title": "Your Blog Post Title Here",
  "content": "# Heading\\n\\nYour markdown content here..."
}`;

	console.log('[AI] Generating blog post for:', bookmark.title);
	console.log('[AI] Using model:', model, 'at:', baseUrl);
	
	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
			temperature: 0.7,
			max_tokens: 4000,
			thinking: { type: 'disabled' }
		})
	});
	
	if (!response.ok) {
		const error = await response.text();
		console.error('[AI] API error:', response.status, error);
		throw new Error(`AI API error: ${response.status} - ${error}`);
	}
	
	const data = await response.json();
	const content = data.choices?.[0]?.message?.content;
	
	if (!content) {
		throw new Error('No content returned from AI');
	}
	
	console.log('[AI] Raw response:', content.substring(0, 200));
	
	try {
		const parsed = JSON.parse(content);
		const title = parsed.title || bookmark.title;
		const blogContent = parsed.content || content;
		const slug = generateSlug(title);
		
		console.log('[AI] Generated blog post:', title);
		
		return {
			title,
			slug,
			content: blogContent
		};
	} catch (e) {
		console.log('[AI] Could not parse as JSON, using raw content');
		const title = bookmark.title;
		const slug = generateSlug(title);
		
		return {
			title,
			slug,
			content
		};
	}
}

export async function testAIConnection(): Promise<{ success: boolean; message: string }> {
	try {
		const { baseUrl, apiKey, model } = await getAIConfig();
		
		if (!apiKey) {
			return { success: false, message: 'AI API key not configured' };
		}
		
		const response = await fetch(`${baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'user', content: 'Say "Connection successful" in exactly those words.' }
				],
				max_tokens: 20,
				thinking: { type: 'disabled' }
			})
		});
		
		if (!response.ok) {
			const error = await response.text();
			return { success: false, message: `API error: ${response.status} - ${error}` };
		}
		
		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;
		
		return { 
			success: true, 
			message: `Connected successfully using ${model}. Response: ${content}` 
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return { success: false, message };
	}
}
