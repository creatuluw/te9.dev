import { getAllPosts } from '$lib/server/posts';
import { db } from '$lib/server/db';
import type { PostMeta } from '$lib/types';

export const load = async () => {
	const [filePosts, approvedDrafts, publishedPosts] = await Promise.all([
		getAllPosts(),
		db.drafts.findApproved(),
		db.posts.findAll()
	]);

	const draftPosts: PostMeta[] = approvedDrafts.map(draft => ({
		title: draft.title,
		date: draft.created_at,
		description: draft.content.slice(0, 150).replace(/[#*`]/g, '').trim() + '...',
		slug: `draft-${draft.id}`,
		_draftId: draft.id,
		_draftType: draft.draft_type
	}));

	const dbPosts: PostMeta[] = publishedPosts.map(post => ({
		title: post.title,
		date: post.published_at,
		description: post.description || post.content.slice(0, 150).replace(/[#*`]/g, '').trim() + '...',
		slug: post.slug,
		_postId: post.id,
		_postType: post.post_type
	}));

	const dbSlugs = new Set(dbPosts.map(p => p.slug));
	const uniqueFilePosts = filePosts.filter(p => !dbSlugs.has(p.slug));

	const allPosts = [...dbPosts, ...uniqueFilePosts, ...draftPosts].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	return { posts: allPosts };
};
