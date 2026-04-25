/**
 * Sysadmin Notification Service - Notify sysadmins of important events
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */

import { getSysadmins } from "./userManagementService";
import { sendEmailMessage } from "./messageService";
import { ok, err, type Result } from "$lib/types/result";
import type { AppError } from "$lib/types/errors";
import { renderEmailTemplate } from "$lib/templates/emails";

/**
 * Notify all sysadmins via message and email
 *
 * @param eventType - Type of event (e.g., 'user_registration', 'password_reset')
 * @param subject - Email subject
 * @param messageText - Plain text message
 * @param htmlContent - HTML email content
 * @param metadata - Additional metadata for the message
 * @returns Result with success status
 */
export async function notifySysadmins(
  eventType: string,
  subject: string,
  messageText: string,
  htmlContent: string,
  metadata?: Record<string, any>,
): Promise<Result<void, AppError>> {
  try {
    // Get all active sysadmins
    const sysadminsResult = await getSysadmins();
    if (!sysadminsResult.success) {
      return err(sysadminsResult.error);
    }

    const sysadmins = sysadminsResult.value;

    if (sysadmins.length === 0) {
      // No sysadmins to notify, but that's okay
      return ok(undefined);
    }

    // Notify each sysadmin
    const notificationPromises = sysadmins.map(async (sysadmin) => {
      // Send both in-app message and email
      const result = await sendEmailMessage({
        type: eventType,
        msg_type: "email",
        recipient_email: sysadmin.email,
        recipient_user_id: sysadmin.id,
        subject,
        html: htmlContent,
        body: messageText,
        message_text: messageText,
      });

      if (!result.success) {
        console.error(
          `Failed to notify sysadmin ${sysadmin.email}:`,
          result.error,
        );
      }

      return result;
    });

    // Wait for all notifications to complete (but don't fail if some fail)
    await Promise.allSettled(notificationPromises);

    return ok(undefined);
  } catch (error) {
    console.error("Notify sysadmins error:", error);
    return err(error as AppError);
  }
}

/**
 * Generate HTML email content for user events
 */
function generateUserEventEmail(
  eventType: string,
  userEmail: string,
  userName?: string,
  additionalInfo?: string,
): string {
  const eventNames: Record<string, string> = {
    user_registration: "Nieuwe gebruikersregistratie",
    password_reset: "Wachtwoord gereset",
    password_forgot: "Wachtwoord vergeten verzoek",
    user_deactivated: "Gebruiker gedeactiveerd",
    user_sysadmin_activated: "Gebruiker aangesteld als systeembeheerder",
    user_sysadmin_deactivated: "Systeembeheerder rechten ingetrokken",
    user_invite_delete: "Uitnodiging verwijderd",
  };

  const eventName = eventNames[eventType] || eventType;
  const displayName = userName || userEmail;

  const additionalInfoHtml = additionalInfo
    ? `<tr><td style="padding: 4px 0;"><strong style="color: #71717a; font-size: 14px;">Details:</strong> <span style="color: #18181b; font-size: 14px; margin-left: 8px;">${additionalInfo}</span></td></tr>`
    : "";

  return renderEmailTemplate("sysadmin-event", {
    eventName,
    userName: displayName,
    userEmail,
    additionalInfo: additionalInfoHtml,
  });
}

/**
 * Notify sysadmins about user registration
 */
export async function notifyUserRegistration(
  userEmail: string,
  userName?: string,
): Promise<Result<void, AppError>> {
  const subject = "Nieuwe gebruikersregistratie";
  const messageText = `Een nieuwe gebruiker heeft zich geregistreerd: ${userName || userEmail} (${userEmail})`;
  const htmlContent = generateUserEventEmail(
    "user_registration",
    userEmail,
    userName,
  );

  return notifySysadmins(
    "user_registration",
    subject,
    messageText,
    htmlContent,
    {
      user_email: userEmail,
      user_name: userName,
    },
  );
}

/**
 * Notify sysadmins about password reset
 */
export async function notifyPasswordReset(
  userEmail: string,
  userName?: string,
): Promise<Result<void, AppError>> {
  const subject = "Wachtwoord gereset";
  const messageText = `Een gebruiker heeft zijn/haar wachtwoord gereset: ${userName || userEmail} (${userEmail})`;
  const htmlContent = generateUserEventEmail(
    "password_reset",
    userEmail,
    userName,
  );

  return notifySysadmins("password_reset", subject, messageText, htmlContent, {
    user_email: userEmail,
    user_name: userName,
  });
}

/**
 * Notify sysadmins about password forgot request
 */
export async function notifyPasswordForgot(
  userEmail: string,
  userName?: string,
): Promise<Result<void, AppError>> {
  const subject = "Wachtwoord vergeten verzoek";
  const messageText = `Een gebruiker heeft een wachtwoord reset aangevraagd: ${userName || userEmail} (${userEmail})`;
  const htmlContent = generateUserEventEmail(
    "password_forgot",
    userEmail,
    userName,
  );

  return notifySysadmins("password_forgot", subject, messageText, htmlContent, {
    user_email: userEmail,
    user_name: userName,
  });
}

/**
 * Notify sysadmins about user deactivation
 */
export async function notifyUserDeactivated(
  userEmail: string,
  userName?: string,
  deactivatedBy?: string,
): Promise<Result<void, AppError>> {
  const subject = "Gebruiker gedeactiveerd";
  const additionalInfo = deactivatedBy
    ? `Gedeactiveerd door: ${deactivatedBy}`
    : undefined;
  const messageText = `Een gebruiker is gedeactiveerd: ${userName || userEmail} (${userEmail})${additionalInfo ? ` - ${additionalInfo}` : ""}`;
  const htmlContent = generateUserEventEmail(
    "user_deactivated",
    userEmail,
    userName,
    additionalInfo,
  );

  return notifySysadmins(
    "user_deactivated",
    subject,
    messageText,
    htmlContent,
    {
      user_email: userEmail,
      user_name: userName,
      deactivated_by: deactivatedBy,
    },
  );
}

/**
 * Notify sysadmins about sysadmin status change
 */
export async function notifySysadminStatusChanged(
  userEmail: string,
  isSysadmin: boolean,
  userName?: string,
  changedBy?: string,
): Promise<Result<void, AppError>> {
  const subject = isSysadmin
    ? "Gebruiker aangesteld als systeembeheerder"
    : "Systeembeheerder rechten ingetrokken";
  const statusText = isSysadmin
    ? "aangesteld als systeembeheerder"
    : "heeft geen systeembeheerder rechten meer";
  const additionalInfo = changedBy ? `Gewijzigd door: ${changedBy}` : undefined;
  const messageText = `Een gebruiker is ${statusText}: ${userName || userEmail} (${userEmail})${additionalInfo ? ` - ${additionalInfo}` : ""}`;
  const htmlContent = generateUserEventEmail(
    isSysadmin ? "user_sysadmin_activated" : "user_sysadmin_deactivated",
    userEmail,
    userName,
    additionalInfo,
  );

  return notifySysadmins(
    isSysadmin ? "user_sysadmin_activated" : "user_sysadmin_deactivated",
    subject,
    messageText,
    htmlContent,
    {
      user_email: userEmail,
      user_name: userName,
      is_sysadmin: isSysadmin,
      changed_by: changedBy,
    },
  );
}

/**
 * Notify sysadmins about invitation deletion
 */
export async function notifyInvitationDeleted(
  invitedEmail: string,
  deletedBy?: string,
): Promise<Result<void, AppError>> {
  const subject = "Uitnodiging verwijderd";
  const additionalInfo = deletedBy
    ? `Verwijderd door: ${deletedBy}`
    : undefined;
  const messageText = `Een openstaande uitnodiging is verwijderd voor: ${invitedEmail}${additionalInfo ? ` - ${additionalInfo}` : ""}`;
  const htmlContent = generateUserEventEmail(
    "user_invite_delete",
    invitedEmail,
    undefined,
    additionalInfo,
  );

  return notifySysadmins(
    "user_invite_delete",
    subject,
    messageText,
    htmlContent,
    {
      invited_email: invitedEmail,
      deleted_by: deletedBy,
    },
  );
}

/**
 * Notify sysadmins about permanent user deletion
 */
export async function notifyUserDeleted(
  userEmail: string,
  userName?: string,
  deletedBy?: string,
  reason?: string,
): Promise<Result<void, AppError>> {
  const subject = "Gebruiker permanent verwijderd";
  let additionalInfo = "";
  if (deletedBy) additionalInfo += `Verwijderd door: ${deletedBy}`;
  if (reason)
    additionalInfo += (additionalInfo ? " | " : "") + `Reden: ${reason}`;

  const messageText = `Een gebruiker is permanent verwijderd: ${userName || userEmail} (${userEmail})${additionalInfo ? ` - ${additionalInfo}` : ""}`;
  const htmlContent = generateUserEventEmail(
    "user_deleted",
    userEmail,
    userName,
    additionalInfo,
  );

  return notifySysadmins("user_deleted", subject, messageText, htmlContent, {
    user_email: userEmail,
    user_name: userName,
    deleted_by: deletedBy,
    deletion_reason: reason,
  });
}
