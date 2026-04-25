/**
 * Validation utilities for using Zod schemas with error handling
 */

import { z } from "zod";
import { ValidationError } from "$lib/types/errors";
import { err, ok, type Result } from "$lib/types/result";
import type { AppError } from "$lib/types/errors";

/**
 * Validate data against a Zod schema and return Result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result with validated data or ValidationError
 *
 * @example
 * ```typescript
 * const result = validateSchema(MySchema, data);
 * if (result.success) {
 *   // Use result.value (validated data)
 * }
 * ```
 */
export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): Result<z.infer<T>, AppError> {
  try {
    const validated = schema.parse(data);
    return ok(validated);
  } catch (error) {
    if (
      error instanceof z.ZodError &&
      error.issues &&
      error.issues.length > 0
    ) {
      const firstError = error.issues[0];
      const field = firstError?.path.join(".") || "unknown";
      const message = firstError?.message || "Validation failed";

      console.error("Zod validation error:", {
        field,
        message,
        allErrors: error.issues.map((e: z.ZodIssue) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      });

      return err(
        new ValidationError(`Validation error: ${message}`, field, data, {
          allErrors: error.issues,
        }),
      );
    }

    console.error("Non-Zod validation error:", error);
    return err(ValidationError.create("Validation failed", undefined, data));
  }
}

/**
 * Validate data against a Zod schema (safe parse)
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result
 */
export function safeValidate<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  return schema.safeParse(data);
}

/**
 * Parse validation errors into user-friendly messages (Dutch)
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue: z.ZodIssue) => {
    const field = issue.path.join(".");
    const message = issue.message;

    // Simple Dutch translations for common errors
    const translations: Record<string, string> = {
      Required: "Verplicht veld",
      Invalid: "Ongeldige waarde",
      "Too small": "Te klein",
      "Too big": "Te groot",
      "Invalid email": "Ongeldig e-mailadres",
      "Invalid date format": "Ongeldig datumformaat",
    };

    let translatedMessage = message;
    for (const [key, value] of Object.entries(translations)) {
      if (message.includes(key)) {
        translatedMessage = message.replace(key, value);
      }
    }

    return field ? `${field}: ${translatedMessage}` : translatedMessage;
  });
}
