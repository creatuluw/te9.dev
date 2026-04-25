/**
 * Case service - Case management and creation from process templates
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  getRowByIdResult,
  deleteRowsResult,
} from "$lib/utils/postgrest";
import { calculateDeadline } from "./deadlineService";
import { getCurrentUserId } from "$lib/utils/userUtils";
import { requestCache } from "$lib/utils/requestCache";
import type { Process } from "./processService";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AppError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import { z } from "zod";
import * as pocketbaseService from "$lib/services/pocketbaseService";
import * as eventLogService from "./eventLogService";
import {
  CreateCaseInputSchema,
  UpdateCaseInputSchema,
  UpdateCaseStepInputSchema,
  UpdateCaseTaskInputSchema,
  type Case,
  type CaseStep,
  type CaseTask,
  type CreateCaseInput,
  type UpdateCaseInput,
  type UpdateCaseStepInput,
  type UpdateCaseTaskInput,
} from "$lib/schemas/case";
import type { ProcessTask } from "$lib/schemas/process";
import type { CaseId, ProcessId, UserId } from "$lib/types/utilities";
import { toCaseId, isValidCaseId } from "$lib/types/utilities";
import * as taskAssigneeService from "./taskAssigneeService";
import { setTaskHoursForAssignees } from "$lib/utils/hoursUtils";
import type { Task } from "$lib/schemas/task";

/**
 * Helper function to enrich case tasks with assignee_id arrays and sum of assignee hours
 */
async function enrichCaseTasksWithAssignees<T extends { id: number }>(
  tasks: T[],
): Promise<(T & { assignee_id: string[]; uren?: number | null })[]> {
  if (tasks.length === 0) {
    return [];
  }

  const taskIds = tasks.map((t) => t.id);
  const assigneeMap = new Map<number, string[]>();
  const hoursSumMap = new Map<number, number>();

  // Fetch all assignees for all tasks in one query
  const assigneesResult = await queryTableResult<{
    task_id: number;
    assignee_id: string;
    uren: number | null;
  }>("_bpm_task_assignees", {
    filter: { task_id: `in.(${taskIds.join(",")})` },
  });

  if (assigneesResult.success) {
    for (const row of assigneesResult.value.data) {
      // Build assignee_id array
      if (!assigneeMap.has(row.task_id)) {
        assigneeMap.set(row.task_id, []);
      }
      assigneeMap.get(row.task_id)!.push(row.assignee_id);

      // Sum hours from assignees
      if (row.uren !== null && row.uren !== undefined) {
        const currentSum = hoursSumMap.get(row.task_id) || 0;
        hoursSumMap.set(row.task_id, currentSum + row.uren);
      }
    }
  }

  // Enrich each task with assignee_id array and sum of assignee hours for display
  return tasks.map((task) => {
    const assigneeId = assigneeMap.get(task.id) || [];
    const urenSum = hoursSumMap.get(task.id) || (task as any).uren || null;
    return {
      ...task,
      assignee_id: assigneeId,
      uren: urenSum,
    };
  });
}

/**
 * Create a new case from a process template
 *
 * @param process - Process template with steps
 * @param data - Case creation data (name, start_date, optional owner_id, optional source URL)
 * @returns Result containing created case, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await createCaseFromProcess(process, {
 *   name: 'New Case',
 *   start_date: '2025-01-26',
 *   source: 'http://localhost:5173/processes?drawer=case&processId=1'
 * });
 * if (result.success) {
 *   console.log(result.value); // Case
 * }
 * ```
 */
export async function createCaseFromProcess(
  process: Process & { steps: any[] },
  data: CreateCaseInput & { process_id: number; source?: string },
): Promise<Result<Case, AppError>> {
  // Validate input - allow source field but don't save it to case table
  const validation = validateSchema(
    CreateCaseInputSchema.extend({
      process_id: z.number().int().positive(),
      source: z.string().optional(),
    }),
    data,
  );

  if (!validation.success) {
    return err(validation.error);
  }

  // Validate process exists and has valid ID
  if (!process.id || process.id !== data.process_id) {
    return err(
      ValidationError.create(
        "Process ID mismatch",
        "process_id",
        data.process_id,
      ),
    );
  }

  // Calculate case completion deadline
  const startDate = new Date(data.start_date);
  if (isNaN(startDate.getTime())) {
    return err(
      ValidationError.create(
        "Invalid start date",
        "start_date",
        data.start_date,
      ),
    );
  }

  const completionDeadline = calculateDeadline(
    startDate,
    process.completion_days,
  );

  // Use provided owner_id or default to current user
  const ownerId = data.owner_id || getCurrentUserId() || undefined;

  // Set created_by to current user (the person creating the case)
  const createdBy = getCurrentUserId() || null;

  // Prepare case data, excluding source field (source is only for tasks)
  const { source, ...caseDataWithoutSource } = data;
  const createData = {
    ...caseDataWithoutSource,
    completion_deadline: completionDeadline.toISOString().split("T")[0],
    owner_id: ownerId,
    created_by: createdBy,
    project_id: data.project_id || null,
  };

  // Create case
  const caseResult = await insertRowResult<Case>("_bpm_cases", createData);

  if (!caseResult.success) {
    console.error("Error creating case:", caseResult.error);
    return err(caseResult.error);
  }

  const newCase = caseResult.value;

  // Create case steps and tasks
  for (const step of process.steps) {
    const stepStartDate = calculateDeadline(startDate, step.start_days_offset);
    const stepDeadline = calculateDeadline(stepStartDate, step.completion_days);

    const stepResult = await insertRowResult<CaseStep>("_bpm_case_steps", {
      case_id: newCase.id,
      step_id: step.id,
      status: "pending",
      start_date: stepStartDate.toISOString().split("T")[0],
      completion_deadline: stepDeadline.toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    });

    if (!stepResult.success) {
      // If step creation fails, return error (case was created but incomplete)
      return err(stepResult.error);
    }

    const caseStep = stepResult.value;

    // Create tasks for this step
    for (const task of step.tasks || []) {
      // Calculate task start date: step start + task's start_offset
      const taskStartDate = calculateDeadline(
        stepStartDate,
        task.start_offset_days || 0,
      );
      // Calculate task deadline: step start + task's deadline_days
      const taskDeadline = calculateDeadline(taskStartDate, task.deadline_days);

      // Get case owner's email for komt_van field
      let komtVan = null;
      if (ownerId) {
        const userResult = await pocketbaseService.getUserById(ownerId);
        if (userResult.success) {
          komtVan = userResult.value.email || null;
        }
      }

      const taskResult = await insertRowResult<any>("_bpm_tasks", {
        task_type: "process",
        case_step_id: caseStep.id,
        task_id: task.id,
        subject: task.name, // Sync subject with process task name
        uren: task.uren ?? null, // Store user-entered value (hours per assignee)
        status: "backlog",
        kanban_status: "backlog", // When status is backlog, kanban_status should also be backlog
        deadline: taskDeadline.toISOString(),
        source: data.source || "process_automation",
        project_id: createData.project_id || null, // Cascade project_id from case to tasks
        komt_van: komtVan, // Set komt_van to case owner's email
        updated_at: new Date().toISOString(),
      });

      if (!taskResult.success) {
        // If task creation fails, continue with other tasks but log error
        console.error(
          `Failed to create task ${task.id} for step ${caseStep.id}:`,
          taskResult.error,
        );
      }
    }
  }

  // Log case creation event
  await eventLogService
    .logCaseCreated(newCase.id, newCase, "case_creation")
    .catch(console.error);

  // Invalidate cache
  requestCache.invalidateEntity("case");
  requestCache.invalidate("processes"); // Cases are shown in process views
  requestCache.invalidate("workitems"); // Case tasks are work items

  return ok(newCase);
}
export async function updateCase(
  id: number,
  data: UpdateCaseInput,
): Promise<Result<Case[], AppError>> {
  // Validate ID
  if (!isValidCaseId(id)) {
    return err(ValidationError.create("Invalid case ID", "id", id));
  }

  // Validate input data
  const validation = validateSchema(UpdateCaseInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const caseId = toCaseId(id);

  // Get current case data for logging
  const currentCaseResult = await getRowByIdResult<Case>("_bpm_cases", caseId);
  if (!currentCaseResult.success) {
    return err(currentCaseResult.error);
  }
  const currentCase = currentCaseResult.value;

  // Check if owner_id is being updated and actually changed
  const ownerIdChanged =
    "owner_id" in data && currentCase.owner_id !== data.owner_id;
  const newOwnerId = ownerIdChanged ? data.owner_id : undefined;

  // Prepare update data - ensure bijlagen is properly formatted
  const updateData: Partial<Case> = {
    ...data,
    owner_id: data.owner_id ?? undefined,
    updated_at: new Date().toISOString(),
  };

  // Ensure bijlagen is an array of strings if provided
  if ("bijlagen" in data && data.bijlagen !== undefined) {
    updateData.bijlagen = Array.isArray(data.bijlagen)
      ? data.bijlagen.filter(
          (url): url is string => typeof url === "string" && url.trim() !== "",
        )
      : [];
  }

  // Update the case
  const updateResult = await updateRowsResult<Case>(
    "_bpm_cases",
    { id: `eq.${caseId}` },
    updateData,
  );

  // Log detailed error if update fails
  if (!updateResult.success) {
    console.error("[updateCase] Update failed:", {
      caseId,
      updateData,
      error: updateResult.error,
      errorDetails: (updateResult.error as any)?.details,
    });
    return err(updateResult.error);
  }

  // If owner_id changed, update komt_van for all related tasks
  if (ownerIdChanged) {
    console.log(
      "[updateCase] Owner ID changed, updating komt_van for all tasks. New owner ID:",
      newOwnerId,
      "Case ID:",
      caseId,
    );
    try {
      let email: string | null = null;

      if (newOwnerId) {
        const userResult = await pocketbaseService.getUserById(newOwnerId);
        if (userResult.success) {
          email = userResult.value.email || null;
          console.log("[updateCase] Fetched user email:", email);
        } else {
          // Log error but don't fail case update
          console.error(
            "[updateCase] Failed to fetch user for komt_van update:",
            userResult.error,
          );
        }
      }
      // If newOwnerId is null/undefined, email stays null

      console.log("[updateCase] Calling updateTasksKomtVan with email:", email);
      const tasksUpdateResult = await updateTasksKomtVan(caseId, email);
      if (!tasksUpdateResult.success) {
        // Log error but don't fail case update
        console.error(
          "[updateCase] Failed to update komt_van for tasks:",
          tasksUpdateResult.error,
        );
      } else {
        console.log("[updateCase] Successfully updated komt_van for all tasks");
      }
    } catch (error) {
      // Log error but don't fail case update
      console.error("[updateCase] Error updating komt_van for tasks:", error);
    }
  }

  // Check if project_id is being updated and actually changed
  const projectIdChanged =
    "project_id" in data && currentCase.project_id !== data.project_id;
  const newProjectId = projectIdChanged ? data.project_id : undefined;

  // If project_id changed, update project_id for all related tasks
  if (projectIdChanged) {
    console.log(
      "[updateCase] Project ID changed, updating project_id for all tasks. New project ID:",
      newProjectId,
      "Case ID:",
      caseId,
    );
    try {
      console.log(
        "[updateCase] Calling updateTasksProjectId with project_id:",
        newProjectId,
      );
      const tasksProjectUpdateResult = await updateTasksProjectId(
        caseId,
        newProjectId || null,
      );
      if (!tasksProjectUpdateResult.success) {
        // Log error but don't fail case update
        console.error(
          "[updateCase] Failed to update project_id for tasks:",
          tasksProjectUpdateResult.error,
        );
      } else {
        console.log(
          "[updateCase] Successfully updated project_id for all tasks",
        );
      }
    } catch (error) {
      // Log error but don't fail case update
      console.error("[updateCase] Error updating project_id for tasks:", error);
    }
  }

  // Log case update event
  await eventLogService
    .logCaseUpdated(
      caseId,
      currentCase,
      { ...currentCase, ...data },
      "case_update",
    )
    .catch(console.error);

  // Log specific field changes for easier querying
  // Log owner/user assignment change
  if (ownerIdChanged && newOwnerId != null) {
    await eventLogService
      .logUserAssignmentChanged(
        "case",
        caseId,
        currentCase.owner_id ?? null,
        newOwnerId,
      )
      .catch(console.error);
  }

  // Log project assignment change if project_id changed
  if (data.project_id != null && data.project_id !== currentCase.project_id) {
    await eventLogService
      .logProjectAssignmentChanged(
        "case",
        caseId,
        currentCase.project_id ?? null,
        data.project_id,
      )
      .catch(console.error);
  }

  // Invalidate cache
  if (updateResult.success) {
    requestCache.invalidateEntity("case", id);
    requestCache.invalidate("workitems"); // Case tasks are work items
  }

  return updateResult;
}

/**
 * Delete a case (hard delete - use with caution)
 * This will also delete related case steps and case tasks due to cascading deletes
 *
 * @param id - Case ID to delete
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await deleteCase(123);
 * if (result.success) {
 *   console.log('Case deleted');
 * }
 * ```
 */
export async function deleteCase(id: number): Promise<Result<void, AppError>> {
  // Validate ID
  if (!isValidCaseId(id)) {
    return err(ValidationError.create("Invalid case ID", "id", id));
  }

  const caseId = toCaseId(id);

  // Get case data before deletion for logging
  const caseResult = await getRowByIdResult<Case>("_bpm_cases", caseId);
  const caseData = caseResult.success ? caseResult.value : null;

  // Delete case steps first (which will cascade to case tasks if configured)
  // Then delete the case itself
  // Note: If foreign keys are configured with ON DELETE CASCADE, we only need to delete the case
  // Otherwise, we need to delete in order: tasks -> steps -> case
  // For now, we'll delete the case and let the database handle cascading if configured

  // First, try to delete related case tasks and steps
  // Get all steps for this case
  const stepsResult = await queryTableResult<CaseStep>("_bpm_case_steps", {
    filter: { case_id: `eq.${caseId}` },
  });

  if (stepsResult.success) {
    // Delete all tasks for each step
    for (const step of stepsResult.value.data) {
      await deleteRowsResult("_bpm_tasks", {
        case_step_id: `eq.${step.id}`,
        task_type: `eq.process`,
      });
    }
    // Delete all steps
    await deleteRowsResult("_bpm_case_steps", { case_id: `eq.${caseId}` });
  }

  // Finally, delete the case
  const deleteResult = await deleteRowsResult("_bpm_cases", {
    id: `eq.${caseId}`,
  });

  // Log case deletion event if successful
  if (deleteResult.success && caseData) {
    await eventLogService
      .logEvent("case_deleted", "case", caseId, {
        oldValues: caseData,
      })
      .catch(console.error);

    // Invalidate cache - invalidate all variants of cases list
    requestCache.invalidateEntity("case", id);
    requestCache.invalidate("cases"); // Invalidate cases:all, cases:all:all:all, etc.
    requestCache.invalidate("workitems"); // Case tasks are work items
  }

  return deleteResult;
}

/**
 * Update a case step
 *
 * @param id - Case step ID to update
 * @param data - Partial step data to update (status or owner_id)
 * @returns Result containing updated step array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateCaseStep(456, { status: 'afgerond' });
 * if (result.success) {
 *   console.log(result.value); // CaseStep[]
 * }
 * ```
 */
export async function updateCaseStep(
  id: number,
  data: UpdateCaseStepInput,
): Promise<Result<CaseStep[], AppError>> {
  // Validate input
  const validation = validateSchema(UpdateCaseStepInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Get the step to find the case_id for cache invalidation
  const stepResult = await getRowByIdResult<CaseStep>("_bpm_case_steps", id);
  if (!stepResult.success) {
    return err(stepResult.error);
  }

  const updateResult = await updateRowsResult<CaseStep>(
    "_bpm_case_steps",
    { id: `eq.${id}` },
    {
      ...data,
      owner_id: data.owner_id ?? undefined,
      updated_at: new Date().toISOString(),
    },
  );

  // Invalidate cache for the case
  if (updateResult.success) {
    requestCache.invalidateEntity("case", stepResult.value.case_id);
    requestCache.invalidate("workitems"); // Case steps affect work items
  }

  return updateResult;
}

/**
 * Check and update overdue status for all cases
 * This function should be called periodically (e.g., daily cron job) to mark cases as overdue
 *
 * @returns Promise that resolves when check is complete (non-blocking)
 */
export async function checkAllCasesForOverdue(): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    // Get all cases that are not completed and have a deadline that has passed
    const overdueCasesResult = await queryTableResult<Case>("_bpm_cases", {
      filter: {
        status: "not.in.(afgerond,overdue)",
        completion_deadline: `lt.${today}`,
      },
    });

    if (!overdueCasesResult.success) {
      console.error(
        "Failed to check cases for overdue status:",
        overdueCasesResult.error,
      );
      return;
    }

    const overdueCases = overdueCasesResult.value.data;

    // Update each overdue case
    for (const caseItem of overdueCases) {
      const updateResult = await updateRowsResult<Case>(
        "_bpm_cases",
        { id: `eq.${caseItem.id}` },
        {
          status: "overdue",
          updated_at: new Date().toISOString(),
        },
      );

      if (!updateResult.success) {
        console.error(
          `Failed to mark case ${caseItem.id} as overdue:`,
          updateResult.error,
        );
      }
    }

    if (overdueCases.length > 0) {
      console.log(`Updated ${overdueCases.length} case(s) to overdue status`);
    }
  } catch (error) {
    console.error("Error checking cases for overdue status:", error);
  }
}

/**
 * Update case status based on task statuses and deadline
 * This function automatically updates case status to:
 * - 'mee_bezig' when first task becomes active (if case is 'gepland' and deadline hasn't passed)
 * - 'overdue' when deadline has passed (if case is not 'afgerond')
 *
 * @param caseId - Case ID to update
 * @returns Result with success/error status (non-blocking, errors are logged but don't fail)
 */
export async function updateCaseStatusFromTasks(caseId: number): Promise<void> {
  try {
    // Get the case
    const caseResult = await getRowByIdResult<Case>("_bpm_cases", caseId);
    if (!caseResult.success) {
      console.error(
        `Failed to get case ${caseId} for status update:`,
        caseResult.error,
      );
      return;
    }

    const caseData = caseResult.value;

    // Don't update if case is already completed
    if (caseData.status === "afgerond") {
      return;
    }

    // Get all steps for this case
    const stepsResult = await queryTableResult<CaseStep>("_bpm_case_steps", {
      filter: { case_id: `eq.${caseId}` },
    });

    if (!stepsResult.success) {
      console.error(
        `Failed to get steps for case ${caseId}:`,
        stepsResult.error,
      );
      return;
    }

    const allStepIds = stepsResult.value.data.map((s) => s.id);

    // Get all tasks for all steps in this case
    const tasksResult = await queryTableResult<CaseTask>("_bpm_tasks", {
      filter: {
        case_step_id: `in.(${allStepIds.join(",")})`,
        task_type: "eq.process",
      },
    });

    if (!tasksResult.success) {
      console.error(
        `Failed to get tasks for case ${caseId}:`,
        tasksResult.error,
      );
      return;
    }

    const allTasks = tasksResult.value.data;
    const updates: Partial<Case> = {};

    // Check deadline first: if deadline has passed and case is not completed, set to 'overdue'
    // Deadline check takes priority over active status
    if (caseData.completion_deadline) {
      const deadlineDate = new Date(caseData.completion_deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        updates.status = "overdue";
      } else {
        // Only check for active status if deadline hasn't passed
        // A task is active if kanban_status is 'mee_bezig' or 'in_review'
        const hasActiveTask = allTasks.some(
          (t) =>
            t.kanban_status === "mee_bezig" || t.kanban_status === "in_review",
        );
        if (hasActiveTask && caseData.status === "gepland") {
          updates.status = "mee_bezig";
          updates.status = "mee_bezig";
        }
      }
    } else {
      // No deadline set, check for active status
      // A task is active if kanban_status is 'mee_bezig' or 'in_review'
      const hasActiveTask = allTasks.some(
        (t) =>
          t.kanban_status === "mee_bezig" || t.kanban_status === "in_review",
      );
      if (hasActiveTask && caseData.status === "gepland") {
        updates.status = "mee_bezig";
      }
    }

    // Update case if there are changes
    if (Object.keys(updates).length > 0) {
      const updateResult = await updateRowsResult<Case>(
        "_bpm_cases",
        { id: `eq.${caseId}` },
        {
          ...updates,
          updated_at: new Date().toISOString(),
        },
      );

      if (!updateResult.success) {
        console.error(
          `Failed to update case ${caseId} status:`,
          updateResult.error,
        );
      } else {
        // Log case status change event
        await eventLogService
          .logEvent("case_status_changed", "case", caseId, {
            oldValues: { status: caseData.status },
            newValues: updates,
          })
          .catch(console.error);
      }
    }
  } catch (error) {
    console.error(`Error updating case ${caseId} status from tasks:`, error);
  }
}

/**
 * Update a case task
 *
 * @param id - Case task ID to update
 * @param data - Partial task data to update (status or owner_id)
 * @returns Result containing updated task array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateCaseTask(789, { kanban_status: 'mee_bezig' });
 * if (result.success) {
 *   console.log(result.value); // CaseTask[]
 * }
 * ```
 */
export async function updateCaseTask(
  id: number,
  data: UpdateCaseTaskInput,
): Promise<Result<CaseTask[], AppError>> {
  // Validate input
  const validation = validateSchema(UpdateCaseTaskInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Get current task data for dependency analysis
  const currentTaskResult = await getRowByIdResult<CaseTask>("_bpm_tasks", id);
  if (!currentTaskResult.success) {
    return err(currentTaskResult.error);
  }
  const currentTask = currentTaskResult.value;

  // Handle owner_id separately (it's now in junction table)
  // Convert owner_id to array format for junction table
  // If assignee_id is provided as array, use it; otherwise convert owner_id
  const { owner_id, assignee_id, uren, ...restData } = data as any;
  const assigneeIds =
    assignee_id !== undefined
      ? Array.isArray(assignee_id)
        ? assignee_id
        : assignee_id
          ? [assignee_id]
          : []
      : owner_id !== undefined
        ? owner_id
          ? [owner_id]
          : []
        : undefined;

  const updateData: Partial<CaseTask> = {
    ...restData,
    // Don't include assignee_id in updateData - it's now in junction table
    // Include uren - this is the user-entered value (hours per assignee)
    updated_at: new Date().toISOString(),
  };

  // Include uren in updateData if provided
  if (uren !== undefined) {
    updateData.uren = uren;
  }

  // If status is being set to backlog, ensure kanban_status is also set to backlog
  if (data.status === "backlog" && data.kanban_status === undefined) {
    updateData.kanban_status = "backlog";
  }

  // Auto-set timestamps based on kanban_status
  // If kanban_status is provided and indicates work has started
  if (
    data.kanban_status === "mee_bezig" ||
    data.kanban_status === "in_review"
  ) {
    updateData.started_at = new Date().toISOString();
  }

  if (data.kanban_status === "afgerond") {
    updateData.completed_at = new Date().toISOString();
  }

  // Get current assignees for comparison
  let currentAssignees: string[] = [];
  const currentAssigneesResult = await taskAssigneeService.getTaskAssignees(id);
  if (currentAssigneesResult.success) {
    currentAssignees = currentAssigneesResult.value;
  }

  // Perform the update
  const updateResult = await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    updateData,
  );
  if (!updateResult.success) {
    return err(updateResult.error);
  }

  // Update assignees in junction table if owner_id was provided
  // Note: assigneeIds will be [] (empty array) if owner_id is null, or [userId] if owner_id has a value
  // We need to update assignees even if owner_id is null (to clear assignees)
  if (owner_id !== undefined) {
    console.log(
      "[updateCaseTask] Updating assignees for task",
      id,
      "with owner_id:",
      owner_id,
      "assigneeIds:",
      assigneeIds,
    );
    const setAssigneesResult = await taskAssigneeService.setTaskAssignees(
      id,
      assigneeIds || [],
    );
    if (!setAssigneesResult.success) {
      // Return error if assignee update fails - this is critical
      console.error(
        "[updateCaseTask] Failed to update assignees:",
        setAssigneesResult.error,
      );
      return err(setAssigneesResult.error);
    }
    console.log("[updateCaseTask] Successfully updated assignees for task", id);
  }

  // Handle hours update - assign full hours to each assignee (same as task.uren)
  if (updateResult.success && uren !== undefined) {
    const hoursResult = await setTaskHoursForAssignees(id, uren);
    if (!hoursResult.success) {
      console.error(
        "[updateCaseTask] Failed to update hours for assignees:",
        hoursResult.error,
      );
      // Don't fail the update if hours setting fails, but log it
    }
  }

  // Invalidate cache for this case if it has a case_step_id
  if (currentTask.case_step_id) {
    const stepResult = await getRowByIdResult<CaseStep>(
      "_bpm_case_steps",
      currentTask.case_step_id,
    );
    if (stepResult.success) {
      console.log(
        "[updateCaseTask] Invalidating cache for case",
        stepResult.value.case_id,
      );
      requestCache.invalidateEntity("case", stepResult.value.case_id);
    }
  }
  requestCache.invalidate("workitems"); // Tasks are work items

  // Enrich with assignee arrays
  const enrichedTasks = await enrichCaseTasksWithAssignees(updateResult.value);

  // Map assignee_id back to owner_id in response for backward compatibility
  const mappedTasks = enrichedTasks.map((task: any) => ({
    ...task,
    owner_id:
      task.assignee_id && task.assignee_id.length > 0
        ? task.assignee_id[0]
        : null,
  }));

  // Check for deadline changes and process dependencies asynchronously
  if (data.deadline != null && data.deadline !== currentTask.deadline) {
    // Process dependencies asynchronously to avoid blocking the main update
    processDeadlineChangeDependencies(
      id,
      currentTask.deadline ?? null,
      data.deadline,
    ).catch(console.error);
  }

  // Log task update event
  if (data.status && data.status !== currentTask.status) {
    await eventLogService
      .logEvent("task_status_changed", "task", id, {
        oldValues: { status: currentTask.status },
        newValues: { status: data.status },
      })
      .catch(console.error);
  }

  // Log task assignment change if owner_id changed
  if (assigneeIds !== undefined) {
    const assigneesChanged =
      JSON.stringify(currentAssignees.sort()) !==
      JSON.stringify((assigneeIds || []).sort());
    if (assigneesChanged) {
      const oldOwnerId = currentAssignees[0] ?? null;
      const newOwnerId = assigneeIds[0] ?? null;
      if (newOwnerId) {
        await eventLogService
          .logTaskAssigned(id, oldOwnerId, newOwnerId)
          .catch(console.error);
      } else {
        // Log unassignment
        await eventLogService
          .logEvent("task_unassigned", "task", id, {
            oldValues: { assignee_id: oldOwnerId },
            newValues: { assignee_id: null },
          })
          .catch(console.error);
      }
    }
  }

  // Log deadline change if deadline changed
  if (data.deadline != null && data.deadline !== currentTask.deadline) {
    await eventLogService
      .logDeadlineChanged(
        "task",
        id,
        currentTask.deadline ?? null,
        data.deadline,
      )
      .catch(console.error);
  }

  // Log komt_van change if komt_van changed
  if (data.komt_van != null && data.komt_van !== currentTask.komt_van) {
    await eventLogService
      .logKomtVanChanged(
        "task",
        id,
        currentTask.komt_van ?? null,
        data.komt_van,
      )
      .catch(console.error);
  }

  // Update case status based on task changes (non-blocking)
  if (currentTask.case_step_id) {
    const stepResult = await getRowByIdResult<CaseStep>(
      "_bpm_case_steps",
      currentTask.case_step_id,
    );
    if (stepResult.success) {
      updateCaseStatusFromTasks(stepResult.value.case_id).catch(console.error);
    }
  }

  return ok(mappedTasks);
}

/**
 * Get all tasks for a case
 *
 * @param caseId - Case ID
 * @returns Result containing array of all tasks for the case, or error if query fails
 */
async function getAllTasksForCase(
  caseId: number,
): Promise<Result<CaseTask[], AppError>> {
  // Validate ID
  if (!isValidCaseId(caseId)) {
    return err(ValidationError.create("Invalid case ID", "caseId", caseId));
  }

  const validCaseId = toCaseId(caseId);

  // Get all steps for this case
  const stepsResult = await queryTableResult<CaseStep>("_bpm_case_steps", {
    filter: { case_id: `eq.${validCaseId}` },
  });

  if (!stepsResult.success) {
    return err(stepsResult.error);
  }

  const steps = stepsResult.value.data;
  if (steps.length === 0) {
    return ok([]);
  }

  // Get all task IDs from all steps
  const stepIds = steps.map((step) => step.id);

  // Query all tasks for these steps
  const tasksResult = await queryTableResult<CaseTask>("_bpm_tasks", {
    filter: {
      case_step_id: `in.(${stepIds.join(",")})`,
      task_type: `eq.process`,
    },
  });

  if (!tasksResult.success) {
    return err(tasksResult.error);
  }

  // queryTableResult returns { data: T[], status, headers }, so extract the data array
  return ok(tasksResult.value.data);
}

/**
 * Update komt_van field for all tasks in a case
 *
 * @param caseId - Case ID
 * @param email - Email address to set (or null to clear)
 * @returns Result with success/error status
 */
async function updateTasksKomtVan(
  caseId: number,
  email: string | null,
): Promise<Result<void, AppError>> {
  console.log(
    "[updateTasksKomtVan] Starting update for case:",
    caseId,
    "with email:",
    email,
  );

  // Get all tasks for this case
  const tasksResult = await getAllTasksForCase(caseId);
  if (!tasksResult.success) {
    console.error(
      "[updateTasksKomtVan] Failed to get tasks:",
      tasksResult.error,
    );
    return err(tasksResult.error);
  }

  const tasks = tasksResult.value;
  console.log("[updateTasksKomtVan] Found", tasks.length, "tasks to update");

  if (tasks.length === 0) {
    // No tasks to update, return success
    console.log("[updateTasksKomtVan] No tasks to update, returning success");
    return ok(undefined);
  }

  // Update all tasks' komt_van field
  const taskIds = tasks.map((task) => task.id);
  console.log("[updateTasksKomtVan] Updating task IDs:", taskIds);

  const updateResult = await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `in.(${taskIds.join(",")})` },
    {
      komt_van: email,
      updated_at: new Date().toISOString(),
    },
  );

  if (!updateResult.success) {
    console.error("[updateTasksKomtVan] Update failed:", updateResult.error);
    return err(updateResult.error);
  }

  console.log(
    "[updateTasksKomtVan] Successfully updated komt_van for",
    updateResult.value.length,
    "tasks",
  );
  return ok(undefined);
}

/**
 * Update project_id field for all tasks in a case
 *
 * @param caseId - Case ID
 * @param projectId - Project ID to set (or null to clear)
 * @returns Result with success/error status
 */
async function updateTasksProjectId(
  caseId: number,
  projectId: number | null,
): Promise<Result<void, AppError>> {
  console.log(
    "[updateTasksProjectId] Starting update for case:",
    caseId,
    "with project_id:",
    projectId,
  );

  // Get all tasks for this case
  const tasksResult = await getAllTasksForCase(caseId);
  if (!tasksResult.success) {
    console.error(
      "[updateTasksProjectId] Failed to get tasks:",
      tasksResult.error,
    );
    return err(tasksResult.error);
  }

  const tasks = tasksResult.value;
  console.log("[updateTasksProjectId] Found", tasks.length, "tasks to update");

  if (tasks.length === 0) {
    // No tasks to update, return success
    console.log("[updateTasksProjectId] No tasks to update, returning success");
    return ok(undefined);
  }

  // Update all tasks' project_id field
  const taskIds = tasks.map((task) => task.id);
  console.log("[updateTasksProjectId] Updating task IDs:", taskIds);

  const updateResult = await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `in.(${taskIds.join(",")})` },
    {
      project_id: projectId,
      updated_at: new Date().toISOString(),
    } as Partial<CaseTask> & { project_id: number | null },
  );

  if (!updateResult.success) {
    console.error("[updateTasksProjectId] Update failed:", updateResult.error);
    return err(updateResult.error);
  }

  console.log(
    "[updateTasksProjectId] Successfully updated project_id for",
    updateResult.value.length,
    "tasks",
  );

  // Log project assignment change event for each task
  if (projectId != null) {
    for (const task of tasks) {
      await eventLogService
        .logProjectAssignmentChanged(
          "task",
          task.id,
          (task as any).project_id ?? null,
          projectId,
        )
        .catch(console.error);
    }
  }

  return ok(undefined);
}

/**
 * Process dependencies when a task deadline changes
 *
 * @param taskId - ID of the task that changed
 * @param oldDeadline - Previous deadline value
 * @param newDeadline - New deadline value
 */
async function processDeadlineChangeDependencies(
  taskId: number,
  oldDeadline: string | null,
  newDeadline: string,
): Promise<void> {
  try {
    // Import dependency service dynamically to avoid circular dependencies
    const { analyzeTaskDependencies, processDependencyChange } =
      await import("./dependencyService");

    // Analyze dependencies
    const dependencyResult = await analyzeTaskDependencies(taskId);
    if (!dependencyResult.success) {
      console.error("Failed to analyze dependencies:", dependencyResult.error);
      return;
    }

    const dependencies = dependencyResult.value;
    if (dependencies.length === 0) {
      return; // No dependencies to process
    }

    // Create dependency change object
    const dependencyChange = {
      changedTaskId: taskId,
      changedField: "deadline" as const,
      oldValue: oldDeadline,
      newValue: newDeadline,
      dependentTaskIds: dependencies.map((d) => d.dependentTaskId),
      changeTimestamp: new Date().toISOString(),
    };

    // Process the dependency change (comments and messages)
    const processResult = await processDependencyChange(dependencyChange);
    if (!processResult.success) {
      console.error(
        "Failed to process dependency change:",
        processResult.error,
      );
    }
  } catch (error) {
    console.error("Error processing deadline change dependencies:", error);
  }
}

/**
 * Get all case tasks with optional filters
 *
 * @param filters - Optional filters for owner_id or status
 * @returns Result containing array of case tasks, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getAllCaseTasks({ owner_id: 'user123' });
 * if (result.success) {
 *   console.log(result.value); // CaseTask[]
 * }
 * ```
 */
export async function getAllCaseTasks(filters?: {
  owner_id?: string | null;
  status?: string;
}): Promise<Result<CaseTask[], AppError>> {
  const filter: Record<string, string> = {
    task_type: "eq.process",
    closed: "eq.false",
  };

  // Handle assignee filtering via junction table
  let taskIdsFilter: number[] | null = null;
  if (filters?.owner_id !== undefined) {
    const taskIdsResult = await getCaseTaskIdsByAssignee(filters.owner_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter === null) {
      // owner_id is null - we want tasks with NO assignees
      // We'll filter these out after fetching
    } else if (taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else {
      filter.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }

  if (filters?.status) {
    filter.status = `eq.${filters.status}`;
  }

  const result = await queryTableResult<CaseTask>("_bpm_tasks", {
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // If filtering for null owner_id, filter out tasks that have assignees
  if (filters?.owner_id === null && taskIdsFilter === null) {
    const allAssigneesResult = await queryTableResult<{ task_id: number }>(
      "_bpm_task_assignees",
      {},
    );
    if (allAssigneesResult.success) {
      const tasksWithAssignees = new Set(
        allAssigneesResult.value.data.map((row) => row.task_id),
      );
      tasks = tasks.filter((task: any) => !tasksWithAssignees.has(task.id));
    }
  }

  // Enrich with assignee arrays
  const enrichedTasks = await enrichCaseTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Get case tasks for case-log (unplanned items - status: backlog)
 * Note: 'backlog' is the default case task status for unplanned items
 *
 * @param owner_id - Optional owner filter (null shows all)
 * @returns Result containing array of case-log case tasks, or error if query fails
 */
export async function getCaseLogTasks(
  owner_id?: string | null,
): Promise<Result<CaseTask[], AppError>> {
  // Query for 'backlog' (default case task status)
  // Case tasks use 'backlog' as the unplanned status by default
  const filter: Record<string, string> = {
    task_type: "eq.process",
    status: "eq.backlog",
    closed: "eq.false",
  };

  // Handle assignee filtering via junction table
  let taskIdsFilter: number[] | null = null;
  if (owner_id !== undefined) {
    const taskIdsResult = await getCaseTaskIdsByAssignee(owner_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter === null) {
      // owner_id is null - we want tasks with NO assignees
      // We'll filter these out after fetching
    } else if (taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else {
      filter.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }

  const result = await queryTableResult<CaseTask>("_bpm_tasks", {
    filter,
    order: "deadline.asc.nullslast,id.asc",
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // If filtering for null owner_id, filter out tasks that have assignees
  if (owner_id === null && taskIdsFilter === null) {
    const allAssigneesResult = await queryTableResult<{ task_id: number }>(
      "_bpm_task_assignees",
      {},
    );
    if (allAssigneesResult.success) {
      const tasksWithAssignees = new Set(
        allAssigneesResult.value.data.map((row) => row.task_id),
      );
      tasks = tasks.filter((task: any) => !tasksWithAssignees.has(task.id));
    }
  }

  // Enrich with assignee arrays
  const enrichedTasks = await enrichCaseTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Get case tasks for planning board (only items with status 'gepland' or 'ad-hoc')
 * The kanban board displays items by kanban_status, but only items with status 'gepland' or 'ad-hoc' are shown
 *
 * @param owner_id - Optional owner filter (null shows all)
 * @returns Result containing array of planning case tasks, or error if query fails
 */
export async function getPlanningCaseTasks(
  owner_id?: string | null,
): Promise<Result<CaseTask[], AppError>> {
  const filter: Record<string, string> = {
    task_type: "eq.process",
    // Only show items with status 'gepland' or 'ad-hoc' in the plan board (excludes 'backlog')
    status: "in.(gepland,ad-hoc)",
    // Filter by kanban_status - exclude 'backlog' as those items belong in the backlog, not planning
    // Kanban board columns: gepland, mee_bezig, in_review, afgerond
    kanban_status: "in.(gepland,mee_bezig,in_review,afgerond)",
    // Exclude closed tasks
    closed: "eq.false",
  };

  // Handle assignee filtering via junction table
  // Note: owner_id === null means "show all tasks" (not "show unassigned")
  // owner_id === undefined also means "show all tasks"
  let taskIdsFilter: number[] | null = null;
  if (owner_id !== undefined && owner_id !== null) {
    // Only filter when a specific owner ID is provided
    const taskIdsResult = await getCaseTaskIdsByAssignee(owner_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter && taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else if (taskIdsFilter && taskIdsFilter.length > 0) {
      filter.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }
  // If owner_id is undefined or null, don't add any assignee filter (show all tasks)

  const result = await queryTableResult<CaseTask>("_bpm_tasks", {
    filter,
    order: ["kanban_order.asc", "created_at.desc"],
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // Enrich with assignee arrays
  const enrichedTasks = await enrichCaseTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Get closed case tasks (archived)
 *
 * @param owner_id - Optional owner filter (null shows all)
 * @returns Result containing array of closed case tasks, or error if query fails
 */
export async function getClosedCaseTasks(
  owner_id?: string | null,
): Promise<Result<CaseTask[], AppError>> {
  const filter: Record<string, string> = {
    task_type: "eq.process",
    closed: "eq.true",
  };

  // Handle assignee filtering via junction table
  let taskIdsFilter: number[] | null = null;
  if (owner_id !== undefined) {
    const taskIdsResult = await getCaseTaskIdsByAssignee(owner_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter === null) {
      // owner_id is null - we want tasks with NO assignees
      // We'll filter these out after fetching
    } else if (taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else {
      filter.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }

  const result = await queryTableResult<CaseTask>("_bpm_tasks", {
    filter,
    order: "updated_at.desc", // Most recently closed first
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // If filtering for null owner_id, filter out tasks that have assignees
  if (owner_id === null && taskIdsFilter === null) {
    const allAssigneesResult = await queryTableResult<{ task_id: number }>(
      "_bpm_task_assignees",
      {},
    );
    if (allAssigneesResult.success) {
      const tasksWithAssignees = new Set(
        allAssigneesResult.value.data.map((row) => row.task_id),
      );
      tasks = tasks.filter((task: any) => !tasksWithAssignees.has(task.id));
    }
  }

  // Enrich with assignee arrays
  const enrichedTasks = await enrichCaseTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Move case task to planning (change status to gepland or ad-hoc)
 *
 * @param id - Case task ID
 * @param status - New status (gepland or ad-hoc)
 * @returns Result containing updated case task array, or error if update fails
 */
export async function moveCaseTaskToPlanning(
  id: number,
  status: "gepland" | "ad-hoc",
): Promise<Result<CaseTask[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid case task ID", "id", id));
  }

  return await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      status,
      kanban_status: "gepland",
      updated_at: new Date().toISOString(),
    },
  );
}

/**
 * Update case task kanban status (drag-and-drop in kanban board)
 *
 * @param id - Case task ID
 * @param kanban_status - New kanban status
 * @returns Result containing updated case task array, or error if update fails
 */
export async function updateCaseTaskKanbanStatus(
  id: number,
  kanban_status:
    | "backlog"
    | "gepland"
    | "mee_bezig"
    | "in_review"
    | "afgerond"
    | "overdue",
): Promise<Result<CaseTask[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid case task ID", "id", id));
  }

  return await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      kanban_status,
      updated_at: new Date().toISOString(),
    },
  );
}

/**
 * Reorder case tasks within a kanban column
 *
 * @param itemOrders - Array of {id, kanban_order} pairs for tasks in the column
 * @param kanban_status - The kanban status column these tasks belong to
 * @returns Result containing updated case tasks, or error if update fails
 */
export async function reorderCaseTasks(
  itemOrders: Array<{ id: number; kanban_order: number }>,
  kanban_status:
    | "backlog"
    | "gepland"
    | "mee_bezig"
    | "in_review"
    | "afgerond"
    | "overdue",
): Promise<Result<CaseTask[], AppError>> {
  if (!itemOrders || itemOrders.length === 0) {
    return err(
      ValidationError.create(
        "Item orders array cannot be empty",
        "itemOrders",
        itemOrders,
      ),
    );
  }

  // Update each task's kanban_order
  const updates = itemOrders.map(({ id, kanban_order }) => {
    if (!Number.isInteger(id) || id <= 0) {
      return err(ValidationError.create("Invalid case task ID", "id", id));
    }
    if (!Number.isInteger(kanban_order) || kanban_order < 0) {
      return err(
        ValidationError.create(
          "Invalid kanban_order",
          "kanban_order",
          kanban_order,
        ),
      );
    }

    return updateRowsResult<CaseTask>(
      "_bpm_tasks",
      { id: `eq.${id}` },
      {
        kanban_order,
        kanban_status,
        updated_at: new Date().toISOString(),
      },
    );
  });

  // Execute all updates
  for (const update of updates) {
    const result = await update;
    if (!result.success) {
      console.error(
        `❌ [reorderStepTasks] Failed to update task:`,
        result.error,
      );
      return err(result.error);
    }
  }

  console.log(
    `✅ [reorderStepTasks] All ${updates.length} updates completed successfully`,
  );

  // Return success with empty array (we don't need to return all updated items)
  return ok([]);
}

/**
 * Get all steps for a case with enriched process step data
 *
 * @param caseId - Case ID
 * @returns Result containing array of case steps with enriched process step data, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getCaseStepsByCaseId(123);
 * if (result.success) {
 *   console.log(result.value); // CaseStep[] with name, description, etc.
 * }
 * ```
 */
export async function getCaseStepsByCaseId(
  caseId: number,
): Promise<Result<CaseStep[], AppError>> {
  // Validate ID
  if (!isValidCaseId(caseId)) {
    return err(ValidationError.create("Invalid case ID", "caseId", caseId));
  }

  const validCaseId = toCaseId(caseId);

  // Get steps
  const stepsResult = await queryTableResult<CaseStep>("_bpm_case_steps", {
    filter: { case_id: `eq.${validCaseId}` },
    order: "created_at.asc",
  });

  if (!stepsResult.success) {
    return err(stepsResult.error);
  }

  const steps = stepsResult.value.data;

  // Enrich steps with process step data
  const enrichedStepsPromises = steps.map(async (step) => {
    // Fetch process step details
    const processStepResult = await getRowByIdResult(
      "_bpm_process_steps",
      step.step_id,
    );
    let processStepData: any = {};
    if (processStepResult.success) {
      // Exclude id from processStepData to avoid overwriting case step id
      const { id: _processStepId, ...processStepFields } =
        processStepResult.value;
      processStepData = processStepFields;
    }

    return { ...step, ...processStepData };
  });

  const enrichedSteps = await Promise.all(enrichedStepsPromises);

  return ok(enrichedSteps);
}

/**
 * Reorder case tasks within steps and across steps
 *
 * @param taskId - ID of task being moved
 * @param sourceCaseStepId - Original step ID (can be null if no step assigned)
 * @param targetCaseStepId - Target step ID (null for within-step, new step ID for cross-step)
 * @param targetStepOrder - New step_order position for moved task
 * @param allTaskOrders - Array of {id, step_order} for all tasks affected by reordering
 * @returns Result containing updated case tasks, or error if update fails
 */
export async function reorderStepTasks(
  taskId: number,
  sourceCaseStepId: number | null,
  targetCaseStepId: number | null,
  targetStepOrder: number,
  allTaskOrders: Array<{
    id: number;
    step_order: number;
    case_step_id?: number | null;
  }>,
): Promise<Result<CaseTask[], AppError>> {
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return err(
      ValidationError.create("Invalid case task ID", "taskId", taskId),
    );
  }

  if (!allTaskOrders || allTaskOrders.length === 0) {
    return err(
      ValidationError.create(
        "Task orders array cannot be empty",
        "allTaskOrders",
        allTaskOrders,
      ),
    );
  }

  // Prepare updates for all affected tasks
  const updates = allTaskOrders.map(({ id, step_order, case_step_id }) => {
    if (!Number.isInteger(id) || id <= 0) {
      return err(ValidationError.create("Invalid case task ID", "id", id));
    }
    if (!Number.isInteger(step_order) || step_order < 0) {
      return err(
        ValidationError.create("Invalid step_order", "step_order", step_order),
      );
    }

    const updateData: Partial<CaseTask> = {
      step_order,
      updated_at: new Date().toISOString(),
    };

    // For cross-step moves, update case_step_id for moved task
    if (case_step_id != null && id === taskId) {
      updateData.case_step_id = case_step_id;
    }

    console.log(`🔧 [reorderStepTasks] Updating task ${id} with:`, updateData);

    return updateRowsResult<CaseTask>(
      "_bpm_tasks",
      { id: `eq.${id}` },
      updateData,
    );
  });

  // Execute all updates
  for (const update of updates) {
    const result = await update;
    if (!result.success) {
      return err(result.error);
    }
  }

  // Invalidate cache for both source and target steps
  if (sourceCaseStepId) {
    requestCache.invalidateEntity("case_step", sourceCaseStepId);
  }
  if (targetCaseStepId) {
    requestCache.invalidateEntity("case_step", targetCaseStepId);
  }
  requestCache.invalidate("workitems");

  // CRITICAL: Invalidate case cache so getCaseById fetches fresh data
  requestCache.invalidate(/^case:\d+$/);
  // Also invalidate all cases cache
  requestCache.invalidate("cases");

  // Return success with empty array
  return ok([]);
}

/**
 * Reorder process tasks within steps
 *
 * @param taskId - ID of the task being moved
 * @param sourceStepId - ID of the source step
 * @param targetStepId - ID of the target step (null if same step)
 * @param targetStepOrder - New order index for the moved task
 * @param allTaskOrders - Array of task orders for all affected tasks
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await reorderProcessTasks(297, 120, 120, 1, [
 *   { id: 296, step_order: 0 },
 *   { id: 297, step_order: 1 }
 * ]);
 * if (result.success) {
 *   console.log('Tasks reordered');
 * }
 * ```
 */
export async function reorderProcessTasks(
  taskId: number,
  sourceStepId: number | null,
  targetStepId: number | null,
  targetStepOrder: number,
  allTaskOrders: Array<{
    id: number;
    step_order: number;
    step_id?: number | null;
  }>,
): Promise<Result<ProcessTask[], AppError>> {
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return err(
      ValidationError.create("Invalid process task ID", "taskId", taskId),
    );
  }

  if (!allTaskOrders || allTaskOrders.length === 0) {
    return err(
      ValidationError.create(
        "Task orders array cannot be empty",
        "allTaskOrders",
        allTaskOrders,
      ),
    );
  }

  // Prepare updates for all affected tasks
  const updates = allTaskOrders.map(({ id, step_order, step_id }) => {
    if (!Number.isInteger(id) || id <= 0) {
      return err(ValidationError.create("Invalid process task ID", "id", id));
    }
    if (!Number.isInteger(step_order) || step_order < 0) {
      return err(
        ValidationError.create("Invalid step_order", "step_order", step_order),
      );
    }

    const updateData: Partial<ProcessTask> = {
      step_order,
      // Note: updated_at not included as column doesn't exist in _bpm_process_tasks
    };

    // For cross-step moves, update step_id for moved task
    if (step_id != null && id === taskId) {
      updateData.step_id = step_id;
    }

    return updateRowsResult<ProcessTask>(
      "_bpm_process_tasks",
      { id: `eq.${id}` },
      updateData,
    );
  });

  // Execute all updates
  for (const update of updates) {
    const result = await update;
    if (!result.success) {
      return err(result.error);
    }
  }

  // Invalidate cache for both source and target steps
  if (sourceStepId) {
    requestCache.invalidateEntity("process_step", sourceStepId);
  }
  if (targetStepId) {
    requestCache.invalidateEntity("process_step", targetStepId);
  }
  requestCache.invalidate(/^process:\d+$/); // Invalidate process cache so getProcessById fetches fresh data
  requestCache.invalidate("workitems");

  // Return success with empty array
  return ok([]);
}

/**
 * Get all process tasks for a step with enriched data
 *
 * @param stepId - Process step ID
 * @returns Result containing array of process tasks with enriched data, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getProcessTasksByStepId(456);
 * if (result.success) {
 *   console.log(result.value); // ProcessTask[] with name, description, etc.
 * }
 * ```
 */
export async function getProcessTasksByStepId(
  stepId: number,
): Promise<Result<any[], AppError>> {
  // Validate ID
  if (!Number.isInteger(stepId) || stepId <= 0) {
    return err(ValidationError.create("Invalid step ID", "stepId", stepId));
  }

  // Get process tasks for this step
  const tasksResult = await queryTableResult<any>("_bpm_process_tasks", {
    filter: { step_id: `eq.${stepId}` },
    order: "order_index.asc",
  });

  if (!tasksResult.success) {
    return err(tasksResult.error);
  }

  return ok(tasksResult.value.data);
}

/**
 * Link a case to a project
 * Only project owners can link cases to their project
 *
 * @param caseId - Case ID to link
 * @param projectId - Project ID to link to (null to unlink)
 * @param userId - User ID performing the action (for authorization)
 * @returns Result with success/error status
 */
export async function linkCaseToProject(
  caseId: number,
  projectId: number | null,
  userId: string,
): Promise<Result<Case[], AppError>> {
  if (!Number.isInteger(caseId) || caseId <= 0) {
    return err(ValidationError.create("Invalid case ID", "caseId", caseId));
  }

  if (projectId !== null && (!Number.isInteger(projectId) || projectId <= 0)) {
    return err(
      ValidationError.create("Invalid project ID", "projectId", projectId),
    );
  }

  // If linking to a project, verify user is owner
  if (projectId !== null) {
    const { isProjectOwner } = await import("./projectMemberService");
    const isOwner = await isProjectOwner(projectId, userId);

    if (!isOwner) {
      return err(
        new ForbiddenError(
          "Only project owners can link cases to their project",
        ),
      );
    }
  }

  const result = await updateRowsResult<Case>(
    "_bpm_cases",
    { id: `eq.${caseId}` },
    {
      project_id: projectId,
      updated_at: new Date().toISOString(),
    },
  );

  // Log event
  if (result.success) {
    await eventLogService
      .logEvent(
        projectId ? "case_linked_to_project" : "case_unlinked_from_project",
        "case",
        caseId,
        { metadata: { projectId }, userId },
      )
      .catch(console.error);

    // Cascade project_id to all case tasks
    if (projectId !== null) {
      console.log(
        "[linkCaseToProject] Cascading project_id",
        projectId,
        "to all tasks for case",
        caseId,
      );
      const tasksUpdateResult = await updateTasksProjectId(caseId, projectId);
      if (!tasksUpdateResult.success) {
        console.error(
          "[linkCaseToProject] Failed to cascade project_id to tasks:",
          tasksUpdateResult.error,
        );
      } else {
        console.log(
          "[linkCaseToProject] Successfully cascaded project_id to all tasks",
        );
      }
    }

    // Invalidate cache
    requestCache.invalidateEntity("case", caseId);
    requestCache.invalidate("cases:all");
  }

  return result;
}

/**
 * Archive a case task (mark as closed)
 *
 * @param id - Case task ID to archive
 * @returns Result containing updated case task array, or error if update fails
 */
export async function archiveCaseTask(
  id: number,
): Promise<Result<CaseTask[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid case task ID", "id", id));
  }

  // Get current task for logging
  const currentTaskResult = await getRowByIdResult<CaseTask>("_bpm_tasks", id);
  if (!currentTaskResult.success) {
    return err(currentTaskResult.error);
  }

  const result = await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      closed: true,
      updated_at: new Date().toISOString(),
    },
  );

  // Log task archived event
  if (result.success) {
    await eventLogService
      .logEvent("case_task_archived", "task", id, {
        oldValues: { closed: false },
        newValues: { closed: true },
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidate("workitems");
    requestCache.invalidate(/^case:\d+$/);
    requestCache.invalidate("cases");
  }

  return result;
}

/**
 * Unarchive a case task (mark as not closed)
 *
 * @param id - Case task ID to unarchive
 * @returns Result containing updated case task array, or error if update fails
 */
export async function unarchiveCaseTask(
  id: number,
): Promise<Result<CaseTask[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid case task ID", "id", id));
  }

  // Get current task for logging
  const currentTaskResult = await getRowByIdResult<CaseTask>("_bpm_tasks", id);
  if (!currentTaskResult.success) {
    return err(currentTaskResult.error);
  }

  const result = await updateRowsResult<CaseTask>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      closed: false,
      updated_at: new Date().toISOString(),
    },
  );

  // Log task unarchived event
  if (result.success) {
    await eventLogService
      .logEvent("case_task_unarchived", "task", id, {
        oldValues: { closed: true },
        newValues: { closed: false },
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidate("workitems");
    requestCache.invalidate(/^case:\d+$/);
    requestCache.invalidate("cases");
  }

  return result;
}

/**
 * Delete a case task (permanently remove from database)
 *
 * @param id - Case task ID to delete
 * @returns Result indicating success or error
 *
 * @example
 * ```typescript
 * const result = await deleteCaseTask(123);
 * if (result.success) {
 *   console.log('Task deleted successfully');
 * }
 * ```
 */
export async function deleteCaseTask(
  id: number,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid case task ID", "id", id));
  }

  // Get current task for logging
  const currentTaskResult = await getRowByIdResult<CaseTask>("_bpm_tasks", id);
  if (!currentTaskResult.success) {
    return err(currentTaskResult.error);
  }

  const currentTask = currentTaskResult.value;

  // Delete the task
  const result = await deleteRowsResult("_bpm_tasks", { id: `eq.${id}` });

  // Log task deleted event
  if (result.success) {
    await eventLogService
      .logEvent("case_task_deleted", "task", id, {
        oldValues: {
          case_step_id: currentTask.case_step_id,
          task_id: currentTask.task_id,
          name: currentTask.name,
          closed: currentTask.closed,
        },
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidate("workitems");
    requestCache.invalidate(/^case:\d+$/);
    requestCache.invalidate("cases");
  }

  return result;
}

/**
 * Get all cases with optional filtering
 *
 * @param filters - Optional filters for status, process_id, or owner_id
 * @returns Result containing array of cases, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getAllCases({ status: 'mee_bezig' });
 * if (result.success) {
 *   console.log(result.value); // Case[]
 * }
 * ```
 */
export async function getAllCases(filters?: {
  status?: string;
  process_id?: number;
  owner_id?: string;
}): Promise<Result<Case[], AppError>> {
  const filter: Record<string, string> = {};

  if (filters?.status) {
    filter.status = `eq.${filters.status}`;
  }
  if (filters?.process_id) {
    filter.process_id = `eq.${filters.process_id}`;
  }
  if (filters?.owner_id) {
    filter.owner_id = `eq.${filters.owner_id}`;
  }

  const result = await queryTableResult<Case>("_bpm_cases", {
    filter,
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get case task IDs assigned to a specific user
 *
 * @param assigneeId - Assignee ID (null to get tasks with no assignees)
 * @returns Result containing array of task IDs, or null if getting unassigned tasks, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getCaseTaskIdsByAssignee('user1');
 * if (result.success) {
 *   console.log(result.value); // number[] | null
 * }
 * ```
 */
export async function getCaseTaskIdsByAssignee(
  assigneeId: string | null,
): Promise<Result<number[] | null, AppError>> {
  if (assigneeId === null) {
    // Return null to indicate we want tasks with NO assignees
    // The calling function will handle this case
    return ok(null);
  }

  if (
    !assigneeId ||
    typeof assigneeId !== "string" ||
    assigneeId.trim() === ""
  ) {
    return err(
      ValidationError.create(
        "Valid assignee ID is required",
        "assigneeId",
        assigneeId,
      ),
    );
  }

  // Get task IDs from task assignees table
  const assigneeResult =
    await taskAssigneeService.getTasksByAssignee(assigneeId);
  if (!assigneeResult.success) {
    return err(assigneeResult.error);
  }

  const allTaskIds = assigneeResult.value;

  if (allTaskIds.length === 0) {
    return ok([]);
  }

  // Filter for case tasks only (task_type: 'process')
  const caseTaskResult = await queryTableResult<{ id: number }>("_bpm_tasks", {
    filter: {
      id: `in.(${allTaskIds.join(",")})`,
      task_type: "eq.process",
    },
  });

  if (!caseTaskResult.success) {
    return err(caseTaskResult.error);
  }

  const caseTaskIds = caseTaskResult.value.data.map((task) => task.id);
  return ok(caseTaskIds);
}

/**
 * Get case by ID with steps and tasks
 *
 * @param caseId - Case ID
 * @returns Result containing case data with steps and tasks, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getCaseById(123);
 * if (result.success) {
 *   console.log(result.value.case); // Case data
 *   console.log(result.value.steps); // Steps with tasks
 * }
 * ```
 */
export async function getCaseById(caseId: number): Promise<
  Result<
    {
      case: Case;
      steps: (CaseStep & { tasks: CaseTask[] })[];
    },
    AppError
  >
> {
  // Validate ID
  if (!isValidCaseId(caseId)) {
    return err(ValidationError.create("Invalid case ID", "caseId", caseId));
  }

  const validCaseId = toCaseId(caseId);

  // Get case data
  const caseResult = await getRowByIdResult<Case>("_bpm_cases", validCaseId);
  if (!caseResult.success) {
    return err(caseResult.error);
  }

  // Get steps for this case
  const stepsResult = await getCaseStepsByCaseId(caseId);
  if (!stepsResult.success) {
    return err(stepsResult.error);
  }

  // Get tasks for each step
  const stepsWithTasks = await Promise.all(
    stepsResult.value.map(async (step) => {
      const tasksResult = await queryTableResult<CaseTask>("_bpm_tasks", {
        filter: {
          case_step_id: `eq.${step.id}`,
          task_type: "eq.process",
        },
        order: "step_order.asc",
      });

      if (!tasksResult.success) {
        // If tasks query fails, return step with empty tasks array
        return { ...step, tasks: [] as CaseTask[] };
      }

      // Enrich tasks with assignees
      const tasksWithAssignees = await enrichCaseTasksWithAssignees(
        tasksResult.value.data,
      );
      return { ...step, tasks: tasksWithAssignees };
    }),
  );

  return ok({
    case: caseResult.value,
    steps: stepsWithTasks,
  });
}

// Re-export types for backward compatibility with existing components
export type { Case, CaseStep, CaseTask } from "$lib/schemas/case";
