/**
 * Project Public Sharing API - Toggle public sharing for projects
 */
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requirePermission } from "$lib/server/requirePermission";
import * as publicSharingService from "$lib/services/publicSharingService";
import { getUserMessage } from "$lib/types/errors";

/**
 * GET /api/projects/[id]/public - Get current public sharing status
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Check write permission for projects
  try {
    requirePermission(locals, "/projects/[id]", "write");
  } catch (err: any) {
    return json(
      { error: err.body?.message || "Access denied" },
      { status: err.status || 403 },
    );
  }

  const result = await publicSharingService.getPublicSharingStatus(
    "project",
    projectId,
  );

  if (!result.success) {
    return json({ error: getUserMessage(result.error) }, { status: 500 });
  }

  return json(result.value);
};

/**
 * PUT /api/projects/[id]/public - Toggle public sharing
 */
export const PUT: RequestHandler = async ({ params, request, locals, url }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Check write permission for projects
  try {
    requirePermission(locals, "/projects/[id]", "write");
  } catch (err: any) {
    return json(
      { error: err.body?.message || "Access denied" },
      { status: err.status || 403 },
    );
  }

  const { isPublic } = await request.json();

  if (typeof isPublic !== "boolean") {
    return json({ error: "isPublic must be a boolean" }, { status: 400 });
  }

  const result = await publicSharingService.togglePublicSharing(
    "project",
    projectId,
    isPublic,
    locals.user.id,
    url.href,
  );

  if (!result.success) {
    return json({ error: getUserMessage(result.error) }, { status: 400 });
  }

  // Get updated sharing status
  const statusResult = await publicSharingService.getPublicSharingStatus(
    "project",
    projectId,
  );
  if (!statusResult.success) {
    return json({ error: getUserMessage(statusResult.error) }, { status: 500 });
  }

  return json(statusResult.value);
};
