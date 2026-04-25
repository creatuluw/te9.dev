/**
 * Zod validation schemas for User Availability domain entities
 */

import { z } from 'zod';

/**
 * User availability schema
 */
export const UserAvailabilitySchema = z.object({
	id: z.number().int().positive(),
	user_id: z.string().min(1, 'User ID is required'),
	hours_per_week: z.number().positive('Hours per week must be positive'),
	week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create user availability input schema
 */
export const CreateUserAvailabilityInputSchema = z.object({
	user_id: z.string().min(1, 'User ID is required'),
	hours_per_week: z.number().positive('Hours per week must be positive'),
	week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
});

/**
 * Update user availability input schema
 */
export const UpdateUserAvailabilityInputSchema = z.object({
	hours_per_week: z.number().positive('Hours per week must be positive').optional(),
	week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional()
});

/**
 * Type exports inferred from schemas
 */
export type UserAvailability = z.infer<typeof UserAvailabilitySchema>;
export type CreateUserAvailabilityInput = z.infer<typeof CreateUserAvailabilityInputSchema>;
export type UpdateUserAvailabilityInput = z.infer<typeof UpdateUserAvailabilityInputSchema>;

