/**
 * GET/PUT/DELETE /api/auth/users/[id] - Get, update, delete user
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import * as userService from "$lib/services/userManagementService";
import { extractTokenFromHeader, verifyToken } from "$lib/utils/jwt";
import { hasPermission } from "$lib/services/authService";
import { getUserMessage } from "$lib/types/errors";

// GET - Get user by ID
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

    const result = await userService.getUserById(params.id!);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 404 },
      );
    }

    return json({ success: true, data: result.value });
  } catch (error) {
    console.error("Get user endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

// PUT - Update user
export const PUT: RequestHandler = async ({ request, params }) => {
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

    // Protect sysadmin flag: only admins (sysadmin or Admin role) can modify it
    if (body.is_sysadmin !== undefined) {
      const payload = tokenResult.value;
      const isAdmin = payload.is_sysadmin || payload.roles.includes("Admin");
      if (!isAdmin) {
        return json(
          {
            success: false,
            error: "Alleen beheerders kunnen de sysadmin vlag wijzigen",
          },
          { status: 403 },
        );
      }
    }

    const result = await userService.updateUser(
      params.id!,
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
    console.error("Update user endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

// DELETE - Delete user (soft delete)
export const DELETE: RequestHandler = async ({ request, params }) => {
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
      "/admin/users",
      "delete",
    );
    if (!canDelete) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const result = await userService.deleteUser(
      params.id!,
      tokenResult.value.userId,
    );

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
