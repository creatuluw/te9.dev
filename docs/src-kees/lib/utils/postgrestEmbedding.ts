/**
 * PostgREST Resource Embedding Helpers
 *
 * Provides utilities for building PostgREST select strings with resource embedding
 * (joins via `select` parameter) and parsing nested responses into flat objects.
 *
 * This enables fetching tasks with related case/case_step/process_task data
 * in a single PostgREST query instead of 5-7 separate HTTP round-trips.
 *
 * Task: setup-001 — Create PostgREST resource embedding helper and tests
 */

// ============================================================
// Types
// ============================================================

/**
 * Shape of an embedded case record from PostgREST resource embedding.
 * Represents `_bpm_cases` data nested inside `case_step_id.case_id`.
 */
export interface EmbeddedCase {
  id: number;
  name: string;
  project_id: number | null;
}

/**
 * Shape of an embedded case step record from PostgREST resource embedding.
 * Represents `_bpm_case_steps` data nested inside `case_step_id`.
 */
export interface EmbeddedCaseStep {
  id: number;
  case_id: EmbeddedCase | null;
}

/**
 * Shape of an embedded process task record from PostgREST resource embedding.
 * Represents `_bpm_process_tasks` data nested inside `task_id`.
 */
export interface EmbeddedProcessTask {
  id: number;
  name: string | null;
}

/**
 * Raw PostgREST response row with embedded relations.
 *
 * When using `buildTaskEmbeddingSelect()` as the `select` parameter,
 * PostgREST returns rows in this nested shape. The `case_step_id` and
 * `task_id` fields contain embedded objects instead of plain FK values.
 *
 * At runtime, these fields may also be raw FK numbers if PostgREST
 * doesn't embed (e.g., missing FK relationship). The parser handles both cases.
 */
export interface EmbeddedTaskRow {
  id: number;
  subject: string | null;
  task_type: "help" | "manual" | "process";
  status: string;
  kanban_status: string | null;
  deadline: string | null;
  uren: number | null;
  tags: string[] | null;
  project_id: number | null;
  priority: number | null;
  relevantie: number | null;
  voor_wie_is_het: string | null;
  wat_ga_je_doen: string | null;
  waarom_doe_je_het: string | null;
  komt_van: string | null;
  bijlagen: string[] | null;
  created_at: string;
  updated_at: string;
  closed: boolean;
  /** Embedded case step + case data, or null for non-process tasks */
  case_step_id: EmbeddedCaseStep | null;
  /** Embedded process task data, or null for non-process tasks */
  task_id: EmbeddedProcessTask | null;
}

/**
 * Flattened task row after parsing embedded PostgREST response.
 *
 * - For manual/help tasks (`type: 'work_item'`): no case/process fields
 * - For process tasks (`type: 'case_task'`): includes flattened case and process data
 */
export interface ParsedEmbeddedTask {
  id: number;
  type: "work_item" | "case_task";
  task_type: "help" | "manual" | "process";
  subject: string;
  status: string;
  kanban_status: string | null;
  deadline: string | null;
  uren: number | null;
  tags: string[];
  project_id: number | null;
  priority: number | null;
  relevantie: number | null;
  voor_wie_is_het: string | null;
  wat_ga_je_doen: string | null;
  waarom_doe_je_het: string | null;
  komt_van: string | null;
  bijlagen: string[];
  created_at: string;
  updated_at: string;
  closed: boolean;
  // Flattened embedded fields — only present for process tasks (type === 'case_task')
  case_step_id?: number;
  case_id?: number;
  case_name?: string | null;
  task_id?: number;
  task_name?: string | null;
}

// ============================================================
// buildTaskEmbeddingSelect()
// ============================================================

/**
 * Build the PostgREST `select` parameter string for task queries with
 * resource embedding of case_step → case and process_task relations.
 *
 * Uses PostgREST's native join syntax:
 * - `case_step_id(id,case_id(id,name,project_id))` — embeds case step with its parent case
 * - `task_id(id,name)` — embeds the process task definition
 *
 * @returns PostgREST-compatible select string (no spaces, comma-separated)
 */
export function buildTaskEmbeddingSelect(): string {
  return (
    "id,subject,task_type,status,kanban_status,deadline,uren,tags,project_id," +
    "priority,relevantie,voor_wie_is_het,wat_ga_je_doen,waarom_doe_je_het," +
    "komt_van,bijlagen,created_at,updated_at,closed," +
    "case_step_id(id,case_id(id,name,project_id))," +
    "task_id(id,name)"
  );
}

// ============================================================
// parseEmbeddedTask()
// ============================================================

/**
 * Parse a single PostgREST row with embedded relations into a flat object.
 *
 * For process tasks (`task_type === 'process'`):
 * - Extracts `case_step_id.id` → `case_step_id`
 * - Extracts `case_step_id.case_id.id` → `case_id`
 * - Extracts `case_step_id.case_id.name` → `case_name`
 * - Extracts `case_step_id.case_id.project_id` → `project_id` (inherited from case)
 * - Extracts `task_id.id` → `task_id`
 * - Extracts `task_id.name` → `task_name`
 * - Sets `subject` to: process task name → row subject → `Taak #${task_id}`
 *
 * For manual/help tasks:
 * - Preserves `project_id` from the row
 * - No case/process fields in output (undefined)
 * - Sets `subject` to: row subject → `'Geen titel'`
 *
 * Handles edge cases:
 * - EC-1: Empty rows should be handled by caller (parseEmbeddedTasks returns [])
 * - EC-3: Orphaned process tasks with null embedded data get fallback values
 * - EC-5: Null embedded objects are handled gracefully
 *
 * @param row - Raw PostgREST response row with nested embedded data
 * @returns Flattened task object with embedded data extracted
 */
export function parseEmbeddedTask(row: EmbeddedTaskRow): ParsedEmbeddedTask {
  const isProcessTask = row.task_type === "process";

  // Base fields common to all task types
  const base = {
    id: row.id,
    task_type: row.task_type,
    status: row.status,
    kanban_status: row.kanban_status,
    deadline: row.deadline,
    uren: row.uren,
    tags: row.tags || [],
    priority: row.priority,
    relevantie: row.relevantie,
    voor_wie_is_het: row.voor_wie_is_het,
    wat_ga_je_doen: row.wat_ga_je_doen,
    waarom_doe_je_het: row.waarom_doe_je_het,
    komt_van: row.komt_van,
    bijlagen: row.bijlagen || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    closed: row.closed,
  };

  if (isProcessTask) {
    return parseProcessTask(row, base);
  }

  // Manual/help task — no embedded fields
  return {
    ...base,
    type: "work_item" as const,
    subject: row.subject || "Geen titel",
    project_id: row.project_id,
  };
}

/**
 * Parse a process task row with embedded case and process task data.
 * Extracted from parseEmbeddedTask for clarity.
 */
function parseProcessTask(
  row: EmbeddedTaskRow,
  base: Omit<
    ParsedEmbeddedTask,
    | "type"
    | "subject"
    | "project_id"
    | "case_step_id"
    | "case_id"
    | "case_name"
    | "task_id"
    | "task_name"
  >,
): ParsedEmbeddedTask {
  const caseStepEmbedded = row.case_step_id;
  const taskEmbedded = row.task_id;

  // Defaults for case data — null means "process task but data unavailable"
  let caseStepId: number | undefined;
  let caseId: number | undefined;
  let caseName: string | null = null;
  let projectId: number | null = row.project_id;

  // Extract case_step_id embedding
  if (caseStepEmbedded !== null && typeof caseStepEmbedded === "object") {
    caseStepId = caseStepEmbedded.id;

    // Extract nested case_id embedding
    if (
      caseStepEmbedded.case_id !== null &&
      typeof caseStepEmbedded.case_id === "object"
    ) {
      caseId = caseStepEmbedded.case_id.id;
      caseName = caseStepEmbedded.case_id.name;
      projectId = caseStepEmbedded.case_id.project_id ?? null;
    }
  }

  // Extract task_id embedding
  let taskId: number | undefined;
  let taskName: string | null = null;

  if (taskEmbedded !== null && typeof taskEmbedded === "object") {
    taskId = taskEmbedded.id;
    taskName = taskEmbedded.name;
  }

  // Subject priority: process task name → row subject → fallback with task_id FK
  const subject =
    taskName ||
    row.subject ||
    `Taak #${taskEmbedded && typeof taskEmbedded === "object" ? taskEmbedded.id : row.id}`;

  return {
    ...base,
    type: "case_task" as const,
    subject,
    project_id: projectId,
    // Only include FK fields if we have actual values (undefined = not present)
    ...(caseStepId !== undefined && { case_step_id: caseStepId }),
    ...(caseId !== undefined && { case_id: caseId }),
    case_name: caseName,
    ...(taskId !== undefined && { task_id: taskId }),
    task_name: taskName,
  };
}

// ============================================================
// parseEmbeddedTasks()
// ============================================================

/**
 * Batch-parse multiple PostgREST rows with embedded relations.
 *
 * @param rows - Array of raw PostgREST response rows
 * @returns Array of flattened task objects
 */
export function parseEmbeddedTasks(
  rows: EmbeddedTaskRow[],
): ParsedEmbeddedTask[] {
  return rows.map(parseEmbeddedTask);
}
