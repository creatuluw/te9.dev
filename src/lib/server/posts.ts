import { marked } from 'marked';
import matter from 'gray-matter';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import type { PostMeta } from '$lib/types';

const postsDir = join(process.cwd(), 'posts');

export async function getAllPosts(): Promise<PostMeta[]> {
	const files = await readdir(postsDir);
	const posts: PostMeta[] = [];

	for (const file of files) {
		if (!file.endsWith('.md')) continue;
		const filePath = join(postsDir, file);
		const content = await readFile(filePath, 'utf-8');
		const { data } = matter(content);
		posts.push({
			title: data.title,
			date: data.date,
			description: data.description,
			slug: file.replace('.md', '')
		});
	}

	return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPost(slug: string): Promise<{ meta: PostMeta; content: string } | null> {
	try {
		const filePath = join(postsDir, `${slug}.md`);
		const raw = await readFile(filePath, 'utf-8');
		const { data, content } = matter(raw);
		let html = await marked(content);
		html = html.replace(/<h1[^>]*>.*?<\/h1>/s, '');
		return {
			meta: {
				title: data.title,
				date: data.date,
				description: data.description,
				slug
			},
			content: html
		};
	} catch {
		return null;
	}
}
