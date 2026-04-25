/**
 * Zod validation schemas for Employee domain entities
 * 
 * Based on the _bpm_employees view which joins:
 * - _kiekeboe_users (ku.*)
 * - _kiekeboe_employee_contract_info (keci.*)
 * - Computed hoi_email field
 */

import { z } from 'zod';

/**
 * Employee schema from _bpm_employees view
 * 
 * This view includes:
 * - All fields from _kiekeboe_users (user_id, email_value, etc.)
 * - Computed hoi_email field (extracted from email_value)
 * - All fields from _kiekeboe_employee_contract_info (valid_from, valid_until, etc.)
 * 
 * Uses passthrough() to allow additional fields from the underlying tables
 */
export const EmployeeSchema = z.object({
	// Common user fields (from _kiekeboe_users)
	user_id: z.union([z.string(), z.number()]).optional(),
	email_value: z.string().optional().nullable(),
	name: z.string().optional().nullable(), // Legacy field
	fullname: z.string().optional().nullable(), // Actual field from view
	email: z.string().optional().nullable(), // Email field from view
	
	// Computed field from view
	hoi_email: z.string().optional().nullable(),
	
	// Contract info fields (from _kiekeboe_employee_contract_info)
	employee_id: z.union([z.string(), z.number()]).optional(),
	valid_from: z.union([
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
		z.string(), // Accept any string format
		z.null()
	]).optional().nullable(),
	valid_until: z.union([
		z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
		z.string(), // Accept any string format
		z.null()
	]).optional().nullable(),
	
	// Additional contract fields
	active: z.boolean().optional(),
	hours_per_week: z.number().optional().nullable(),
	full_time_hours: z.number().optional().nullable(),
	max_hours_per_week: z.number().optional().nullable(),
	type_of_contract: z.string().optional().nullable(),
	hours_calculation_model: z.string().optional().nullable(),
	scale: z.string().optional().nullable(),
	scale_number: z.number().optional().nullable(),
	salary: z.number().optional().nullable(),
	
	// Allow additional fields from underlying tables
}).passthrough();

/**
 * Employee query options schema
 */
export const EmployeeQueryOptionsSchema = z.object({
	search: z.string().optional(),
	valid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // Filter by specific date
	include_expired: z.boolean().optional().default(false)
}).optional();

/**
 * Type exports inferred from schemas
 */
export type Employee = z.infer<typeof EmployeeSchema>;
export type EmployeeQueryOptions = z.infer<typeof EmployeeQueryOptionsSchema>;

