import { g as getAllPosts } from "../../chunks/posts.js";
const load = async () => {
  const posts = await getAllPosts();
  return { posts };
};
export {
  load
};
