/**
 * Common interceptors for API client
 */

import type { RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from './client';
import type { AppError } from '$lib/types/errors';
import { UnauthorizedError } from '$lib/types/errors';
import { authStore } from '$lib/stores/authStore';
import { isApiLoggingEnabled } from '$lib/config/apiLogging';

/**
 * Add authentication token to requests
 */
export const authInterceptor: RequestInterceptor = (config) => {
	if (typeof window === 'undefined') {
		return config;
	}

	// Try to get token from store first
	let auth = authStore.getAuth();
	let token = auth?.token;

	// Fallback: if store is not initialized yet, check localStorage directly
	if (!token && typeof window !== 'undefined') {
		try {
			const authDataStr = localStorage.getItem('auth_data');
			if (authDataStr) {
				const authData = JSON.parse(authDataStr);
				token = authData?.token;
				// If we found it in localStorage but not in store, initialize the store
				if (token && !auth) {
					authStore.init();
				}
			}
		} catch (e) {
			// Ignore parsing errors
		}
	}

	if (token) {
		const headers = new Headers(config.headers);
		headers.set('Authorization', `Bearer ${token}`);
		return {
			...config,
			headers
		};
	}

	return config;
};

/**
 * Log requests in development
 * Note: Actual request logging with full URL happens in executeRequest after URL construction
 */
export const requestLogInterceptor: RequestInterceptor = (config) => {
	// Interceptor runs before URL construction, so logging is handled in executeRequest
	return config;
};

/**
 * Log responses if API logging is enabled
 */
export const responseLogInterceptor: ResponseInterceptor = (response) => {
	if (isApiLoggingEnabled()) {
		// Clone response to read body without consuming it
		const clonedResponse = response.clone();
		
		// Log asynchronously without blocking the response
		(async () => {
			let responseData;
			try {
				responseData = await clonedResponse.json();
			} catch (e) {
				try {
					responseData = await clonedResponse.text();
				} catch (e2) {
					responseData = '(unable to read response body)';
				}
			}
			
			console.log('[API Response]', {
				status: response.status,
				statusText: response.statusText,
				url: response.url,
				body: responseData,
				headers: Object.fromEntries(response.headers.entries())
			});
		})();
	}
	return response;
};

/**
 * Handle authentication errors globally
 */
export const authErrorInterceptor: ErrorInterceptor = async (error: AppError) => {
	if (error instanceof UnauthorizedError || (error as any).statusCode === 401) {
		// Don't redirect if we're already on the login page
		if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
			authStore.clearAuth();
			localStorage.removeItem('auth_data');
			localStorage.removeItem('auth');
			localStorage.removeItem('authorized');
			window.location.href = '/login';
		}
	}
	return error;
};

/**
 * Setup default interceptors
 */
export function setupDefaultInterceptors(client: any): void {
	client.useRequestInterceptor(authInterceptor);
	
	// Always add logging interceptors (they check isApiLoggingEnabled internally)
	client.useRequestInterceptor(requestLogInterceptor);
	client.useResponseInterceptor(responseLogInterceptor);
	
	client.useErrorInterceptor(authErrorInterceptor);
}

