/**
 * Task service - CRUD operations for tasks
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
  getRowByIdResult,
} from "$lib/utils/postgrest";
import {
  buildTaskEmbeddingSelect,
  parseEmbeddedTask,
  type EmbeddedTaskRow,
} from "$lib/utils/postgrestEmbedding";
import { getCurrentUserId } from "$lib/utils/userUtils";
import { requestCache } from "$lib/utils/requestCache";
import { taskCache } from "$lib/utils/taskCache";
import {
  backlogCache,
  planningCache,
  invalidateTaskCaches,
} from "./taskQueryCache";
import * as eventLogService from "./eventLogService";
import * as projectAuthService from "./projectAuthService";
import {
  AppError,
  ValidationError,
  NotFoundError,
  NetworkError,
} from "$lib/types/errors";
import type { AppError as AppErrorType } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  CreateManualTaskInputSchema,
  CreateHelpTaskInputSchema,
  UpdateTaskInputSchema,
  type Task,
  type CreateManualTaskInput,
  type CreateHelpTaskInput,
  type UpdateTaskInput,
} from "$lib/schemas/task";
import type { CaseTask } from "$lib/schemas/case";
import * as taskAssigneeService from "./taskAssigneeService";
import { setTaskHoursForAssignees } from "$lib/utils/hoursUtils";

/**
 * Helper function to enrich tasks with assignee_id arrays and sum of assignee hours
 */
async function enrichTasksWithAssignees<T extends { id: number }>(
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
  return tasks.map((task) => ({
    ...task,
    assignee_id: assigneeMap.get(task.id) || [],
    // Override uren with sum of assignee hours for display (task.uren keeps user-entered value)
    uren: hoursSumMap.get(task.id) || (task as any).uren || null,
  }));
}

/**
 * Helper function to get task IDs filtered by assignee using junction table
 */
async function getTaskIdsByAssignee(
  assigneeId: string | null,
): Promise<Result<number[] | null, AppError>> {
  if (assigneeId === null) {
    // For null, we want tasks with NO assignees - get all task IDs and filter out those with assignees
    const allAssigneesResult = await queryTableResult<{ task_id: number }>(
      "_bpm_task_assignees",
      {},
    );
    if (!allAssigneesResult.success) {
      return err(allAssigneesResult.error);
    }
    const tasksWithAssignees = new Set(
      allAssigneesResult.value.data.map((row) => row.task_id),
    );
    // Return null to indicate we need to filter in the main query
    return ok(null);
  }

  const result = await taskAssigneeService.getTasksByAssignee(assigneeId);
  if (!result.success) {
    return err(result.error);
  }
  return ok(result.value);
}

/**
 * Get all work items with optional filters
 *
 * @param filters - Optional filters for status, assignee_id, project_id, kanban_status
 * @returns Result containing array of work items, or error if query fails
 */
export async function getAllWorkItems(filters?: {
  status?: "backlog" | "gepland" | "ad-hoc";
  assignee_id?: string | null;
  project_id?: number;
  kanban_status?:
    | "backlog"
    | "gepland"
    | "mee_bezig"
    | "in_review"
    | "afgerond"
    | "overdue";
}): Promise<Result<Task[], AppError>> {
  // Create cache key based on filters
  const filterKey = filters
    ? `workitems:${filters.status || "all"}:${filters.assignee_id || "all"}:${filters.project_id || "all"}:${filters.kanban_status || "all"}`
    : "workitems:all";

  return await requestCache.get<Result<Task[], AppError>>(
    filterKey,
    async () => {
      const filterObj: Record<string, string> = {};

      if (filters?.status) {
        filterObj.status = `eq.${filters.status}`;
      }
      if (filters?.project_id) {
        filterObj.project_id = `eq.${filters.project_id}`;
      }
      if (filters?.kanban_status) {
        filterObj.kanban_status = `eq.${filters.kanban_status}`;
      }

      filterObj.task_type = "in.(manual,help)";
      filterObj.closed = "eq.false";

      // Handle assignee filtering via junction table
      let taskIdsFilter: number[] | null = null;
      if (filters?.assignee_id !== undefined) {
        const taskIdsResult = await getTaskIdsByAssignee(filters.assignee_id);
        if (!taskIdsResult.success) {
          return err(taskIdsResult.error);
        }
        taskIdsFilter = taskIdsResult.value;

        if (taskIdsFilter === null) {
          // assignee_id is null - we want tasks with NO assignees
          // Get all tasks with assignees and filter them out
          const allAssigneesResult = await queryTableResult<{
            task_id: number;
          }>("_bpm_task_assignees", {});
          if (allAssigneesResult.success) {
            const tasksWithAssignees = new Set(
              allAssigneesResult.value.data.map((row) => row.task_id),
            );
            // We'll filter these out after fetching
          }
        } else if (taskIdsFilter.length === 0) {
          // No tasks found for this assignee
          return ok([]);
        } else {
          // Filter by task IDs from junction table
          filterObj.id = `in.(${taskIdsFilter.join(",")})`;
        }
      }

      const result = await queryTableResult<any>("_bpm_tasks", {
        filter: filterObj,
        order: "created_at.desc",
      });

      if (!result.success) {
        return result;
      }

      let tasks = result.value.data;

      // If filtering for null assignee, filter out tasks that have assignees
      if (filters?.assignee_id === null && taskIdsFilter === null) {
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
      const enrichedTasks = await enrichTasksWithAssignees(tasks);

      return ok(enrichedTasks);
    },
  );
}

/**
 * Get work items for planning board (shows items with status 'gepland' or 'ad-hoc' and any kanban_status)
 * The kanban board displays items by kanban_status, but only items with status 'gepland' or 'ad-hoc' are shown
 *
 * @param assignee_id - Optional assignee filter (null shows all)
 * @returns Result containing array of planning work items, or error if query fails
 */
export async function getPlanningWorkItems(
  assignee_id?: string | null,
): Promise<Result<Task[], AppError>> {
  const filterObj: Record<string, string> = {
    task_type: "in.(manual,help)",
    // Only show items with status 'gepland' or 'ad-hoc' in the plan board (excludes 'backlog')
    status: "in.(gepland,ad-hoc)",
    // Filter by kanban_status - exclude 'backlog' as those items belong in the backlog, not planning
    kanban_status: "in.(gepland,mee_bezig,in_review,afgerond,overdue)",
    // Exclude closed items
    closed: "eq.false",
  };

  // Handle assignee filtering via junction table
  // Note: assignee_id === null means "show all tasks" (not "show unassigned")
  // assignee_id === undefined also means "show all tasks"
  if (assignee_id !== undefined && assignee_id !== null) {
    // Only filter when a specific assignee ID is provided
    const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    const taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter && taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else if (taskIdsFilter && taskIdsFilter.length > 0) {
      filterObj.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }
  // If assignee_id is undefined or null, don't add any assignee filter (show all tasks)

  const result = await queryTableResult<any>("_bpm_tasks", {
    filter: filterObj,
    order: ["kanban_order.asc", "created_at.desc"],
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // Enrich with assignee arrays
  const enrichedTasks = await enrichTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Get backlog items
 *
 * @param assignee_id - Optional assignee filter (null shows all)
 * @returns Result containing array of backlog items, or error if query fails
 */
export async function getBacklogItems(
  assignee_id?: string | null,
): Promise<Result<Task[], AppError>> {
  const filterObj: Record<string, string> = {
    task_type: "in.(manual,help)",
    status: "eq.backlog",
    closed: "eq.false",
  };

  // Handle assignee filtering via junction table
  if (assignee_id !== undefined) {
    const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    const taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter === null) {
      // assignee_id is null - we want tasks with NO assignees
      const allAssigneesResult = await queryTableResult<{ task_id: number }>(
        "_bpm_task_assignees",
        {},
      );
      if (allAssigneesResult.success) {
        const tasksWithAssignees = new Set(
          allAssigneesResult.value.data.map((row) => row.task_id),
        );
        // We'll filter these out after fetching
      }
    } else if (taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else {
      filterObj.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }

  const result = await queryTableResult<any>("_bpm_tasks", {
    filter: filterObj,
    order: "deadline.asc.nullslast,id.asc",
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // If filtering for null assignee, filter out tasks that have assignees
  if (assignee_id === null) {
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
  const enrichedTasks = await enrichTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Get work item by ID
 *
 * @param id - Work item ID
 * @returns Result containing work item data, or error if not found
 */
export async function getWorkItemById(
  id: number,
): Promise<Result<Task, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid work item ID", "id", id));
  }

  const result = await getRowByIdResult<any>("_bpm_tasks", id);
  if (!result.success) {
    return err(result.error);
  }

  // Enrich with assignee array
  const enrichedTasks = await enrichTasksWithAssignees([result.value]);
  const enrichedItem = enrichedTasks[0];

  return ok(enrichedItem);
}

/**
 * Create a new work item
 *
 * @param data - Work item creation data
 * @returns Result containing created work item, or error if creation fails
 */
export async function createWorkItem(
  data: CreateManualTaskInput | CreateHelpTaskInput,
): Promise<Result<Task, AppError>> {
  // Determine which schema to use based on task_type
  const taskType = (data as any).task_type || "manual";
  const schema =
    taskType === "help"
      ? CreateHelpTaskInputSchema
      : CreateManualTaskInputSchema;

  // Validate input
  const validation = validateSchema(schema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Ensure subject is present for manual/help tasks (required by database constraint)
  if (!data.subject || data.subject.trim() === "") {
    return err(
      ValidationError.create(
        "Subject is required for manual tasks",
        "subject",
        data.subject,
      ),
    );
  }

  // Trim and validate subject before proceeding
  const trimmedSubject = data.subject.trim();
  if (trimmedSubject === "") {
    return err(
      ValidationError.create(
        "Subject cannot be empty",
        "subject",
        data.subject,
      ),
    );
  }

  // Handle assignee_id assignment:
  // - If assignee_id is explicitly provided (including empty array), use it
  // - If assignee_id is undefined (not provided), use current user as default
  const assigneeIds =
    "assignee_id" in data
      ? data.assignee_id || []
      : getCurrentUserId()
        ? [getCurrentUserId()!]
        : [];

  // Map due_date to deadline for unified table
  const finalStatus = data.status || "backlog";
  // If status is backlog, kanban_status should also be backlog
  const finalKanbanStatus =
    data.kanban_status || (finalStatus === "backlog" ? "backlog" : "gepland");

  // Extract hours, subject, and assignee_id - will be set explicitly or excluded
  const {
    uren,
    subject: _,
    assignee_id: __,
    ...dataWithoutHoursSubjectAndAssignee
  } = data;

  const insertData: any = {
    task_type: taskType,
    ...dataWithoutHoursSubjectAndAssignee,
    subject: trimmedSubject, // Explicitly set pre-validated trimmed subject
    // Include uren - this is the user-entered value (hours per assignee)
    uren: uren !== undefined ? uren : null,
    // Task schema uses deadline directly (ISO datetime string)
    // If deadline is provided as date-only (YYYY-MM-DD), convert to ISO datetime
    deadline: data.deadline
      ? data.deadline.includes("T")
        ? data.deadline
        : `${data.deadline}T12:00:00Z`
      : null,
    tags: data.tags || [],
    bijlagen: data.bijlagen || [],
    status: finalStatus,
    kanban_status: finalKanbanStatus,
    source: data.source || null,
    case_step_id: data.case_step_id || null,
    task_id: data.task_id || null,
    updated_at: new Date().toISOString(),
  };
  // assignee_id already excluded from destructuring above

  // Final validation: ensure subject is set and not empty before insert
  // This is critical for database constraint check_manual_task_subject
  if (!insertData.subject || insertData.subject.trim() === "") {
    return err(
      ValidationError.create(
        "Subject is required and cannot be empty for help/manual tasks",
        "subject",
        insertData.subject,
      ),
    );
  }

  // Ensure subject is a non-empty string (not null, not undefined, not empty)
  insertData.subject = String(insertData.subject).trim();
  if (insertData.subject === "") {
    return err(
      ValidationError.create(
        "Subject must be a non-empty string",
        "subject",
        insertData.subject,
      ),
    );
  }

  // Debug logging in development
  if (import.meta.env?.DEV) {
    console.log(
      "[taskService] Creating task with subject:",
      insertData.subject,
    );
    console.log(
      "[taskService] Full insertData:",
      JSON.stringify(insertData, null, 2),
    );
  }

  const result = await insertRowResult<Task>("_bpm_tasks", insertData);

  // Log error details in development
  if (!result.success && import.meta.env?.DEV) {
    console.error("[taskService] Insert failed:", {
      error: result.error,
      errorMessage: result.error.message,
      errorDetails: (result.error as any).details,
      insertData: JSON.stringify(insertData, null, 2),
    });
  }

  // Set assignees in junction table
  if (result.success && result.value && assigneeIds.length > 0) {
    const workItemId = result.value.id;
    const setAssigneesResult = await taskAssigneeService.setTaskAssignees(
      workItemId,
      assigneeIds,
    );
    if (!setAssigneesResult.success) {
      // Log error but don't fail the creation
      console.error(
        "[taskService] Failed to set assignees:",
        setAssigneesResult.error,
      );
    } else if (uren !== undefined && uren !== null) {
      // Assign full hours to each assignee (same as task.uren - user-entered value)
      const hoursResult = await setTaskHoursForAssignees(workItemId, uren);
      if (!hoursResult.success) {
        console.error(
          "[taskService] Failed to set hours for assignees:",
          hoursResult.error,
        );
      }
    }
  }

  // Enrich result with assignee array
  let enrichedTask: Task | null = null;
  if (result.success && result.value) {
    const enriched = await enrichTasksWithAssignees([result.value]);
    enrichedTask = enriched[0];
  }

  // Log work item creation event
  if (result.success && enrichedTask) {
    const taskId = enrichedTask.id;

    // Prepare newValues with only essential fields to avoid issues with large objects
    const newValues = {
      id: enrichedTask.id,
      subject: enrichedTask.subject,
      status: enrichedTask.status,
      kanban_status: enrichedTask.kanban_status,
      assignee_id: enrichedTask.assignee_id,
      project_id: enrichedTask.project_id,
    };

    // Log event asynchronously (don't block the response)
    // sourceUrl will be auto-detected from window.location.href by logEvent
    eventLogService
      .logEvent("work_item_created", "work_item", taskId, {
        newValues: newValues,
        sourceUrl: data.source ?? undefined, // Use explicit source if provided, otherwise auto-detect
      })
      .then((logResult) => {
        if (!logResult.success) {
          console.error(
            "[taskService] Failed to log work item creation event:",
            logResult.error,
          );
          if (logResult.error.details) {
            console.error(
              "[taskService] Error details:",
              logResult.error.details,
            );
          }
        } else if (import.meta.env?.DEV) {
          console.log(
            "[taskService] Successfully logged work item creation event:",
            logResult.value.id,
          );
        }
      })
      .catch((error) => {
        console.error(
          "[taskService] Error logging work item creation event:",
          error,
        );
      });

    // Update centralized cache immediately
    if (enrichedTask) {
      taskCache.createTask(enrichedTask);
    }

    // Invalidate request cache
    requestCache.invalidate("workitems");
    invalidateTaskCaches();

    // Return enriched task
    if (enrichedTask) {
      return ok(enrichedTask);
    }
  }

  if (!result.success) {
    return err(result.error);
  }

  // If no assignees, still return the task enriched
  if (result.value) {
    const enriched = await enrichTasksWithAssignees([result.value]);
    const enrichedTask = enriched[0];
    return ok(enrichedTask);
  }

  return result;
}

/**
 * Update a work item
 *
 * @param id - Work item ID to update
 * @param data - Partial work item data to update
 * @returns Result containing updated work item array, or error if update fails
 */
export async function updateWorkItem(
  id: number,
  data: UpdateTaskInput,
): Promise<Result<Task[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid work item ID", "id", id));
  }

  // Validate input data
  const validation = validateSchema(UpdateTaskInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Ensure subject is not null or empty if provided (required by database constraint for manual tasks)
  if (
    data.subject !== undefined &&
    (!data.subject || (data.subject && data.subject.trim() === ""))
  ) {
    return err(
      ValidationError.create(
        "Subject cannot be empty for manual tasks",
        "subject",
        data.subject,
      ),
    );
  }

  // Handle assignee_id separately (it's now in junction table)
  const assigneeIds =
    data.assignee_id !== undefined ? data.assignee_id || [] : undefined;

  // Task schema uses deadline directly (ISO datetime string)
  const updateData: any = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Remove assignee_id from updateData - it's handled via junction table
  delete updateData.assignee_id;

  // Map due_date to deadline for backward compatibility (frontend may send due_date)
  // Only map if deadline is not already provided (deadline takes precedence)
  if ((data as any).due_date !== undefined && data.deadline === undefined) {
    const dueDateValue = (data as any).due_date;
    if (dueDateValue) {
      // Convert YYYY-MM-DD to ISO datetime if needed
      if (typeof dueDateValue === "string" && !dueDateValue.includes("T")) {
        updateData.deadline = `${dueDateValue}T12:00:00Z`;
      } else {
        updateData.deadline = dueDateValue;
      }
    } else {
      updateData.deadline = null;
    }
  }
  // Always remove due_date from updateData to avoid sending it to PostgREST
  if ((data as any).due_date !== undefined) {
    delete updateData.due_date;
  }

  // If either status is being set to backlog, ensure both are set to backlog
  if (data.status === "backlog") {
    updateData.kanban_status = "backlog";
  } else if (data.kanban_status === "backlog") {
    updateData.status = "backlog";
  }

  // If deadline is provided as date-only (YYYY-MM-DD), convert to ISO datetime
  if (
    data.deadline !== undefined &&
    data.deadline &&
    !data.deadline.includes("T")
  ) {
    updateData.deadline = `${data.deadline}T12:00:00Z`;
  }

  // Trim subject if provided
  if (data.subject !== undefined && data.subject) {
    updateData.subject = data.subject.trim();
  }

  // Get current task for logging assignment changes
  const currentItemResult = await getRowByIdResult<Task>("_bpm_tasks", id);
  const currentItem = currentItemResult.success
    ? currentItemResult.value
    : null;

  // Extract hours - will be set on both task and assignees
  const { uren, ...updateDataWithoutHours } = updateData;

  // Include uren in updateData - this is the user-entered value (hours per assignee)
  if (uren !== undefined) {
    updateDataWithoutHours.uren = uren;
  }

  // Get current assignees for comparison
  let currentAssignees: string[] = [];
  if (currentItem) {
    const currentAssigneesResult =
      await taskAssigneeService.getTaskAssignees(id);
    if (currentAssigneesResult.success) {
      currentAssignees = currentAssigneesResult.value;
    }
  }

  const result = await updateRowsResult<Task>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    updateDataWithoutHours,
  );

  // Update assignees in junction table if assignee_id was provided
  if (result.success && assigneeIds !== undefined) {
    const setAssigneesResult = await taskAssigneeService.setTaskAssignees(
      id,
      assigneeIds,
    );
    if (!setAssigneesResult.success) {
      // Return error if assignee update fails - this is critical
      console.error(
        "[taskService] Failed to update assignees:",
        setAssigneesResult.error,
      );
      return err(setAssigneesResult.error);
    }
  }

  // Handle hours update - assign full hours to each assignee (same as task.uren)
  if (result.success && uren !== undefined) {
    const hoursResult = await setTaskHoursForAssignees(id, uren);
    if (!hoursResult.success) {
      console.error(
        "[taskService] Failed to update hours for assignees:",
        hoursResult.error,
      );
      // Don't fail the update if hours setting fails, but log it
    }
  }

  // Enrich result with assignee arrays
  let enrichedTasks: Task[] = [];
  if (result.success && result.value) {
    enrichedTasks = await enrichTasksWithAssignees(result.value);

    // Update centralized cache immediately for each updated task
    for (const task of enrichedTasks) {
      taskCache.updateTask(task.id, task);
    }
  }

  // Log work item update event
  if (result.success && currentItem) {
    // Log assignment change if assignee_id changed
    if (assigneeIds !== undefined) {
      const assigneesChanged =
        JSON.stringify(currentAssignees.sort()) !==
        JSON.stringify((assigneeIds || []).sort());
      if (assigneesChanged) {
        const oldAssigneeId =
          currentAssignees.length > 0 ? currentAssignees[0] : null;
        const newAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null;
        if (newAssigneeId) {
          await eventLogService
            .logTaskAssigned(id, oldAssigneeId, newAssigneeId)
            .catch(console.error);
        } else {
          // Log unassignment
          await eventLogService
            .logEvent("task_unassigned", "work_item", id, {
              oldValues: { assignee_id: oldAssigneeId },
              newValues: { assignee_id: null },
            })
            .catch(console.error);
        }
      }
    }

    // Log deadline change if deadline changed
    if (data.deadline !== undefined) {
      const newDeadline = updateData.deadline; // This is the converted deadline value
      const oldDeadline = currentItem.deadline || null;

      // Compare deadlines (normalize both to date strings for comparison)
      const normalizeDate = (dateStr: string | null): string | null => {
        if (!dateStr) return null;
        return dateStr.split("T")[0]; // Get just the date part YYYY-MM-DD
      };

      if (normalizeDate(newDeadline) !== normalizeDate(oldDeadline)) {
        await eventLogService
          .logDeadlineChanged("work_item", id, oldDeadline, newDeadline)
          .catch(console.error);
      }
    }

    // Log project assignment change if project_id changed
    if (
      data.project_id !== undefined &&
      data.project_id !== currentItem.project_id
    ) {
      await eventLogService
        .logProjectAssignmentChanged(
          "work_item",
          id,
          currentItem.project_id || null,
          data.project_id as number,
        )
        .catch(console.error);
    }

    // Log komt_van change if komt_van changed
    if (data.komt_van !== undefined && data.komt_van !== currentItem.komt_van) {
      await eventLogService
        .logKomtVanChanged(
          "work_item",
          id,
          currentItem.komt_van || null,
          data.komt_van as string,
        )
        .catch(console.error);
    }

    // Invalidate request cache
    requestCache.invalidate("workitems");
    invalidateTaskCaches();
  }

  if (!result.success) {
    return err(result.error);
  }

  // Return enriched work items
  return ok(enrichedTasks);
}

/**
 * Update work item kanban status (drag-and-drop in kanban board)
 *
 * @param id - Work item ID
 * @param kanban_status - New kanban status
 * @returns Result containing updated work item array, or error if update fails
 */
export async function updateWorkItemKanbanStatus(
  id: number,
  kanban_status:
    | "backlog"
    | "gepland"
    | "mee_bezig"
    | "in_review"
    | "afgerond"
    | "overdue",
): Promise<Result<Task[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid work item ID", "id", id));
  }

  // Get current task for logging
  const currentItemResult = await getRowByIdResult<Task>("_bpm_tasks", id);
  if (!currentItemResult.success) {
    return err(currentItemResult.error);
  }
  const currentItem = currentItemResult.value;

  const result = await updateRowsResult<Task>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      kanban_status,
      updated_at: new Date().toISOString(),
    },
  );

  // Enrich and update cache
  if (result.success && result.value) {
    const enriched = await enrichTasksWithAssignees(result.value);
    if (enriched.length > 0) {
      // Update centralized cache immediately
      taskCache.updateTask(id, enriched[0]);
    }
  }

  // Log kanban status change event
  if (result.success) {
    await eventLogService
      .logEvent("work_item_status_changed", "work_item", id, {
        oldValues: { kanban_status: currentItem.kanban_status },
        newValues: { kanban_status },
      })
      .catch(console.error);

    // Invalidate request cache
    requestCache.invalidate("workitems");
    invalidateTaskCaches();
  }

  return result;
}

/**
 * Move work item to planning (change status to gepland or ad-hoc)
 *
 * @param id - Work item ID
 * @param status - New status (gepland or ad-hoc)
 * @returns Result containing updated work item array, or error if update fails
 */
export async function moveWorkItemToPlanning(
  id: number,
  status: "gepland" | "ad-hoc",
): Promise<Result<Task[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid work item ID", "id", id));
  }

  const result = await updateRowsResult<Task>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      status,
      kanban_status: "gepland",
      updated_at: new Date().toISOString(),
    },
  );

  // Enrich and update cache
  if (result.success && result.value) {
    const enriched = await enrichTasksWithAssignees(result.value);
    if (enriched.length > 0) {
      // Update centralized cache immediately
      taskCache.updateTask(id, enriched[0]);
    }
  }

  // Invalidate request cache
  if (result.success) {
    requestCache.invalidate("workitems");
    invalidateTaskCaches();
  }

  return result;
}

/**
 * Close a work item (mark as closed)
 *
 * @param id - Work item ID to close
 * @returns Result containing updated work item array, or error if update fails
 */
export async function closeWorkItem(
  id: number,
): Promise<Result<Task[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid work item ID", "id", id));
  }

  // Get current task for logging
  const currentItemResult = await getRowByIdResult<Task>("_bpm_tasks", id);
  if (!currentItemResult.success) {
    return err(currentItemResult.error);
  }

  const result = await updateRowsResult<Task>(
    "_bpm_tasks",
    { id: `eq.${id}` },
    {
      closed: true,
      updated_at: new Date().toISOString(),
    },
  );

  // Log work item closed event
  if (result.success) {
    await eventLogService
      .logEvent("work_item_closed", "work_item", id, {
        oldValues: { closed: false },
        newValues: { closed: true },
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidate("workitems");
    invalidateTaskCaches();
  }

  return result;
}

/**
 * Get closed work items (archived)
 *
 * @param assignee_id - Optional assignee filter (null shows all)
 * @returns Result containing array of closed work items, or error if query fails
 */
export async function getClosedWorkItems(
  assignee_id?: string | null,
): Promise<Result<Task[], AppError>> {
  const filterObj: Record<string, string> = {
    task_type: "in.(manual,help)",
    closed: "eq.true",
  };

  // Handle assignee filtering via junction table
  if (assignee_id !== undefined) {
    const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    const taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter === null) {
      // assignee_id is null - we want tasks with NO assignees
      const allAssigneesResult = await queryTableResult<{ task_id: number }>(
        "_bpm_task_assignees",
        {},
      );
      if (allAssigneesResult.success) {
        const tasksWithAssignees = new Set(
          allAssigneesResult.value.data.map((row) => row.task_id),
        );
        // We'll filter these out after fetching
      }
    } else if (taskIdsFilter.length === 0) {
      // No tasks found for this assignee
      return ok([]);
    } else {
      filterObj.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }

  const result = await queryTableResult<any>("_bpm_tasks", {
    filter: filterObj,
    order: "updated_at.desc", // Most recently closed first
  });

  if (!result.success) {
    return err(result.error);
  }

  let tasks = result.value.data;

  // If filtering for null assignee, filter out tasks that have assignees
  if (assignee_id === null) {
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
  const enrichedTasks = await enrichTasksWithAssignees(tasks);

  return ok(enrichedTasks);
}

/**
 * Delete a work item
 *
 * @param id - Work item ID to delete
 * @returns Result with success/error status
 */
export async function deleteWorkItem(
  id: number,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid work item ID", "id", id));
  }

  // Get task data before deletion for logging
  const currentItemResult = await getRowByIdResult<Task>("_bpm_tasks", id);
  const currentItem = currentItemResult.success
    ? currentItemResult.value
    : null;

  const result = await deleteRowsResult("_bpm_tasks", { id: `eq.${id}` });

  // Log work item deletion event if successful
  if (result.success && currentItem) {
    // Delete from centralized cache immediately
    taskCache.deleteTask(id);

    await eventLogService
      .logEvent("work_item_deleted", "work_item", id, {
        oldValues: currentItem,
      })
      .catch(console.error);

    // Invalidate request cache
    requestCache.invalidate("workitems");
    invalidateTaskCaches();
  }

  return result;
}

/**
 * Unified planning item type that can represent either a work item or case task in planning
 */
export interface UnifiedPlanningItem {
  id: number;
  type: "work_item" | "case_task";
  task_type: "help" | "manual" | "process"; // Task type from database
  subject: string;
  assignee_id?: string | null;
  owner_id?: string | null; // For case tasks
  due_date?: string | null;
  deadline?: string | null; // For case tasks
  uren?: number | null;
  tags?: string[];
  status: string;
  kanban_status: string;
  kanban_order?: number;
  relevantie?: number | null;
  voor_wie_is_het?: string | null;
  wat_ga_je_doen?: string | null;
  waarom_doe_je_het?: string | null;
  komt_van?: string | null;
  bijlagen?: string[] | null;
  created_at: string;
  updated_at: string;
  // Case-specific fields
  case_id?: number | null;
  case_name?: string | null;
  case_step_id?: number | null;
  // Process task enrichment for case tasks
  name?: string | null;
  description?: string | null;
  criteria?: string | null;
  order_index?: number | null;
  // Project access control
  project_id?: number | null;
  canInteract?: boolean;
  projectIsPrivate?: boolean;
  isProjectMember?: boolean;
}

/**
 * Unified backlog item type that can represent either a work item or case task
 */
export interface UnifiedBacklogItem {
  id: number;
  type: "work_item" | "case_task";
  task_type: "help" | "manual" | "process"; // Task type from database
  subject: string;
  assignee_id?: string | null;
  owner_id?: string | null; // For case tasks
  due_date?: string | null;
  deadline?: string | null; // For case tasks
  uren?: number | null;
  tags?: string[];
  status: string;
  kanban_status?: string;
  relevantie?: number | null;
  voor_wie_is_het?: string | null;
  wat_ga_je_doen?: string | null;
  waarom_doe_je_het?: string | null;
  komt_van?: string | null;
  bijlagen?: string[];
  created_at: string;
  updated_at: string;
  // Case task specific fields
  case_id?: number;
  case_name?: string;
  case_step_id?: number;
  task_id?: number;
  task_name?: string;
  // Work item specific fields
  project_id?: number | null;
  // Project access control
  canInteract?: boolean;
  projectIsPrivate?: boolean;
  isProjectMember?: boolean;
}

/**
 * Get unified backlog items (both work items and case tasks)
 *
 * Query all backlog tasks from _bpm_tasks in a single query to ensure complete data
 * and prevent flashing between partial and complete stats.
 *
 * @param assignee_id - Optional assignee/owner filter (null shows all)
 * @param userId - Current user ID for access control checks
 * @returns Result containing array of unified backlog items, or error if query fails
 */
export async function getUnifiedBacklogItems(
  assignee_id?: string | null,
  userId?: string,
): Promise<Result<UnifiedBacklogItem[], AppError>> {
  // Cross-request TTL cache — skip DB queries on cache hit
  const backlogCacheKey = `backlog:${assignee_id || "all"}:${userId || "anon"}`;
  const cachedBacklog = backlogCache.get(backlogCacheKey);
  if (cachedBacklog !== null) {
    return cachedBacklog;
  }

  const callTime = new Date().toISOString();
  const isServer = typeof window === "undefined";
  console.log(
    `[PERF] getUnifiedBacklogItems called at ${callTime} (${isServer ? "SERVER" : "CLIENT"}):`,
    {
      assignee_id: assignee_id !== undefined ? assignee_id || "null" : "all",
      userId: userId || "no-user",
    },
  );

  // Query all backlog tasks from _bpm_tasks in a single query (both manual and process)
  const filterObj: Record<string, string> = {
    status: "eq.backlog",
    closed: "eq.false",
  };

  // Handle assignee filtering via junction table (works for both manual and process tasks)
  let taskIdsFilter: number[] | null = null;
  if (assignee_id !== undefined) {
    const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    taskIdsFilter = taskIdsResult.value;

    if (taskIdsFilter === null) {
      // assignee_id is null - we want tasks with NO assignees
      // We'll filter these out after fetching
    } else if (taskIdsFilter.length === 0) {
      // No tasks found for this assignee — cache the empty result
      const emptyResult = ok<UnifiedBacklogItem[], AppError>([]);
      backlogCache.set(backlogCacheKey, emptyResult);
      return emptyResult;
    } else {
      filterObj.id = `in.(${taskIdsFilter.join(",")})`;
    }
  }

  // Q1: Single query to get all backlog tasks with embedded case_step→case and process_task data
  // Uses PostgREST resource embedding to eliminate 3-4 separate enrichment queries
  const allTasksResult = await queryTableResult<EmbeddedTaskRow>("_bpm_tasks", {
    select: buildTaskEmbeddingSelect(),
    filter: filterObj,
    order: "deadline.asc.nullslast,id.asc",
  });

  if (!allTasksResult.success) {
    return err(allTasksResult.error);
  }

  let allTasks = allTasksResult.value.data;

  const queryTime = new Date().toISOString();
  console.log(
    `[PERF] getUnifiedBacklogItems query completed at ${queryTime} (${isServer ? "SERVER" : "CLIENT"}):`,
    {
      rawTaskCount: allTasks.length,
      assignee_id: assignee_id !== undefined ? assignee_id || "null" : "all",
      userId: userId || "no-user",
    },
  );

  // If filtering for null assignee, filter out tasks that have assignees
  if (assignee_id === null && taskIdsFilter === null) {
    const allAssigneesResult = await queryTableResult<{ task_id: number }>(
      "_bpm_task_assignees",
      {},
    );
    if (allAssigneesResult.success) {
      const tasksWithAssignees = new Set(
        allAssigneesResult.value.data.map((row) => row.task_id),
      );
      allTasks = allTasks.filter(
        (task: any) => !tasksWithAssignees.has(task.id),
      );
    }
  }

  // Enrich all tasks together with assignee arrays (no splitting by type)
  const enrichedAllTasks = await enrichTasksWithAssignees(allTasks);

  // Update centralized cache with all fetched tasks (record-level updates)
  for (const task of enrichedAllTasks) {
    taskCache.updateTask(task.id, task as any);
  }

  // Convert all tasks to unified format using parsed embedded data
  // Data already includes case_step→case and process_task via PostgREST resource embedding
  const allItems: UnifiedBacklogItem[] = enrichedAllTasks.map((task) => {
    const taskItem = task as any;
    // Cast through any — enriched tasks from PostgREST already have the correct embedded shape,
    // but TypeScript can't reconcile the enriched type with EmbeddedTaskRow
    const parsed = parseEmbeddedTask(taskItem as unknown as EmbeddedTaskRow);

    if (parsed.type === "case_task") {
      // Process task (case task) — data already embedded from PostgREST
      const assigneeIdArray = Array.isArray(taskItem.assignee_id)
        ? taskItem.assignee_id
        : taskItem.assignee_id
          ? [taskItem.assignee_id]
          : [];
      return {
        id: parsed.id,
        type: "case_task" as const,
        task_type: parsed.task_type,
        subject: parsed.subject,
        assignee_id: assigneeIdArray,
        owner_id:
          assigneeIdArray.length > 0
            ? assigneeIdArray[0]
            : task.owner_id || null,
        deadline: parsed.deadline,
        uren: task.uren,
        tags: parsed.tags,
        status: parsed.status,
        kanban_status: parsed.kanban_status ?? undefined,
        relevantie: parsed.relevantie,
        voor_wie_is_het: parsed.voor_wie_is_het,
        wat_ga_je_doen: parsed.wat_ga_je_doen,
        waarom_doe_je_het: parsed.waarom_doe_je_het,
        komt_van: parsed.komt_van,
        bijlagen: parsed.bijlagen,
        created_at: parsed.created_at,
        updated_at: parsed.updated_at,
        case_id: parsed.case_id,
        case_name: parsed.case_name ?? undefined,
        case_step_id: parsed.case_step_id,
        task_id: parsed.task_id,
        task_name: parsed.task_name ?? undefined,
        project_id: parsed.project_id,
      } satisfies UnifiedBacklogItem;
    } else {
      // Manual task (work item)
      return {
        id: parsed.id,
        type: "work_item" as const,
        task_type: parsed.task_type,
        subject: parsed.subject,
        assignee_id: taskItem.assignee_id,
        due_date: parsed.deadline
          ? new Date(parsed.deadline).toISOString().split("T")[0]
          : null,
        deadline: parsed.deadline,
        uren: task.uren,
        tags: parsed.tags,
        status: parsed.status,
        kanban_status: parsed.kanban_status ?? undefined,
        relevantie: parsed.relevantie,
        voor_wie_is_het: parsed.voor_wie_is_het,
        wat_ga_je_doen: parsed.wat_ga_je_doen,
        waarom_doe_je_het: parsed.waarom_doe_je_het,
        komt_van: parsed.komt_van,
        bijlagen: parsed.bijlagen,
        created_at: parsed.created_at,
        updated_at: parsed.updated_at,
        project_id: parsed.project_id,
      } satisfies UnifiedBacklogItem;
    }
  });

  // Sort by deadline ascending (earliest first, nulls last), with stable secondary sort
  // Using id as secondary key to maintain stable order for items with same deadline
  allItems.sort((a, b) => {
    // Get the date from either deadline or due_date field
    const dateA = a.deadline || a.due_date;
    const dateB = b.deadline || b.due_date;

    // Items without date go to the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    // Compare dates (ascending - earliest first)
    const dateDiff = new Date(dateA).getTime() - new Date(dateB).getTime();

    // If dates are equal, use id as stable secondary sort to prevent reordering
    if (dateDiff === 0) {
      return a.id - b.id;
    }

    return dateDiff;
  });

  // Batch check project access (much faster than N individual calls)
  const projectIds = allItems.map((item) => item.project_id);
  const accessMap = await projectAuthService.batchCanAccessProjects(
    projectIds,
    userId,
  );

  // Add canInteract flag based on project access
  // Users can interact if: no project OR assigned to task OR project member/public
  const itemsWithAccess = allItems.map((item) => {
    if (!item.project_id) {
      return { ...item, canInteract: true };
    }

    // Check if user is assigned to this task (always allow access if assigned)
    if (userId) {
      const assigneeIds = Array.isArray(item.assignee_id)
        ? item.assignee_id
        : item.assignee_id
          ? [item.assignee_id]
          : [];
      const ownerId = item.owner_id;

      if (assigneeIds.includes(userId) || ownerId === userId) {
        return { ...item, canInteract: true };
      }
    }

    // Use batch result
    const canInteract = accessMap.get(item.project_id) ?? false;
    return { ...item, canInteract };
  });

  // Log the results for debugging
  if (import.meta.env.DEV) {
    const logTime = new Date().toISOString();
    const filteredCount = itemsWithAccess.filter(
      (item) => !item.canInteract,
    ).length;
    console.log(`[PERF] getUnifiedBacklogItems completed at ${logTime}:`, {
      totalItems: allItems.length,
      itemsWithAccess: itemsWithAccess.length,
      itemsFilteredOut: filteredCount,
      userId: userId || "no-user",
      assigneeFilter: assignee_id !== undefined ? assignee_id || "null" : "all",
    });
  }

  const backlogResult = ok<UnifiedBacklogItem[], AppError>(itemsWithAccess);
  // Cache successful result (30s TTL, lazy expiration)
  backlogCache.set(backlogCacheKey, backlogResult);
  return backlogResult;
}

/**
 * Get all closed (archived) items (both work items and case tasks)
 *
 * @param assignee_id - Optional assignee/owner filter (null shows all)
 * @returns Result containing array of closed unified items, or error if query fails
 */
export async function getClosedUnifiedItems(
  assignee_id?: string | null,
  userId?: string,
): Promise<Result<UnifiedBacklogItem[], AppError>> {
  // Fetch closed work items
  const workItemsResult = await getClosedWorkItems(assignee_id);
  if (!workItemsResult.success) {
    return err(workItemsResult.error);
  }

  // Fetch closed case tasks
  let caseTasksResult: Result<CaseTask[], AppError>;
  try {
    const caseServiceModule = await import("./caseService");
    if (!caseServiceModule.getClosedCaseTasks) {
      return err(
        AppError.from(
          new Error("getClosedCaseTasks function not found in caseService"),
        ),
      );
    }
    const result = await caseServiceModule.getClosedCaseTasks(assignee_id);
    if (!result || typeof result !== "object" || !("success" in result)) {
      return err(
        AppError.from(new Error("getClosedCaseTasks returned invalid result")),
      );
    }
    caseTasksResult = result;
  } catch (error) {
    return err(NetworkError.from(error as Error, "./caseService"));
  }

  if (!caseTasksResult.success) {
    return err(caseTasksResult.error);
  }

  // Convert work items to unified format
  const unifiedWorkItems: UnifiedBacklogItem[] = workItemsResult.value.map(
    (item) => {
      const taskItem = item as any;
      return {
        id: item.id,
        type: "work_item" as const,
        task_type: item.task_type || "manual",
        subject: item.subject || "Geen titel",
        assignee_id: item.assignee_id?.[0] ?? null,
        due_date: taskItem.deadline
          ? new Date(taskItem.deadline).toISOString().split("T")[0]
          : null,
        deadline: taskItem.deadline,
        uren: item.uren,
        tags: item.tags,
        status: item.status,
        kanban_status: item.kanban_status,
        relevantie: item.relevantie,
        voor_wie_is_het: item.voor_wie_is_het,
        wat_ga_je_doen: item.wat_ga_je_doen,
        waarom_doe_je_het: item.waarom_doe_je_het,
        komt_van: item.komt_van,
        bijlagen: item.bijlagen,
        created_at: item.created_at,
        updated_at: item.updated_at,
        project_id: item.project_id,
      };
    },
  );

  // Enrich case tasks with case and process task info
  const caseTasks: CaseTask[] = (
    Array.isArray(caseTasksResult.value)
      ? caseTasksResult.value
      : (caseTasksResult.value as any).data || []
  ) as CaseTask[];
  const caseStepIds = [
    ...new Set(caseTasks.map((t: CaseTask) => t.case_step_id)),
  ];
  const taskIds = [...new Set(caseTasks.map((t: CaseTask) => t.task_id))];

  // Maps to store enrichment data
  const caseMap = new Map<number, any>();
  const caseStepToCaseMap = new Map<number, number>();
  const processTaskMap = new Map<number, any>();

  // Fetch case steps to get case IDs
  if (caseStepIds.length > 0) {
    const caseStepsResult = await queryTableResult<any>("_bpm_case_steps", {
      filter: { id: `in.(${caseStepIds.join(",")})` },
    });

    if (caseStepsResult.success) {
      const caseSteps = Array.isArray(caseStepsResult.value)
        ? caseStepsResult.value
        : caseStepsResult.value.data || [];
      const allCaseIds = [...new Set(caseSteps.map((s: any) => s.case_id))];

      for (const step of caseSteps) {
        caseStepToCaseMap.set(step.id, step.case_id);
      }

      if (allCaseIds.length > 0) {
        const casesResult = await queryTableResult<any>("_bpm_cases", {
          filter: { id: `in.(${allCaseIds.join(",")})` },
        });

        if (casesResult.success) {
          for (const caseData of casesResult.value.data) {
            caseMap.set(caseData.id, caseData);
          }
        }
      }
    }
  }

  // Fetch process task names
  if (taskIds.length > 0) {
    const processTasksResult = await queryTableResult<any>(
      "_bpm_process_tasks",
      {
        filter: { id: `in.(${taskIds.join(",")})` },
      },
    );

    if (processTasksResult.success) {
      for (const processTask of processTasksResult.value.data) {
        processTaskMap.set(processTask.id, processTask);
      }
    }
  }

  // Convert case tasks to unified format
  const unifiedCaseTasks: UnifiedBacklogItem[] = caseTasks.map((task) => {
    const caseId = caseStepToCaseMap.get(task.case_step_id);
    const caseData = caseId ? caseMap.get(caseId) : null;
    const processTask = processTaskMap.get(task.task_id);

    const taskItem = task as any;
    return {
      id: task.id,
      type: "case_task" as const,
      task_type: "process" as const,
      subject: processTask?.name || taskItem.subject || `Taak #${task.task_id}`,
      owner_id: taskItem.assignee_id || task.owner_id,
      deadline: task.deadline,
      uren: task.uren,
      tags: [],
      status: task.status,
      kanban_status: task.kanban_status,
      relevantie: taskItem.relevantie,
      voor_wie_is_het: taskItem.voor_wie_is_het,
      wat_ga_je_doen: taskItem.wat_ga_je_doen,
      waarom_doe_je_het: taskItem.waarom_doe_je_het,
      komt_van: taskItem.komt_van,
      bijlagen: taskItem.bijlagen || [],
      created_at: task.created_at,
      updated_at: task.updated_at,
      case_id: caseId,
      case_name: caseData?.name,
      case_step_id: task.case_step_id,
      task_id: task.task_id,
      task_name: processTask?.name,
    };
  });

  // Combine and sort by updated_at descending (most recently closed first)
  const allItems = [...unifiedWorkItems, ...unifiedCaseTasks].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Batch check project access - get all unique project IDs
  const projectIds = [
    ...new Set(
      allItems
        .map((i) => i.project_id)
        .filter((id): id is number => id !== null && id !== undefined),
    ),
  ];
  const accessMap = await projectAuthService.batchCanAccessProjects(
    projectIds,
    userId,
  );

  // Apply access checks using the cached results
  const itemsWithAccess = allItems.map((item) => {
    if (!item.project_id) {
      return { ...item, canInteract: true };
    }

    // Check if user is assigned to this task (always allow access if assigned)
    if (userId) {
      const assigneeIds = Array.isArray(item.assignee_id)
        ? item.assignee_id
        : item.assignee_id
          ? [item.assignee_id]
          : [];
      const ownerId = item.owner_id; // For case tasks

      if (assigneeIds.includes(userId) || ownerId === userId) {
        return { ...item, canInteract: true };
      }
    }

    // Use batch result
    const canInteract = accessMap.get(item.project_id) ?? true;
    return { ...item, canInteract };
  });

  return ok(itemsWithAccess);
}

/**
 * Get all unified work items (both work items and case tasks regardless of status)
 * This is similar to getUnifiedBacklogItems but includes all items, not just backlog
 *
 * @param assignee_id - Optional assignee/owner filter (null shows all)
 * @param statusFilter - Optional status filter (Dutch kanban_status values like 'backlog', 'gepland', 'mee_bezig', 'in_review', 'afgerond', or comma-separated like 'mee_bezig,in_review', or null for all)
 * @param userId - Optional user ID for access checks
 * @param filters - Optional filters object { project_id?: number }
 * @returns Result containing array of unified work items, or error if query fails
 */
export async function getAllUnifiedWorkItems(
  assignee_id?: string | null,
  statusFilter?: string | null,
  userId?: string,
  filters?: { project_id?: number },
): Promise<Result<UnifiedBacklogItem[], AppError>> {
  // Create cache key based on parameters
  const cacheKey = `workitems:all:${assignee_id || "all"}:${statusFilter || "all"}:${userId || "anon"}:${filters?.project_id || "all"}`;

  return await requestCache.get<Result<UnifiedBacklogItem[], AppError>>(
    cacheKey,
    async () => {
      // Fetch all work items (not just backlog)
      const workItemsFilter: Record<string, string> = {
        task_type: "eq.manual",
        closed: "eq.false",
      };

      // Apply project_id filter at database level if provided
      if (filters?.project_id !== undefined) {
        workItemsFilter.project_id = `eq.${filters.project_id}`;
      }

      // Handle assignee filtering via junction table
      let workItemTaskIdsFilter: number[] | null = null;
      if (assignee_id !== undefined) {
        const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
        if (!taskIdsResult.success) {
          return err(taskIdsResult.error);
        }
        workItemTaskIdsFilter = taskIdsResult.value;

        if (workItemTaskIdsFilter === null) {
          // assignee_id is null - we want tasks with NO assignees
          // We'll filter these out after fetching
        } else if (workItemTaskIdsFilter.length === 0) {
          // No tasks found for this assignee - but continue to check case tasks
          workItemsFilter.id = "eq.-1"; // Impossible ID to return empty
        } else {
          workItemsFilter.id = `in.(${workItemTaskIdsFilter.join(",")})`;
        }
      }

      // Apply status filter at database level if provided
      if (statusFilter) {
        // Handle comma-separated status values
        const statusValues = statusFilter
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);

        // Check if filtering for completed tasks - if so, include closed tasks too
        const isFilteringCompleted = statusValues.some((s) => s === "afgerond");

        if (statusValues.length === 1) {
          const status = statusValues[0];
          // Handle overdue filter (deadline < today AND kanban_status not in ('afgerond'))
          if (status === "overdue") {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
            workItemsFilter.deadline = `lt.${today}`;
            workItemsFilter.kanban_status = "not.in.(afgerond)";
          } else {
            // Single status value - filter by kanban_status
            workItemsFilter.kanban_status = `eq.${status}`;
            // If filtering for completed tasks, remove closed filter to show all completed tasks (both open and closed)
            if (status === "afgerond") {
              delete workItemsFilter.closed;
            }
          }
        } else if (statusValues.length > 1) {
          // Multiple status values - use 'in' filter
          workItemsFilter.kanban_status = `in.(${statusValues.join(",")})`;
          // If filtering includes completed tasks, remove closed filter to include both open and closed tasks
          if (isFilteringCompleted) {
            delete workItemsFilter.closed;
          }
        }
      }

      const workItemsResult = await queryTableResult<Task>("_bpm_tasks", {
        filter: workItemsFilter,
        order: "created_at.desc",
      });
      if (!workItemsResult.success) {
        return err(workItemsResult.error);
      }

      // Fetch all case tasks (not just case-log)
      let getAllCaseTasksFn:
        | ((filters?: {
            owner_id?: string | null;
            status?: string;
          }) => Promise<Result<CaseTask[], AppError>>)
        | undefined;
      try {
        const caseServiceModule = await import("./caseService");
        if (!caseServiceModule.getAllCaseTasks) {
          return err(
            AppError.from(
              new Error("getAllCaseTasks function not found in caseService"),
            ),
          );
        }
        getAllCaseTasksFn = caseServiceModule.getAllCaseTasks;
      } catch (error) {
        return err(NetworkError.from(error as Error, "./caseService"));
      }

      // Apply status filter at database level for case tasks if provided
      let caseTasksResult: Result<CaseTask[], AppError>;
      if (statusFilter) {
        const statusValues = statusFilter
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
        const caseTasksFilter: Record<string, string> = {
          task_type: "eq.process",
          closed: "eq.false",
        };

        // Handle assignee filtering via junction table for case tasks
        let caseTaskIdsFilter: number[] | null = null;
        if (assignee_id !== undefined) {
          const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
          if (!taskIdsResult.success) {
            return err(taskIdsResult.error);
          }
          caseTaskIdsFilter = taskIdsResult.value;

          if (caseTaskIdsFilter === null) {
            // assignee_id is null - we want tasks with NO assignees
            // We'll filter these out after fetching
          } else if (caseTaskIdsFilter.length === 0) {
            // No tasks found for this assignee
            caseTasksFilter.id = "eq.-1"; // Impossible ID to return empty
          } else {
            caseTasksFilter.id = `in.(${caseTaskIdsFilter.join(",")})`;
          }
        }

        // Check if filtering for completed tasks - if so, include closed tasks too
        const isFilteringCompleted = statusValues.some((s) => s === "afgerond");

        if (statusValues.length === 1) {
          const status = statusValues[0];
          // Handle overdue filter (deadline < today AND kanban_status not in ('afgerond'))
          if (status === "overdue") {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
            caseTasksFilter.deadline = `lt.${today}`;
            caseTasksFilter.kanban_status = "not.in.(afgerond)";
          } else {
            // Single status value - filter by kanban_status
            caseTasksFilter.kanban_status = `eq.${status}`;
            // If filtering for completed tasks, remove closed filter to show all completed tasks (both open and closed)
            if (status === "afgerond") {
              delete caseTasksFilter.closed;
            }
          }
        } else if (statusValues.length > 1) {
          // Multiple status values - use 'in' filter
          caseTasksFilter.kanban_status = `in.(${statusValues.join(",")})`;
          // If filtering includes completed tasks, remove closed filter to include both open and closed tasks
          if (isFilteringCompleted) {
            delete caseTasksFilter.closed;
          }
        }

        caseTasksResult = (await queryTableResult<any>("_bpm_tasks", {
          filter: caseTasksFilter,
          order: "created_at.desc",
        })) as unknown as Result<CaseTask[], AppError>;
      } else {
        if (!getAllCaseTasksFn) {
          return err(
            AppError.from(new Error("getAllCaseTasks function not available")),
          );
        }
        const result = await getAllCaseTasksFn({
          owner_id: assignee_id,
          status: undefined, // Get all statuses
        });
        if (!result || typeof result !== "object" || !("success" in result)) {
          return err(
            AppError.from(new Error("getAllCaseTasks returned invalid result")),
          );
        }
        caseTasksResult = result;
      }

      if (!caseTasksResult.success) {
        return err(caseTasksResult.error);
      }

      // Enrich work items with assignees
      const workItems = Array.isArray(workItemsResult.value)
        ? workItemsResult.value
        : workItemsResult.value.data || [];
      const enrichedWorkItems = await enrichTasksWithAssignees(workItems);

      // Convert work items to unified format
      const unifiedWorkItems: UnifiedBacklogItem[] = enrichedWorkItems.map(
        (item) => {
          const taskItem = item as any;
          return {
            id: item.id,
            type: "work_item" as const,
            task_type: item.task_type,
            subject: item.subject || "Geen titel",
            assignee_id: item.assignee_id,
            due_date: taskItem.deadline
              ? new Date(taskItem.deadline).toISOString().split("T")[0]
              : null,
            deadline: taskItem.deadline,
            uren: item.uren,
            tags: item.tags,
            status: item.status,
            kanban_status: item.kanban_status,
            relevantie: item.relevantie,
            voor_wie_is_het: item.voor_wie_is_het,
            wat_ga_je_doen: item.wat_ga_je_doen,
            waarom_doe_je_het: item.waarom_doe_je_het,
            komt_van: item.komt_van,
            bijlagen: item.bijlagen,
            created_at: item.created_at,
            updated_at: item.updated_at,
            project_id: item.project_id,
          };
        },
      );

      // Enrich case tasks with case and process task info
      const caseTasks: CaseTask[] = (
        Array.isArray(caseTasksResult.value)
          ? caseTasksResult.value
          : (caseTasksResult.value as any).data || []
      ) as CaseTask[];
      const caseStepIds = [...new Set(caseTasks.map((t) => t.case_step_id))];
      const taskIds = [...new Set(caseTasks.map((t) => t.task_id))];

      // Maps to store enrichment data
      const caseMap = new Map<number, any>();
      const caseStepToCaseMap = new Map<number, number>();
      const processTaskMap = new Map<number, any>();

      // Fetch case steps to get case IDs
      if (caseStepIds.length > 0) {
        const caseStepsResult = await queryTableResult<any>("_bpm_case_steps", {
          filter: { id: `in.(${caseStepIds.join(",")})` },
        });

        if (caseStepsResult.success) {
          const caseSteps = caseStepsResult.value.data;
          const allCaseIds = [...new Set(caseSteps.map((s: any) => s.case_id))];

          for (const step of caseSteps) {
            caseStepToCaseMap.set(step.id, step.case_id);
          }

          if (allCaseIds.length > 0) {
            const casesResult = await queryTableResult<any>("_bpm_cases", {
              filter: { id: `in.(${allCaseIds.join(",")})` },
            });

            if (casesResult.success) {
              for (const caseData of casesResult.value.data) {
                caseMap.set(caseData.id, caseData);
              }
            }
          }
        }
      }

      // Fetch process task names
      if (taskIds.length > 0) {
        const processTasksResult = await queryTableResult<any>(
          "_bpm_process_tasks",
          {
            filter: { id: `in.(${taskIds.join(",")})` },
          },
        );

        if (processTasksResult.success) {
          for (const processTask of processTasksResult.value.data) {
            processTaskMap.set(processTask.id, processTask);
          }
        }
      }

      // Convert case tasks to unified format
      const unifiedCaseTasks: UnifiedBacklogItem[] = caseTasks.map(
        (task: CaseTask) => {
          const caseId = caseStepToCaseMap.get(task.case_step_id);
          const caseData = caseId ? caseMap.get(caseId) : null;
          const processTask = processTaskMap.get(task.task_id);

          const taskItem = task as any;
          return {
            id: task.id,
            type: "case_task" as const,
            task_type: "process" as const,
            subject:
              processTask?.name || taskItem.subject || `Taak #${task.task_id}`,
            owner_id: taskItem.assignee_id || task.owner_id,
            deadline: task.deadline,
            due_date: task.deadline
              ? new Date(task.deadline).toISOString().split("T")[0]
              : null,
            uren: task.uren,
            tags: [],
            status: task.status,
            kanban_status: task.kanban_status,
            relevantie: taskItem.relevantie,
            voor_wie_is_het: taskItem.voor_wie_is_het,
            wat_ga_je_doen: taskItem.wat_ga_je_doen,
            waarom_doe_je_het: taskItem.waarom_doe_je_het,
            komt_van: taskItem.komt_van,
            bijlagen: taskItem.bijlagen || [],
            created_at: task.created_at,
            updated_at: task.updated_at,
            case_id: caseId,
            case_name: caseData?.name,
            case_step_id: task.case_step_id,
            task_id: task.task_id,
            task_name: processTask?.name,
            project_id: caseData?.project_id || null,
          };
        },
      );

      // Combine all items
      let allItems = [...unifiedWorkItems, ...unifiedCaseTasks];

      // Status filtering is already done at database level, so no need to filter again here

      // Sort by created_at (newest first)
      allItems.sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      // Add canInteract flag based on project access
      // Users can interact if: no project OR assigned to task OR project member/public
      // Batch project access check to avoid N+1 queries
      const projectIds = [
        ...new Set(allItems.map((item) => item.project_id).filter(Boolean)),
      ] as number[];
      const accessMap = await projectAuthService.batchCanAccessProjects(
        projectIds,
        userId,
      );

      const itemsWithAccess = allItems.map((item) => {
        if (!item.project_id) {
          return { ...item, canInteract: true };
        }

        if (userId) {
          const assigneeIds = Array.isArray(item.assignee_id)
            ? item.assignee_id
            : item.assignee_id
              ? [item.assignee_id]
              : [];
          const ownerId = item.owner_id;

          if (assigneeIds.includes(userId) || ownerId === userId) {
            return { ...item, canInteract: true };
          }
        }

        const canInteract = accessMap.get(item.project_id) ?? false;
        return { ...item, canInteract };
      });

      return ok(itemsWithAccess);
    },
  );
}

/**
 * Get unified planning items (both work items and case tasks with planning status)
 *
 * @param assignee_id - Optional assignee filter (null shows all items)
 * @returns Result containing array of unified planning items, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getUnifiedPlanningItems('user123');
 * if (result.success) {
 *   console.log(result.value); // UnifiedPlanningItem[]
 * }
 * ```
 */
export async function getUnifiedPlanningItems(
  assignee_id?: string | null,
  userId?: string,
): Promise<Result<UnifiedPlanningItem[], AppError>> {
  // Cross-request TTL cache — skip DB queries on cache hit
  const planningCacheKey = `planning:${assignee_id || "all"}:${userId || "anon"}`;
  const cachedPlanning = planningCache.get(planningCacheKey);
  if (cachedPlanning !== null) {
    return cachedPlanning;
  }

  // Per-request deduplication cache key
  const cacheKey = `workitems:planning:${assignee_id || "all"}`;

  const result = await requestCache.get<
    Result<UnifiedPlanningItem[], AppError>
  >(cacheKey, async () => {
    // Helper to fetch case tasks (wraps dynamic import + validation)
    const fetchCaseTasks = async (): Promise<Result<CaseTask[], AppError>> => {
      try {
        const caseServiceModule = await import("./caseService");
        if (!caseServiceModule.getPlanningCaseTasks) {
          return err(
            AppError.from(
              new Error(
                "getPlanningCaseTasks function not found in caseService",
              ),
            ),
          );
        }
        const result =
          await caseServiceModule.getPlanningCaseTasks(assignee_id);
        if (!result || typeof result !== "object" || !("success" in result)) {
          return err(
            AppError.from(
              new Error("getPlanningCaseTasks returned invalid result"),
            ),
          );
        }
        return result as Result<CaseTask[], AppError>;
      } catch (error) {
        return err(NetworkError.from(error as Error, "./caseService"));
      }
    };

    // Parallelize independent fetches: work items and case tasks
    const [workItemsResult, caseTasksResult] = await Promise.all([
      getPlanningWorkItems(assignee_id),
      fetchCaseTasks(),
    ]);

    if (!workItemsResult.success) {
      return err(workItemsResult.error);
    }

    if (!caseTasksResult.success) {
      return err(caseTasksResult.error);
    }

    const workItems = workItemsResult.value;
    const caseTasks: CaseTask[] = (
      Array.isArray(caseTasksResult.value)
        ? caseTasksResult.value
        : (caseTasksResult.value as any).data || []
    ) as CaseTask[];

    // Update centralized cache with all fetched work items (record-level updates)
    for (const task of workItems) {
      taskCache.updateTask(task.id, task);
    }

    // Convert work items to unified format
    // Note: work items now use deadline instead of due_date, but we map it back for compatibility
    const unifiedWorkItems: UnifiedPlanningItem[] = workItems.map((item) => {
      const taskItem = item as any; // Type assertion since WorkItem schema may not have deadline yet
      return {
        id: item.id,
        type: "work_item" as const,
        task_type: taskItem.task_type || "manual", // Include task_type (help, manual, or process)
        subject: item.subject || "Geen titel",
        assignee_id: item.assignee_id?.[0] ?? null,
        due_date: taskItem.deadline
          ? new Date(taskItem.deadline).toISOString().split("T")[0]
          : null, // Map deadline back to due_date for compatibility
        deadline: taskItem.deadline, // Include deadline field
        uren: item.uren,
        tags: item.tags,
        status: item.status,
        kanban_status: item.kanban_status || "gepland", // Default to 'gepland' if not set
        kanban_order: item.kanban_order ?? 0,
        relevantie: item.relevantie,
        voor_wie_is_het: item.voor_wie_is_het,
        wat_ga_je_doen: item.wat_ga_je_doen,
        waarom_doe_je_het: item.waarom_doe_je_het,
        komt_van: item.komt_van,
        bijlagen: item.bijlagen,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    // For case tasks, we need to enrich them with case and process task data
    // Get unique case step IDs and task IDs
    const caseStepIds = [
      ...new Set(caseTasks.map((t: CaseTask) => t.case_step_id)),
    ];
    const taskIds = [...new Set(caseTasks.map((t: CaseTask) => t.task_id))];

    // Initialize maps outside conditionals so they're always in scope
    const caseStepMap = new Map<number, any>();
    const caseMap = new Map<number, any>();
    const processTaskMap = new Map<number, any>();

    // Parallelize independent enrichment queries: _bpm_case_steps and _bpm_process_tasks
    // Both only depend on IDs extracted from caseTasks, not on each other
    const [caseStepsResult, processTasksResult] = await Promise.all([
      caseStepIds.length > 0
        ? queryTableResult("_bpm_case_steps", {
            filter: { id: `in.(${caseStepIds.join(",")})` },
          })
        : Promise.resolve(null),
      taskIds.length > 0
        ? queryTableResult("_bpm_process_tasks", {
            filter: { id: `in.(${taskIds.join(",")})` },
          })
        : Promise.resolve(null),
    ]);

    // Process case_steps result → populate maps → then fetch cases (cases depend on case_steps)
    if (caseStepsResult && caseStepsResult.success) {
      const caseSteps = Array.isArray(caseStepsResult.value)
        ? caseStepsResult.value
        : caseStepsResult.value.data || [];
      // First pass: populate caseStepMap
      for (const caseStep of caseSteps) {
        caseStepMap.set(caseStep.id, caseStep);
      }

      // Batch fetch case data (fixes N+1 query pattern)
      const uniqueCaseIds = [
        ...new Set(caseSteps.map((cs: any) => cs.case_id).filter(Boolean)),
      ];
      if (uniqueCaseIds.length > 0) {
        const casesResult = await queryTableResult("_bpm_cases", {
          filter: { id: `in.(${uniqueCaseIds.join(",")})` },
        });
        if (casesResult.success) {
          const cases = Array.isArray(casesResult.value)
            ? casesResult.value
            : casesResult.value.data || [];
          for (const c of cases) {
            caseMap.set(c.id, c);
          }
        }
      }
    }

    // Process process_tasks result (independent — already fetched in parallel)
    if (processTasksResult && processTasksResult.success) {
      for (const processTask of processTasksResult.value.data) {
        processTaskMap.set(processTask.id, processTask);
      }
    }

    // Convert case tasks to unified format
    const unifiedCaseTasks: UnifiedPlanningItem[] = caseTasks.map(
      (task: CaseTask) => {
        const caseStep = caseStepMap.get(task.case_step_id);
        const caseData = caseStep ? caseMap.get(caseStep.case_id) : null;
        const processTask = processTaskMap.get(task.task_id);

        const taskItem = task as any; // Type assertion since CaseTask schema may have assignee_id now
        // Handle assignee_id as array (from junction table) - take first element for owner_id compatibility
        const assigneeIdArray = Array.isArray(taskItem.assignee_id)
          ? taskItem.assignee_id
          : taskItem.assignee_id
            ? [taskItem.assignee_id]
            : [];
        return {
          id: task.id,
          type: "case_task" as const,
          task_type: "process" as const, // Case tasks are always process type
          subject: processTask?.name || taskItem.subject || `Task ${task.id}`,
          assignee_id: assigneeIdArray, // Include assignee_id array for filtering
          owner_id:
            assigneeIdArray.length > 0
              ? assigneeIdArray[0]
              : task.owner_id || null, // Map first assignee to owner_id for compatibility
          deadline: task.deadline,
          uren: task.uren,
          status: task.status,
          kanban_status: task.kanban_status || "gepland",
          kanban_order: task.kanban_order ?? 0,
          created_at: task.created_at,
          updated_at: task.updated_at,
          // Case-specific fields
          case_id: caseStep?.case_id || null,
          case_name: caseData?.name || null,
          case_step_id: task.case_step_id,
          // Process task enrichment
          name: processTask?.name || null,
          description: processTask?.description || null,
          criteria: processTask?.criteria || null,
          order_index: processTask?.order_index || null,
        };
      },
    );

    // Add project_id to work items
    const workItemsWithProject = unifiedWorkItems.map((item) => {
      const workItem = workItems.find((wi) => wi.id === item.id);
      return {
        ...item,
        project_id: (workItem as any)?.project_id || null,
      };
    });

    // Add project_id to case tasks (inherit from their cases)
    const caseTasksWithProject = unifiedCaseTasks.map((item) => {
      const caseData =
        item.case_id != null ? caseMap.get(item.case_id) : undefined;
      return {
        ...item,
        project_id: caseData?.project_id || null, // Inherit project_id from parent case
      };
    });

    // Group by kanban_status and sort each group by kanban_order
    // Map 'backlog' to 'gepland' so backlog items show in the gepland column
    const grouped = new Map<string, UnifiedPlanningItem[]>();

    for (const item of [...workItemsWithProject, ...caseTasksWithProject]) {
      let status = item.kanban_status || "gepland";
      // Map 'backlog' to 'gepland' for kanban display (kanban doesn't have a backlog column)
      if (status === "backlog") {
        status = "gepland";
      }
      if (!grouped.has(status)) {
        grouped.set(status, []);
      }
      grouped.get(status)!.push(item);
    }

    // Sort each group by kanban_order (or created_at if kanban_order is missing)
    const allItems: UnifiedPlanningItem[] = [];
    for (const [status, items] of grouped.entries()) {
      items.sort((a, b) => {
        const orderA = (a as any).kanban_order ?? 0;
        const orderB = (b as any).kanban_order ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      allItems.push(...items);
    }

    // Batch check project access - get all unique project IDs
    const projectIds = [
      ...new Set(
        allItems
          .map((i) => i.project_id)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    ];
    const accessMap = await projectAuthService.batchCanAccessProjects(
      projectIds,
      userId,
    );

    // Apply access checks using the cached results
    const itemsWithAccess = allItems.map((item) => {
      if (!item.project_id) {
        return { ...item, canInteract: true };
      }

      // Check if user is assigned to this task (always allow access if assigned)
      if (userId) {
        const assigneeIds = Array.isArray(item.assignee_id)
          ? item.assignee_id
          : item.assignee_id
            ? [item.assignee_id]
            : [];
        const ownerId = item.owner_id; // For case tasks

        if (assigneeIds.includes(userId) || ownerId === userId) {
          return { ...item, canInteract: true };
        }
      }

      // Use batch result
      const canInteract = accessMap.get(item.project_id) ?? true;
      return { ...item, canInteract };
    });

    return ok(itemsWithAccess);
  });

  // Cache successful results only (30s TTL, lazy expiration)
  if (result.success) {
    planningCache.set(planningCacheKey, result);
  }

  return result;
}

/**
 * Get unified overdue items (both work items and case tasks that are overdue)
 * Overdue means: deadline < now AND status !== 'completed'
 *
 * @param assignee_id - Optional assignee filter (null shows all items)
 * @returns Result containing array of unified overdue items, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getUnifiedOverdueItems('user123');
 * if (result.success) {
 *   console.log(result.value); // UnifiedPlanningItem[]
 * }
 * ```
 */
export async function getUnifiedOverdueItems(
  assignee_id?: string | null,
): Promise<Result<UnifiedPlanningItem[], AppError>> {
  // Query all work items directly (not using getAllWorkItems which filters by status)
  const workItemsFilter: Record<string, string> = {
    task_type: "eq.manual",
  };

  // Handle assignee filtering via junction table
  let workItemTaskIdsFilter: number[] | null = null;
  if (assignee_id !== undefined) {
    const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    workItemTaskIdsFilter = taskIdsResult.value;

    if (workItemTaskIdsFilter === null) {
      // assignee_id is null - we want tasks with NO assignees
      // We'll filter these out after fetching
    } else if (workItemTaskIdsFilter.length === 0) {
      workItemsFilter.id = "eq.-1"; // Impossible ID to return empty
    } else {
      workItemsFilter.id = `in.(${workItemTaskIdsFilter.join(",")})`;
    }
  }

  const workItemsResult = await queryTableResult<Task>("_bpm_tasks", {
    filter: workItemsFilter,
    order: "created_at.desc",
  });
  if (!workItemsResult.success) {
    return err(workItemsResult.error);
  }

  // Query all case tasks directly (not using getAllCaseTasks which may filter by status)
  const caseTasksFilter: Record<string, string> = {
    task_type: "eq.process",
  };

  // Handle assignee filtering via junction table for case tasks
  let caseTaskIdsFilter: number[] | null = null;
  if (assignee_id !== undefined) {
    const taskIdsResult = await getTaskIdsByAssignee(assignee_id);
    if (!taskIdsResult.success) {
      return err(taskIdsResult.error);
    }
    caseTaskIdsFilter = taskIdsResult.value;

    if (caseTaskIdsFilter === null) {
      // assignee_id is null - we want tasks with NO assignees
      // We'll filter these out after fetching
    } else if (caseTaskIdsFilter.length === 0) {
      caseTasksFilter.id = "eq.-1"; // Impossible ID to return empty
    } else {
      caseTasksFilter.id = `in.(${caseTaskIdsFilter.join(",")})`;
    }
  }

  const caseTasksResult = await queryTableResult<any>("_bpm_tasks", {
    filter: caseTasksFilter,
    order: "created_at.desc",
  });
  if (!caseTasksResult.success) {
    return err(caseTasksResult.error);
  }

  let allWorkItems = workItemsResult.value.data;
  let allCaseTasks = caseTasksResult.value.data;

  // If filtering for null assignee, filter out tasks that have assignees
  if (assignee_id === null) {
    const allAssigneesResult = await queryTableResult<{ task_id: number }>(
      "_bpm_task_assignees",
      {},
    );
    if (allAssigneesResult.success) {
      const tasksWithAssignees = new Set(
        allAssigneesResult.value.data.map((row) => row.task_id),
      );
      allWorkItems = allWorkItems.filter(
        (task: any) => !tasksWithAssignees.has(task.id),
      );
      allCaseTasks = allCaseTasks.filter(
        (task: any) => !tasksWithAssignees.has(task.id),
      );
    }
  }

  // Enrich with assignee arrays
  const enrichedWorkItems = await enrichTasksWithAssignees(allWorkItems);
  const enrichedCaseTasks = await enrichTasksWithAssignees(allCaseTasks);
  const now = new Date();

  // Filter for overdue: deadline < now AND kanban_status !== 'afgerond'
  const overdueWorkItems = enrichedWorkItems.filter((item: any) => {
    if (!item.deadline || item.kanban_status === "afgerond") return false;
    return new Date(item.deadline) < now;
  });

  const overdueCaseTasks = enrichedCaseTasks.filter((task: any) => {
    if (!task.deadline || task.kanban_status === "afgerond") return false;
    return new Date(task.deadline) < now;
  });

  // Convert work items to unified format
  const unifiedWorkItems: UnifiedPlanningItem[] = overdueWorkItems.map(
    (item) => {
      const taskItem = item as any;
      return {
        id: item.id,
        type: "work_item" as const,
        task_type: taskItem.task_type || "manual",
        subject: item.subject || "Geen titel",
        assignee_id: item.assignee_id?.[0] ?? null,
        due_date: taskItem.deadline
          ? new Date(taskItem.deadline).toISOString().split("T")[0]
          : null,
        deadline: taskItem.deadline,
        uren: item.uren,
        tags: item.tags,
        status: item.status,
        kanban_status: item.kanban_status || "gepland",
        kanban_order: item.kanban_order ?? 0,
        relevantie: item.relevantie,
        voor_wie_is_het: item.voor_wie_is_het,
        wat_ga_je_doen: item.wat_ga_je_doen,
        waarom_doe_je_het: item.waarom_doe_je_het,
        komt_van: item.komt_van,
        bijlagen: item.bijlagen,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    },
  );

  // For case tasks, enrich them with case and process task data
  const caseStepIds = [...new Set(overdueCaseTasks.map((t) => t.case_step_id))];
  const taskIds = [...new Set(overdueCaseTasks.map((t) => t.task_id))];

  const caseStepMap = new Map<number, any>();
  const caseMap = new Map<number, any>();
  const processTaskMap = new Map<number, any>();

  // Fetch case step data
  if (caseStepIds.length > 0) {
    const caseStepsResult = await queryTableResult("_bpm_case_steps", {
      filter: { id: `in.(${caseStepIds.join(",")})` },
    });

    if (caseStepsResult.success) {
      const caseSteps = Array.isArray(caseStepsResult.value)
        ? caseStepsResult.value
        : caseStepsResult.value.data || [];
      // First pass: populate caseStepMap
      for (const caseStep of caseSteps) {
        caseStepMap.set(caseStep.id, caseStep);
      }

      // Batch fetch case data (fixes N+1 query pattern)
      const uniqueCaseIds = [
        ...new Set(caseSteps.map((cs: any) => cs.case_id).filter(Boolean)),
      ];
      if (uniqueCaseIds.length > 0) {
        const casesResult = await queryTableResult("_bpm_cases", {
          filter: { id: `in.(${uniqueCaseIds.join(",")})` },
        });
        if (casesResult.success) {
          const cases = Array.isArray(casesResult.value)
            ? casesResult.value
            : casesResult.value.data || [];
          for (const c of cases) {
            caseMap.set(c.id, c);
          }
        }
      }
    }
  }

  // Fetch process task data
  if (taskIds.length > 0) {
    const processTasksResult = await queryTableResult("_bpm_process_tasks", {
      filter: { id: `in.(${taskIds.join(",")})` },
    });

    if (processTasksResult.success) {
      for (const processTask of processTasksResult.value.data) {
        processTaskMap.set(processTask.id, processTask);
      }
    }
  }

  // Convert case tasks to unified format
  const unifiedCaseTasks: UnifiedPlanningItem[] = overdueCaseTasks.map(
    (task) => {
      const caseStep = caseStepMap.get(task.case_step_id);
      const caseData = caseStep ? caseMap.get(caseStep.case_id) : null;
      const processTask = processTaskMap.get(task.task_id);

      const taskItem = task as any;
      return {
        id: task.id,
        type: "case_task" as const,
        task_type: "process" as const,
        subject: processTask?.name || taskItem.subject || `Task ${task.id}`,
        owner_id: taskItem.assignee_id || task.owner_id,
        deadline: task.deadline,
        uren: task.uren,
        status: task.status,
        kanban_status: task.kanban_status || "gepland",
        kanban_order: task.kanban_order ?? 0,
        created_at: task.created_at,
        updated_at: task.updated_at,
        case_id: caseStep?.case_id || null,
        case_name: caseData?.name || null,
        case_step_id: task.case_step_id,
        name: processTask?.name || null,
        description: processTask?.description || null,
        criteria: processTask?.criteria || null,
        order_index: processTask?.order_index || null,
      };
    },
  );

  // Combine and sort by deadline (most overdue first)
  const allItems = [...unifiedWorkItems, ...unifiedCaseTasks].sort((a, b) => {
    const deadlineA = a.deadline || a.due_date;
    const deadlineB = b.deadline || b.due_date;
    if (!deadlineA && !deadlineB) return 0;
    if (!deadlineA) return 1;
    if (!deadlineB) return -1;
    return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
  });

  return ok(allItems);
}

/**
 * Reorder work items within a kanban column
 *
 * @param itemOrders - Array of {id, kanban_order} pairs for items in the column
 * @param kanban_status - The kanban status column these items belong to
 * @returns Result containing updated work items, or error if update fails
 */
export async function reorderWorkItems(
  itemOrders: Array<{ id: number; kanban_order: number }>,
  kanban_status:
    | "backlog"
    | "gepland"
    | "mee_bezig"
    | "in_review"
    | "afgerond"
    | "overdue",
): Promise<Result<Task[], AppError>> {
  if (!itemOrders || itemOrders.length === 0) {
    return err(
      ValidationError.create(
        "Item orders array cannot be empty",
        "itemOrders",
        itemOrders,
      ),
    );
  }

  // Update each item's kanban_order
  const updates = itemOrders.map(({ id, kanban_order }) => {
    if (!Number.isInteger(id) || id <= 0) {
      return err(ValidationError.create("Invalid work item ID", "id", id));
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

    return updateRowsResult<Task>(
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
      return err(result.error);
    }
  }

  // Invalidate caches after successful reorder
  requestCache.invalidate("workitems");
  invalidateTaskCaches();

  // Return success with empty array (we don't need to return all updated items)
  return ok([]);
}

// Re-export types
export type { Task } from "$lib/schemas/task";
