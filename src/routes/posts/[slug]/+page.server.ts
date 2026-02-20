import { getPost } from '$lib/server/posts';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';

interface LoadResult {
	meta: {
		title: string;
		date: string;
		description: string;
		slug: string;
		_postType?: 'blog_post' | 'skill';
	};
	content: string;
}

export const load = async ({ params }: { params: { slug: string } }): Promise<LoadResult> => {
	const filePost = await getPost(params.slug);
	if (filePost) {
		return filePost;
	}

	const dbPost = await db.posts.findBySlug(params.slug);
	if (dbPost) {
		let html = await marked(dbPost.content);
		html = html.replace(/<h1[^>]*>.*?<\/h1>/s, '');
		
		return {
			meta: {
				title: dbPost.title,
				date: dbPost.published_at,
				description: dbPost.description || '',
				slug: dbPost.slug,
				_postType: dbPost.post_type
			},
			content: html
		};
	}

	throw error(404, 'Post not found');
};
