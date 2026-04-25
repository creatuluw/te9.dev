/**
 * Invitation Service - User invitations and password resets
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */

import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
  filter,
} from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  InvitationInputSchema,
  type InvitationInput,
  PasswordResetRequestSchema,
  type PasswordResetRequest,
  PasswordResetSchema,
  type PasswordReset,
} from "$lib/schemas/auth";
import { generateSecureToken, hashPassword } from "$lib/utils/password";
import { sendEmail } from "./emailService";
import { logActivity } from "./authService";
import * as eventLogService from "./eventLogService";
import * as sysadminNotificationService from "./sysadminNotificationService";
import { assignRoles } from "./userManagementService";
import { renderEmailTemplate } from "$lib/templates/emails";
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

const INVITATION_EXPIRY_HOURS = parseInt(env.INVITATION_EXPIRY_HOURS || "72");
const PASSWORD_RESET_EXPIRY_HOURS = parseInt(
  env.PASSWORD_RESET_EXPIRY_HOURS || "24",
);
const EMAIL_VERIFICATION_EXPIRY_HOURS = parseInt(
  env.EMAIL_VERIFICATION_EXPIRY_HOURS || "48",
);
const APP_URL = publicEnv.PUBLIC_APP_URL || "http://localhost:5173";

interface Invitation {
  id: number;
  email: string;
  token: string;
  invited_by: string;
  role_ids: number[];
  status: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

/**
 * Send invitation email to new user
 *
 * @param data - Invitation data
 * @param invitedBy - User ID of inviter
 * @param origin - Request origin URL (e.g., https://kees.pippeloi.nl)
 * @returns Result containing invitation
 */
export async function sendInvitation(
  data: InvitationInput,
  invitedBy: string,
  origin?: string,
): Promise<Result<Invitation, AppError>> {
  // Validate input
  const validation = validateSchema(InvitationInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const validated = validation.value;

  try {
    // Check if user already exists
    const existingUser = await queryTableResult("_auth_users", {
      filter: filter().eq("email", validated.email).build(),
    });

    if (existingUser.success && existingUser.value.data.length > 0) {
      return err(
        ValidationError.create(
          "User with this email already exists",
          "email",
          validated.email,
        ),
      );
    }

    // Generate invitation token
    const token = generateSecureToken();
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    // Create invitation record
    const invitationResult = await insertRowResult<Invitation>(
      "_auth_invitations",
      {
        email: validated.email,
        token,
        invited_by: invitedBy,
        role_ids: validated.role_ids,
        status: "pending",
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      },
    );

    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    const invitation = invitationResult.value;

    // Send invitation email
    const baseUrl = origin || APP_URL;
    const invitationLink = `${baseUrl}/invite/${token}`;
    const emailResult = await sendEmail({
      to: validated.email,
      subject: "You have been invited to join Kees Platform",
      html: generateInvitationEmail(
        validated.email,
        invitationLink,
        INVITATION_EXPIRY_HOURS,
      ),
    });

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // Don't fail the whole operation if email fails
    }

    // Log activity
    await logActivity(invitedBy, "invitation_sent", undefined, undefined, {
      email: validated.email,
      invitation_id: invitation.id,
    }).catch(console.error);

    // Log event to _bpm_event_log (use invitedBy as user_id since the user doesn't exist yet)
    await eventLogService
      .logUserEvent("user_invite_send", invitedBy, {
        newValues: {
          invited_email: validated.email,
        },
        metadata: {
          invitation_id: invitation.id,
        },
      })
      .catch(console.error);

    return ok(invitation);
  } catch (error) {
    console.error("Send invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get invitation by token
 *
 * @param token - Invitation token
 * @returns Result containing invitation
 */
export async function getInvitation(
  token: string,
): Promise<Result<Invitation, AppError>> {
  try {
    const result = await queryTableResult<Invitation>("_auth_invitations", {
      filter: filter().eq("token", token).build(),
    });

    if (!result.success) {
      return err(result.error);
    }

    if (result.value.data.length === 0) {
      return err(NotFoundError.resource("Invitation", token));
    }

    const invitation = result.value.data[0];

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return err(ValidationError.create("Invitation expired", "token", token));
    }

    // Check if already accepted
    if (invitation.status === "accepted") {
      return err(
        ValidationError.create("Invitation already accepted", "token", token),
      );
    }

    // Check if revoked
    if (invitation.status === "revoked") {
      return err(ValidationError.create("Invitation revoked", "token", token));
    }

    return ok(invitation);
  } catch (error) {
    console.error("Get invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Accept invitation and create user account
 *
 * @param token - Invitation token
 * @param password - User password
 * @param name - User name
 * @returns Result containing created user
 */
export async function acceptInvitation(
  token: string,
  password: string,
  name: string,
): Promise<Result<any, AppError>> {
  try {
    // Get invitation
    const invitationResult = await getInvitation(token);
    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    const invitation = invitationResult.value;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create user
    const userResult = await insertRowResult("_auth_users", {
      id: userId,
      email: invitation.email,
      name,
      password_hash: passwordHash,
      email_verified: true, // Auto-verify for invited users
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!userResult.success) {
      return err(userResult.error);
    }

    const user = userResult.value;

    // Assign roles
    const roleIds = JSON.parse(invitation.role_ids as any);
    if (roleIds && roleIds.length > 0) {
      await assignRoles(userId, roleIds, invitation.invited_by).catch(
        console.error,
      );
    }

    // Mark invitation as accepted
    await updateRowsResult(
      "_auth_invitations",
      filter().eq("token", token).build(),
      {
        status: "accepted",
        accepted_at: new Date().toISOString(),
      },
    ).catch(console.error);

    // Send welcome email
    const welcomeEmail = await sendEmail({
      to: invitation.email,
      subject: "Welcome to Kees Platform",
      html: generateWelcomeEmail(name),
    });

    // Log activity
    await logActivity(userId, "invitation_accepted", undefined, undefined, {
      invitation_id: invitation.id,
    }).catch(console.error);

    return ok(user);
  } catch (error) {
    console.error("Accept invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get pending invitations
 *
 * @returns Result containing list of pending invitations
 */
export async function getPendingInvitations(): Promise<
  Result<Invitation[], AppError>
> {
  try {
    const result = await queryTableResult<Invitation>("_auth_invitations", {
      filter: filter().eq("status", "pending").build(),
      order: "created_at.desc",
    });

    if (!result.success) {
      return err(result.error);
    }

    // Filter out expired invitations
    const now = new Date();
    const validInvitations = result.value.data.filter(
      (invitation) => new Date(invitation.expires_at) > now,
    );

    return ok(validInvitations);
  } catch (error) {
    console.error("Get pending invitations error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Resend invitation email
 *
 * @param id - Invitation ID
 * @param invitedBy - User ID of person resending
 * @returns Result containing invitation
 */
export async function resendInvitation(
  id: number,
  invitedBy: string,
  origin?: string,
): Promise<Result<Invitation, AppError>> {
  try {
    // Get invitation
    const invitationResult = await queryTableResult<Invitation>(
      "_auth_invitations",
      { filter: filter().eq("id", id).build() },
    );

    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    if (invitationResult.value.data.length === 0) {
      return err(NotFoundError.resource("Invitation", id.toString()));
    }

    const invitation = invitationResult.value.data[0];

    // Check if already accepted
    if (invitation.status === "accepted") {
      return err(
        ValidationError.create(
          "Invitation already accepted",
          "id",
          id.toString(),
        ),
      );
    }

    // Check if revoked
    if (invitation.status === "revoked") {
      return err(
        ValidationError.create("Invitation revoked", "id", id.toString()),
      );
    }

    // Check if expired - if expired, generate new token and extend expiry
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    let token = invitation.token;
    let newExpiresAt = invitation.expires_at;

    if (expiresAt <= now) {
      // Generate new token and extend expiry
      token = generateSecureToken();
      newExpiresAt = new Date(
        Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000,
      ).toISOString();

      // Update invitation with new token and expiry
      const updateResult = await updateRowsResult(
        "_auth_invitations",
        filter().eq("id", id).build(),
        {
          token,
          expires_at: newExpiresAt,
        },
      );

      if (!updateResult.success) {
        return err(updateResult.error);
      }
    }

    // Send invitation email
    const baseUrl = origin || APP_URL;
    const invitationLink = `${baseUrl}/invite/${token}`;
    const emailResult = await sendEmail({
      to: invitation.email,
      subject: "You have been invited to join Kees Platform",
      html: generateInvitationEmail(
        invitation.email,
        invitationLink,
        INVITATION_EXPIRY_HOURS,
      ),
    });

    if (!emailResult.success) {
      console.error("Failed to resend invitation email:", emailResult.error);
      // Still return success as invitation exists
    }

    // Log activity
    await logActivity(invitedBy, "invitation_resent", undefined, undefined, {
      invitation_id: id,
      email: invitation.email,
    }).catch(console.error);

    // Return updated invitation
    const updatedInvitation: Invitation = {
      ...invitation,
      token,
      expires_at: newExpiresAt,
    };

    return ok(updatedInvitation);
  } catch (error) {
    console.error("Resend invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Revoke invitation
 *
 * @param id - Invitation ID
 * @param revokedBy - User ID of revoker
 * @returns Result with success
 */
export async function revokeInvitation(
  id: number,
  revokedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Get invitation to get email for logging and notifications
    const invitationResult = await queryTableResult<Invitation>(
      "_auth_invitations",
      { filter: filter().eq("id", id).build() },
    );

    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    if (invitationResult.value.data.length === 0) {
      return err(NotFoundError.resource("Invitation", id.toString()));
    }

    const invitation = invitationResult.value.data[0];

    // Only revoke pending invitations
    if (invitation.status !== "pending") {
      return err(
        ValidationError.create(
          "Alleen openstaande uitnodigingen kunnen worden ingetrokken",
          "id",
          id.toString(),
        ),
      );
    }

    const updateResult = await updateRowsResult(
      "_auth_invitations",
      { status: "revoked" },
      filter().eq("id", id).build(),
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Log activity
    if (revokedBy) {
      await logActivity(revokedBy, "invitation_revoked", undefined, undefined, {
        invitation_id: id,
        invited_email: invitation.email,
      }).catch(console.error);
    }

    // Log event to _bpm_event_log
    if (revokedBy) {
      await eventLogService
        .logUserEvent("user_invite_delete", revokedBy, {
          oldValues: {
            invited_email: invitation.email,
            status: "pending",
          },
          newValues: {
            status: "revoked",
          },
          metadata: {
            invitation_id: id,
          },
        })
        .catch(console.error);
    }

    // Notify sysadmins
    await sysadminNotificationService
      .notifyInvitationDeleted(invitation.email, revokedBy)
      .catch(console.error);

    return ok(undefined);
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Request password reset
 *
 * @param request - Password reset request
 * @returns Result with success
 */
export async function requestPasswordReset(
  request: PasswordResetRequest,
  origin?: string,
): Promise<Result<void, AppError>> {
  // Validate input
  const validation = validateSchema(PasswordResetRequestSchema, request);
  if (!validation.success) {
    return err(validation.error);
  }

  const { email } = validation.value;

  try {
    // Find user by email
    const userResult = await queryTableResult("_auth_users", {
      filter: filter().eq("email", email).build(),
    });

    // Don't reveal if user exists or not (security)
    if (!userResult.success || userResult.value.data.length === 0) {
      return ok(undefined);
    }

    const user = userResult.value.data[0];

    // Generate reset token
    const token = generateSecureToken();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    // Create password reset record
    await insertRowResult("_auth_password_resets", {
      user_id: user.id,
      token,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    // Send password reset email
    const baseUrl = origin || APP_URL;
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    const emailResult = await sendEmail({
      to: email,
      subject: "Wachtwoord reset aangevraagd voor Kees",
      html: generatePasswordResetEmail(
        user.name || email,
        resetLink,
        PASSWORD_RESET_EXPIRY_HOURS,
      ),
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
    }

    // Log activity
    await logActivity(
      user.id,
      "password_reset_requested",
      undefined,
      undefined,
      {},
    ).catch(console.error);

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_password_forgot", user.id, {
        newValues: {
          email: email,
        },
      })
      .catch(console.error);

    // Notify sysadmins
    await sysadminNotificationService
      .notifyPasswordForgot(email, user.name || undefined)
      .catch(console.error);

    return ok(undefined);
  } catch (error) {
    console.error("Request password reset error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Reset password with token
 *
 * @param data - Password reset data
 * @returns Result with success
 */
export async function resetPassword(
  data: PasswordReset,
): Promise<Result<void, AppError>> {
  // Validate input
  const validation = validateSchema(PasswordResetSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const { token, password } = validation.value;

  try {
    // Find reset token
    const resetResult = await queryTableResult<any>("_auth_password_resets", {
      filter: filter().eq("token", token).build(),
    });

    if (!resetResult.success || resetResult.value.data.length === 0) {
      return err(
        ValidationError.create(
          "Invalid or expired reset token",
          "token",
          token,
        ),
      );
    }

    const reset = resetResult.value.data[0];

    // Check if expired
    if (new Date(reset.expires_at) < new Date()) {
      return err(ValidationError.create("Reset token expired", "token", token));
    }

    // Check if already used
    if (reset.used_at) {
      return err(
        ValidationError.create("Reset token already used", "token", token),
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await updateRowsResult(
      "_auth_users",
      filter().eq("id", reset.user_id).build(),
      {
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      },
    );

    // Mark token as used
    await updateRowsResult(
      "_auth_password_resets",
      filter().eq("token", token).build(),
      { used_at: new Date().toISOString() },
    );

    // Invalidate all user sessions
    await deleteRowsResult(
      "_auth_sessions",
      filter().eq("user_id", reset.user_id).build(),
    ).catch(console.error);

    // Log activity
    await logActivity(
      reset.user_id,
      "password_reset_completed",
      undefined,
      undefined,
      {},
    ).catch(console.error);

    // Get user info for logging and notification
    const userResult = await queryTableResult<any>("_auth_users", {
      filter: filter().eq("id", reset.user_id).build(),
    });

    if (userResult.success && userResult.value.data.length > 0) {
      const user = userResult.value.data[0];

      // Log event to _bpm_event_log
      await eventLogService
        .logUserEvent("user_password_reset", reset.user_id, {
          newValues: {
            email: user.email,
          },
        })
        .catch(console.error);

      // Notify sysadmins
      await sysadminNotificationService
        .notifyPasswordReset(user.email, user.name || undefined)
        .catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Reset password error:", error);
    return err(NetworkError.from(error));
  }
}

// ============ EMAIL TEMPLATES ============

function generateInvitationEmail(
  email: string,
  invitationLink: string,
  expiresInHours: number,
): string {
  return renderEmailTemplate("invitation", {
    invitationLink,
    expiresInHours: String(expiresInHours),
  });
}

function generatePasswordResetEmail(
  name: string,
  resetLink: string,
  expiresInHours: number,
): string {
  return renderEmailTemplate("password-reset", {
    name,
    resetLink,
    expiresInHours: String(expiresInHours),
  });
}

function generateWelcomeEmail(name: string): string {
  return renderEmailTemplate("welcome", {
    name,
    loginUrl: `${APP_URL}/login`,
  });
}
