/**
 * Shortcuts Service
 *
 * Service for managing user shortcuts (bookmarks)
 */

import { ok, err, type Result } from "$lib/types/result";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
} from "$lib/types/errors";
import { getCurrentUserId } from "$lib/utils/userUtils";
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
} from "$lib/utils/postgrest";
import { z } from "zod";

/**
 * Generate a random hex color
 */
export function generateRandomColor(): string {
  const colors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#f97316", // orange
    "#ef4444", // red
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#84cc16", // lime
    "#a855f7", // violet
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Shortcut schema
 */
export interface Shortcut {
  id: number;
  user_id: string;
  title: string;
  url: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create shortcut input schema
 */
export const CreateShortcutInputSchema = z.object({
  title: z
    .string()
    .min(1, "Titel is verplicht")
    .max(255, "Titel mag maximaal 255 tekens zijn"),
  url: z
    .string()
    .min(1, "URL is verplicht")
    .max(500, "URL mag maximaal 500 tekens zijn"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ongeldige kleurcode")
    .optional(),
});

export type CreateShortcutInput = z.infer<typeof CreateShortcutInputSchema>;

/**
 * Add a shortcut for the current user
 *
 * @param input - Shortcut data (title and URL)
 * @returns Result containing the created shortcut or error
 */
export async function addShortcut(
  input: CreateShortcutInput,
): Promise<Result<Shortcut, ValidationError | NetworkError>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return err(
      ValidationError.create("Gebruiker niet ingelogd", "user_id", null),
    );
  }

  // Validate input
  const validation = CreateShortcutInputSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return err(
      ValidationError.create(
        firstError.message,
        firstError.path[0] as string,
        input,
      ),
    );
  }

  const validData = validation.data;

  // Check if shortcut already exists for this user and URL
  const existingResult = await queryTableResult<Shortcut>("_user_shortcuts", {
    filter: {
      user_id: `eq.${userId}`,
      url: `eq.${validData.url}`,
    },
  });

  if (existingResult.success && existingResult.value.data.length > 0) {
    return err(
      ValidationError.create(
        "Deze snelkoppeling bestaat al",
        "url",
        validData.url,
      ),
    );
  }

  // Insert new shortcut with color (default to random if not provided)
  const result = await insertRowResult<Shortcut>("_user_shortcuts", {
    user_id: userId,
    title: validData.title,
    url: validData.url,
    color: validData.color || generateRandomColor(),
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value);
}

/**
 * Get all shortcuts for the current user
 *
 * @returns Result containing array of shortcuts or error
 */
export async function getUserShortcuts(): Promise<
  Result<Shortcut[], NetworkError>
> {
  const userId = getCurrentUserId();
  if (!userId) {
    return err(
      NetworkError.from(new Error("Gebruiker niet ingelogd"), "/api/shortcuts"),
    );
  }

  const result = await queryTableResult<Shortcut>("_user_shortcuts", {
    filter: {
      user_id: `eq.${userId}`,
    },
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Update a shortcut
 *
 * @param id - Shortcut ID
 * @param input - Updated shortcut data
 * @returns Result containing updated shortcut or error
 */
export async function updateShortcut(
  id: number,
  input: Partial<CreateShortcutInput>,
): Promise<Result<Shortcut, ValidationError | NetworkError | NotFoundError>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return err(
      ValidationError.create("Gebruiker niet ingelogd", "user_id", null),
    );
  }

  // Check if shortcut exists and belongs to user
  const existingResult = await queryTableResult<Shortcut>("_user_shortcuts", {
    filter: {
      id: `eq.${id}`,
      user_id: `eq.${userId}`,
    },
  });

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length === 0) {
    return err(NotFoundError.resource("Shortcut", id));
  }

  // Validate input if provided
  if (input.title || input.url) {
    const validation = CreateShortcutInputSchema.partial().safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return err(
        ValidationError.create(
          firstError.message,
          firstError.path[0] as string,
          input,
        ),
      );
    }
  }

  // Update shortcut
  const result = await updateRowsResult<Shortcut>(
    "_user_shortcuts",
    { id: `eq.${id}` },
    input,
  );

  if (!result.success) {
    return err(result.error);
  }

  if (result.value.length === 0) {
    return err(NotFoundError.resource("Shortcut", id));
  }

  return ok(result.value[0]);
}

/**
 * Delete a shortcut
 *
 * @param id - Shortcut ID
 * @returns Result containing success or error
 */
export async function deleteShortcut(
  id: number,
): Promise<Result<void, NetworkError | NotFoundError>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return err(
      NetworkError.from(new Error("Gebruiker niet ingelogd"), "/api/shortcuts"),
    );
  }

  // Check if shortcut exists and belongs to user
  const existingResult = await queryTableResult<Shortcut>("_user_shortcuts", {
    filter: {
      id: `eq.${id}`,
      user_id: `eq.${userId}`,
    },
  });

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length === 0) {
    return err(NotFoundError.resource("Shortcut", id));
  }

  // Delete shortcut
  const result = await deleteRowsResult("_user_shortcuts", { id: `eq.${id}` });

  if (!result.success) {
    return err(result.error);
  }

  return ok(undefined);
}
