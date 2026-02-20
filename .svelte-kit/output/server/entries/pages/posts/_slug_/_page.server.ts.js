import { a as getPost } from "../../../../chunks/posts.js";
import { d as db } from "../../../../chunks/db.js";
import { error } from "@sveltejs/kit";
import { marked } from "marked";
const load = async ({ params }) => {
  const filePost = await getPost(params.slug);
  if (filePost) {
    return filePost;
  }
  const dbPost = await db.posts.findBySlug(params.slug);
  if (dbPost) {
    let html = await marked(dbPost.content);
    html = html.replace(/<h1[^>]*>.*?<\/h1>/s, "");
    return {
      meta: {
        title: dbPost.title,
        date: dbPost.published_at,
        description: dbPost.description || "",
        slug: dbPost.slug,
        _postType: dbPost.post_type
      },
      content: html
    };
  }
  throw error(404, "Post not found");
};
export {
  load
};
