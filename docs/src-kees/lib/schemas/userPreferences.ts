/**
 * Zod validation schemas for User Preferences domain entities
 */

import { z } from 'zod';

/**
 * Notification method enum
 */
export const NotificationMethodSchema = z.enum(['in-app', 'email']);

/**
 * User preferences schema
 */
export const UserPreferencesSchema = z.object({
	id: z.number().int().positive(),
	user_id: z.string().min(1, 'User ID is required'),
	notification_methods: z.array(NotificationMethodSchema).default(['in-app']),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create user preferences input schema
 */
export const CreateUserPreferencesInputSchema = z.object({
	user_id: z.string().min(1, 'User ID is required'),
	notification_methods: z.array(NotificationMethodSchema).default(['in-app'])
});

/**
 * Update user preferences input schema
 */
export const UpdateUserPreferencesInputSchema = z.object({
	notification_methods: z.array(NotificationMethodSchema).min(1, 'At least one notification method is required')
});

/**
 * Type exports inferred from schemas
 */
export type NotificationMethod = z.infer<typeof NotificationMethodSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type CreateUserPreferencesInput = z.infer<typeof CreateUserPreferencesInputSchema>;
export type UpdateUserPreferencesInput = z.infer<typeof UpdateUserPreferencesInputSchema>;

