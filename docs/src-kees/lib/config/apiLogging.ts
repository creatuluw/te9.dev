/**
 * API Logging Configuration
 * 
 * Controls whether API request/response logs are shown in the console.
 * Can be controlled via environment variable or runtime toggle.
 */

/**
 * Check if API logging is enabled
 * Reads from PUBLIC_ENABLE_API_LOGS environment variable
 * Defaults to false to keep console clean
 */
export function isApiLoggingEnabled(): boolean {
	// Check environment variable first
	const envValue = import.meta.env.PUBLIC_ENABLE_API_LOGS;
	
	// If explicitly set in env, use that value
	if (envValue !== undefined) {
		return envValue === 'true' || envValue === true;
	}
	
	// Check localStorage for runtime toggle (browser only)
	if (typeof window !== 'undefined') {
		const storedValue = localStorage.getItem('enable_api_logs');
		if (storedValue !== null) {
			return storedValue === 'true';
		}
	}
	
	// Default to false (muted)
	return false;
}

/**
 * Enable API logging at runtime
 * Stores preference in localStorage
 */
export function enableApiLogging(): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem('enable_api_logs', 'true');
		console.log('✅ API logging enabled. Reload the page for changes to take effect.');
	}
}

/**
 * Disable API logging at runtime
 * Stores preference in localStorage
 */
export function disableApiLogging(): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem('enable_api_logs', 'false');
		console.log('🔇 API logging disabled. Reload the page for changes to take effect.');
	}
}

/**
 * Toggle API logging on/off
 * Stores preference in localStorage
 */
export function toggleApiLogging(): void {
	const currentState = isApiLoggingEnabled();
	if (currentState) {
		disableApiLogging();
	} else {
		enableApiLogging();
	}
}

// Expose to window for console access
if (typeof window !== 'undefined') {
	(window as any).apiLogging = {
		enable: enableApiLogging,
		disable: disableApiLogging,
		toggle: toggleApiLogging,
		isEnabled: isApiLoggingEnabled
	};
}

