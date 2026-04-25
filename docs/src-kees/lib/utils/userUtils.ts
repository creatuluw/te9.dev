/**
 * User utilities - Get current logged-in user data for attribution
 */
import { authStore } from '$lib/stores/authStore';
import * as pocketbaseService from '$lib/services/pocketbaseService';
import type { PocketBaseUser } from '$lib/services/pocketbaseService';

/**
 * Get current user from auth store
 */
export function getCurrentUser(): PocketBaseUser | null {
	const auth = authStore.getAuth();
	return auth?.user || null;
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | null {
	const user = getCurrentUser();
	return user?.id || null;
}

/**
 * Get current user email
 */
export function getCurrentUserEmail(): string | null {
	const user = getCurrentUser();
	return user?.email || null;
}

/**
 * Get current user name (name, username, or email)
 */
export function getCurrentUserName(): string | null {
	const user = getCurrentUser();
	if (!user) return null;
	return user.name || user.username || user.email || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	return getCurrentUserId() !== null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export function requireAuth(): PocketBaseUser {
	const user = getCurrentUser();
	if (!user) {
		throw new Error('User must be authenticated');
	}
	return user;
}

/**
 * Require user ID - throws error if not authenticated
 */
export function requireUserId(): string {
	const userId = getCurrentUserId();
	if (!userId) {
		throw new Error('User must be authenticated');
	}
	return userId;
}

/**
 * Get user by ID with caching (for attribution display)
 */
let userCache: Map<string, PocketBaseUser> = new Map();

export async function getUserForAttribution(userId: string | number | null | undefined): Promise<PocketBaseUser | null> {
	if (!userId) return null;
	
	// Convert to string for consistent caching
	const userIdString = String(userId);
	
	// Check cache first
	if (userCache.has(userIdString)) {
		const cachedUser = userCache.get(userIdString)!;
		if (import.meta.env.DEV) {
			// Commented out: verbose userUtils cache logs
			// console.log(`[getUserForAttribution] Using cached user for ${userIdString}:`, cachedUser.name || cachedUser.email);
		}
		return cachedUser;
	}
	
	if (import.meta.env.DEV) {
		// Commented out: verbose userUtils fetch logs (keep errors)
		// console.log(`[getUserForAttribution] Fetching user ${userIdString}...`);
	}
	
	const result = await pocketbaseService.getUserById(userIdString);
	if (result.success) {
		userCache.set(userIdString, result.value);
		if (import.meta.env.DEV) {
			// Commented out: verbose userUtils success logs (keep errors)
			// console.log(`[getUserForAttribution] Successfully fetched user ${userIdString}:`, result.value.name || result.value.email || result.value.username);
		}
		return result.value;
	} else {
		// Check if this is an auto-cancellation error (not a real error)
		const errorMessage = result.error.message || '';
		const isAutoCancelled = errorMessage.includes('autocancelled') || 
		                       errorMessage.includes('signal is aborted') ||
		                       errorMessage.includes('aborted without reason');
		
		if (isAutoCancelled) {
			// Auto-cancellation is expected when requests are aborted (e.g., component unmounts)
			// Don't log as error, just return null
			if (import.meta.env.DEV) {
				console.log(`[getUserForAttribution] Request for user ${userId} was auto-cancelled (expected)`);
			}
			return null;
		}
		
		// Check if this is a 404 (user not found) - this is expected for legacy/invalid user IDs
		const isNotFound = result.error.name === 'NotFoundError' || errorMessage.includes('not found');
		
		if (isNotFound) {
			// User doesn't exist - this is expected for old PocketBase IDs or deleted users
			// Don't log as error, just return null silently
			if (import.meta.env.DEV) {
				console.log(`[getUserForAttribution] User ${userId} not found (legacy or deleted user)`);
			}
			return null;
		}
		
		// Real error (network, permission, etc.) - log it
		console.error(`[getUserForAttribution] Error fetching user ${userId}:`, result.error);
		return null;
	}
}

/**
 * Clear user cache (useful when users are updated)
 */
export function clearUserCache() {
	userCache.clear();
}

/**
 * Format user name for display
 */
export function formatUserName(user: PocketBaseUser | null | undefined): string {
	if (!user) return 'Unknown';
	return user.name || user.username || user.email || 'Unknown';
}

