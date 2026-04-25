/**
 * @deprecated This file is deprecated. Use task.ts instead.
 * 
 * This file was used for the legacy _bpm_work_items table.
 * After migration to unified _bpm_tasks table, all WorkItem types
 * should use Task types from task.ts.
 * 
 * This file is kept temporarily for backward compatibility but will be removed.
 * 
 * Migration guide:
 * - WorkItem → Task
 * - CreateWorkItemInput → CreateManualTaskInput or CreateHelpTaskInput
 * - UpdateWorkItemInput → UpdateTaskInput
 * - due_date (YYYY-MM-DD) → deadline (ISO datetime)
 */

import { z } from 'zod';

/**
 * Work item schema
 */
export const WorkItemSchema = z.object({
	id: z.number().int().positive(),
	project_id: z.number().int().positive().nullable(),
	case_step_id: z.number().int().positive().nullable(),
	task_id: z.number().int().positive().nullable(),
	assignee_id: z.array(z.string()).default([]),
	subject: z.string().nullable(),
	voor_wie_is_het: z.string().nullable(),
	wat_ga_je_doen: z.string().nullable(),
	waarom_doe_je_het: z.string().nullable(),
	due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
	tags: z.array(z.string()).default([]),
	komt_van: z.string().email().nullable(),
	uren: z.number().nonnegative().nullable(),
	bijlagen: z.array(z.string().url()).default([]),
	relevantie: z.number().int().min(1).max(5).nullable(),
	status: z.enum(['backlog', 'gepland', 'ad-hoc']),
	kanban_status: z.enum(['backlog', 'gepland', 'mee_bezig', 'in_review', 'afgerond', 'overdue']),
	kanban_order: z.number().int().default(0),
	closed: z.boolean().default(false),
	public_token: z.string().nullable().optional(),
	is_public: z.boolean().default(false).optional(),
	public_token_expires_at: z.string().datetime().nullable().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create work item input schema
 * Note: subject is required for manual and help tasks (enforced by database constraint check_manual_task_subject)
 */
export const CreateWorkItemInputSchema = z.object({
	project_id: z.number().int().positive().optional().nullable(),
	case_step_id: z.number().int().positive().optional().nullable(),
	task_id: z.number().int().positive().optional().nullable(),
	assignee_id: z.array(z.string()).optional().default([]),
	task_type: z.enum(['process', 'manual', 'help']).optional().default('manual'),
	subject: z.string().min(1, 'Subject is required for manual tasks').max(255),
	voor_wie_is_het: z.string().max(500).optional().nullable(),
	wat_ga_je_doen: z.string().max(1000).optional().nullable(),
	waarom_doe_je_het: z.string().max(1000).optional().nullable(),
	due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
	tags: z.array(z.string()).optional().default([]),
	komt_van: z.string().email().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	bijlagen: z.array(z.string().url()).optional().default([]),
	relevantie: z.number().int().min(1).max(5).optional().nullable(),
	status: z.enum(['backlog', 'gepland', 'ad-hoc']).optional().default('backlog'),
	kanban_status: z.enum(['backlog', 'gepland', 'mee_bezig', 'in_review', 'afgerond', 'overdue']).optional().default('gepland'),
	source: z.string().max(500).optional().nullable()
});

/**
 * Update work item input schema
 * Note: subject is optional (can be omitted), but if provided, must be non-empty
 * (manual tasks require non-null subject per database constraint check_manual_task_subject)
 */
export const UpdateWorkItemInputSchema = z.object({
	project_id: z.number().int().positive().optional().nullable(),
	case_step_id: z.number().int().positive().optional().nullable(),
	task_id: z.number().int().positive().optional().nullable(),
	assignee_id: z.array(z.string()).optional().default([]),
	subject: z.string().min(1, 'Subject cannot be empty for manual tasks').max(255).optional(),
	voor_wie_is_het: z.string().max(500).optional().nullable(),
	wat_ga_je_doen: z.string().max(1000).optional().nullable(),
	waarom_doe_je_het: z.string().max(1000).optional().nullable(),
	due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
	tags: z.array(z.string()).optional(),
	komt_van: z.string().email().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	bijlagen: z.array(z.string().url()).optional(),
	relevantie: z.number().int().min(1).max(5).optional().nullable(),
	status: z.enum(['backlog', 'gepland', 'ad-hoc']).optional(),
	kanban_status: z.enum(['backlog', 'gepland', 'mee_bezig', 'in_review', 'afgerond', 'overdue']).optional(),
	closed: z.boolean().optional(),
	source: z.string().max(500).optional().nullable()
});

/**
 * Type exports inferred from schemas
 */
export type WorkItem = z.infer<typeof WorkItemSchema>;
export type CreateWorkItemInput = z.infer<typeof CreateWorkItemInputSchema>;
export type UpdateWorkItemInput = z.infer<typeof UpdateWorkItemInputSchema>;

