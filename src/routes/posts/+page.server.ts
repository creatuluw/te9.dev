import { getAllPosts } from '$lib/server/posts';

export const load = async () => {
	const posts = await getAllPosts();
	return { posts };
};
