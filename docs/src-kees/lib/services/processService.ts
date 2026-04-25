/**
 * Process service - CRUD operations for processes, steps, and tasks
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
import { getCurrentUserId } from "$lib/utils/userUtils";
import { requestCache } from "$lib/utils/requestCache";
import * as eventLogService from "./eventLogService";
import { ValidationError, NotFoundError, AppError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  CreateProcessInputSchema,
  UpdateProcessInputSchema,
  CreateProcessStepInputSchema,
  UpdateProcessStepInputSchema,
  CreateProcessTaskInputSchema,
  UpdateProcessTaskInputSchema,
  type Process,
  type ProcessStep,
  type ProcessTask,
  type CreateProcessInput,
  type UpdateProcessInput,
  type CreateProcessStepInput,
  type UpdateProcessStepInput,
  type CreateProcessTaskInput,
  type UpdateProcessTaskInput,
} from "$lib/schemas/process";
import type {
  ProcessId,
  ProcessStepId,
  ProcessTaskId,
} from "$lib/types/utilities";
import { toProcessId, isValidProcessId } from "$lib/types/utilities";

/**
 * Get all processes (excludes archived)
 *
 * @returns Result containing array of active processes, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getAllProcesses();
 * if (result.success) {
 *   console.log(result.value); // Process[]
 * }
 * ```
 */
export async function getAllProcesses(): Promise<Result<Process[], AppError>> {
  return (await requestCache.get(
    "processes:all",
    async (conditionalHeaders) => {
      try {
        const result = await queryTableResult<Process>("_bpm_processes", {
          filter: { status: "neq.archived" },
          order: "created_at.desc",
          conditionalHeaders,
        });

        if (!result.success) {
          // Return error result with metadata
          return {
            data: err(result.error) as any,
            metadata: { status: 0, headers: new Headers() },
          };
        }

        // Handle 304 Not Modified - return special marker
        if (result.value.status === 304) {
          return {
            data: null,
            metadata: { status: 304, headers: result.value.headers },
            isNotModified: true,
          };
        }

        // Return success result with metadata
        return {
          data: ok(result.value.data) as any,
          metadata: {
            status: result.value.status,
            headers: result.value.headers,
          },
        };
      } catch (error) {
        // Catch any unexpected errors and wrap them
        const appError =
          error instanceof AppError
            ? error
            : AppError.from(
                error instanceof Error ? error : new Error(String(error)),
              );
        return {
          data: err(appError) as any,
          metadata: { status: 0, headers: new Headers() },
        };
      }
    },
  )) as Promise<Result<Process[], AppError>>;
}

/**
 * Get all processes including archived ones
 *
 * @returns Result containing array of all processes (including archived), or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getAllProcessesIncludingArchived();
 * if (result.success) {
 *   console.log(result.value); // Process[]
 * }
 * ```
 */
export async function getAllProcessesIncludingArchived(): Promise<
  Result<Process[], AppError>
> {
  const result = await queryTableResult<Process>("_bpm_processes", {
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get process by ID with steps and tasks
 *
 * @param id - Process ID (number, will be validated)
 * @returns Result containing process data with nested steps and tasks, or error if not found
 *
 * @example
 * ```typescript
 * const result = await getProcessById(123);
 * if (result.success) {
 *   console.log(result.value.process); // Process
 *   console.log(result.value.steps); // ProcessStep[] with tasks
 * } else {
 *   console.error(result.error); // NotFoundError or AppError
 * }
 * ```
 */
export async function getProcessById(id: number): Promise<
  Result<
    {
      process: Process;
      steps: (ProcessStep & { tasks: ProcessTask[] })[];
    },
    AppError
  >
> {
  // Validate ID
  if (!isValidProcessId(id)) {
    return err(ValidationError.create("Invalid process ID", "id", id));
  }

  const processId = toProcessId(id);

  return await requestCache.get<
    Result<
      { process: Process; steps: (ProcessStep & { tasks: ProcessTask[] })[] },
      AppError
    >
  >(
    `process:${id}`,
    async () => {
      // Get process
      const processResult = await getRowByIdResult<Process>(
        "_bpm_processes",
        processId,
      );
      if (!processResult.success) {
        return err(processResult.error);
      }
      const process = processResult.value;

      // Get steps
      const stepsResult = await queryTableResult<ProcessStep>(
        "_bpm_process_steps",
        {
          filter: { process_id: `eq.${processId}` },
          order: "order_index.asc",
        },
      );
      if (!stepsResult.success) {
        return err(stepsResult.error);
      }
      const steps = stepsResult.value.data;

      // Get tasks for each step
      const stepsWithTasksPromises = steps.map(async (step) => {
        const tasksResult = await queryTableResult<ProcessTask>(
          "_bpm_process_tasks",
          {
            filter: { step_id: `eq.${step.id}` },
            order: "step_order.asc", // ✅ FIXED: Order by step_order, not order_index
          },
        );
        if (!tasksResult.success) {
          // Return empty array if tasks query fails
          return { ...step, tasks: [] as ProcessTask[] };
        }
        return { ...step, tasks: tasksResult.value.data };
      });

      const stepsWithTasks = await Promise.all(stepsWithTasksPromises);

      return ok({ process, steps: stepsWithTasks });
    },
    { ttl: 60000 },
  ); // 60 seconds TTL for single entities
}

/**
 * Create a new process
 *
 * @param data - Process creation data (name, optional description, completion_days)
 * @returns Result containing created process, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await createProcess({
 *   name: 'New Process',
 *   completion_days: 30
 * });
 * if (result.success) {
 *   console.log(result.value); // Process
 * }
 * ```
 */
export async function createProcess(
  data: CreateProcessInput,
): Promise<Result<Process, AppError>> {
  // Validate input
  const validation = validateSchema(CreateProcessInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const result = await insertRowResult<Process>("_bpm_processes", {
    ...data,
    status: "active",
    updated_at: new Date().toISOString(),
  });

  // Log process creation event
  if (result.success) {
    await eventLogService
      .logEvent("process_created", "process", result.value.id, {
        newValues: result.value,
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidateEntity("process");
  }

  return result;
}

/**
 * Update a process
 *
 * @param id - Process ID to update
 * @param data - Partial process data to update (name, description, or completion_days)
 * @returns Result containing updated process array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateProcess(123, { name: 'Updated Process' });
 * if (result.success) {
 *   console.log(result.value); // Process[]
 * }
 * ```
 */
export async function updateProcess(
  id: number,
  data: UpdateProcessInput,
): Promise<Result<Process[], AppError>> {
  // Validate ID
  if (!isValidProcessId(id)) {
    return err(ValidationError.create("Invalid process ID", "id", id));
  }

  // Validate input data
  const validation = validateSchema(UpdateProcessInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const processId = toProcessId(id);

  // Get current process for logging
  const currentProcessResult = await getRowByIdResult<Process>(
    "_bpm_processes",
    processId,
  );
  if (!currentProcessResult.success) {
    return err(currentProcessResult.error);
  }
  const currentProcess = currentProcessResult.value;

  // Prepare update data - spread data directly like taskService does
  const updateData: Partial<Process> = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  const result = await updateRowsResult<Process>(
    "_bpm_processes",
    { id: `eq.${processId}` },
    updateData,
  );

  // Log detailed error if update fails
  if (!result.success) {
    console.error("[updateProcess] Update failed:", {
      processId,
      updateData,
      error: result.error,
      errorDetails: (result.error as any)?.details,
    });
  }

  // Log process update event
  if (result.success) {
    await eventLogService
      .logEvent("process_updated", "process", processId, {
        oldValues: currentProcess,
        newValues: data,
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidateEntity("process", id);
  }

  return result;
}

/**
 * Archive a process (soft delete - sets status to 'archived')
 *
 * @param id - Process ID to archive
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await archiveProcess(123);
 * if (result.success) {
 *   console.log('Process archived');
 * }
 * ```
 */
export async function archiveProcess(
  id: number,
): Promise<Result<void, AppError>> {
  // Validate ID
  if (!isValidProcessId(id)) {
    return err(ValidationError.create("Invalid process ID", "id", id));
  }

  const processId = toProcessId(id);

  const result = await updateRowsResult(
    "_bpm_processes",
    { id: `eq.${processId}` },
    {
      status: "archived",
      updated_at: new Date().toISOString(),
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // Invalidate cache
  requestCache.invalidateEntity("process", id);

  return ok(undefined);
}

/**
 * Delete a process (hard delete - use with caution)
 * This will fail if there are related cases due to foreign key constraints
 *
 * @param id - Process ID to delete
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await deleteProcess(123);
 * if (result.success) {
 *   console.log('Process deleted');
 * }
 * ```
 */
export async function deleteProcess(
  id: number,
): Promise<Result<void, AppError>> {
  // Validate ID
  if (!isValidProcessId(id)) {
    return err(ValidationError.create("Invalid process ID", "id", id));
  }

  const processId = toProcessId(id);

  // Get process data before deletion for logging
  const processResult = await getRowByIdResult<Process>(
    "_bpm_processes",
    processId,
  );
  const processData = processResult.success ? processResult.value : null;

  const result = await deleteRowsResult("_bpm_processes", {
    id: `eq.${processId}`,
  });

  // Log process deletion event if successful
  if (result.success && processData) {
    await eventLogService
      .logEvent("process_deleted", "process", processId, {
        oldValues: processData,
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidateEntity("process", id);
  }

  return result;
}

/**
 * Add a step to a process
 *
 * @param data - Step creation data
 * @returns Result containing created step, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await addStepToProcess({
 *   process_id: 123,
 *   name: 'New Step',
 *   order_index: 0,
 *   start_days_offset: 0,
 *   completion_days: 5
 * });
 * if (result.success) {
 *   console.log(result.value); // ProcessStep
 * }
 * ```
 */
export async function addStepToProcess(
  data: CreateProcessStepInput,
): Promise<Result<ProcessStep, AppError>> {
  // Validate input
  const validation = validateSchema(CreateProcessStepInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const result = await insertRowResult<ProcessStep>("_bpm_process_steps", data);

  // Log process step creation event
  if (result.success) {
    await eventLogService
      .logEvent("process_step_created", "process_step", result.value.id, {
        newValues: result.value,
        metadata: { process_id: data.process_id },
      })
      .catch(console.error);

    // Invalidate cache to ensure fresh data on next load
    requestCache.invalidateEntity("process", data.process_id);
  }

  return result;
}

/**
 * Update a step
 *
 * @param id - Step ID to update
 * @param data - Partial step data to update
 * @returns Result containing updated step array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateStep(456, { name: 'Updated Step' });
 * if (result.success) {
 *   console.log(result.value); // ProcessStep[]
 * }
 * ```
 */
export async function updateStep(
  id: number,
  data: UpdateProcessStepInput,
): Promise<Result<ProcessStep[], AppError>> {
  // Validate input
  const validation = validateSchema(UpdateProcessStepInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Get current step for logging
  const currentStepResult = await getRowByIdResult<ProcessStep>(
    "_bpm_process_steps",
    id,
  );
  const currentStep = currentStepResult.success
    ? currentStepResult.value
    : null;

  const result = await updateRowsResult<ProcessStep>(
    "_bpm_process_steps",
    { id: `eq.${id}` },
    data,
  );

  // Log step update event
  if (result.success && currentStep) {
    await eventLogService
      .logEvent("process_step_updated", "process_step", id, {
        oldValues: currentStep,
        newValues: data,
      })
      .catch(console.error);
  }

  return result;
}

/**
 * Delete a step
 *
 * First deletes all case steps and tasks that reference this process step,
 * then deletes all process tasks in this step,
 * finally deletes the process step itself to avoid foreign key constraint violations.
 *
 * @param id - Step ID to delete
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await deleteStep(456);
 * if (result.success) {
 *   console.log('Step deleted');
 * }
 * ```
 */
export async function deleteStep(id: number): Promise<Result<void, AppError>> {
  // Get step data before deletion for logging
  const stepResult = await getRowByIdResult<ProcessStep>(
    "_bpm_process_steps",
    id,
  );
  const stepData = stepResult.success ? stepResult.value : null;

  // First, get all tasks in this step
  const tasksResult = await queryTableResult<ProcessTask>(
    "_bpm_process_tasks",
    {
      filter: { step_id: `eq.${id}` },
    },
  );

  if (tasksResult.success) {
    // Delete all case tasks that reference tasks in this step
    for (const task of tasksResult.value.data) {
      await deleteRowsResult("_bpm_tasks", {
        task_id: `eq.${task.id}`,
        task_type: "eq.process",
      });
    }
  }

  // Delete all case steps that reference this process step
  await deleteRowsResult("_bpm_case_steps", { step_id: `eq.${id}` });

  // Delete all tasks in this step
  await deleteRowsResult("_bpm_process_tasks", { step_id: `eq.${id}` });

  // Finally, delete the step itself
  const result = await deleteRowsResult("_bpm_process_steps", {
    id: `eq.${id}`,
  });

  // Log step deletion event if successful
  if (result.success && stepData) {
    await eventLogService
      .logEvent("process_step_deleted", "process_step", id, {
        oldValues: stepData,
      })
      .catch(console.error);
  }

  return result;
}

/**
 * Add a task to a step
 *
 * @param data - Task creation data
 * @returns Result containing created task, or error if creation fails
 *
 * @example
 * ```typescript
 * const result = await addTaskToStep({
 *   step_id: 456,
 *   name: 'New Task',
 *   order_index: 0,
 *   deadline_days: 3
 * });
 * if (result.success) {
 *   console.log(result.value); // ProcessTask
 * }
 * ```
 */
export async function addTaskToStep(
  data: CreateProcessTaskInput,
): Promise<Result<ProcessTask, AppError>> {
  // Validate input
  const validation = validateSchema(CreateProcessTaskInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  let orderIndex = data.order_index;
  let startOffsetDays = data.start_offset_days ?? 0;

  // If from_task_id is provided, we need to:
  // 1. Find the parent task
  // 2. Calculate order_index to place task after parent
  // 3. Update order_index for all tasks after parent
  // 4. Set start_offset_days based on parent's deadline_days if not explicitly set
  if (data.from_task_id) {
    // Get the parent task
    const parentTaskResult = await getRowByIdResult<ProcessTask>(
      "_bpm_process_tasks",
      data.from_task_id,
    );
    if (!parentTaskResult.success) {
      return err(NotFoundError.resource("ProcessTask", data.from_task_id));
    }
    const parentTask = parentTaskResult.value;

    // Verify parent task is in the same step
    if (parentTask.step_id !== data.step_id) {
      return err(
        ValidationError.create(
          "Parent task must be in the same step",
          "from_task_id",
          data.from_task_id,
        ),
      );
    }

    // Get all tasks in the step to calculate order
    const allTasksResult = await queryTableResult<ProcessTask>(
      "_bpm_process_tasks",
      {
        filter: { step_id: `eq.${data.step_id}` },
        order: "order_index.asc",
      },
    );

    if (!allTasksResult.success) {
      return err(allTasksResult.error);
    }

    const allTasks = allTasksResult.value.data;

    // Find the parent task's position
    const parentIndex = allTasks.findIndex((t) => t.id === parentTask.id);
    if (parentIndex === -1) {
      return err(NotFoundError.resource("ProcessTask", data.from_task_id));
    }

    // Calculate order_index: place after parent task
    // Find the next task after parent (if any) to determine insertion point
    let nextTaskIndex = parentIndex + 1;
    while (
      nextTaskIndex < allTasks.length &&
      allTasks[nextTaskIndex].order_index === parentTask.order_index
    ) {
      nextTaskIndex++;
    }

    // If there's a next task, use its order_index, otherwise use parent's order_index + 1
    if (nextTaskIndex < allTasks.length) {
      orderIndex = allTasks[nextTaskIndex].order_index;
    } else {
      orderIndex = parentTask.order_index + 1;
    }

    // Increment order_index for all tasks that come after the insertion point
    const tasksToUpdate = allTasks.filter((t) => t.order_index >= orderIndex);
    for (const task of tasksToUpdate) {
      await updateRowsResult<ProcessTask>(
        "_bpm_process_tasks",
        { id: `eq.${task.id}` },
        {
          order_index: task.order_index + 1,
        },
      );
    }

    // Set start_offset_days based on parent's deadline_days if not explicitly set
    if (data.start_offset_days === undefined || data.start_offset_days === 0) {
      startOffsetDays = parentTask.deadline_days;
    }
  }

  const result = await insertRowResult<ProcessTask>("_bpm_process_tasks", {
    ...data,
    order_index: orderIndex,
    start_offset_days: startOffsetDays,
    links: data.links || [],
  });

  // Log process task creation event
  if (result.success) {
    await eventLogService
      .logEvent("process_task_created", "process_task", result.value.id, {
        newValues: result.value,
        metadata: { process_step_id: data.step_id },
      })
      .catch(console.error);

    // Invalidate process cache so new task data (including hours) is shown
    // Get the step to find the process_id
    const stepResult = await getRowByIdResult<ProcessStep>(
      "_bpm_process_steps",
      data.step_id,
    );
    if (stepResult.success) {
      requestCache.invalidateEntity("process", stepResult.value.process_id);
    }
  }

  return result;
}

/**
 * Update a task
 *
 * @param id - Task ID to update
 * @param data - Partial task data to update
 * @returns Result containing updated task array, or error if update fails
 *
 * @example
 * ```typescript
 * const result = await updateTask(789, { name: 'Updated Task' });
 * if (result.success) {
 *   console.log(result.value); // ProcessTask[]
 * }
 * ```
 */
export async function updateTask(
  id: number,
  data: UpdateProcessTaskInput,
): Promise<Result<ProcessTask[], AppError>> {
  // Validate input
  const validation = validateSchema(UpdateProcessTaskInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // If name is being updated, sync subject field in all related case tasks
  if (data.name !== undefined) {
    // Update all case tasks that reference this process task
    const syncResult = await updateRowsResult<any>(
      "_bpm_tasks",
      { task_id: `eq.${id}`, task_type: `eq.process` },
      {
        subject: data.name,
        updated_at: new Date().toISOString(),
      },
    );

    if (!syncResult.success) {
      // Log error but don't fail the process task update
      console.error(
        `Failed to sync subject for case tasks referencing process task ${id}:`,
        syncResult.error,
      );
    }
  }

  // Get current task for logging
  const currentTaskResult = await getRowByIdResult<ProcessTask>(
    "_bpm_process_tasks",
    id,
  );
  const currentTask = currentTaskResult.success
    ? currentTaskResult.value
    : null;

  const result = await updateRowsResult<ProcessTask>(
    "_bpm_process_tasks",
    { id: `eq.${id}` },
    {
      ...data,
      from_task_id: data.from_task_id ?? undefined,
      uren: data.uren ?? undefined,
    },
  );

  // Log task update event
  if (result.success && currentTask) {
    await eventLogService
      .logEvent("process_task_updated", "process_task", id, {
        oldValues: currentTask,
        newValues: data,
      })
      .catch(console.error);

    // Invalidate process cache so updated task data (including hours) is shown
    // Get the step to find the process_id
    const stepResult = await getRowByIdResult<ProcessStep>(
      "_bpm_process_steps",
      currentTask.step_id,
    );
    if (stepResult.success) {
      requestCache.invalidateEntity("process", stepResult.value.process_id);
    }
  }

  return result;
}

/**
 * Delete a task
 *
 * First deletes all case tasks that reference this process task,
 * then deletes the process task itself to avoid foreign key constraint violations.
 *
 * @param id - Task ID to delete
 * @returns Result with success/error status
 *
 * @example
 * ```typescript
 * const result = await deleteTask(789);
 * if (result.success) {
 *   console.log('Task deleted');
 * }
 * ```
 */
export async function deleteTask(id: number): Promise<Result<void, AppError>> {
  // Get task data before deletion for logging
  const taskResult = await getRowByIdResult<ProcessTask>(
    "_bpm_process_tasks",
    id,
  );
  const taskData = taskResult.success ? taskResult.value : null;

  // First, delete all case tasks that reference this process task
  // This prevents foreign key constraint violations
  const caseTasks = await deleteRowsResult("_bpm_tasks", {
    task_id: `eq.${id}`,
    task_type: "eq.process",
  });

  // Even if case tasks deletion fails (e.g., no case tasks exist), continue to delete the process task
  // The important thing is that we tried to clean up references first

  // Now delete the process task
  const result = await deleteRowsResult("_bpm_process_tasks", {
    id: `eq.${id}`,
  });

  // Log task deletion event if successful
  if (result.success && taskData) {
    await eventLogService
      .logEvent("process_task_deleted", "process_task", id, {
        oldValues: taskData,
      })
      .catch(console.error);
  }

  return result;
}

/**
 * Get step and task counts for a process (for preview displays)
 *
 * @param id - Process ID
 * @returns Result containing step and task counts, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getProcessStats(123);
 * if (result.success) {
 *   console.log(`Steps: ${result.value.stepCount}, Tasks: ${result.value.taskCount}, Hours: ${result.value.totalHours}`);
 * }
 * ```
 */
export async function getProcessStats(
  id: number,
): Promise<
  Result<{ stepCount: number; taskCount: number; totalHours: number }, AppError>
> {
  // Validate ID
  if (!isValidProcessId(id)) {
    return err(ValidationError.create("Invalid process ID", "id", id));
  }

  const processId = toProcessId(id);

  const stepsResult = await queryTableResult<ProcessStep>(
    "_bpm_process_steps",
    {
      filter: { process_id: `eq.${processId}` },
    },
  );

  if (!stepsResult.success) {
    return err(stepsResult.error);
  }

  const steps = stepsResult.value.data;
  let taskCount = 0;
  let totalHours = 0;

  if (steps.length > 0) {
    // Query tasks for all steps
    const stepIds = steps.map((s) => s.id);
    const taskPromises = stepIds.map((stepId) =>
      queryTableResult<ProcessTask>("_bpm_process_tasks", {
        filter: { step_id: `eq.${stepId}` },
      }),
    );
    const taskResults = await Promise.all(taskPromises);

    // Count tasks and sum hours, handling any failures gracefully
    for (const taskResult of taskResults) {
      if (taskResult.success) {
        taskCount += taskResult.value.data.length;
        // Sum up hours from all tasks
        for (const task of taskResult.value.data) {
          if (task.uren !== null && task.uren !== undefined) {
            totalHours += task.uren;
          }
        }
      }
    }
  }

  return ok({
    stepCount: steps.length,
    taskCount,
    totalHours,
  });
}

// Re-export types for backward compatibility with existing components
export type { Process, ProcessStep, ProcessTask } from "$lib/schemas/process";
