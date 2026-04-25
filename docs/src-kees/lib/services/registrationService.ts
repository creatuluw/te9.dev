/**
 * Registration Service - Secure user registration flow
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
  RegistrationInvitationInputSchema,
  type RegistrationInvitationInput,
  CompleteRegistrationInputSchema,
  type CompleteRegistrationInput,
} from "$lib/schemas/auth";
import {
  generateSecureToken,
  hashPassword,
  validatePasswordStrength,
} from "$lib/utils/password";
import * as emailService from "./emailService";
import { logActivity, clearAllSessions } from "./authService";
import * as eventLogService from "./eventLogService";
import * as sysadminNotificationService from "./sysadminNotificationService";
import * as roleService from "./roleService";
import * as userManagementService from "./userManagementService";
import * as messageService from "./messageService";
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

const REGISTRATION_EXPIRY_HOURS = 7 * 24; // 7 days
const EMAIL_VERIFICATION_EXPIRY_HOURS = parseInt(
  env.EMAIL_VERIFICATION_EXPIRY_HOURS || "48",
);
const APP_URL = publicEnv.PUBLIC_APP_URL || "http://localhost:5173";

interface RegistrationInvitation {
  id: number;
  email: string;
  token: string;
  invited_by: string;
  status: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

/**
 * Send registration invitation
 *
 * @param email - Email address to invite
 * @param invitedBy - User ID of admin sending invitation
 * @param origin - Request origin URL (e.g., https://kees.pippeloi.nl)
 * @returns Result containing invitation record
 */
export async function sendRegistrationInvitation(
  email: string,
  invitedBy: string,
  origin?: string,
): Promise<Result<RegistrationInvitation, AppError>> {
  // Validate input
  const validation = validateSchema(RegistrationInvitationInputSchema, {
    email,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    // Check if user already exists in active users only
    // Deleted users (_auth_users_deleted) can be re-invited
    const existingUser = await queryTableResult("_auth_users", {
      filter: filter().eq("email", email).build(),
    });

    if (existingUser.success && existingUser.value.data.length > 0) {
      return err(
        ValidationError.create(
          "Een gebruiker met dit e-mailadres bestaat al",
          "email",
          email,
        ),
      );
    }

    // Check if pending invitation exists
    const existingInvitation = await queryTableResult<RegistrationInvitation>(
      "_auth_invitations",
      {
        filter: filter().eq("email", email).eq("status", "pending").build(),
      },
    );

    if (
      existingInvitation.success &&
      existingInvitation.value.data.length > 0
    ) {
      const invitation = existingInvitation.value.data[0];
      const expiresAt = new Date(invitation.expires_at);
      if (expiresAt > new Date()) {
        return err(
          ValidationError.create(
            "Er is al een uitnodiging verstuurd naar dit e-mailadres. De link is nog geldig.",
            "email",
            email,
          ),
        );
      }
    }

    // Generate secure token
    const token = generateSecureToken();
    const expiresAt = new Date(
      Date.now() + REGISTRATION_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    // Create invitation record (using _auth_invitations table)
    const invitationResult = await insertRowResult<RegistrationInvitation>(
      "_auth_invitations",
      {
        email,
        token,
        invited_by: invitedBy,
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
    const registrationLink = `${baseUrl}/register/${token}`;
    const emailHtml = generateRegistrationInvitationEmail(
      registrationLink,
      REGISTRATION_EXPIRY_HOURS,
    );
    // Generate plain text version from HTML
    const emailText = emailHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    console.log("Sending invitation email to:", email);
    const emailResult = await emailService.sendEmail({
      to: email,
      subject: "Uitnodiging om uw account aan te maken",
      html: emailHtml,
      text: emailText,
    });

    console.log("Email send result:", {
      success: emailResult.success,
      emailSuccess: emailResult.success
        ? emailResult.value?.success
        : undefined,
      error: emailResult.success ? undefined : emailResult.error,
      emailError: emailResult.success ? emailResult.value?.error : undefined,
      emailDetails: emailResult.success
        ? emailResult.value?.details
        : undefined,
      emailData: emailResult.success ? emailResult.value?.data : undefined,
    });

    if (!emailResult.success) {
      console.error(
        "Failed to send registration invitation email - API call failed:",
        emailResult.error,
      );
      return err(emailResult.error);
    }

    // Check if email API returned an error in the response body
    if (!emailResult.value || !emailResult.value.success) {
      const errorMessage =
        emailResult.value?.error ||
        emailResult.value?.details ||
        "Onbekende fout";
      console.error("Email service returned error in response:", {
        success: emailResult.value?.success,
        error: emailResult.value?.error,
        details: emailResult.value?.details,
        fullResponse: emailResult.value,
      });
      return err(
        ValidationError.create(
          `E-mail kon niet worden verstuurd: ${errorMessage}`,
          "email",
          email,
        ),
      );
    }

    // Verify we got confirmation data from the email API
    if (!emailResult.value.data) {
      console.error(
        "Email service returned success but no confirmation data:",
        emailResult.value,
      );
      return err(
        ValidationError.create(
          "E-mail service gaf geen bevestiging terug. De e-mail is mogelijk niet verzonden.",
          "email",
          email,
        ),
      );
    }

    console.log(
      "Invitation email sent successfully to:",
      email,
      "Message ID:",
      emailResult.value.data.messageId,
    );

    // Log activity
    await logActivity(
      invitedBy,
      "registration_invitation_sent",
      undefined,
      undefined,
      {
        invited_email: email,
      },
    ).catch(console.error);

    // Log event to _bpm_event_log (use invitedBy as user_id since the user doesn't exist yet)
    await eventLogService
      .logUserEvent("user_invite_send", invitedBy, {
        newValues: {
          invited_email: email,
        },
        metadata: {
          invitation_id: invitation.id,
        },
      })
      .catch(console.error);

    return ok(invitation);
  } catch (error) {
    console.error("Send registration invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Validate registration token
 *
 * @param token - Registration token
 * @returns Result containing invitation if valid
 */
export async function validateRegistrationToken(
  token: string,
): Promise<Result<RegistrationInvitation, AppError>> {
  if (!token || token.trim() === "") {
    return err(ValidationError.create("Token is verplicht", "token", token));
  }

  try {
    const invitationResult = await queryTableResult<RegistrationInvitation>(
      "_auth_invitations",
      {
        filter: filter().eq("token", token).build(),
      },
    );

    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    if (invitationResult.value.data.length === 0) {
      return err(NotFoundError.resource("Registration invitation", token));
    }

    const invitation = invitationResult.value.data[0];

    // Check if already accepted
    if (invitation.status === "accepted") {
      return err(
        ValidationError.create(
          "Deze uitnodiging is al gebruikt",
          "token",
          token,
        ),
      );
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return err(
        ValidationError.create("Deze uitnodiging is verlopen", "token", token),
      );
    }

    return ok(invitation);
  } catch (error) {
    console.error("Validate registration token error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Complete registration
 *
 * @param token - Registration token
 * @param data - Registration data (name, username, password, avatar, bio)
 * @returns Result containing created user
 */
export async function completeRegistration(
  token: string,
  data: Omit<CompleteRegistrationInput, "token" | "confirmPassword">,
  origin?: string,
): Promise<Result<any, AppError>> {
  // Clear all sessions from system for security
  // This ensures a clean state when new users register
  const clearSessionsResult = await clearAllSessions();
  if (!clearSessionsResult.success) {
    console.error(
      "Failed to clear sessions during registration:",
      clearSessionsResult.error,
    );
    // Continue with registration even if clearing sessions fails
  } else {
    console.log("All sessions cleared before completing registration");
  }

  // Validate token first
  const tokenValidation = await validateRegistrationToken(token);
  if (!tokenValidation.success) {
    return err(tokenValidation.error);
  }

  const invitation = tokenValidation.value;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.valid) {
    return err(
      ValidationError.create(
        passwordValidation.message ||
          "Wachtwoord voldoet niet aan de vereisten",
        "password",
        data.password,
      ),
    );
  }

  // Check if username already exists (if provided)
  if (data.username) {
    const usernameCheck = await queryTableResult("_auth_users", {
      filter: filter().eq("username", data.username).build(),
    });

    if (usernameCheck.success && usernameCheck.value.data.length > 0) {
      return err(
        ValidationError.create(
          "Een gebruiker met deze gebruikersnaam bestaat al",
          "username",
          data.username,
        ),
      );
    }
  }

  try {
    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Generate user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create user account (email_verified = false, is_active = false)
    const userResult = await insertRowResult("_auth_users", {
      id: userId,
      email: invitation.email,
      name: data.name,
      username: data.username || null,
      password_hash: passwordHash,
      avatar: data.avatar || null,
      bio: data.bio || null,
      email_verified: false,
      is_active: false, // Inactive until email verified
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!userResult.success) {
      return err(userResult.error);
    }

    const user = userResult.value;

    // Assign default role to new user
    const defaultRoleResult = await roleService.getDefaultRole();
    if (defaultRoleResult.success && defaultRoleResult.value) {
      await userManagementService
        .assignRoleToUser(
          userId,
          defaultRoleResult.value.id,
          invitation.invited_by,
        )
        .catch(console.error);
    }

    // Mark invitation as accepted (by token)
    const updateInvitationResult = await updateRowsResult(
      "_auth_invitations",
      filter().eq("token", token).build(),
      {
        status: "accepted",
        accepted_at: new Date().toISOString(),
      },
    );

    if (!updateInvitationResult.success) {
      console.error(
        "Failed to mark invitation as accepted:",
        updateInvitationResult.error,
      );
    }

    // Also close any other pending invitations for this email (in case of duplicates)
    await updateRowsResult(
      "_auth_invitations",
      filter().eq("email", invitation.email).eq("status", "pending").build(),
      {
        status: "accepted",
        accepted_at: new Date().toISOString(),
      },
    ).catch(console.error);

    // Generate email verification token
    const verificationToken = generateSecureToken();
    const verificationExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString();

    // Create email verification record
    await insertRowResult("_auth_email_verifications", {
      user_id: userId,
      token: verificationToken,
      expires_at: verificationExpiresAt,
      created_at: new Date().toISOString(),
    }).catch(console.error);

    // Send verification email
    const baseUrl = origin || APP_URL;
    const verificationLink = `${baseUrl}/verify-email/${verificationToken}`;
    const emailResult = await emailService.sendEmail({
      to: invitation.email,
      subject: "Verifieer uw e-mailadres",
      html: generateEmailVerificationEmail(
        data.name || invitation.email,
        verificationLink,
        EMAIL_VERIFICATION_EXPIRY_HOURS,
      ),
    });

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      console.error(
        "Email error details:",
        JSON.stringify(emailResult.error, null, 2),
      );
      // Still return success as user was created
    } else if (!emailResult.value.success) {
      // Email service returned success but email sending actually failed
      console.error(
        "Email service returned error in response:",
        emailResult.value.error,
      );
      console.error("Email error details:", emailResult.value.details);
      // Still return success as user was created
    } else {
      console.log("Verification email sent successfully to:", invitation.email);
    }

    // Log activity
    await logActivity(userId, "registration_completed", undefined, undefined, {
      invitation_id: invitation.id,
    }).catch(console.error);

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_registration", userId, {
        newValues: {
          email: invitation.email,
          name: data.name,
          username: data.username || null,
        },
        metadata: {
          invitation_id: invitation.id,
        },
      })
      .catch(console.error);

    // Notify sysadmins
    await sysadminNotificationService
      .notifyUserRegistration(invitation.email, data.name)
      .catch(console.error);

    // Notify inviter (in-app and email)
    if (invitation.invited_by) {
      // Get inviter's email
      const inviterResult = await queryTableResult<{
        email: string;
        name: string | null;
      }>("_auth_users", {
        filter: filter().eq("id", invitation.invited_by).build(),
        select: "email,name",
      });

      if (inviterResult.success && inviterResult.value.data.length > 0) {
        const inviter = inviterResult.value.data[0];
        const inviterName = inviter.name || inviter.email;
        const newUserName = data.name || invitation.email;

        // Generate notification content
        const subject = "Nieuwe gebruiker heeft zich geregistreerd";
        const messageText = `${newUserName} heeft zich geregistreerd met het e-mailadres ${invitation.email}.`;
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #18181b;">Nieuwe gebruiker geregistreerd</h2>
            <p style="color: #3f3f46; line-height: 1.6;">
              ${newUserName} heeft zich geregistreerd met het e-mailadres <strong>${invitation.email}</strong>.
            </p>
            <p style="color: #3f3f46; line-height: 1.6;">
              De gebruiker heeft een verificatie-e-mail ontvangen en kan inloggen zodra het e-mailadres is geverifieerd.
            </p>
            <p style="color: #71717a; font-size: 14px; margin-top: 30px;">
              Dit is een automatische melding van het Kees Platform.
            </p>
          </div>
        `;

        // Send in-app notification
        await messageService
          .sendMessage({
            type: "user_registered",
            recipient_email: inviter.email,
            recipient_user_id: invitation.invited_by,
            subject: subject,
            body: messageText,
            message_text: messageText,
            msg_type: "notification",
            attachments: [],
            references: [],
          })
          .catch(console.error);

        // Send email notification
        await messageService
          .sendEmailMessage({
            type: "user_registered",
            recipient_email: inviter.email,
            recipient_user_id: invitation.invited_by,
            subject: subject,
            html: htmlContent,
            message_text: messageText,
            msg_type: "email",
          })
          .catch(console.error);
      }
    }

    return ok(user);
  } catch (error) {
    console.error("Complete registration error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Close invitations for users who have already registered
 * This is a cleanup function to handle cases where invitations weren't properly closed
 * Updates invitations where the email exists in _auth_users table
 */
async function closeInvitationsForRegisteredUsers(): Promise<void> {
  try {
    // Get all pending invitations
    const invitationsResult = await queryTableResult<RegistrationInvitation>(
      "_auth_invitations",
      {
        filter: filter().eq("status", "pending").build(),
      },
    );

    if (
      !invitationsResult.success ||
      invitationsResult.value.data.length === 0
    ) {
      return;
    }

    // Get all user emails from _auth_users table only
    // Note: We don't check _auth_users_deleted because we allow re-inviting deleted users
    const usersResult = await queryTableResult<{ email: string }>(
      "_auth_users",
      {
        select: "email",
      },
    );

    const registeredEmails = new Set<string>();

    // Add emails from active users only
    if (usersResult.success) {
      usersResult.value.data
        .map((u) => u.email?.toLowerCase().trim())
        .filter((email): email is string => !!email)
        .forEach((email) => registeredEmails.add(email));
    } else {
      console.error(
        "Failed to fetch users for invitation cleanup:",
        usersResult.error,
      );
    }

    if (registeredEmails.size === 0) {
      return;
    }

    // Find invitations for registered users
    const invitationsToClose = invitationsResult.value.data.filter(
      (invitation) => {
        const invitationEmail = invitation.email?.toLowerCase().trim();
        return invitationEmail && registeredEmails.has(invitationEmail);
      },
    );

    if (invitationsToClose.length === 0) {
      return;
    }

    // Close all invitations for registered users in batch
    const updatePromises = invitationsToClose.map((invitation) =>
      updateRowsResult(
        "_auth_invitations",
        filter().eq("id", invitation.id).build(),
        {
          status: "accepted",
          accepted_at: new Date().toISOString(),
        },
      ),
    );

    const updateResults = await Promise.allSettled(updatePromises);

    const successful = updateResults.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const failed = updateResults.filter((r) => r.status === "rejected").length;

    if (successful > 0) {
      console.log(
        `Closed ${successful} invitation(s) for already registered users`,
      );
    }
    if (failed > 0) {
      console.error(`Failed to close ${failed} invitation(s)`);
      updateResults
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .forEach((r) => console.error("Update error:", r.reason));
    }
  } catch (error) {
    console.error("Error closing invitations for registered users:", error);
    // Don't throw - this is a cleanup function
  }
}

/**
 * Get pending registration invitations
 *
 * @returns Result containing list of pending invitations
 * Automatically filters out invitations for users who have already registered
 */
export async function getPendingInvitations(): Promise<
  Result<RegistrationInvitation[], AppError>
> {
  try {
    // First, clean up any invitations for users who have already registered
    await closeInvitationsForRegisteredUsers();

    // Get all pending invitations
    const result = await queryTableResult<RegistrationInvitation>(
      "_auth_invitations",
      {
        filter: filter().eq("status", "pending").build(),
        order: "created_at.desc",
      },
    );

    if (!result.success) {
      return err(result.error);
    }

    // Get registered user emails to double-check filtering
    // Only check active users - we allow inviting deleted users
    const usersResult = await queryTableResult<{ email: string }>(
      "_auth_users",
      {
        select: "email",
      },
    );

    const registeredEmails = new Set<string>();

    // Add emails from active users only
    if (usersResult.success) {
      usersResult.value.data
        .map((u) => u.email?.toLowerCase().trim())
        .filter((email): email is string => !!email)
        .forEach((email) => registeredEmails.add(email));
    }

    // Filter out expired invitations AND invitations for active registered users
    const now = new Date();
    const validInvitations = result.value.data.filter((invitation) => {
      // Check if expired
      if (new Date(invitation.expires_at) <= now) {
        return false;
      }

      // Filter out if email exists in _auth_users (active users only, not deleted)
      const invitationEmail = invitation.email?.toLowerCase().trim();
      if (invitationEmail && registeredEmails.has(invitationEmail)) {
        // This invitation should have been closed, but wasn't - log it
        console.warn(
          `Found pending invitation for registered user: ${invitation.email} (ID: ${invitation.id})`,
        );
        return false;
      }

      return true;
    });

    return ok(validInvitations);
  } catch (error) {
    console.error("Get pending invitations error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Resend registration invitation email
 *
 * @param id - Invitation ID
 * @param invitedBy - User ID of person resending
 * @returns Result containing invitation
 */
export async function resendRegistrationInvitation(
  id: number,
  invitedBy: string,
  origin?: string,
): Promise<Result<RegistrationInvitation, AppError>> {
  try {
    // Get invitation
    const invitationResult = await queryTableResult<RegistrationInvitation>(
      "_auth_invitations",
      { filter: filter().eq("id", id).build() },
    );

    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    if (invitationResult.value.data.length === 0) {
      return err(
        NotFoundError.resource("Registration invitation", id.toString()),
      );
    }

    const invitation = invitationResult.value.data[0];

    // Check if already accepted
    if (invitation.status === "accepted") {
      return err(
        ValidationError.create(
          "Uitnodiging is al gebruikt",
          "id",
          id.toString(),
        ),
      );
    }

    // Check if revoked
    if (invitation.status === "revoked") {
      return err(
        ValidationError.create(
          "Uitnodiging is ingetrokken",
          "id",
          id.toString(),
        ),
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
        Date.now() + REGISTRATION_EXPIRY_HOURS * 60 * 60 * 1000,
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
    const registrationLink = `${baseUrl}/register/${token}`;
    const emailHtml = generateRegistrationInvitationEmail(
      registrationLink,
      REGISTRATION_EXPIRY_HOURS,
    );
    // Generate plain text version from HTML
    const emailText = emailHtml
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    console.log("Resending invitation email to:", invitation.email);
    const emailResult = await emailService.sendEmail({
      to: invitation.email,
      subject: "Uitnodiging om uw account aan te maken",
      html: emailHtml,
      text: emailText,
    });

    console.log("Resend email result:", {
      success: emailResult.success,
      emailSuccess: emailResult.success
        ? emailResult.value?.success
        : undefined,
      error: emailResult.success ? undefined : emailResult.error,
      emailError: emailResult.success ? emailResult.value?.error : undefined,
    });

    if (!emailResult.success) {
      console.error(
        "Failed to resend registration invitation email:",
        emailResult.error,
      );
      return err(emailResult.error);
    }

    // Check if email API returned an error in the response
    if (!emailResult.value.success) {
      console.error(
        "Email service returned error:",
        emailResult.value.error,
        emailResult.value.details,
      );
      return err(
        ValidationError.create(
          `E-mail kon niet worden verstuurd: ${emailResult.value.error || "Onbekende fout"}`,
          "email",
          invitation.email,
        ),
      );
    }

    // Log activity
    await logActivity(
      invitedBy,
      "registration_invitation_resent",
      undefined,
      undefined,
      {
        invitation_id: id,
        invited_email: invitation.email,
      },
    ).catch(console.error);

    // Return updated invitation
    const updatedInvitation: RegistrationInvitation = {
      ...invitation,
      token,
      expires_at: newExpiresAt,
    };

    return ok(updatedInvitation);
  } catch (error) {
    console.error("Resend registration invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Delete registration invitation
 *
 * @param id - Invitation ID
 * @param deletedBy - User ID of person deleting
 * @returns Result with success status
 */
export async function deleteRegistrationInvitation(
  id: number,
  deletedBy: string,
): Promise<Result<void, AppError>> {
  try {
    // Get invitation to verify it exists and get email for logging
    const invitationResult = await queryTableResult<RegistrationInvitation>(
      "_auth_invitations",
      { filter: filter().eq("id", id).build() },
    );

    if (!invitationResult.success) {
      return err(invitationResult.error);
    }

    if (invitationResult.value.data.length === 0) {
      return err(
        NotFoundError.resource("Registration invitation", id.toString()),
      );
    }

    const invitation = invitationResult.value.data[0];

    // Check if already accepted - don't allow deletion of accepted invitations
    if (invitation.status === "accepted") {
      return err(
        ValidationError.create(
          "Uitnodiging is al gebruikt en kan niet worden verwijderd",
          "id",
          id.toString(),
        ),
      );
    }

    // Delete the invitation
    const deleteResult = await deleteRowsResult(
      "_auth_invitations",
      filter().eq("id", id).build(),
    );

    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    // Log activity
    await logActivity(
      deletedBy,
      "registration_invitation_deleted",
      undefined,
      undefined,
      {
        invitation_id: id,
        invited_email: invitation.email,
      },
    ).catch(console.error);

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_invite_delete", deletedBy, {
        oldValues: {
          invited_email: invitation.email,
          status: invitation.status,
        },
        metadata: {
          invitation_id: id,
        },
      })
      .catch(console.error);

    // Notify sysadmins
    await sysadminNotificationService
      .notifyInvitationDeleted(invitation.email, deletedBy)
      .catch(console.error);

    return ok(undefined);
  } catch (error) {
    console.error("Delete registration invitation error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Resend email verification
 *
 * @param email - User email address
 * @returns Result with success status
 */
export async function resendEmailVerification(
  email: string,
  origin?: string,
): Promise<Result<void, AppError>> {
  if (!email || email.trim() === "") {
    return err(
      ValidationError.create("E-mailadres is verplicht", "email", email),
    );
  }

  try {
    // Find user by email
    const userResult = await queryTableResult("_auth_users", {
      filter: filter().eq("email", email).build(),
    });

    if (!userResult.success) {
      return err(userResult.error);
    }

    if (userResult.value.data.length === 0) {
      return err(NotFoundError.resource("User", email));
    }

    const user = userResult.value.data[0];

    // Check if already verified
    if (user.email_verified) {
      return err(
        ValidationError.create(
          "E-mailadres is al geverifieerd",
          "email",
          email,
        ),
      );
    }

    // Find existing verification record
    const verificationResult = await queryTableResult(
      "_auth_email_verifications",
      {
        filter: filter().eq("user_id", user.id).build(),
      },
    );

    let verificationToken: string;
    let expiresAt: string;

    if (
      verificationResult.success &&
      verificationResult.value.data.length > 0
    ) {
      const existingVerification = verificationResult.value.data[0];

      // Check if token is still valid (not expired)
      const expiresAtDate = new Date(existingVerification.expires_at);
      if (expiresAtDate > new Date() && !existingVerification.verified_at) {
        // Use existing token
        verificationToken = existingVerification.token;
        expiresAt = existingVerification.expires_at;
      } else {
        // Generate new token
        verificationToken = generateSecureToken();
        expiresAt = new Date(
          Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
        ).toISOString();

        // Update or create verification record
        if (existingVerification.verified_at) {
          // Create new record
          await insertRowResult("_auth_email_verifications", {
            user_id: user.id,
            token: verificationToken,
            expires_at: expiresAt,
            created_at: new Date().toISOString(),
          }).catch(console.error);
        } else {
          // Update existing record
          await updateRowsResult(
            "_auth_email_verifications",
            filter().eq("user_id", user.id).build(),
            {
              token: verificationToken,
              expires_at: expiresAt,
            },
          ).catch(console.error);
        }
      }
    } else {
      // Create new verification record
      verificationToken = generateSecureToken();
      expiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
      ).toISOString();

      await insertRowResult("_auth_email_verifications", {
        user_id: user.id,
        token: verificationToken,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      }).catch(console.error);
    }

    // Send verification email
    const baseUrl = origin || APP_URL;
    const verificationLink = `${baseUrl}/verify-email/${verificationToken}`;
    const emailResult = await emailService.sendEmail({
      to: user.email,
      subject: "Verifieer uw e-mailadres",
      html: generateEmailVerificationEmail(
        user.name || user.email,
        verificationLink,
        EMAIL_VERIFICATION_EXPIRY_HOURS,
      ),
    });

    if (!emailResult.success) {
      console.error("Failed to resend verification email:", emailResult.error);
      return err(emailResult.error);
    } else if (!emailResult.value.success) {
      console.error(
        "Email service returned error in response:",
        emailResult.value.error,
      );
      return err(
        new NetworkError(
          `Failed to send email: ${emailResult.value.error || "Unknown error"}`,
        ),
      );
    }

    // Log activity
    await logActivity(
      user.id,
      "email_verification_resent",
      undefined,
      undefined,
      {},
    ).catch(console.error);

    return ok(undefined);
  } catch (error) {
    console.error("Resend email verification error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Verify email address
 *
 * @param token - Email verification token
 * @returns Result with success status
 */
export async function verifyEmail(
  token: string,
): Promise<Result<void, AppError>> {
  if (!token || token.trim() === "") {
    return err(ValidationError.create("Token is verplicht", "token", token));
  }

  try {
    const verificationResult = await queryTableResult(
      "_auth_email_verifications",
      {
        filter: filter().eq("token", token).build(),
      },
    );

    if (!verificationResult.success) {
      return err(verificationResult.error);
    }

    if (verificationResult.value.data.length === 0) {
      return err(NotFoundError.resource("Email verification", token));
    }

    const verification = verificationResult.value.data[0];

    // Check if already verified
    if (verification.verified_at) {
      return err(
        ValidationError.create(
          "E-mailadres is al geverifieerd",
          "token",
          token,
        ),
      );
    }

    // Check if expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      return err(
        ValidationError.create("Verificatielink is verlopen", "token", token),
      );
    }

    // Update verification record
    await updateRowsResult(
      "_auth_email_verifications",
      filter().eq("token", token).build(),
      {
        verified_at: new Date().toISOString(),
      },
    );

    // Activate user account
    await updateRowsResult(
      "_auth_users",
      filter().eq("id", verification.user_id).build(),
      {
        email_verified: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
    );

    // Log activity
    await logActivity(
      verification.user_id,
      "email_verified",
      undefined,
      undefined,
      {},
    ).catch(console.error);

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_email_verification", verification.user_id, {
        newValues: {
          email_verified: true,
          is_active: true,
        },
      })
      .catch(console.error);

    return ok(undefined);
  } catch (error) {
    console.error("Verify email error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Generate registration invitation email HTML
 */
function generateRegistrationInvitationEmail(
  registrationLink: string,
  expiresInHours: number,
): string {
  const expiresInDays = Math.floor(expiresInHours / 24);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Uitnodiging Account Aanmaken</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <h1 style="color: #111827; font-size: 24px; margin-top: 0; margin-bottom: 20px;">Uitnodiging Account Aanmaken</h1>

    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
      U bent uitgenodigd om een account aan te maken voor het Business Process Management systeem.
    </p>

    <p style="color: #374151; font-size: 16px; margin-bottom: 30px;">
      Klik op de onderstaande knop om uw account aan te maken:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${registrationLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Account Aanmaken</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; margin-bottom: 10px;">
      Of kopieer en plak deze link in uw browser:
    </p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all; background-color: #f9fafb; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
      ${registrationLink}
    </p>

    <p style="color: #dc2626; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
      <strong>Let op:</strong> Deze link is ${expiresInDays} dag(en) geldig. Na het aanmaken van uw account ontvangt u een e-mail om uw e-mailadres te verifiëren.
    </p>
  </div>

  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
    Als u deze uitnodiging niet heeft aangevraagd, kunt u deze e-mail negeren.
  </p>
</body>
</html>
  `.trim();
}

/**
 * Generate email verification email HTML
 */
function generateEmailVerificationEmail(
  name: string,
  verificationLink: string,
  expiresInHours: number,
): string {
  const expiresInDays = Math.floor(expiresInHours / 24);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifieer Uw E-mailadres</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
    <h1 style="color: #111827; font-size: 24px; margin-top: 0; margin-bottom: 20px;">Verifieer Uw E-mailadres</h1>

    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
      Hallo ${name},
    </p>

    <p style="color: #374151; font-size: 16px; margin-bottom: 30px;">
      Bedankt voor het aanmaken van uw account. Klik op de onderstaande knop om uw e-mailadres te verifiëren en uw account te activeren:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">E-mailadres Verifiëren</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; margin-bottom: 10px;">
      Of kopieer en plak deze link in uw browser:
    </p>
    <p style="color: #6b7280; font-size: 12px; word-break: break-all; background-color: #f9fafb; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
      ${verificationLink}
    </p>

    <p style="color: #dc2626; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
      <strong>Let op:</strong> Deze link is ${expiresInDays} dag(en) geldig. Na verificatie kunt u inloggen met uw e-mailadres en wachtwoord.
    </p>
  </div>

  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
    Als u deze verificatie niet heeft aangevraagd, kunt u deze e-mail negeren.
  </p>
</body>
</html>
  `.trim();
}
