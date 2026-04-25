/**
 * Employee service - Fetch employee data from _bpm_employees view
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { queryTableResult } from '$lib/utils/postgrest';
import type { AppError } from '$lib/types/errors';
import { ValidationError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';
import { validateSchema } from '$lib/utils/validation';
import {
	EmployeeSchema,
	EmployeeQueryOptionsSchema,
	type Employee,
	type EmployeeQueryOptions
} from '$lib/schemas/employee';

/**
 * Get all employees from _bpm_employees view
 * 
 * The view automatically filters for current valid contracts (between valid_from and valid_until, or valid_until is NULL).
 * 
 * @param options - Optional query options (search, valid_on, include_expired)
 * @returns Result containing array of employees, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await getAllEmployees();
 * if (result.success) {
 *   console.log(result.value.length); // Number of active employees
 * }
 * ```
 */
export async function getAllEmployees(
	options?: EmployeeQueryOptions
): Promise<Result<Employee[], AppError>> {
	// Validate options if provided
	if (options) {
		const validation = validateSchema(EmployeeQueryOptionsSchema, options);
		if (!validation.success) {
			return err(validation.error);
		}
	}

	// Build filter for PostgREST
	const filter: Record<string, string> = {};

	// If searching by specific date, add date filter
	if (options?.valid_on) {
		// Filter for contracts valid on the specified date
		filter.valid_from = `lte.${options.valid_on}`;
		filter.valid_until = `or(gt.${options.valid_on},is.null)`;
	}

	// Build query options
	const queryOptions = {
		filter: Object.keys(filter).length > 0 ? filter : undefined,
		order: ['user_id.asc'],
		limit: 1000 // Reasonable limit for employees
	};

	const result = await queryTableResult<Employee>('_bpm_employees', queryOptions);

	if (!result.success) {
		return err(result.error);
	}

	// Validate each employee against schema
	// Since we use passthrough(), validation should be lenient
	const validatedEmployees: Employee[] = [];
	for (const employee of result.value.data) {
		const validation = EmployeeSchema.safeParse(employee);
		if (validation.success) {
			validatedEmployees.push(validation.data);
		} else {
			// Log validation errors in dev mode but include the employee anyway
			if (import.meta.env.DEV) {
				console.warn('[employeeService] Employee validation failed:', validation.error);
			}
			// Since we use passthrough(), include the employee anyway
			validatedEmployees.push(employee as Employee);
		}
	}

	// Add test employee
	const testEmployee: Employee = {
		user_id: 0,
		employee_id: 0,
		email_value: 'creatuluw@gmail.com',
		email: 'creatuluw@gmail.com',
		hoi_email: 'creatuluw@gmail.com',
		fullname: 'Patrick Testubijuluw',
		name: 'Patrick Testubijuluw',
		active: true,
		valid_from: '2024-01-01',
		valid_until: null,
		hours_per_week: 40,
		full_time_hours: 40,
		max_hours_per_week: 40,
		type_of_contract: 'Vast',
		hours_calculation_model: 'Standard',
		scale: 'F',
		scale_number: 10,
		salary: 50000
	};
	validatedEmployees.push(testEmployee);
	
	return ok(validatedEmployees);
}

/**
 * Get employee by user ID
 * 
 * @param userId - User ID to search for
 * @returns Result containing employee or error if not found
 * 
 * @example
 * ```typescript
 * const result = await getEmployeeByUserId('123');
 * if (result.success) {
 *   console.log(result.value.name);
 * }
 * ```
 */
export async function getEmployeeByUserId(userId: string | number): Promise<Result<Employee, AppError>> {
	if (userId === undefined || userId === null) {
		return err(ValidationError.create('User ID is required', 'userId', userId));
	}

	// Check if it's the test employee (ID 0)
	if (userId === 0 || userId === '0') {
		const testEmployee: Employee = {
			user_id: 0,
			employee_id: 0,
			email_value: 'creatuluw@gmail.com',
			email: 'creatuluw@gmail.com',
			hoi_email: 'creatuluw@gmail.com',
			fullname: 'Patrick Testubijuluw',
			name: 'Patrick Testubijuluw',
			active: true,
			valid_from: '2024-01-01',
			valid_until: null,
			hours_per_week: 40,
			full_time_hours: 40,
			max_hours_per_week: 40,
			type_of_contract: 'Vast',
			hours_calculation_model: 'Standard',
			scale: 'F',
			scale_number: 10,
			salary: 50000
		};
		return ok(testEmployee);
	}

	const userIdStr = String(userId);

	const result = await queryTableResult<Employee>('_bpm_employees', {
		filter: { user_id: `eq.${userIdStr}` },
		limit: 1
	});

	if (!result.success) {
		return err(result.error);
	}

	if (result.value.data.length === 0) {
		return err(ValidationError.create('Employee not found', 'userId', userIdStr));
	}

	const employee = result.value.data[0];
	const validation = EmployeeSchema.safeParse(employee);
	
	if (!validation.success) {
		return err(ValidationError.create('Invalid employee data', 'employee', employee));
	}

	return ok(validation.data);
}

/**
 * Search employees by name or email
 * 
 * @param searchTerm - Search term to match against name or email
 * @returns Result containing array of matching employees, or error if query fails
 * 
 * @example
 * ```typescript
 * const result = await searchEmployees('john');
 * if (result.success) {
 *   console.log(result.value); // Employees matching "john"
 * }
 * ```
 */
export async function searchEmployees(searchTerm: string): Promise<Result<Employee[], AppError>> {
	if (!searchTerm || searchTerm.trim().length === 0) {
		return err(ValidationError.create('Search term is required', 'searchTerm', searchTerm));
	}

	if (searchTerm.length < 2) {
		return err(ValidationError.create('Search term must be at least 2 characters', 'searchTerm', searchTerm));
	}

	// PostgREST text search using ilike (case-insensitive)
	const result = await queryTableResult<Employee>('_bpm_employees', {
		filter: {
			or: `(name.ilike.%${searchTerm}%,email_value.ilike.%${searchTerm}%,hoi_email.ilike.%${searchTerm}%)`
		},
		order: ['name'],
		limit: 100
	});

	if (!result.success) {
		return err(result.error);
	}

	// Validate employees
	const validatedEmployees: Employee[] = [];
	for (const employee of result.value.data) {
		const validation = EmployeeSchema.safeParse(employee);
		if (validation.success) {
			validatedEmployees.push(validation.data);
		}
	}

	return ok(validatedEmployees);
}

