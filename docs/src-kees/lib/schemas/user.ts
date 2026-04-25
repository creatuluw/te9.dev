/**
 * Zod validation schemas for User domain entities (PocketBase)
 */

import { z } from 'zod';

/**
 * PocketBase user schema
 * 
 * More lenient validation to handle real-world PocketBase data:
 * - Email can be optional (some users might not have emails)
 * - Avatar can be empty string or null (not always a valid URL)
 * - Datetime fields accept various formats (PocketBase returns different formats)
 */
export const PocketBaseUserSchema = z.object({
	id: z.string().min(1, 'User ID is required'),
	username: z.string().optional().nullable(),
	// Email is optional - some PocketBase users might not have emails
	email: z.string().email('Invalid email address').optional().nullable(),
	name: z.string().optional().nullable(),
	emailVisibility: z.boolean().optional(),
	verified: z.boolean().optional(),
	// Avatar can be any string (PocketBase may store various formats: URLs, file paths, etc.)
	// We normalize empty strings to null for consistency
	avatar: z.preprocess(
		(val) => {
			// Convert empty string or whitespace-only strings to null
			if (typeof val === 'string' && val.trim() === '') return null;
			return val;
		},
		z.union([
			z.string(), // Accept any string value (URL, file path, etc.)
			z.null()
		]).optional().nullable()
	),
	// Accept various datetime formats from PocketBase
	created: z.union([
		z.string().datetime(),
		z.string(), // Fallback for non-standard datetime formats
		z.undefined()
	]).optional(),
	updated: z.union([
		z.string().datetime(),
		z.string(), // Fallback for non-standard datetime formats
		z.undefined()
	]).optional()
}).passthrough(); // Allow additional fields from PocketBase

/**
 * User search query schema
 */
export const UserSearchQuerySchema = z.object({
	query: z.string().min(1, 'Search query is required').max(100, 'Search query is too long')
});

/**
 * Auth data schema - for new auth system
 */
export const AuthDataSchema = z.object({
	token: z.string(),
	refreshToken: z.string().optional(),
	user: z.object({
		id: z.string(),
		email: z.string(),
		username: z.string().nullable().optional(),
		name: z.string().nullable().optional(),
		avatar: z.string().nullable().optional(),
		email_verified: z.boolean().optional(),
		is_active: z.boolean().optional(),
		is_sysadmin: z.boolean().optional()
	}),
	roles: z.array(z.object({
		id: z.number(),
		name: z.string(),
		description: z.string().nullable().optional()
	})),
	permissions: z.array(z.object({
		id: z.number(),
		route: z.string(),
		actions: z.array(z.string())
	})),
	expiresAt: z.string()
});

/**
 * Type exports inferred from schemas
 */
export type PocketBaseUser = z.infer<typeof PocketBaseUserSchema>;
export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
export type AuthData = z.infer<typeof AuthDataSchema>;

