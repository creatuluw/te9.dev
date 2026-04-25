/**
 * API-related types
 */

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
	data: T;
	message?: string;
	status?: number;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
	error: string;
	message: string;
	details?: Record<string, unknown>;
	statusCode: number;
}

/**
 * Request metadata
 */
export interface RequestMetadata {
	timestamp: number;
	duration?: number;
	retries?: number;
}

