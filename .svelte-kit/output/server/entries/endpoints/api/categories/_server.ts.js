import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../chunks/auth.js";
import { d as db } from "../../../../chunks/db.js";
const GET = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const categories = await db.categories.findAll();
  return json(categories);
};
const POST = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const body = await request.json();
  if (!body.name || !body.slug) {
    return json({ error: "Name and slug are required" }, { status: 400 });
  }
  try {
    const category = await db.categories.create(body.name, body.slug);
    return json(category);
  } catch {
    return json({ error: "Category already exists" }, { status: 409 });
  }
};
export {
  GET,
  POST
};
