import type { PageLoad } from './$types';
import * as dashboardService from '$lib/services/dashboardService';

/**
 * Server-side data loading for dashboard page
 * Loads data during SSR for faster initial page render
 */
export const load: PageLoad = async () => {
	const result = await dashboardService.getDashboardStats();
	
	if (result.success) {
		return {
			stats: result.value
		};
	}
	
	// Return empty data on error - component will handle gracefully
	return {
		stats: null,
		error: result.error
	};
};

