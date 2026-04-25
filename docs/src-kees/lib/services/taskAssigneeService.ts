/**
 * Task Assignee Service - Manage task-assignee relationships with hours
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 * 
 * Hours are stored per assignee in _bpm_task_assignees.uren and automatically
 * summed into _bpm_tasks.uren via database triggers.
 */
import { queryTableResult, insertRowResult, updateRowsResult, deleteRowsResult } from '$lib/utils/postgrest';
import type { AppError } from '$lib/types/errors';
import { ValidationError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';
import { getCurrentUserId } from '$lib/utils/userUtils';

/**
 * Task assignee with hours
 */
export interface TaskAssignee {
  id: number;
  task_id: number;
  assignee_id: string;
  uren: number | null;
  assigned_at: string;
  assigned_by: string | null;
}

/**
 * Get all assignee IDs for a task
 * 
 * @param taskId - Task ID
 * @returns Result containing array of assignee IDs, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await getTaskAssignees(123);
 * if (result.success) {
 *   console.log(result.value); // string[]
 * }
 * ```
 */
export async function getTaskAssignees(taskId: number): Promise<Result<string[], AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  const result = await queryTableResult<{ assignee_id: string }>('_bpm_task_assignees', {
    filter: { task_id: `eq.${taskId}` },
    order: 'assigned_at.asc'
  });

  if (!result.success) {
    return err(result.error);
  }

  const assigneeIds = result.value.data.map(row => row.assignee_id);
  return ok(assigneeIds);
}

/**
 * Get all assignees with their hours for a task
 * 
 * @param taskId - Task ID
 * @returns Result containing array of assignees with hours, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await getTaskAssigneesWithHours(123);
 * if (result.success) {
 *   console.log(result.value); // TaskAssignee[]
 * }
 * ```
 */
export async function getTaskAssigneesWithHours(taskId: number): Promise<Result<TaskAssignee[], AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  const result = await queryTableResult<TaskAssignee>('_bpm_task_assignees', {
    filter: { task_id: `eq.${taskId}` },
    order: 'assigned_at.asc'
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Sum hours from all assignees for a task
 * 
 * @param taskId - Task ID
 * @returns Result containing sum of hours, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await sumTaskAssigneeHours(123);
 * if (result.success) {
 *   console.log(result.value); // number (sum of all assignee hours)
 * }
 * ```
 */
export async function sumTaskAssigneeHours(taskId: number): Promise<Result<number, AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  const result = await getTaskAssigneesWithHours(taskId);
  if (!result.success) {
    return err(result.error);
  }

  const totalHours = result.value.reduce((sum, assignee) => {
    return sum + (assignee.uren || 0);
  }, 0);

  return ok(totalHours);
}

/**
 * Set assignees for a task (replaces all existing assignees)
 * 
 * @param taskId - Task ID
 * @param assigneeIds - Array of assignee IDs (can be empty to remove all assignees)
 * @returns Result containing void, or error if operation fails
 * 
 * @example
 * ```typescript
 * const result = await setTaskAssignees(123, ['user1', 'user2']);
 * if (result.success) {
 *   console.log('Assignees updated');
 * }
 * ```
 */
export async function setTaskAssignees(
  taskId: number,
  assigneeIds: string[]
): Promise<Result<void, AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  if (!Array.isArray(assigneeIds)) {
    return err(ValidationError.create('Assignee IDs must be an array', 'assigneeIds', assigneeIds));
  }

  // Filter out null/undefined/empty strings
  const validAssigneeIds = assigneeIds.filter(id => id && typeof id === 'string' && id.trim() !== '');

  // Get current user for assigned_by field
  const currentUserId = getCurrentUserId();

  // Delete all existing assignees for this task
  const deleteResult = await deleteRowsResult('_bpm_task_assignees', {
    task_id: `eq.${taskId}`
  });

  if (!deleteResult.success) {
    return err(deleteResult.error);
  }

  // If no assignees to add, we're done
  if (validAssigneeIds.length === 0) {
    return ok(undefined);
  }

  // Insert new assignees (hours will be NULL initially, can be set separately)
  const insertPromises = validAssigneeIds.map(assigneeId =>
    insertRowResult('_bpm_task_assignees', {
      task_id: taskId,
      assignee_id: assigneeId,
      uren: null, // Hours set separately via setTaskAssigneeHours
      assigned_by: currentUserId || null
    })
  );

  const insertResults = await Promise.all(insertPromises);

  // Check if any insert failed
  const failedInsert = insertResults.find(result => !result.success);
  if (failedInsert) {
    return err(failedInsert.error);
  }

  return ok(undefined);
}

/**
 * Set assignees with hours for a task (replaces all existing assignees)
 * 
 * @param taskId - Task ID
 * @param assignees - Array of assignee objects with IDs and hours
 * @returns Result containing void, or error if operation fails
 * 
 * @example
 * ```typescript
 * const result = await setTaskAssigneesWithHours(123, [
 *   { assignee_id: 'user1', uren: 4 },
 *   { assignee_id: 'user2', uren: 2 }
 * ]);
 * if (result.success) {
 *   console.log('Assignees with hours updated');
 * }
 * ```
 */
export async function setTaskAssigneesWithHours(
  taskId: number,
  assignees: Array<{ assignee_id: string; uren?: number | null }>
): Promise<Result<void, AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  if (!Array.isArray(assignees)) {
    return err(ValidationError.create('Assignees must be an array', 'assignees', assignees));
  }

  // Filter out invalid assignees
  const validAssignees = assignees.filter(
    a => a.assignee_id && typeof a.assignee_id === 'string' && a.assignee_id.trim() !== ''
  );

  // Get current user for assigned_by field
  const currentUserId = getCurrentUserId();

  // Delete all existing assignees for this task
  const deleteResult = await deleteRowsResult('_bpm_task_assignees', {
    task_id: `eq.${taskId}`
  });

  if (!deleteResult.success) {
    return err(deleteResult.error);
  }

  // If no assignees to add, we're done
  if (validAssignees.length === 0) {
    return ok(undefined);
  }

  // Insert new assignees with hours
  const insertPromises = validAssignees.map(assignee =>
    insertRowResult('_bpm_task_assignees', {
      task_id: taskId,
      assignee_id: assignee.assignee_id,
      uren: assignee.uren !== undefined ? assignee.uren : null,
      assigned_by: currentUserId || null
    })
  );

  const insertResults = await Promise.all(insertPromises);

  // Check if any insert failed
  const failedInsert = insertResults.find(result => !result.success);
  if (failedInsert) {
    return err(failedInsert.error);
  }

  return ok(undefined);
}

/**
 * Update hours for a specific assignee on a task
 * 
 * @param taskId - Task ID
 * @param assigneeId - Assignee ID
 * @param uren - Hours to set (null to clear)
 * @returns Result containing void, or error if operation fails
 * 
 * @example
 * ```typescript
 * const result = await setTaskAssigneeHours(123, 'user1', 4);
 * if (result.success) {
 *   console.log('Assignee hours updated');
 * }
 * ```
 */
export async function setTaskAssigneeHours(
  taskId: number,
  assigneeId: string,
  uren: number | null
): Promise<Result<void, AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  if (!assigneeId || typeof assigneeId !== 'string' || assigneeId.trim() === '') {
    return err(ValidationError.create('Valid assignee ID is required', 'assigneeId', assigneeId));
  }

  if (uren !== null && (typeof uren !== 'number' || uren < 0 || isNaN(uren))) {
    return err(ValidationError.create('Hours must be a non-negative number or null', 'uren', uren));
  }

  const result = await updateRowsResult('_bpm_task_assignees', {
    task_id: `eq.${taskId}`,
    assignee_id: `eq.${assigneeId}`
  }, {
    uren: uren
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(undefined);
}

/**
 * Add an assignee to a task
 * 
 * @param taskId - Task ID
 * @param assigneeId - Assignee ID to add
 * @param uren - Optional hours for this assignee
 * @returns Result containing void, or error if operation fails
 * 
 * @example
 * ```typescript
 * const result = await addTaskAssignee(123, 'user1', 4);
 * if (result.success) {
 *   console.log('Assignee added');
 * }
 * ```
 */
export async function addTaskAssignee(
  taskId: number,
  assigneeId: string,
  uren?: number | null
): Promise<Result<void, AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  if (!assigneeId || typeof assigneeId !== 'string' || assigneeId.trim() === '') {
    return err(ValidationError.create('Valid assignee ID is required', 'assigneeId', assigneeId));
  }

  if (uren !== undefined && uren !== null && (typeof uren !== 'number' || uren < 0 || isNaN(uren))) {
    return err(ValidationError.create('Hours must be a non-negative number or null', 'uren', uren));
  }

  const currentUserId = getCurrentUserId();

  const result = await insertRowResult('_bpm_task_assignees', {
    task_id: taskId,
    assignee_id: assigneeId,
    uren: uren !== undefined ? uren : null,
    assigned_by: currentUserId || null
  });

  if (!result.success) {
    // If it's a unique constraint violation, the assignee is already assigned - that's OK
    if (result.error.message?.includes('unique') || result.error.message?.includes('duplicate')) {
      return ok(undefined);
    }
    return err(result.error);
  }

  return ok(undefined);
}

/**
 * Remove an assignee from a task
 * 
 * @param taskId - Task ID
 * @param assigneeId - Assignee ID to remove
 * @returns Result containing void, or error if operation fails
 * 
 * @example
 * ```typescript
 * const result = await removeTaskAssignee(123, 'user1');
 * if (result.success) {
 *   console.log('Assignee removed');
 * }
 * ```
 */
export async function removeTaskAssignee(
  taskId: number,
  assigneeId: string
): Promise<Result<void, AppError>> {
  if (!taskId || taskId <= 0) {
    return err(ValidationError.create('Valid task ID is required', 'taskId', taskId));
  }

  if (!assigneeId || typeof assigneeId !== 'string' || assigneeId.trim() === '') {
    return err(ValidationError.create('Valid assignee ID is required', 'assigneeId', assigneeId));
  }

  const result = await deleteRowsResult('_bpm_task_assignees', {
    task_id: `eq.${taskId}`,
    assignee_id: `eq.${assigneeId}`
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(undefined);
}

/**
 * Get all task IDs assigned to a specific user
 * 
 * @param assigneeId - Assignee ID
 * @returns Result containing array of task IDs, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await getTasksByAssignee('user1');
 * if (result.success) {
 *   console.log(result.value); // number[]
 * }
 * ```
 */
export async function getTasksByAssignee(assigneeId: string): Promise<Result<number[], AppError>> {
  if (!assigneeId || typeof assigneeId !== 'string' || assigneeId.trim() === '') {
    return err(ValidationError.create('Valid assignee ID is required', 'assigneeId', assigneeId));
  }

  const result = await queryTableResult<{ task_id: number }>('_bpm_task_assignees', {
    filter: { assignee_id: `eq.${assigneeId}` }
  });

  if (!result.success) {
    return err(result.error);
  }

  const taskIds = result.value.data.map(row => row.task_id);
  return ok(taskIds);
}

