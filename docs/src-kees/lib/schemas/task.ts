/**
 * Zod validation schemas for unified Task domain entities
 * Merges functionality from _bpm_case_tasks and _bpm_work_items
 */

import { z } from 'zod';

/**
 * Task type enum
 */
export const TaskTypeSchema = z.enum(['process', 'manual', 'help']);

/**
 * Priority enum
 */
export const PrioritySchema = z.enum(['laag', 'normaal', 'hoog']);

/**
 * Unified task schema
 */
export const TaskSchema = z.object({
	id: z.number().int().positive(),
	task_type: TaskTypeSchema,
	// Process task fields (nullable, only used when task_type='process')
	case_step_id: z.number().int().positive().nullable(),
	task_id: z.number().int().positive().nullable(), // references _bpm_process_tasks
	// Project assignment (nullable, available for both task types)
	project_id: z.number().int().positive().nullable(),
	// Unified fields
	assignee_id: z.array(z.string()).default([]),
	subject: z.string().nullable(), // NOT NULL for manual tasks, optional for process tasks
	voor_wie_is_het: z.string().nullable(),
	wat_ga_je_doen: z.string().nullable(),
	waarom_doe_je_het: z.string().nullable(),
	deadline: z.string().datetime().nullable(), // merged from deadline (case_tasks) and due_date (work_items)
	tags: z.array(z.string()).default([]),
	komt_van: z.string().nullable(),
	uren: z.number().nonnegative().nullable(),
	bijlagen: z.array(z.string()).default([]),
	relevantie: z.number().int().min(1).max(5).nullable(),
	source: z.string().nullable(),
	priority: PrioritySchema.default('normaal'),
	status: z.string(), // Can be various status values
	kanban_status: z.string(),
	kanban_order: z.number().int().default(0),
	step_order: z.number().int().default(0),
	closed: z.boolean().default(false),
	started_at: z.string().datetime().nullable(),
	completed_at: z.string().datetime().nullable(),
	public_token: z.string().nullable().optional(),
	is_public: z.boolean().default(false).optional(),
	public_token_expires_at: z.string().datetime().nullable().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create process task input schema
 */
export const CreateProcessTaskInputSchema = z.object({
	case_step_id: z.number().int().positive(),
	task_id: z.number().int().positive(),
	project_id: z.number().int().positive().optional().nullable(),
	assignee_id: z.array(z.string()).optional().default([]),
	subject: z.string().max(255).optional().nullable(),
	deadline: z.string().datetime().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	priority: PrioritySchema.optional().default('normaal'),
	status: z.string().optional().default('backlog'),
	kanban_status: z.string().optional().default('gepland')
});

/**
 * Create manual task input schema
 */
export const CreateManualTaskInputSchema = z.object({
	project_id: z.number().int().positive().optional().nullable(),
	case_step_id: z.number().int().positive().optional().nullable(),
	task_id: z.number().int().positive().optional().nullable(),
	assignee_id: z.array(z.string()).optional().default([]),
	subject: z.string().min(1, 'Subject is required for manual tasks').max(255),
	voor_wie_is_het: z.string().max(500).optional().nullable(),
	wat_ga_je_doen: z.string().max(1000).optional().nullable(),
	waarom_doe_je_het: z.string().max(1000).optional().nullable(),
	deadline: z.string().datetime().optional().nullable(),
	tags: z.array(z.string()).optional().default([]),
	komt_van: z.string().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	bijlagen: z.array(z.string().url()).optional().default([]),
	relevantie: z.number().int().min(1).max(5).optional().nullable(),
	source: z.string().max(500).optional().nullable(),
	priority: PrioritySchema.optional().default('normaal'),
	status: z.enum(['backlog', 'gepland', 'ad-hoc']).optional().default('backlog'),
	kanban_status: z.enum(['backlog', 'gepland', 'mee_bezig', 'in_review', 'afgerond', 'overdue']).optional().default('gepland')
});

/**
 * Create help task input schema
 * Help tasks are similar to manual tasks but have task_type='help'
 */
export const CreateHelpTaskInputSchema = z.object({
	project_id: z.number().int().positive().optional().nullable(),
	case_step_id: z.number().int().positive().optional().nullable(),
	task_id: z.number().int().positive().optional().nullable(),
	assignee_id: z.array(z.string()).optional().default([]),
	subject: z.string().min(1, 'Subject is required for help tasks').max(255),
	voor_wie_is_het: z.string().max(500).optional().nullable(),
	wat_ga_je_doen: z.string().max(1000).optional().nullable(),
	waarom_doe_je_het: z.string().max(1000).optional().nullable(),
	deadline: z.string().datetime().optional().nullable(),
	tags: z.array(z.string()).optional().default([]),
	komt_van: z.string().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	bijlagen: z.array(z.string().url()).optional().default([]),
	relevantie: z.number().int().min(1).max(5).optional().nullable(),
	source: z.string().max(500).optional().nullable(),
	priority: PrioritySchema.optional().default('normaal'),
	status: z.enum(['backlog', 'gepland', 'ad-hoc']).optional().default('backlog'),
	kanban_status: z.enum(['backlog', 'gepland', 'mee_bezig', 'in_review', 'afgerond', 'overdue']).optional().default('gepland')
});

/**
 * Update task input schema
 */
export const UpdateTaskInputSchema = z.object({
	project_id: z.number().int().positive().optional().nullable(),
	assignee_id: z.array(z.string()).optional().default([]),
	subject: z.string().max(255).optional().nullable(),
	voor_wie_is_het: z.string().max(500).optional().nullable(),
	wat_ga_je_doen: z.string().max(1000).optional().nullable(),
	waarom_doe_je_het: z.string().max(1000).optional().nullable(),
	deadline: z.string().datetime().optional().nullable(),
	tags: z.array(z.string()).optional(),
	komt_van: z.string().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	bijlagen: z.array(z.string().url()).optional(),
	relevantie: z.number().int().min(1).max(5).optional().nullable(),
	source: z.string().max(500).optional().nullable(),
	priority: PrioritySchema.optional(),
	status: z.string().optional(),
	kanban_status: z.string().optional().nullable(),
	kanban_order: z.number().int().optional().nullable(),
	step_order: z.number().int().optional().nullable(),
	closed: z.boolean().optional(),
	started_at: z.string().datetime().optional().nullable(),
	completed_at: z.string().datetime().optional().nullable(),
	public_token: z.string().optional().nullable(),
	is_public: z.boolean().optional(),
	public_token_expires_at: z.string().datetime().optional().nullable()
});

/**
 * Type exports inferred from schemas
 */
export type Task = z.infer<typeof TaskSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type CreateProcessTaskInput = z.infer<typeof CreateProcessTaskInputSchema>;
export type CreateManualTaskInput = z.infer<typeof CreateManualTaskInputSchema>;
export type CreateHelpTaskInput = z.infer<typeof CreateHelpTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;

