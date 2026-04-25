/**
 * Zod validation schemas for Process domain entities
 */

import { z } from 'zod';

/**
 * Process schema
 */
export const ProcessSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().min(1, 'Process name is required'),
	description: z.string().optional().nullable(),
	completion_days: z.number().int().positive('Completion days must be positive'),
	status: z.string(),
	bijlagen: z.array(z.string()).optional().default([]),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create process input schema
 */
export const CreateProcessInputSchema = z.object({
	name: z.string().min(1, 'Process name is required').max(255, 'Process name is too long'),
	description: z.string().max(1000, 'Description is too long').optional(),
	completion_days: z.number().int().positive('Completion days must be a positive integer')
});

/**
 * Update process input schema
 */
export const UpdateProcessInputSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional().nullable(),
	completion_days: z.number().int().positive().optional(),
	bijlagen: z.array(z.string()).optional()
});

/**
 * Process step schema
 */
export const ProcessStepSchema = z.object({
	id: z.number().int().positive(),
	process_id: z.number().int().positive(),
	name: z.string().min(1, 'Step name is required'),
	description: z.string().optional().nullable(),
	order_index: z.number().int().nonnegative('Order index must be non-negative'),
	start_days_offset: z.number().int().nonnegative('Start days offset must be non-negative'),
	completion_days: z.number().int().positive('Completion days must be positive'),
	created_at: z.string().datetime()
});

/**
 * Create process step input schema
 */
export const CreateProcessStepInputSchema = z.object({
	process_id: z.number().int().positive(),
	name: z.string().min(1, 'Step name is required').max(255, 'Step name is too long'),
	description: z.string().max(1000, 'Description is too long').optional(),
	order_index: z.number().int().nonnegative('Order index must be non-negative'),
	start_days_offset: z.number().int().nonnegative('Start days offset must be non-negative'),
	completion_days: z.number().int().positive('Completion days must be a positive integer')
});

/**
 * Update process step input schema
 */
export const UpdateProcessStepInputSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional().nullable(),
	order_index: z.number().int().nonnegative().optional(),
	start_days_offset: z.number().int().nonnegative().optional(),
	completion_days: z.number().int().positive().optional()
});

/**
 * Process task schema
 */
export const ProcessTaskSchema = z.object({
	id: z.number().int().positive(),
	step_id: z.number().int().positive(),
	name: z.string().min(1, 'Task name is required'),
	description: z.string().optional().nullable(),
	role: z.string().optional().nullable(),
	order_index: z.number().int().nonnegative('Order index must be non-negative'),
	criteria: z.string().optional().nullable(),
	links: z.array(z.unknown()).optional().default([]),
	step_order: z.number().int().nonnegative().optional(),
	start_offset_days: z.number().int().nonnegative('Start offset days must be non-negative').default(0),
	deadline_days: z.number().int().positive('Deadline days must be a positive integer'),
	from_task_id: z.number().int().positive().optional(),
	uren: z.number().nonnegative().optional()
});

/**
 * Create process task input schema
 */
export const CreateProcessTaskInputSchema = z.object({
	step_id: z.number().int().positive(),
	name: z.string().min(1, 'Task name is required').max(255, 'Task name is too long'),
	description: z.string().max(1000, 'Description is too long').optional(),
	role: z.string().max(255, 'Role is too long').optional().nullable(),
	order_index: z.number().int().nonnegative('Order index must be non-negative'),
	criteria: z.string().max(500, 'Criteria is too long').optional(),
	links: z.array(z.unknown()).optional(),
	start_offset_days: z.number().int().nonnegative('Start offset days must be non-negative').default(0),
	deadline_days: z.number().int().positive('Deadline days must be a positive integer'),
	from_task_id: z.number().int().positive().optional(),
	uren: z.number().nonnegative().optional()
});

/**
 * Update process task input schema
 */
export const UpdateProcessTaskInputSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional().nullable(),
	role: z.string().max(255).optional().nullable(),
	order_index: z.number().int().nonnegative().optional(),
	criteria: z.string().max(500).optional().nullable(),
	links: z.array(z.unknown()).optional(),
	start_offset_days: z.number().int().nonnegative().optional(),
	deadline_days: z.number().int().positive().optional(),
	from_task_id: z.number().int().positive().optional().nullable(),
	uren: z.number().nonnegative().optional().nullable()
});

/**
 * Type exports inferred from schemas
 */
export type Process = z.infer<typeof ProcessSchema>;
export type CreateProcessInput = z.infer<typeof CreateProcessInputSchema>;
export type UpdateProcessInput = z.infer<typeof UpdateProcessInputSchema>;
export type ProcessStep = z.infer<typeof ProcessStepSchema>;
export type CreateProcessStepInput = z.infer<typeof CreateProcessStepInputSchema>;
export type UpdateProcessStepInput = z.infer<typeof UpdateProcessStepInputSchema>;
export type ProcessTask = z.infer<typeof ProcessTaskSchema>;
export type CreateProcessTaskInput = z.infer<typeof CreateProcessTaskInputSchema>;
export type UpdateProcessTaskInput = z.infer<typeof UpdateProcessTaskInputSchema>;

