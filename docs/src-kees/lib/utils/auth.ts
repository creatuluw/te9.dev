import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';

/**
 * Logout utility function
 * Clears all authentication data from localStorage and authStore
 * Optionally calls the logout API to invalidate the session on the server
 */
export async function logout(callApi: boolean = true): Promise<void> {
	if (!browser) return;

	// Call logout API if using new auth system and callApi is true
	if (callApi) {
		const authDataStr = localStorage.getItem('auth_data');
		if (authDataStr) {
			try {
				const authData = JSON.parse(authDataStr);
				if (authData.token) {
					// Call new auth API logout
					await fetch('/api/auth/logout', {
						method: 'POST',
						headers: {
							'Authorization': `Bearer ${authData.token}`,
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ sessionId: authData.user?.id })
					}).catch(console.error); // Fire and forget
				}
			} catch (e) {
				console.error('Error during logout:', e);
			}
		}
	}

	// Clear all auth data
	authStore.clearAuth();
	localStorage.removeItem('auth_data');
	localStorage.removeItem('auth');
}

/**
 * Logout and redirect to login page
 */
export function logoutAndRedirect(): void {
	logout(true).then(() => {
		if (browser) {
			window.location.href = '/login';
		}
	});
}

