/**
 * DELETE /api/email/suppressions/[email] - Remove an email suppression
 *
 * Removes an email address from the suppression list, allowing emails to be sent again.
 * Requires admin permission for /admin/email-tracking with write action.
 */

import { json, type RequestHandler } from "@sveltejs/kit";
import { removeSuppression } from "$lib/services/emailTrackingService";
import { extractTokenFromHeader, verifyToken } from "$lib/utils/jwt";
import { hasPermission } from "$lib/services/authService";
import { getUserMessage } from "$lib/types/errors";

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DELETE: RequestHandler = async ({ params, request }) => {
  try {
    // Authenticate the request
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

    // Check permission — require write access to the email-tracking admin page
    const canWrite = await hasPermission(
      tokenResult.value.userId,
      "/admin/email-tracking",
      "write",
    );
    if (!canWrite) {
      return json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Validate the email parameter
    const email = decodeURIComponent(params.email!);

    if (!email) {
      return json(
        { success: false, error: "Email parameter is required" },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return json(
        { success: false, error: "Invalid email address format" },
        { status: 400 },
      );
    }

    // Remove the suppression
    const result = await removeSuppression(email);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 },
      );
    }

    return json({ success: true, data: { email } });
  } catch (error) {
    console.error("[api/email/suppressions] DELETE error:", error);
    return json(
      { success: false, error: "An error occurred while removing suppression" },
      { status: 500 },
    );
  }
};
