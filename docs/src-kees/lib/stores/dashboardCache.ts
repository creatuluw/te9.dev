/**
 * Dashboard data caching store
 * Provides client-side caching for dashboard statistics with TTL
 */
import { writable } from 'svelte/store';
import type { DashboardStats } from '$lib/services/dashboardService';

interface CacheEntry {
	data: DashboardStats;
	timestamp: number;
}

// Cache TTL: 30 seconds (adjust based on data freshness requirements)
const CACHE_TTL = 30 * 1000;

function createDashboardCache() {
	const { subscribe, set } = writable<CacheEntry | null>(null);

	return {
		subscribe,
		/**
		 * Set cached data
		 */
		setCache: (data: DashboardStats) => {
			set({
				data,
				timestamp: Date.now()
			});
		},
		/**
		 * Get cached data if still valid
		 */
		getCache: (currentCache: CacheEntry | null): DashboardStats | null => {
			if (!currentCache) return null;
			
			const age = Date.now() - currentCache.timestamp;
			if (age > CACHE_TTL) {
				return null; // Cache expired
			}
			
			return currentCache.data;
		},
		/**
		 * Clear cache (e.g., after mutations)
		 */
		clearCache: () => {
			set(null);
		}
	};
}

export const dashboardCache = createDashboardCache();

