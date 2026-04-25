/**
 * Zod validation schemas for Case domain entities
 */

import { z } from 'zod';

/**
 * Case status enum
 * Unified with task statuses: gepland (pending), mee_bezig (in_progress), afgerond (completed), overdue
 */
export const CaseStatusSchema = z.enum(['gepland', 'mee_bezig', 'afgerond', 'overdue']);

/**
 * Case schema
 */
export const CaseSchema = z.object({
	id: z.number().int().positive(),
	process_id: z.number().int().positive(),
	name: z.string().min(1, 'Case name is required'),
	start_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
	completion_deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
	status: CaseStatusSchema,
	owner_id: z.string().optional(),
	created_by: z.string().optional().nullable(),
	project_id: z.number().int().positive().optional().nullable(),
	bijlagen: z.array(z.string()).optional().default([]),
	public_token: z.string().nullable().optional(),
	is_public: z.boolean().default(false).optional(),
	public_token_expires_at: z.string().datetime().nullable().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Case creation input schema
 */
export const CreateCaseInputSchema = z.object({
	name: z.string().min(1, 'Case name is required').max(255, 'Case name is too long'),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	owner_id: z.string().optional(),
	process_id: z.number().int().positive(),
	project_id: z.number().int().positive().optional().nullable()
});

/**
 * Case update input schema
 */
export const UpdateCaseInputSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	status: CaseStatusSchema.optional(),
	owner_id: z.string().optional().nullable(),
	project_id: z.number().int().positive().optional().nullable(),
	bijlagen: z.array(z.string()).optional()
});

/**
 * Case step status enum
 */
export const CaseStepStatusSchema = z.enum(['pending', 'active', 'completed', 'overdue']);

/**
 * Case step schema
 */
export const CaseStepSchema = z.object({
	id: z.number().int().positive(),
	case_id: z.number().int().positive(),
	step_id: z.number().int().positive(),
	status: CaseStepStatusSchema,
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	completion_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	owner_id: z.string().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
	// Fields from joined process_step (populated via embedding)
	name: z.string().optional(),
	description: z.string().optional(),
	order_index: z.number().optional(),
	start_days_offset: z.number().optional(),
	completion_days: z.number().optional()
});

/**
 * Case step update input schema
 */
export const UpdateCaseStepInputSchema = z.object({
	status: CaseStepStatusSchema.optional(),
	owner_id: z.string().optional().nullable(),
	project_id: z.number().int().positive().optional().nullable()
});

/**
 * Case task status enum
 * Aligned with work item statuses for backlog management
 */
export const CaseTaskStatusSchema = z.enum(['backlog', 'gepland', 'ad-hoc']);

/**
 * Case task schema
 */
export const CaseTaskSchema = z.object({
	id: z.number().int().positive(),
	case_step_id: z.number().int().positive(),
	task_id: z.number().int().positive(),
	status: CaseTaskStatusSchema,
	kanban_status: z.string().optional(),
	kanban_order: z.number().int().default(0),
	step_order: z.number().int().default(0),
	started_at: z.string().datetime().optional().nullable(),
	completed_at: z.string().datetime().optional().nullable(),
	deadline: z.string().datetime().optional().nullable(),
	owner_id: z.string().optional().nullable(),
	uren: z.number().optional().nullable(),
	komt_van: z.string().optional().nullable(),
	closed: z.boolean().default(false),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
	// Fields from joined process_task (populated via embedding)
	name: z.string().optional(),
	description: z.string().optional(),
	order_index: z.number().optional(),
	criteria: z.string().optional(),
	links: z.any().optional(), // JSONB field
	deadline_days: z.number().optional()
});

/**
 * Date/datetime string validator - accepts both date (YYYY-MM-DD) and datetime formats
 * This is needed because DatePicker returns YYYY-MM-DD but database stores TIMESTAMP
 */
const DateOrDateTimeSchema = z.string()
	.refine(
		(val) => {
			// Accept date format YYYY-MM-DD
			if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return true;
			// Accept datetime format YYYY-MM-DDTHH:mm:ss (with or without timezone)
			if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) return true;
			// Accept full ISO datetime with timezone
			if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(val)) return true;
			return false;
		},
		{ message: 'Invalid date or datetime format' }
	)
	.optional()
	.nullable();

/**
 * Case task update input schema
 */
export const UpdateCaseTaskInputSchema = z.object({
	status: CaseTaskStatusSchema.optional(),
	owner_id: z.string().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable(),
	deadline: DateOrDateTimeSchema,
	kanban_status: z.string().optional().nullable(),
	step_order: z.number().int().optional().nullable(),
	komt_van: z.string().email().optional().nullable(),
	closed: z.boolean().optional()
});

/**
 * Type exports inferred from schemas
 */
export type Case = z.infer<typeof CaseSchema>;
export type CreateCaseInput = z.infer<typeof CreateCaseInputSchema>;
export type UpdateCaseInput = z.infer<typeof UpdateCaseInputSchema>;
export type CaseStep = z.infer<typeof CaseStepSchema>;
export type UpdateCaseStepInput = z.infer<typeof UpdateCaseStepInputSchema>;
export type CaseTask = z.infer<typeof CaseTaskSchema>;
export type UpdateCaseTaskInput = z.infer<typeof UpdateCaseTaskInputSchema>;
