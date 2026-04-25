/**
 * GET /api/auth/me - Get current user info
 *
 * Refactored (auth-002): Uses locals.user set by hooks.server.ts instead of
 * re-verifying JWT token. This eliminates redundant JWT verification and
 * session lookup that was previously done via verifySession().
 *
 * Flow:
 * 1. Check locals.user for authentication (set by hooks after JWT verification)
 * 2. If locals.user has full profile data (email field present), return directly (0 DB queries)
 * 3. Otherwise, fetch full user profile + roles + permissions using locals.user.id
 *
 * Performance win: Eliminates redundant extractTokenFromHeader() + verifyToken() +
 * session lookup + session extension that verifySession() performed on every call.
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import { queryTableResult, filter } from "$lib/utils/postgrest";
import * as authService from "$lib/services/authService";
import type { User, Role, Permission } from "$lib/schemas/auth";

/**
 * Check if locals.user contains full profile data (not just minimal JWT payload).
 * Full profile has email field; minimal JWT payload only has {id, roles, permissions, is_sysadmin}.
 */
function hasFullProfile(
  localsUser: any,
): localsUser is User & { roles: string[]; permissions: Permission[] } {
  return localsUser != null && typeof localsUser.email === "string";
}

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Use locals.user for authentication — already verified by hooks.server.ts
    // This eliminates redundant JWT verification (extractTokenFromHeader + verifyToken)
    if (!locals.user) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = locals.user.id;

    // Fast path: if hooks enriched locals.user with full profile data,
    // return directly without any DB queries
    if (hasFullProfile(locals.user)) {
      // locals has full user data — check for enriched roles data
      const rolesData = (locals as any)._rolesData as Role[] | undefined;
      const roles = rolesData || [];
      const permissions = locals.user.permissions || [];

      return json({
        success: true,
        data: {
          user: locals.user,
          roles,
          permissions,
        },
      });
    }

    // Standard path: fetch full user profile from DB using the verified user ID.
    // This is still faster than the old verifySession() because we skip:
    // - JWT re-verification (already done in hooks)
    // - Session lookup and validation
    // - Session extension / new token generation
    const userResult = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("id", userId).build(),
    });

    if (!userResult.success || userResult.value.data.length === 0) {
      // User not found in DB — could be deleted after JWT was issued
      return json({ success: false, error: "User not found" }, { status: 401 });
    }

    const user = userResult.value.data[0];

    // Fetch roles and permissions in parallel for efficiency
    const [rolesResult, permissionsResult] = await Promise.all([
      authService.getUserRoles(userId),
      authService.getUserPermissions(userId, user),
    ]);

    const roles = rolesResult.success ? rolesResult.value : [];
    const permissions = permissionsResult.success
      ? permissionsResult.value
      : [];

    return json({
      success: true,
      data: {
        user,
        roles,
        permissions,
      },
    });
  } catch (error) {
    console.error("Get current user endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
