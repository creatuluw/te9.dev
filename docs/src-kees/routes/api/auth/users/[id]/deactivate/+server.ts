/**
 * PATCH /api/auth/users/[id]/deactivate - Deactivate user
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import * as userService from "$lib/services/userManagementService";
import { extractTokenFromHeader, verifyToken } from "$lib/utils/jwt";
import { hasPermission } from "$lib/services/authService";
import { getUserMessage } from "$lib/types/errors";

export const PATCH: RequestHandler = async ({ request, params }) => {
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

    const result = await userService.deactivateUser(
      params.id!,
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
    console.error("Deactivate user endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
