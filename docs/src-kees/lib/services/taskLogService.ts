/**
 * Task log service - Task completion logs
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { queryTableResult, getRowByIdResult } from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import { ValidationError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import type { TaskLog } from "$lib/schemas/message";
import { z } from "zod";

// Note: TaskLog schema is defined in notification.ts since task logs are related to notifications

/**
 * Task log filters schema
 */
const TaskLogFiltersSchema = z.object({
  case_id: z.number().int().positive().optional(),
  task_id: z.number().int().positive().optional(),
  owner_id: z.string().min(1).optional(),
});

type TaskLogFilters = z.infer<typeof TaskLogFiltersSchema>;

/**
 * Get task logs with filters
 *
 * @param filters - Optional filters for case_id, task_id, or owner_id
 * @returns Result containing array of task logs, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getTaskLogs({ case_id: 123 });
 * if (result.success) {
 *   console.log(result.value); // TaskLog[]
 * }
 * ```
 */
export async function getTaskLogs(
  filters?: TaskLogFilters,
): Promise<Result<TaskLog[], AppError>> {
  // Validate filters if provided
  if (filters) {
    const validation = TaskLogFiltersSchema.safeParse(filters);
    if (!validation.success) {
      return err(
        ValidationError.create("Invalid filter parameters", "filters", filters),
      );
    }
  }

  const filter: Record<string, string> = {};
  if (filters?.case_id) filter.case_id = `eq.${filters.case_id}`;
  if (filters?.task_id) filter.task_id = `eq.${filters.task_id}`;
  if (filters?.owner_id) filter.owner_id = `eq.${filters.owner_id}`;

  const result = await queryTableResult<TaskLog>("_bpm_task_logs", {
    filter,
    order: "completed_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get task log by ID
 *
 * @param id - Task log ID
 * @returns Result containing task log, or error if not found
 *
 * @example
 * ```typescript
 * const result = await getTaskLogById(456);
 * if (result.success) {
 *   console.log(result.value); // TaskLog
 * }
 * ```
 */
export async function getTaskLogById(
  id: number,
): Promise<Result<TaskLog, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid task log ID", "id", id));
  }

  return await getRowByIdResult<TaskLog>("_bpm_task_logs", id);
}

// Re-export types for backward compatibility
export type { TaskLog } from "$lib/schemas/message";
