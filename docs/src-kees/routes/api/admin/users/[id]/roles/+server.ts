/**
 * GET/POST/DELETE /api/admin/users/[id]/roles - Get, assign, or remove user roles
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import * as userManagementService from "$lib/services/userManagementService";
import { extractTokenFromHeader, verifyToken } from "$lib/utils/jwt";
import { hasPermission } from "$lib/services/authService";
import { getUserMessage } from "$lib/types/errors";

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 },
      );
    }

    const canRead = await hasPermission(
      tokenResult.value.userId,
      "/admin/users",
      "read",
    );
    if (!canRead) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const result = await userManagementService.getUserRoles(params.id!);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true, data: result.value });
  } catch (error) {
    console.error("Get user roles endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

export const POST: RequestHandler = async ({ request, params }) => {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 },
      );
    }

    const canWrite = await hasPermission(
      tokenResult.value.userId,
      "/admin/users",
      "write",
    );
    if (!canWrite) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = await userManagementService.assignRoleToUser(
      params.id!,
      body.role_id,
      tokenResult.value.userId,
    );

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Assign user role endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

export const DELETE: RequestHandler = async ({ request, params, url }) => {
  try {
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tokenResult = await verifyToken(token);
    if (!tokenResult.success) {
      return json(
        { success: false, error: getUserMessage(tokenResult.error) },
        { status: 401 },
      );
    }

    const canWrite = await hasPermission(
      tokenResult.value.userId,
      "/admin/users",
      "write",
    );
    if (!canWrite) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const roleId = url.searchParams.get("role_id");
    if (!roleId) {
      return json(
        { success: false, error: "role_id parameter is required" },
        { status: 400 },
      );
    }

    const result = await userManagementService.removeRoleFromUser(
      params.id!,
      parseInt(roleId),
      tokenResult.value.userId,
    );

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true });
  } catch (error) {
    console.error("Remove user role endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
