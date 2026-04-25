/**
 * Typebot service - Integration with Typebot API
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import type { AppError } from "$lib/types/errors";
import { ValidationError, NetworkError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  TypebotSchema,
  type Typebot,
  type ParsedTypebotStructure,
  SendTypebotLinksInputSchema,
  type SendTypebotLinksInput,
} from "$lib/schemas/typebot";
import * as emailService from "./emailService";
import * as messageService from "./messageService";
import * as employeeService from "./employeeService";

/**
 * Get all typebots from the API (via server route)
 *
 * @returns Result containing array of typebots, or error if fetch fails
 */
export async function getAllTypebots(): Promise<Result<Typebot[], AppError>> {
  try {
    const response = await fetch("/tools/typebot/api/list");

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch typebots: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Use default error message
      }
      return err(NetworkError.from(new Error(errorMessage), response.url));
    }

    const data = await response.json();

    if (!data.success) {
      return err(
        ValidationError.create(
          data.error || "Failed to fetch typebots",
          "api",
          data,
        ),
      );
    }

    // Validate each typebot
    const validatedTypebots: Typebot[] = [];
    const typebots = data.typebots || [];
    for (const typebot of typebots) {
      const validation = TypebotSchema.safeParse(typebot);
      if (validation.success) {
        validatedTypebots.push(validation.data);
      } else {
        if (import.meta.env.DEV) {
          console.warn(
            "[typebotService] Typebot validation failed:",
            validation.error,
          );
        }
        // Include anyway with passthrough
        validatedTypebots.push(typebot as Typebot);
      }
    }

    return ok(validatedTypebots);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Get typebot by ID from the API (via server route)
 *
 * @param id - Typebot ID
 * @returns Result containing typebot, or error if not found
 */
export async function getTypebotById(
  id: string,
): Promise<Result<Typebot, AppError>> {
  if (!id || id.trim().length === 0) {
    return err(ValidationError.create("Typebot ID is required", "id", id));
  }

  try {
    const response = await fetch(`/tools/typebot/api/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to fetch typebot: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Use default error message
      }
      return err(NetworkError.from(new Error(errorMessage), response.url));
    }

    const data = await response.json();

    if (!data.success) {
      return err(
        ValidationError.create(
          data.error || "Failed to fetch typebot",
          "api",
          data,
        ),
      );
    }

    const validation = TypebotSchema.safeParse(data.typebot);
    if (!validation.success) {
      return err(
        ValidationError.create("Invalid typebot data", "typebot", data.typebot),
      );
    }

    return ok(validation.data);
  } catch (error) {
    return err(NetworkError.from(error));
  }
}

/**
 * Parse typebot JSON structure into readable format
 *
 * @param typebot - Typebot data
 * @returns Parsed structure with groups, blocks, edges, and variables
 */
export function parseTypebotStructure(
  typebot: Typebot,
): ParsedTypebotStructure {
  const groups = (typebot.groups || []).map((group) => ({
    id: group.id,
    title: group.title || null,
    blocks: (group.blocks || []).map((block) => ({
      id: block.id,
      type: block.type,
      content: block.content,
      options: block.options,
    })),
  }));

  const edges = (typebot.edges || []).map((edge) => ({
    id: edge.id,
    from: typeof edge.from === "string" ? edge.from : JSON.stringify(edge.from),
    to: typeof edge.to === "string" ? edge.to : JSON.stringify(edge.to),
    condition: edge.condition,
  }));

  const variables = (typebot.variables || []).map((variable) => ({
    id: variable.id,
    name: variable.name,
    type: variable.type,
  }));

  return {
    groups,
    edges,
    variables,
  };
}

/**
 * Generate typebot viewer URL with email and reset parameters
 *
 * @param publicId - Typebot public ID
 * @param email - Employee email address
 * @param viewerUrl - Base viewer URL (defaults to production viewer)
 * @returns Generated URL
 */
export function generateTypebotUrl(
  publicId: string,
  email: string,
  viewerUrl: string = "https://viewer-production-a3fa.up.railway.app",
): string {
  const url = new URL(`${viewerUrl}/${publicId}`);
  url.searchParams.set("email", email);
  url.searchParams.set("reset", "true");
  return url.toString();
}

/**
 * Send typebot links to employees via email
 *
 * @param data - Send typebot links input data
 * @returns Result containing send results, or error if sending fails
 */
export async function sendTypebotLinks(
  data: SendTypebotLinksInput,
): Promise<Result<{ sent: number; failed: number }, AppError>> {
  // Validate input
  const validation = validateSchema(SendTypebotLinksInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const validData = validation.value;

  // Get employees
  const employeeResults: Array<{ email: string; name: string }> = [];
  for (const employeeId of validData.employeeIds) {
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

  if (employeeResults.length === 0) {
    return err(
      ValidationError.create(
        "No valid employees found with email addresses",
        "employeeIds",
        validData.employeeIds,
      ),
    );
  }

  // Generate URLs and send emails
  let sent = 0;
  let failed = 0;
  const viewerUrl = "https://viewer-production-a3fa.up.railway.app";

  for (const employee of employeeResults) {
    const typebotUrl = generateTypebotUrl(
      validData.publicId,
      employee.email,
      viewerUrl,
    );

    // Create HTML email with link
    const htmlMessage = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #18181b;">
				${validData.message.replace(/\n/g, "<br>")}
				<br><br>
				<a href="${typebotUrl}" style="display: inline-block; padding: 12px 24px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
					Open het formulier
				</a>
			</div>
		`;

    const plainText = `${validData.message}\n\nOpen het formulier: ${typebotUrl}`;

    // Send email via message service
    const emailResult = await messageService.sendEmailMessage({
      type: "typebot_link",
      msg_type: "email",
      recipient_email: employee.email,
      subject: validData.subject,
      html: htmlMessage,
      body: plainText,
      message_text: plainText,
    });

    if (emailResult.success) {
      sent++;
    } else {
      failed++;
      if (import.meta.env.DEV) {
        console.error(
          `[typebotService] Failed to send email to ${employee.email}:`,
          emailResult.error,
        );
      }
    }
  }

  return ok({ sent, failed });
}
