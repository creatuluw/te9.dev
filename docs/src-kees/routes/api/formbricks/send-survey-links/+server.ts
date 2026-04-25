import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import * as employeeService from "$lib/services/employeeService";
import * as messageService from "$lib/services/messageService";
import { getUserMessage } from "$lib/types/errors";
import { ValidationError } from "$lib/types/errors";

/**
 * Server-side endpoint for sending survey links via email
 *
 * This ensures email sending happens on the server where environment
 * variables (like EMAIL_SERVICE_TOKEN) are available at runtime.
 */

const SendSurveyLinksSchema = z.object({
  surveyId: z.string(),
  employeeIds: z.array(z.union([z.string(), z.number()])),
  subject: z.string().min(1),
  message: z.string().min(1),
  additionalEmails: z.array(z.string().email()).optional(),
});

/**
 * Generate Formbricks survey URL with email parameter
 */
function generateSurveyUrl(
  surveyId: string,
  email: string,
  baseUrl: string,
): string {
  const url = new URL(`/s/${surveyId}`, baseUrl);
  url.searchParams.set("email", email);
  return url.toString();
}

/**
 * Get the public Formbricks URL for survey links
 */
function getPublicFormbricksUrl(): string {
  return (
    process.env.FORMBRICKS_URL ||
    process.env.PUBLIC_FORMBRICKS_URL ||
    "https://formbricks-production-f895.up.railway.app"
  );
}

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = SendSurveyLinksSchema.safeParse(body);
    if (!validation.success) {
      console.error(
        "[api/formbricks/send-survey-links] Validation error:",
        validation.error,
      );
      throw error(400, "Invalid input data");
    }

    const { surveyId, employeeIds, subject, message, additionalEmails } =
      validation.data;

    // Get employees
    const employeeResults: Array<{ email: string; name: string }> = [];
    for (const employeeId of employeeIds) {
      const result = await employeeService.getEmployeeByUserId(employeeId);
      if (result.success) {
        const employee = result.value;
        const email =
          employee.hoi_email || employee.email || employee.email_value;
        const name = employee.fullname || employee.name || "Medewerker";

        if (email) {
          employeeResults.push({ email, name });
        }
      }
    }

    // Add additional emails if provided
    if (additionalEmails && additionalEmails.length > 0) {
      for (const email of additionalEmails) {
        employeeResults.push({ email, name: "Ontvanger" });
      }
    }

    if (employeeResults.length === 0) {
      throw error(400, "No valid recipients found with email addresses");
    }

    // Generate URLs and send emails
    let sent = 0;
    let failed = 0;
    const formbricksBaseUrl = getPublicFormbricksUrl();

    for (const employee of employeeResults) {
      const surveyUrl = generateSurveyUrl(
        surveyId,
        employee.email,
        formbricksBaseUrl,
      );

      // Create HTML email with link
      const htmlMessage = `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b;">
					${message.replace(/\n/g, "<br>")}
					<br><br>
					<a href="${surveyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
						Open het formulier
					</a>
				</div>
			`;

      const plainText = `${message}\n\nOpen het formulier: ${surveyUrl}`;

      // Send email via message service (server-side, has access to process.env)
      const emailResult = await messageService.sendEmailMessage({
        type: "formbricks_link",
        msg_type: "email",
        recipient_email: employee.email,
        subject: subject,
        html: htmlMessage,
        body: plainText,
        message_text: plainText,
      });

      if (emailResult.success) {
        sent++;
      } else {
        failed++;
        // Log individual email failures
        console.error(
          `[api/formbricks/send-survey-links] Failed to send email to ${employee.email}:`,
          {
            errorType: emailResult.error.code,
            errorMessage: emailResult.error.message,
            errorDetails: emailResult.error.details || "No additional details",
            recipient: employee.email,
            surveyId: surveyId,
          },
        );
      }
    }

    return json({
      success: true,
      sent,
      failed,
    });
  } catch (err) {
    console.error("[api/formbricks/send-survey-links] Unexpected error:", err);

    if (err && typeof err === "object" && "status" in err) {
      // Re-throw SvelteKit errors
      throw err;
    }

    throw error(500, "Failed to send survey links");
  }
};
