/**
 * Dashboard service - Aggregate statistics
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { queryTableResult } from '$lib/utils/postgrest';
import type { AppError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';

export interface TaskTypeCount {
  help: number;
  manual: number;
  process: number;
}

export interface DashboardStats {
  totalProcesses: number;
  openCases: number; // pending + active cases
  activeCases: number; // kept for backward compatibility
  completedCases: number;
  overdueTasks: number;
  pendingCases: number;
  overdueCases: number;
  // Task statistics
  pendingTasks: number;
  activeTasksCount: number;
  completedTasksCount: number;
  backlogTasks: number;
  // Task counts by type for each status
  backlogTasksByType: TaskTypeCount;
  pendingTasksByType: TaskTypeCount;
  activeTasksByType: TaskTypeCount;
  completedTasksByType: TaskTypeCount;
  overdueTasksByType: TaskTypeCount;
  processes: {
    id: number;
    name: string;
    pendingCases: number;
    activeCases: number;
    completedCases: number;
    overdueCases: number;
  }[];
}

/**
 * Get dashboard statistics
 * 
 * @returns Result containing dashboard statistics, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await getDashboardStats();
 * if (result.success) {
 *   console.log(`Active cases: ${result.value.activeCases}`);
 * }
 * ```
 */
export async function getDashboardStats(): Promise<Result<DashboardStats, AppError>> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Helper function to count tasks by type
  const countTasksByType = (tasks: any[]): TaskTypeCount => {
    return {
      help: tasks.filter(t => t.task_type === 'help').length,
      manual: tasks.filter(t => t.task_type === 'manual').length,
      process: tasks.filter(t => t.task_type === 'process').length,
    };
  };

  // Execute all base queries in parallel for maximum performance
  const [
    processesResult,
    casesResult,
    overdueTasksResult,
    activeTasksResult,
    pendingTasksResult,
    backlogTasksResult,
    completedTasksResult
  ] = await Promise.all([
    // Get all active processes (exclude archived)
    queryTableResult<any>('_bpm_processes', {
      filter: { status: 'neq.archived' },
    }),
    // Get all cases
    queryTableResult<any>('_bpm_cases', {}),
    // Get overdue tasks (need full data to count by type)
    queryTableResult<any>('_bpm_tasks', {
      filter: {
        deadline: `lt.${today}`,
        kanban_status: 'not.in.(afgerond)'
      },
      select: 'task_type'
    }),
    // Get active tasks (need full data to count by type)
    queryTableResult<any>('_bpm_tasks', {
      filter: { kanban_status: 'in.(in_review,mee_bezig)' },
      select: 'task_type'
    }),
    // Get pending tasks (need full data to count by type)
    queryTableResult<any>('_bpm_tasks', {
      filter: { kanban_status: 'in.(gepland)' },
      select: 'task_type'
    }),
    // Get backlog tasks (need full data to count by type)
    queryTableResult<any>('_bpm_tasks', {
      filter: { kanban_status: 'in.(backlog)' },
      select: 'task_type'
    }),
    // Get completed tasks (need full data to count by type)
    queryTableResult<any>('_bpm_tasks', {
      filter: { kanban_status: 'in.(afgerond)' },
      select: 'task_type'
    })
  ]);

  // Check for critical errors
  if (!processesResult.success) {
    return err(processesResult.error);
  }
  if (!casesResult.success) {
    return err(casesResult.error);
  }

  const processes = processesResult.value.data;
  const allCases = casesResult.value.data;

  // Calculate case statistics from in-memory data
  const openCases = allCases.filter((c: any) => c.status === 'gepland' || c.status === 'mee_bezig').length;
  const activeCases = allCases.filter((c: any) => c.status === 'mee_bezig').length;
  const completedCases = allCases.filter((c: any) => c.status === 'afgerond').length;
  const pendingCases = allCases.filter((c: any) => c.status === 'gepland').length;
  const overdueCases = allCases.filter((c: any) => c.status === 'overdue').length;

  // Extract task counts (gracefully handle errors)
  const overdueTasks = overdueTasksResult.success ? overdueTasksResult.value.data.length : 0;
  const activeTasksCount = activeTasksResult.success ? activeTasksResult.value.data.length : 0;
  const pendingTasks = pendingTasksResult.success ? pendingTasksResult.value.data.length : 0;
  const backlogTasks = backlogTasksResult.success ? backlogTasksResult.value.data.length : 0;
  const completedTasksCount = completedTasksResult.success ? completedTasksResult.value.data.length : 0;

  // Count tasks by type for each status
  const backlogTasksByType = backlogTasksResult.success 
    ? countTasksByType(backlogTasksResult.value.data) 
    : { help: 0, manual: 0, process: 0 };
  const pendingTasksByType = pendingTasksResult.success 
    ? countTasksByType(pendingTasksResult.value.data) 
    : { help: 0, manual: 0, process: 0 };
  const activeTasksByType = activeTasksResult.success 
    ? countTasksByType(activeTasksResult.value.data) 
    : { help: 0, manual: 0, process: 0 };
  const completedTasksByType = completedTasksResult.success 
    ? countTasksByType(completedTasksResult.value.data) 
    : { help: 0, manual: 0, process: 0 };
  const overdueTasksByType = overdueTasksResult.success 
    ? countTasksByType(overdueTasksResult.value.data) 
    : { help: 0, manual: 0, process: 0 };

  // Get cases per process - compute from already loaded cases data
  const processStats = processes.map((process: any) => {
    const casesForProcess = allCases.filter((c: any) => c.process_id === process.id);
    
    return {
      id: process.id,
      name: process.name,
      pendingCases: casesForProcess.filter((c: any) => c.status === 'gepland').length,
      activeCases: casesForProcess.filter((c: any) => c.status === 'mee_bezig').length,
      completedCases: casesForProcess.filter((c: any) => c.status === 'afgerond').length,
      overdueCases: casesForProcess.filter((c: any) => c.status === 'overdue').length,
    };
  });

  return ok({
    totalProcesses: processes.length,
    openCases,
    activeCases, // kept for backward compatibility
    completedCases,
    pendingCases,
    overdueCases,
    overdueTasks,
    pendingTasks,
    activeTasksCount,
    completedTasksCount,
    backlogTasks,
    backlogTasksByType,
    pendingTasksByType,
    activeTasksByType,
    completedTasksByType,
    overdueTasksByType,
    processes: processStats,
  });
}

export interface ProjectTaskStats {
  backlogTasks: number;
  pendingTasks: number;
  activeTasksCount: number;
  completedTasksCount: number;
  overdueTasks: number;
}

/**
 * Get task statistics for a specific project
 * 
 * @param projectId - The project ID to filter tasks by
 * @returns Result containing project task statistics, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await getProjectTaskStats(1);
 * if (result.success) {
 *   console.log(`Active tasks: ${result.value.activeTasksCount}`);
 * }
 * ```
 */
export async function getProjectTaskStats(projectId: number): Promise<Result<ProjectTaskStats, AppError>> {
  // Count overdue tasks: deadline < current_date AND kanban_status not in ('afgerond') AND project_id = projectId
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const overdueTasksFilter: Record<string, string> = {
    deadline: `lt.${today}`,
    kanban_status: 'not.in.(afgerond)',
    project_id: `eq.${projectId}`
  };
  
  const overdueTasksResult = await queryTableResult<any>('_bpm_tasks', {
    filter: overdueTasksFilter
  });
  
  const overdueTasks = overdueTasksResult.success ? overdueTasksResult.value.data.length : 0;
  
  // Count active tasks: kanban_status in ('in_review', 'mee_bezig') AND project_id = projectId
  const activeTasksFilter: Record<string, string> = {
    kanban_status: 'in.(in_review,mee_bezig)',
    project_id: `eq.${projectId}`
  };
  
  const activeTasksResult = await queryTableResult<any>('_bpm_tasks', {
    filter: activeTasksFilter
  });
  
  const activeTasksCount = activeTasksResult.success ? activeTasksResult.value.data.length : 0;
  
  // Count pending tasks: kanban_status in ('gepland') AND project_id = projectId
  const pendingTasksFilter: Record<string, string> = {
    kanban_status: 'in.(gepland)',
    project_id: `eq.${projectId}`
  };
  
  const pendingTasksResult = await queryTableResult<any>('_bpm_tasks', {
    filter: pendingTasksFilter
  });
  
  const pendingTasks = pendingTasksResult.success ? pendingTasksResult.value.data.length : 0;
  
  // Count backlog tasks: kanban_status in ('backlog') AND project_id = projectId
  const backlogTasksFilter: Record<string, string> = {
    kanban_status: 'in.(backlog)',
    project_id: `eq.${projectId}`
  };
  
  const backlogTasksResult = await queryTableResult<any>('_bpm_tasks', {
    filter: backlogTasksFilter
  });
  
  const backlogTasks = backlogTasksResult.success ? backlogTasksResult.value.data.length : 0;
  
  // Count completed tasks: kanban_status in ('afgerond') AND project_id = projectId
  const completedTasksFilter: Record<string, string> = {
    kanban_status: 'in.(afgerond)',
    project_id: `eq.${projectId}`
  };
  
  const completedTasksResult = await queryTableResult<any>('_bpm_tasks', {
    filter: completedTasksFilter
  });
  
  const completedTasksCount = completedTasksResult.success ? completedTasksResult.value.data.length : 0;

  return ok({
    overdueTasks,
    pendingTasks,
    activeTasksCount,
    completedTasksCount,
    backlogTasks,
  });
}

