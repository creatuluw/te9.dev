/**
 * Zod validation schemas for Project domain entities
 */

import { z } from 'zod';

/**
 * Project schema
 */
export const ProjectSchema = z.object({
	id: z.number().int().positive(),
	name: z.string().min(1, 'Project name is required'),
	description: z.string().optional().nullable(),
	status: z.string(),
	is_private: z.boolean().optional(),
	created_by: z.string().optional().nullable(),
	bijlagen: z.array(z.string()).optional().nullable(),
	public_token: z.string().nullable().optional(),
	is_public: z.boolean().default(false).optional(),
	public_token_expires_at: z.string().datetime().nullable().optional(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create project input schema
 */
export const CreateProjectInputSchema = z.object({
	name: z.string().min(1, 'Project name is required').max(255, 'Project name is too long'),
	description: z.string().max(1000, 'Description is too long').optional(),
	status: z.string().optional().default('active'),
	is_private: z.boolean().optional().default(false)
});

/**
 * Update project input schema
 */
export const UpdateProjectInputSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional().nullable(),
	status: z.string().optional(),
	is_private: z.boolean().optional(),
	bijlagen: z.array(z.string()).optional().nullable()
});

/**
 * Type exports inferred from schemas
 */
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

