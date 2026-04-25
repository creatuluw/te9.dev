/**
 * Hours utility functions for task assignee hours management
 *
 * This module provides utilities for working with hours stored per assignee
 * in _bpm_task_assignees.uren, which are automatically summed into _bpm_tasks.uren
 * via database triggers.
 */

import * as taskAssigneeService from "$lib/services/taskAssigneeService";
import { ok, err, type Result } from "$lib/types/result";
import type { AppError } from "$lib/types/errors";

/**
 * Assign full hours to each assignee (for workload planning)
 * Each assignee gets the full task hours, not divided.
 * This means if a task is 8 hours and has 2 assignees, each gets 8 hours.
 * The task total will be the sum (8 + 8 = 16 hours total).
 *
 * @param taskHours - Task hours to assign to each assignee
 * @param assigneeCount - Number of assignees
 * @returns Hours per assignee (null if no assignees or no hours)
 */
export function assignFullHoursToEach(
  taskHours: number | null | undefined,
  assigneeCount: number,
): number | null {
  if (!taskHours || taskHours <= 0 || assigneeCount === 0) {
    return null;
  }
  // Each assignee gets the full task hours (not divided)
  return taskHours;
}

/**
 * Distribute task hours proportionally based on existing assignee hours
 *
 * @param totalHours - Total hours to distribute
 * @param existingHours - Array of existing hours per assignee
 * @returns Array of hours per assignee
 */
export function distributeHoursProportionally(
  totalHours: number | null | undefined,
  existingHours: (number | null)[],
): (number | null)[] {
  if (!totalHours || totalHours <= 0 || existingHours.length === 0) {
    return existingHours.map(() => null);
  }

  const totalExisting = existingHours.reduce<number>(
    (sum, h) => sum + (h || 0),
    0,
  );

  if (totalExisting === 0) {
    // If no existing hours, distribute equally
    const hoursPerAssignee = totalHours / existingHours.length;
    return existingHours.map(() => hoursPerAssignee);
  }

  // Distribute proportionally based on existing hours
  return existingHours.map((hours) => {
    if (hours === null || hours === 0) return null;
    return (hours / totalExisting) * totalHours;
  });
}

/**
 * Set task hours by assigning full hours to each assignee
 *
 * Each assignee gets the full task hours (not divided). This is for workload planning
 * where each person needs to allocate the full hours to their schedule.
 * The task total will be the sum of all assignee hours (hours * number_of_assignees).
 *
 * @param taskId - Task ID
 * @param taskHours - Hours to assign to each assignee
 * @returns Result containing void, or error if operation fails
 *
 * @example
 * ```typescript
 * const result = await setTaskHoursForAssignees(123, 8);
 * // If task has 2 assignees, each gets 8 hours, task total = 16 hours
 * ```
 */
export async function setTaskHoursForAssignees(
  taskId: number,
  taskHours: number | null,
): Promise<Result<void, AppError>> {
  // Get current assignees
  const assigneesResult =
    await taskAssigneeService.getTaskAssigneesWithHours(taskId);
  if (!assigneesResult.success) {
    return err(assigneesResult.error);
  }

  const assignees = assigneesResult.value;
  if (assignees.length === 0) {
    // No assignees - can't set hours, just recalculate sum (returns 0)
    await taskAssigneeService.sumTaskAssigneeHours(taskId);
    return ok(undefined);
  }

  // Assign full hours to each assignee (not divided)
  const hoursPerAssignee = assignFullHoursToEach(taskHours, assignees.length);

  // Update each assignee's hours
  const updatePromises = assignees.map((assignee) =>
    taskAssigneeService.setTaskAssigneeHours(
      taskId,
      assignee.assignee_id,
      hoursPerAssignee,
    ),
  );

  const updateResults = await Promise.all(updatePromises);
  const failedUpdate = updateResults.find((result) => !result.success);

  if (failedUpdate) {
    return err(failedUpdate.error);
  }

  return ok(undefined);
}

/**
 * Get total hours for a task (sum of all assignee hours)
 *
 * This reads from _bpm_tasks.uren which is automatically maintained
 * by database triggers. Since each assignee gets the full task hours,
 * the total will be: taskHours * number_of_assignees.
 *
 * @param taskId - Task ID
 * @param taskHours - Hours from task record (optional, for efficiency)
 * @returns Total hours (sum of all assignee hours)
 */
export async function getTaskTotalHours(
  taskId: number,
  taskHours?: number | null,
): Promise<Result<number, AppError>> {
  // If task hours provided and valid, use it (it's auto-summed by trigger)
  if (taskHours !== undefined && taskHours !== null && taskHours > 0) {
    return ok(taskHours);
  }

  // Otherwise, calculate from assignees
  return taskAssigneeService.sumTaskAssigneeHours(taskId);
}
