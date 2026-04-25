/**
 * GET/PUT/DELETE /api/auth/permissions/[id] - Get, update, or delete a permission
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import * as roleService from "$lib/services/roleService";
import { extractTokenFromHeader, verifyToken } from "$lib/utils/jwt";
import { hasPermission } from "$lib/services/authService";
import { getUserMessage } from "$lib/types/errors";

export const GET: RequestHandler = async ({ params, request }) => {
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
      "/admin/permissions",
      "read",
    );
    if (!canRead) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const permissionId = parseInt(params.id!);
    if (isNaN(permissionId)) {
      return json(
        { success: false, error: "Invalid permission ID" },
        { status: 400 },
      );
    }

    const result = await roleService.getPermissionById(permissionId);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 404 },
      );
    }

    return json({ success: true, data: result.value });
  } catch (error) {
    console.error("Get permission endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

export const PUT: RequestHandler = async ({ params, request }) => {
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
      "/admin/permissions",
      "write",
    );
    if (!canWrite) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const permissionId = parseInt(params.id!);
    if (isNaN(permissionId)) {
      return json(
        { success: false, error: "Invalid permission ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = await roleService.updatePermission(
      permissionId,
      body,
      tokenResult.value.userId,
    );

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true, data: result.value });
  } catch (error) {
    console.error("Update permission endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
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

    const canDelete = await hasPermission(
      tokenResult.value.userId,
      "/admin/permissions",
      "delete",
    );
    if (!canDelete) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const permissionId = parseInt(params.id!);
    if (isNaN(permissionId)) {
      return json(
        { success: false, error: "Invalid permission ID" },
        { status: 400 },
      );
    }

    const result = await roleService.deletePermission(
      permissionId,
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
    console.error("Delete permission endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
