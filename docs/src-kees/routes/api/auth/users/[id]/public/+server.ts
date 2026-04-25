/**
 * GET /api/auth/users/[id]/public - Get public user info for attribution
 *
 * This endpoint returns limited user info (id, name, username, email, avatar)
 * without requiring admin permissions. Used for displaying user attribution
 * in UI components like WorkItemCard.
 *
 * Auth: hooks.server.ts already verified the JWT and set locals.user.
 * No redundant JWT verification is performed here.
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import * as userService from "$lib/services/userManagementService";
import { getUserMessage } from "$lib/types/errors";

// GET - Get public user info by ID
export const GET: RequestHandler = async ({ locals, params }) => {
  try {
    // Authentication check — hooks.server.ts already verified the JWT
    if (!locals.user) {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user - no permission check needed for public info
    const result = await userService.getUserById(params.id!);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 404 },
      );
    }

    // Return only public fields
    const user = result.value;
    const publicData = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return json({ success: true, data: publicData });
  } catch (error) {
    console.error("Get public user info endpoint error:", error);
    return json(
      { success: false, error: "An error occurred" },
      { status: 500 },
    );
  }
};
