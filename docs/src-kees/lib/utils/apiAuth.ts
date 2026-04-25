/**
 * API Authentication Middleware - Helper functions for API route protection
 * 
 * Provides reusable helpers for authentication and authorization in API endpoints.
 */

import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { extractTokenFromHeader, verifyToken } from '$lib/utils/jwt';
import { hasPermission } from '$lib/services/authService';
import { getUserMessage, UnauthorizedError, ForbiddenError } from '$lib/types/errors';
import type { Result } from '$lib/types/result';
import type { TokenPayload } from '$lib/schemas/auth';

/**
 * Extract and verify authentication token from request
 * 
 * @param event - SvelteKit request event
 * @returns Token payload or throws error response
 */
export async function requireApiAuth(event: RequestEvent): Promise<TokenPayload> {
	const authHeader = event.request.headers.get('authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		throw json(
			{ success: false, error: 'Unauthorized - No token provided' },
			{ status: 401 }
		);
	}

	const tokenResult = await verifyToken(token);
	if (!tokenResult.success) {
		throw json(
			{ success: false, error: getUserMessage(tokenResult.error) },
			{ status: 401 }
		);
	}

	return tokenResult.value;
}

/**
 * Check if user is sysadmin from token payload
 * 
 * @param payload - Token payload
 * @returns True if user is sysadmin
 */
export function isSysadmin(payload: TokenPayload): boolean {
	return payload.is_sysadmin === true;
}

/**
 * Require admin role for API endpoint
 * 
 * @param event - SvelteKit request event
 * @returns Token payload if authorized or throws error response
 */
export async function requireAdmin(event: RequestEvent): Promise<TokenPayload> {
	const payload = await requireApiAuth(event);

	// Check if sysadmin or has Admin role
	if (payload.is_sysadmin || payload.roles.includes('Admin')) {
		return payload;
	}

	throw json(
		{ success: false, error: 'Forbidden - Admin access required' },
		{ status: 403 }
	);
}

/**
 * Require specific permission for API endpoint
 * 
 * @param event - SvelteKit request event
 * @param route - Route to check permission for
 * @param action - Action to check
 * @returns Token payload if authorized or throws error response
 */
export async function requireApiPermission(
	event: RequestEvent,
	route: string,
	action: string
): Promise<TokenPayload> {
	const payload = await requireApiAuth(event);

	// Sysadmins bypass all permission checks
	if (payload.is_sysadmin) {
		return payload;
	}

	const canAccess = await hasPermission(payload.userId, route, action);
	
	if (!canAccess) {
		throw json(
			{ success: false, error: 'Forbidden - Insufficient permissions' },
			{ status: 403 }
		);
	}

	return payload;
}

/**
 * Higher-order function wrapper for API handlers with authentication
 * 
 * @param handler - API handler function
 * @returns Wrapped handler with authentication
 * 
 * @example
 * ```typescript
 * export const GET = withAuth(async (event, payload) => {
 *   // payload.userId is available
 *   return json({ success: true, userId: payload.userId });
 * });
 * ```
 */
export function withAuth<T>(
	handler: (event: RequestEvent, payload: TokenPayload) => Promise<T>
) {
	return async (event: RequestEvent): Promise<T> => {
		const payload = await requireApiAuth(event);
		return handler(event, payload);
	};
}

/**
 * Higher-order function wrapper for API handlers with permission check
 * 
 * @param route - Route to check permission for
 * @param action - Action to check
 * @param handler - API handler function
 * @returns Wrapped handler with authentication and permission check
 * 
 * @example
 * ```typescript
 * export const GET = withPermission('/admin/users', 'read', async (event, payload) => {
 *   // User has /admin/users read permission
 *   return json({ success: true });
 * });
 * ```
 */
export function withPermission<T>(
	route: string,
	action: string,
	handler: (event: RequestEvent, payload: TokenPayload) => Promise<T>
) {
	return async (event: RequestEvent): Promise<T> => {
		const payload = await requireApiPermission(event, route, action);
		return handler(event, payload);
	};
}

/**
 * Check if user has permission (non-throwing version)
 * 
 * @param event - SvelteKit request event
 * @param route - Route to check permission for
 * @param action - Action to check
 * @returns Object with payload and hasPermission flag
 */
export async function checkApiPermission(
	event: RequestEvent,
	route: string,
	action: string
): Promise<{
	payload: TokenPayload | null;
	hasPermission: boolean;
}> {
	try {
		const payload = await requireApiAuth(event);
		const canAccess = await hasPermission(payload.userId, route, action);
		
		return {
			payload,
			hasPermission: canAccess
		};
	} catch (error) {
		return {
			payload: null,
			hasPermission: false
		};
	}
}

/**
 * Extract client IP address from request
 * 
 * @param event - SvelteKit request event
 * @returns IP address or null
 */
export function getClientIp(event: RequestEvent): string | null {
	// Try various headers in order of preference
	const headers = [
		'x-forwarded-for',
		'x-real-ip',
		'cf-connecting-ip', // Cloudflare
		'x-client-ip'
	];

	for (const header of headers) {
		const value = event.request.headers.get(header);
		if (value) {
			// x-forwarded-for can be comma-separated, get first IP
			return value.split(',')[0].trim();
		}
	}

	// Fallback to event.getClientAddress() if available
	return event.getClientAddress?.() || null;
}

/**
 * Extract user agent from request
 * 
 * @param event - SvelteKit request event
 * @returns User agent string or null
 */
export function getUserAgent(event: RequestEvent): string | null {
	return event.request.headers.get('user-agent');
}

/**
 * Create standard error response
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @returns JSON response
 */
export function errorResponse(message: string, status: number = 400) {
	return json(
		{ success: false, error: message },
		{ status }
	);
}

/**
 * Create standard success response
 * 
 * @param data - Response data
 * @param status - HTTP status code
 * @returns JSON response
 */
export function successResponse<T>(data: T, status: number = 200) {
	return json(
		{ success: true, data },
		{ status }
	);
}

/**
 * Handle Result pattern in API responses
 * 
 * @param result - Result object
 * @param successStatus - HTTP status for success
 * @param errorStatus - HTTP status for error
 * @returns JSON response
 * 
 * @example
 * ```typescript
 * const result = await userService.getUserById(id);
 * return handleResult(result);
 * ```
 */
export function handleResult<T>(
	result: Result<T, any>,
	successStatus: number = 200,
	errorStatus: number = 400
) {
	if (result.success) {
		return successResponse(result.value, successStatus);
	} else {
		return errorResponse(getUserMessage(result.error), errorStatus);
	}
}

