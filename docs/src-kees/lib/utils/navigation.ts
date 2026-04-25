/**
 * Navigation Utilities
 * 
 * Provides utilities for filtering navigation based on user permissions
 */

import { getNavigationRoutes, getRoutesByGroup, type RouteDefinition } from '$lib/config/routes';
import { hasPermission, isSysadmin } from '$lib/utils/authGuard';
import type { DropdownNavItem } from '$lib/components/DropdownNav.svelte';

/**
 * Get filtered navigation items based on user permissions
 * 
 * @returns Array of navigation items user can access
 */
export function getFilteredNavItems(): Array<{ label: string; href: string; dropdownItems?: Array<{ label: string; href: string }> }> {
	// Sysadmins see all navigation
	if (isSysadmin()) {
		return getNavigationRoutes()
			.filter(route => route.navigation?.group === 'main')
			.map(route => ({
				label: route.navigation!.label,
				href: route.path,
				dropdownItems: route.navigation!.dropdownItems
			}));
	}

	// Filter by permissions
	return getNavigationRoutes()
		.filter(route => {
			// Check if user has read permission for this route
			if (route.navigation?.group === 'main') {
				return hasPermission(route.path, 'read');
			}
			return false;
		})
		.map(route => ({
			label: route.navigation!.label,
			href: route.path,
			dropdownItems: route.navigation!.dropdownItems
		}));
}

/**
 * Get filtered admin dropdown items based on user permissions
 * 
 * @returns Array of admin dropdown items user can access
 */
export function getFilteredAdminDropdownItems(): DropdownNavItem[] {
	// Get admin routes
	let adminRoutes = getRoutesByGroup('admin')
		.filter(route => route.navigation && !route.navigation.showInNav);

	// Sysadmins see all admin items
	if (isSysadmin()) {
		return adminRoutes
			.sort((a, b) => {
				const orderA = a.navigation?.order || 999;
				const orderB = b.navigation?.order || 999;
				return orderA - orderB;
			})
			.map(route => ({
				label: route.navigation!.label,
				href: route.path
			}));
	}

	// Filter by permissions
	return adminRoutes
		.filter(route => hasPermission(route.path, 'read'))
		.sort((a, b) => {
			const orderA = a.navigation?.order || 999;
			const orderB = b.navigation?.order || 999;
			return orderA - orderB;
		})
		.map(route => ({
			label: route.navigation!.label,
			href: route.path
		}));
}

/**
 * Get filtered placeholder dropdown items based on user permissions
 * 
 * @returns Array of placeholder dropdown items user can access
 */
export function getFilteredPlaceholderDropdownItems(): DropdownNavItem[] {
	// Get routes that might be in placeholder menu
	// For now, return empty - can be extended based on routes.ts
	const placeholderRoutes = getNavigationRoutes()
		.filter(route => route.navigation?.group !== 'main' && route.navigation?.group !== 'admin');

	// Sysadmins see all
	if (isSysadmin()) {
		return placeholderRoutes.map(route => ({
			label: route.navigation!.label,
			href: route.path
		}));
	}

	// Filter by permissions
	return placeholderRoutes
		.filter(route => hasPermission(route.path, 'read'))
		.map(route => ({
			label: route.navigation!.label,
			href: route.path
		}));
}

