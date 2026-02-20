import { json } from "@sveltejs/kit";
import { v as validateApiKey, u as unauthorized } from "../../../../../chunks/auth.js";
import { d as db } from "../../../../../chunks/db.js";
const GET = async ({ params, request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return json({ error: "Invalid draft ID" }, { status: 400 });
  }
  const draft = await db.drafts.findById(id);
  if (!draft) {
    return json({ error: "Draft not found" }, { status: 404 });
  }
  return json(draft);
};
const PATCH = async ({ params, request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return json({ error: "Invalid draft ID" }, { status: 400 });
  }
  const body = await request.json();
  const allowedFields = ["title", "content", "status", "feedback"];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== void 0) {
      updates[field] = body[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    return json({ error: "No valid fields to update" }, { status: 400 });
  }
  const draft = await db.drafts.update(id, updates);
  if (!draft) {
    return json({ error: "Draft not found" }, { status: 404 });
  }
  return json(draft);
};
const DELETE = async ({ params, request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return json({ error: "Invalid draft ID" }, { status: 400 });
  }
  const deleted = await db.drafts.delete(id);
  if (!deleted) {
    return json({ error: "Draft not found" }, { status: 404 });
  }
  return json({ success: true });
};
export {
  DELETE,
  GET,
  PATCH
};
