/**
 * Dependency Service - Analyzes task chains and manages dependency notifications
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { queryTableResult, getRowByIdResult } from "$lib/utils/postgrest";
import * as eventLogService from "./eventLogService";
import type { CaseTask, CaseStep, Case } from "./caseService";
import { ok, err, type Result } from "$lib/types/result";
import { AppError, ErrorCode } from "$lib/types/errors";

/**
 * Dependency impact information
 */
export interface DependencyImpact {
  dependentTaskId: number;
  dependentTaskName: string;
  dependencyType: "sequential" | "deadline_dependent";
  impactDescription: string;
}

/**
 * Dependency change tracking
 */
export interface DependencyChange {
  changedTaskId: number;
  changedField: "deadline" | "status" | "owner_id";
  oldValue: any;
  newValue: any;
  dependentTaskIds: number[];
  changeTimestamp: string;
}

/**
 * Analyze dependencies for a case task
 *
 * @param taskId - Case task ID to analyze
 * @returns Result containing dependency impact information
 */
export async function analyzeTaskDependencies(
  taskId: number,
): Promise<Result<DependencyImpact[], AppError>> {
  try {
    // Get the task details
    const taskResult = await getRowByIdResult<CaseTask>("_bpm_tasks", taskId);
    if (!taskResult.success) {
      return err(taskResult.error);
    }

    const task = taskResult.value;
    const impacts: DependencyImpact[] = [];

    // Get all tasks in the same step (sequential dependencies)
    const stepTasksResult = await queryTableResult<CaseTask>("_bpm_tasks", {
      filter: {
        case_step_id: `eq.${task.case_step_id}`,
        task_type: "eq.process",
      },
      order: "created_at.asc",
    });

    if (stepTasksResult.success) {
      const stepTasks = stepTasksResult.value.data;
      const currentIndex = stepTasks.findIndex((t) => t.id === taskId);

      // Find tasks that come after this one in the sequence
      for (let i = currentIndex + 1; i < stepTasks.length; i++) {
        const dependentTask = stepTasks[i];

        // Get process task name for better display
        const processTaskResult = await getRowByIdResult(
          "_bpm_process_tasks",
          dependentTask.task_id,
        );
        const taskName =
          processTaskResult.success && processTaskResult.value?.name
            ? processTaskResult.value.name
            : `Task ${dependentTask.id}`;

        impacts.push({
          dependentTaskId: dependentTask.id,
          dependentTaskName: taskName,
          dependencyType: "sequential",
          impactDescription: `Deze taak volgt op de gewijzigde taak in dezelfde stap`,
        });
      }
    }

    // TODO: Add cross-step dependencies if needed
    // This would involve checking if this step affects subsequent steps

    return ok(impacts);
  } catch (error) {
    return err(
      new AppError(
        "Failed to analyze task dependencies",
        ErrorCode.OPERATION_FAILED,
        { details: error },
      ),
    );
  }
}

/**
 * Create a comment on a dependent task about the dependency change
 *
 * @param dependentTaskId - ID of the task to comment on
 * @param change - Details of the change that affected this task
 * @returns Result with success/error status
 */
export async function createDependencyComment(
  dependentTaskId: number,
  change: DependencyChange,
): Promise<Result<void, AppError>> {
  try {
    // Get the changed task name for the comment
    const changedTaskResult = await getRowByIdResult<CaseTask>(
      "_bpm_tasks",
      change.changedTaskId,
    );
    const changedProcessTaskResult = changedTaskResult.success
      ? await getRowByIdResult(
          "_bpm_process_tasks",
          changedTaskResult.value.task_id,
        )
      : null;

    const changedTaskName =
      changedProcessTaskResult?.success && changedProcessTaskResult.value?.name
        ? changedProcessTaskResult.value.name
        : `Taak ${change.changedTaskId}`;

    // Format the change description
    let changeDescription = "";
    switch (change.changedField) {
      case "deadline":
        const oldDate = change.oldValue
          ? new Date(change.oldValue).toLocaleDateString("nl-NL")
          : "geen";
        const newDate = change.newValue
          ? new Date(change.newValue).toLocaleDateString("nl-NL")
          : "geen";
        changeDescription = `deadline gewijzigd van ${oldDate} naar ${newDate}`;
        break;
      case "status":
        changeDescription = `status gewijzigd van ${change.oldValue} naar ${change.newValue}`;
        break;
      case "owner_id":
        changeDescription = `eigenaar gewijzigd`;
        break;
    }

    const comment = `🔗 Afhankelijkheid: ${changedTaskName} ${changeDescription}. Dit kan invloed hebben op deze taak.`;

    // TODO: Implement comment system
    // For now, we'll just log this - need to integrate with actual comment system
    console.log(
      `[DependencyService] Would create comment on task ${dependentTaskId}: ${comment}`,
    );

    // Placeholder for actual comment creation
    // await commentService.createComment(dependentTaskId, comment, 'system');

    return ok(undefined);
  } catch (error) {
    return err(
      new AppError(
        "Failed to create dependency comment",
        ErrorCode.OPERATION_FAILED,
        { details: error },
      ),
    );
  }
}

/**
 * Send notifications to owners of dependent tasks
 *
 * @param change - Details of the change
 * @returns Result with success/error status
 */
export async function notifyDependentTasks(
  change: DependencyChange,
): Promise<Result<void, AppError>> {
  try {
    // TODO: Implement notification system integration
    console.log(
      `[DependencyService] Would notify ${change.dependentTaskIds.length} dependent tasks about change to task ${change.changedTaskId}`,
    );

    // Get message service
    const { sendEmailMessage } = await import("./messageService");

    for (const dependentTaskId of change.dependentTaskIds) {
      try {
        // Get dependent task details
        const taskResult = await getRowByIdResult<CaseTask>(
          "_bpm_tasks",
          dependentTaskId,
        );
        if (!taskResult.success) continue;

        const task = taskResult.value;

        // Only notify if task has an assignee (check both owner_id for backward compat and assignee_id)
        const assigneeId = (task as any).assignee_id || task.owner_id;
        if (!assigneeId) continue;

        // Get user details
        const { getUserById } = await import("./pocketbaseService");
        const userResult = await getUserById(assigneeId);
        if (!userResult.success) continue;

        const user = userResult.value;
        if (!user.email) continue;

        // Get process task name
        const processTaskResult = await getRowByIdResult(
          "_bpm_process_tasks",
          task.task_id,
        );
        const taskName =
          processTaskResult.success && processTaskResult.value?.name
            ? processTaskResult.value.name
            : `Taak ${task.id}`;

        // Get case_id from step for URL construction
        const stepResult = await getRowByIdResult<CaseStep>(
          "_bpm_case_steps",
          task.case_step_id,
        );
        const caseUrl = stepResult.success
          ? `/cases/${stepResult.value.case_id}`
          : "/cases";

        // Send message
        await sendEmailMessage({
          type: "task_dependency_changed",
          msg_type: "email",
          recipient_email: user.email,
          recipient_user_id: user.id,
          subject: `Afhankelijkheid gewijzigd: ${taskName}`,
          html: `
            <h2>Taak afhankelijkheid gewijzigd</h2>
            <p>Een taak waar ${taskName} van afhangt is gewijzigd. Dit kan invloed hebben op uw taak.</p>
            <p><a href="${caseUrl}">Bekijk case details</a></p>
          `,
        }).catch(console.error); // Don't fail the whole operation if one notification fails
      } catch (error) {
        console.error(
          `Failed to notify owner of task ${dependentTaskId}:`,
          error,
        );
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(
      new AppError(
        "Failed to send dependency messages",
        ErrorCode.OPERATION_FAILED,
        { details: error },
      ),
    );
  }
}

/**
 * Process a dependency change (create comments and send notifications)
 *
 * @param change - Details of the change
 * @returns Result with success/error status
 */
export async function processDependencyChange(
  change: DependencyChange,
): Promise<Result<void, AppError>> {
  try {
    // Create comments on dependent tasks
    for (const dependentTaskId of change.dependentTaskIds) {
      await createDependencyComment(dependentTaskId, change);
    }

    // Send notifications
    await notifyDependentTasks(change);

    // Log dependency change processing event
    await eventLogService
      .logEvent("dependency_change_processed", "task", change.changedTaskId, {
        newValues: {
          changed_field: change.changedField,
          dependent_tasks: change.dependentTaskIds,
        },
        metadata: { impact_count: change.dependentTaskIds.length },
      })
      .catch(console.error);

    return ok(undefined);
  } catch (error) {
    return err(
      new AppError(
        "Failed to process dependency change",
        ErrorCode.OPERATION_FAILED,
        { details: error },
      ),
    );
  }
}
