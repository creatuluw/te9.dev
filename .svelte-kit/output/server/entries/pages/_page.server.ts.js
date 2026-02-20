import { g as getAllPosts } from "../../chunks/posts.js";
import { d as db } from "../../chunks/db.js";
const load = async () => {
  const [filePosts, approvedDrafts, publishedPosts] = await Promise.all([
    getAllPosts(),
    db.drafts.findApproved(),
    db.posts.findAll()
  ]);
  const draftPosts = approvedDrafts.map((draft) => ({
    title: draft.title,
    date: draft.created_at,
    description: draft.content.slice(0, 150).replace(/[#*`]/g, "").trim() + "...",
    slug: `draft-${draft.id}`,
    _draftId: draft.id,
    _draftType: draft.draft_type
  }));
  const dbPosts = publishedPosts.map((post) => ({
    title: post.title,
    date: post.published_at,
    description: post.description || post.content.slice(0, 150).replace(/[#*`]/g, "").trim() + "...",
    slug: post.slug,
    _postId: post.id,
    _postType: post.post_type
  }));
  const allPosts = [...filePosts, ...dbPosts, ...draftPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return { posts: allPosts };
};
export {
  load
};
