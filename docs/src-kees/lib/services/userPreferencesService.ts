/**
 * User preferences service - Manage user notification preferences
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
} from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import { ValidationError, NotFoundError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  UserPreferencesSchema,
  CreateUserPreferencesInputSchema,
  UpdateUserPreferencesInputSchema,
  type UserPreferences,
  type CreateUserPreferencesInput,
  type UpdateUserPreferencesInput,
  type NotificationMethod,
} from "$lib/schemas/userPreferences";

/**
 * Get user preferences
 *
 * Returns default preferences (["in-app"]) if user has no preferences set.
 *
 * @param userId - User ID (PocketBase user ID)
 * @returns Result containing user preferences, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getUserPreferences('user123');
 * if (result.success) {
 *   console.log(result.value.notification_methods); // ["in-app"] or ["in-app", "email"]
 * }
 * ```
 */
export async function getUserPreferences(
  userId: string,
): Promise<Result<UserPreferences, AppError>> {
  if (!userId || userId.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  const result = await queryTableResult<UserPreferences>(
    "_bpm_user_preferences",
    {
      filter: { user_id: `eq.${userId}` },
      limit: 1,
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // If no preferences exist, return default preferences
  if (result.value.data.length === 0) {
    // Return default preferences object (not stored in DB yet)
    return ok({
      id: 0, // Temporary ID
      user_id: userId,
      notification_methods: ["in-app"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return ok(result.value.data[0]);
}

/**
 * Update user preferences
 *
 * Creates preferences if they don't exist, updates if they do.
 *
 * @param userId - User ID (PocketBase user ID)
 * @param methods - Array of notification methods (e.g., ['in-app', 'email'])
 * @returns Result containing updated user preferences, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateUserPreferences('user123', ['in-app', 'email']);
 * if (result.success) {
 *   console.log('Preferences updated');
 * }
 * ```
 */
export async function updateUserPreferences(
  userId: string,
  methods: string[],
): Promise<Result<UserPreferences, AppError>> {
  if (!userId || userId.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  // Validate input
  const validation = validateSchema(UpdateUserPreferencesInputSchema, {
    notification_methods: methods,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  // Use methods as provided by the user (validated as NotificationMethod[] by schema above)
  const notificationMethods = methods as NotificationMethod[];

  // Check if preferences exist
  const existingResult = await queryTableResult<UserPreferences>(
    "_bpm_user_preferences",
    {
      filter: { user_id: `eq.${userId}` },
      limit: 1,
    },
  );

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length > 0) {
    // Update existing preferences
    const updateResult = await updateRowsResult<UserPreferences>(
      "_bpm_user_preferences",
      { user_id: `eq.${userId}` },
      {
        notification_methods: notificationMethods,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Fetch updated preferences
    const fetchResult = await queryTableResult<UserPreferences>(
      "_bpm_user_preferences",
      {
        filter: { user_id: `eq.${userId}` },
        limit: 1,
      },
    );

    if (!fetchResult.success || fetchResult.value.data.length === 0) {
      return err(NotFoundError.resource("UserPreferences", userId));
    }

    return ok(fetchResult.value.data[0]);
  } else {
    // Create new preferences
    const createResult = await insertRowResult<UserPreferences>(
      "_bpm_user_preferences",
      {
        user_id: userId,
        notification_methods: notificationMethods,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    );

    return createResult;
  }
}
