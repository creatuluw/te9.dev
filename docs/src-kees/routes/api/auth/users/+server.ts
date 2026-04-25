/**
 * GET/POST /api/auth/users - List users and create new user
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import * as userService from "$lib/services/userManagementService";
import { extractTokenFromHeader, verifyToken } from "$lib/utils/jwt";
import { hasPermission } from "$lib/services/authService";
import { getUserMessage } from "$lib/types/errors";

// GET - List all users
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Verify authentication
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

    // Check permission
    const canRead = await hasPermission(
      tokenResult.value.userId,
      "/admin/users",
      "read",
    );
    if (!canRead) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Get query params
    const search = url.searchParams.get("search") || undefined;
    const isActive = url.searchParams.get("is_active");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Get users
    const offset = (page - 1) * limit;
    const result = await userService.getAllUsers({
      search,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      offset,
      limit,
    });

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true, data: result.value });
  } catch (error) {
    console.error("Get users endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};

// POST - Create new user
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Verify authentication
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

    // Check permission
    const canWrite = await hasPermission(
      tokenResult.value.userId,
      "/admin/users",
      "write",
    );
    if (!canWrite) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Create user
    const result = await userService.createUser(body, tokenResult.value.userId);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    console.error("Create user endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
