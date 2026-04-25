/**
 * User availability service - Manage weekly hours availability
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { 
  queryTableResult, 
  insertRowResult, 
  updateRowsResult, 
  getRowByIdResult 
} from '$lib/utils/postgrest';
import { getCurrentUserId } from '$lib/utils/userUtils';
import * as eventLogService from './eventLogService';
import type { AppError } from '$lib/types/errors';
import { ValidationError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';
import { validateSchema } from '$lib/utils/validation';
import {
  CreateUserAvailabilityInputSchema,
  UpdateUserAvailabilityInputSchema,
  type UserAvailability,
  type CreateUserAvailabilityInput,
  type UpdateUserAvailabilityInput
} from '$lib/schemas/userAvailability';

/**
 * Get current user's latest availability
 * 
 * @returns Result containing latest availability or null if none exists, or error if query fails
 */
export async function getCurrentUserAvailability(): Promise<Result<UserAvailability | null, AppError>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return ok(null);
  }

  const result = await queryTableResult<UserAvailability>('_bpm_user_availability', {
    filter: { user_id: `eq.${userId}` },
    order: 'created_at.desc',
    limit: 1,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data.length > 0 ? result.value.data[0] : null);
}

/**
 * Get availability for a specific user and week
 * 
 * @param userId - User ID
 * @param weekStartDate - Week start date in YYYY-MM-DD format
 * @returns Result containing availability or null if not found
 */
export async function getUserAvailability(
  userId: string,
  weekStartDate: string
): Promise<Result<UserAvailability | null, AppError>> {
  const result = await queryTableResult<UserAvailability>('_bpm_user_availability', {
    filter: {
      user_id: `eq.${userId}`,
      week_start_date: `eq.${weekStartDate}`
    },
    limit: 1,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data.length > 0 ? result.value.data[0] : null);
}

/**
 * Create or update user availability
 * If availability for the week_start_date already exists, it updates it
 * 
 * @param data - Availability creation/update data
 * @returns Result containing created/updated availability, or error if operation fails
 */
export async function setUserAvailability(
  data: CreateUserAvailabilityInput
): Promise<Result<UserAvailability, AppError>> {
  // Validate input
  const validation = validateSchema(CreateUserAvailabilityInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Check if availability already exists for this user and week
  const existingResult = await getUserAvailability(data.user_id, data.week_start_date);
  if (!existingResult.success) {
    return err(existingResult.error);
  }

  const existing = existingResult.value;

  if (existing) {
    // Update existing
    const updateValidation = validateSchema(UpdateUserAvailabilityInputSchema, {
      hours_per_week: data.hours_per_week,
      week_start_date: data.week_start_date
    });
    if (!updateValidation.success) {
      return err(updateValidation.error);
    }

    const updateResult = await updateRowsResult<UserAvailability>(
      '_bpm_user_availability',
      {
        user_id: `eq.${data.user_id}`,
        week_start_date: `eq.${data.week_start_date}`
      },
      {
        hours_per_week: data.hours_per_week,
        updated_at: new Date().toISOString(),
      }
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Get updated record
    const getResult = await getUserAvailability(data.user_id, data.week_start_date);
    if (!getResult.success || !getResult.value) {
      return err(ValidationError.create('Failed to retrieve updated availability', 'id', existing.id));
    }

    // Log availability update event
    await eventLogService.logEvent('availability_updated', 'user_availability', getResult.value.id, { 
      newValues: getResult.value, 
    }).catch(console.error);

    return ok(getResult.value);
  } else {
    // Create new
    const createResult = await insertRowResult<UserAvailability>('_bpm_user_availability', {
      ...data,
      updated_at: new Date().toISOString(),
    });

    if (!createResult.success) {
      return err(createResult.error);
    }

    // Log availability creation event
    await eventLogService.logEvent('availability_created', 'user_availability', createResult.value.id, { 
      newValues: createResult.value, 
    }).catch(console.error);

    return ok(createResult.value);
  }
}

/**
 * Create a new user availability record (always creates, never updates)
 * 
 * @param data - Availability creation data
 * @returns Result containing created availability, or error if creation fails
 */
export async function createUserAvailability(
  data: CreateUserAvailabilityInput
): Promise<Result<UserAvailability, AppError>> {
  // Validate input
  const validation = validateSchema(CreateUserAvailabilityInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Always create a new record
  const createResult = await insertRowResult<UserAvailability>('_bpm_user_availability', {
    ...data,
    updated_at: new Date().toISOString(),
  });

  if (!createResult.success) {
    return err(createResult.error);
  }

  // Log availability creation event
  await eventLogService.logEvent('availability_created', 'user_availability', createResult.value.id, { 
    newValues: createResult.value, 
  }).catch(console.error);

  return ok(createResult.value);
}

/**
 * Update current user's availability
 * 
 * @param data - Availability update data
 * @returns Result containing updated availability, or error if update fails
 */
export async function updateCurrentUserAvailability(
  data: { hours_per_week: number; week_start_date: string }
): Promise<Result<UserAvailability, AppError>> {
  const userId = getCurrentUserId();
  if (!userId) {
    return err(ValidationError.create('User must be authenticated', 'user_id', null));
  }

  return await setUserAvailability({
    user_id: userId,
    hours_per_week: data.hours_per_week,
    week_start_date: data.week_start_date
  });
}

// Re-export types
export type { UserAvailability } from '$lib/schemas/userAvailability';

