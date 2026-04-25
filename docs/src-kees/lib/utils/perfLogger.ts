/**
 * Performance logging utility for server-side timing
 * Only logs in DEV mode or when PERF_LOGGING env var is set
 */

/**
 * Start a high-resolution timer.
 * Returns a function that when called returns elapsed milliseconds since the timer was created.
 */
export function startTimer(): () => number {
	const start = performance.now();
	return () => Math.round(performance.now() - start);
}

/**
 * Log performance metrics for a request.
 * Only outputs when DEV mode is active or PERF_LOGGING env var is 'true'.
 */
export function logPerformance(options: {
	path: string;
	method: string;
	userId: string | null;
	authMs: number;
	totalMs: number;
}): void {
	const shouldLog =
		import.meta.env.DEV || import.meta.env.PERF_LOGGING === 'true';
	if (!shouldLog) return;

	const { path, method, userId, authMs, totalMs } = options;
	console.log(
		`[PERF] ${method} ${path} auth=${authMs}ms total=${totalMs}ms user=${userId || 'anon'}`
	);
}
