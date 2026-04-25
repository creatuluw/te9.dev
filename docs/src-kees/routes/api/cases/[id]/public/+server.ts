/**
 * Case Public Sharing API - Toggle public sharing for cases
 */
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requirePermission } from "$lib/server/requirePermission";
import * as publicSharingService from "$lib/services/publicSharingService";
import { getUserMessage } from "$lib/types/errors";

/**
 * GET /api/cases/[id]/public - Get current public sharing status
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseId = parseInt(params.id);
  if (isNaN(caseId)) {
    return json({ error: "Invalid case ID" }, { status: 400 });
  }

  // Check write permission for cases
  try {
    requirePermission(locals, "/cases/[id]", "write");
  } catch (err: any) {
    return json(
      { error: err.body?.message || "Access denied" },
      { status: err.status || 403 },
    );
  }

  const result = await publicSharingService.getPublicSharingStatus(
    "case",
    caseId,
  );

  if (!result.success) {
    return json({ error: getUserMessage(result.error) }, { status: 500 });
  }

  return json(result.value);
};

/**
 * PUT /api/cases/[id]/public - Toggle public sharing
 */
export const PUT: RequestHandler = async ({ params, request, locals, url }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const caseId = parseInt(params.id);
  if (isNaN(caseId)) {
    return json({ error: "Invalid case ID" }, { status: 400 });
  }

  // Check write permission for cases
  try {
    requirePermission(locals, "/cases/[id]", "write");
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
    "case",
    caseId,
    isPublic,
    locals.user.id,
    url.href,
  );

  if (!result.success) {
    return json({ error: getUserMessage(result.error) }, { status: 400 });
  }

  // Get updated sharing status
  const statusResult = await publicSharingService.getPublicSharingStatus(
    "case",
    caseId,
  );
  if (!statusResult.success) {
    return json({ error: getUserMessage(statusResult.error) }, { status: 500 });
  }

  return json(statusResult.value);
};
