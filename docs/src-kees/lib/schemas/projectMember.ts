/**
 * Zod validation schemas for ProjectMember domain entities
 */

import { z } from 'zod';

/**
 * Project member schema
 */
export const ProjectMemberSchema = z.object({
	id: z.number().int().positive(),
	project_id: z.number().int().positive(),
	user_id: z.string().min(1),
	is_owner: z.boolean(),
	created_at: z.string().datetime(),
	created_by: z.string().nullable().optional()
});

/**
 * Create project member input schema
 */
export const CreateProjectMemberInputSchema = z.object({
	project_id: z.number().int().positive(),
	user_id: z.string().min(1, 'User ID is required'),
	is_owner: z.boolean().optional().default(false),
	created_by: z.string().optional()
});

/**
 * Update project member input schema
 */
export const UpdateProjectMemberInputSchema = z.object({
	is_owner: z.boolean()
});

/**
 * Project member with user details (for joined queries)
 */
export const ProjectMemberWithUserSchema = ProjectMemberSchema.extend({
	user_name: z.string().optional(),
	user_email: z.string().email().optional(),
	user_avatar: z.string().optional().nullable()
});

/**
 * Type exports inferred from schemas
 */
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type CreateProjectMemberInput = z.infer<typeof CreateProjectMemberInputSchema>;
export type UpdateProjectMemberInput = z.infer<typeof UpdateProjectMemberInputSchema>;
export type ProjectMemberWithUser = z.infer<typeof ProjectMemberWithUserSchema>;

