import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import type { PageServerLoad } from './$types';

interface FileTreeNode {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileTreeNode[];
	description?: string;
	detailedDescription?: string;
}

/**
 * Get short description for a file or folder based on its path and name
 */
function getShortDescription(path: string, name: string, isDirectory: boolean): string {
	const relativePath = path.replace(/^src[\\/]/, '');
	
	if (isDirectory) {
		// Directory descriptions
		if (relativePath.startsWith('lib/api')) return 'API client layer for HTTP requests and interceptors';
		if (relativePath.startsWith('lib/components')) return 'Reusable UI components library';
		if (relativePath.startsWith('lib/services')) return 'Business logic and data access services';
		if (relativePath.startsWith('lib/stores')) return 'Svelte stores for state management';
		if (relativePath.startsWith('lib/schemas')) return 'Zod validation schemas for data types';
		if (relativePath.startsWith('lib/types')) return 'TypeScript type definitions';
		if (relativePath.startsWith('lib/utils')) return 'Utility functions and helpers';
		if (relativePath.startsWith('lib/config')) return 'Application configuration files';
		if (relativePath.startsWith('lib/server')) return 'Server-side utilities and helpers';
		if (relativePath.startsWith('lib/templates')) return 'Email and document templates';
		if (relativePath.startsWith('lib/themes')) return 'Theme definitions and configurations';
		if (relativePath.startsWith('routes/api')) return 'API endpoint handlers';
		if (relativePath.startsWith('routes/admin')) return 'Admin panel pages and routes';
		if (relativePath.startsWith('routes/cases')) return 'Case management pages';
		if (relativePath.startsWith('routes/processes')) return 'Process management pages';
		if (relativePath.startsWith('routes/projects')) return 'Project management pages';
		if (relativePath.startsWith('routes/work')) return 'Work item management pages';
		return 'Directory';
	} else {
		// File descriptions
		if (name === 'hooks.server.ts') return 'SvelteKit server hooks for authentication and permissions';
		if (name === 'app.d.ts') return 'TypeScript type definitions for SvelteKit app';
		if (name === 'app.html') return 'HTML template for the application';
		if (name === 'app.css') return 'Global application styles';
		if (name === 'style.css') return 'Additional global styles';
		if (name === '+layout.svelte') return 'Layout component for route group';
		if (name === '+page.svelte') return 'Page component';
		if (name === '+page.server.ts') return 'Server-side data loader';
		if (name === '+page.ts') return 'Client-side data loader';
		if (name === '+error.svelte') return 'Error page component';
		if (name.endsWith('Service.ts')) return 'Business logic service';
		if (name.endsWith('Store.ts')) return 'Svelte store for state management';
		if (name.endsWith('.schema.ts')) return 'Zod validation schema';
		if (name.endsWith('.svelte')) return 'Svelte component';
		if (name.endsWith('.md')) return 'Documentation file';
		return 'File';
	}
}

/**
 * Get detailed description for a file or folder
 */
function getDetailedDescription(path: string, name: string, isDirectory: boolean): string {
	const relativePath = path.replace(/^src[\\/]/, '');
	
	if (isDirectory) {
		// Directory detailed descriptions
		if (relativePath.startsWith('lib/api')) {
			return 'Contains the API client layer with HTTP request handling, interceptors for authentication, and type-safe API communication. Handles all external API calls and request/response transformations.';
		}
		if (relativePath.startsWith('lib/components')) {
			return 'Reusable UI component library following the design system. Components are documented with .md files and exported through index.ts. Includes form components, layout components, and business-specific components.';
		}
		if (relativePath.startsWith('lib/services')) {
			return 'Business logic layer implementing the Result pattern for error handling. Services handle data access, business rules, validation, and coordinate between components and data sources. All methods return Result<T, AppError>.';
		}
		if (relativePath.startsWith('lib/stores')) {
			return 'Svelte stores for global state management. Includes both rune-based stores (.svelte.ts) and traditional stores. Manages authentication, navigation, UI state, and cached data.';
		}
		if (relativePath.startsWith('lib/schemas')) {
			return 'Zod validation schemas for all domain entities. Used for input validation at service boundaries. Exported through index.ts for centralized schema access.';
		}
		if (relativePath.startsWith('lib/types')) {
			return 'TypeScript type definitions including branded types for IDs, error types, result types, and domain models. Provides type safety across the application.';
		}
		if (relativePath.startsWith('lib/utils')) {
			return 'Utility functions and helpers for common operations: authentication, validation, date/time manipulation, navigation, PostgREST queries, and more. Pure functions with no side effects where possible.';
		}
		if (relativePath.startsWith('lib/config')) {
			return 'Application configuration including route definitions with permissions, API logging settings, and environment-specific configurations.';
		}
		if (relativePath.startsWith('lib/server')) {
			return 'Server-side utilities including permission checking helpers (requirePermission) that enforce security on protected routes. Only available in server context.';
		}
		if (relativePath.startsWith('lib/templates')) {
			return 'Email templates and document templates using HTML. Templates use utility functions for dynamic content generation.';
		}
		if (relativePath.startsWith('lib/themes')) {
			return 'Theme definitions for the application. Each theme exports configuration for colors, fonts, and styling. Themes can be switched dynamically.';
		}
		if (relativePath.startsWith('routes/api')) {
			return 'API endpoint handlers following SvelteKit +server.ts pattern. Handles authentication, validation, business logic coordination, and response formatting. Organized by feature domain.';
		}
		if (relativePath.startsWith('routes/admin')) {
			return 'Admin panel pages for user management, role management, permissions, and system administration. Protected by permission checks in +page.server.ts files.';
		}
		if (relativePath.startsWith('routes/cases')) {
			return 'Case management pages for viewing, creating, and managing business process cases. Includes public sharing functionality and case detail views.';
		}
		if (relativePath.startsWith('routes/processes')) {
			return 'Process definition pages for creating and editing business process templates. Manages process steps, tasks, and workflow definitions.';
		}
		if (relativePath.startsWith('routes/projects')) {
			return 'Project management pages for organizing work by projects. Includes project member management and project-based filtering.';
		}
		if (relativePath.startsWith('routes/work')) {
			return 'Work item management pages including backlog view, work item details, and work organization. Central hub for task and work item management.';
		}
		return 'Directory containing application files.';
	} else {
		// File detailed descriptions
		if (name === 'hooks.server.ts') {
			return 'SvelteKit server hooks that run on every request. Handles authentication via PocketBase, sets up user context (locals.user), loads permissions, and enforces route-level permissions. Critical for security - runs on both server-side page loads and API requests.';
		}
		if (name === 'app.d.ts') {
			return 'TypeScript declaration file that extends SvelteKit types. Defines the Locals interface with user and permissions, and App namespace types for type safety across the application.';
		}
		if (name === 'app.html') {
			return 'Root HTML template for the SvelteKit application. Contains the base HTML structure, meta tags, and where the Svelte app mounts.';
		}
		if (name === 'app.css') {
			return 'Global CSS styles including Tailwind directives, custom CSS variables, and application-wide styling rules. Loaded on every page.';
		}
		if (name === '+layout.svelte') {
			return 'Layout component that wraps child routes. Provides shared UI structure like headers, navigation, and common page elements. Can be nested for route groups.';
		}
		if (name === '+page.svelte') {
			return 'Page component that renders the route. Receives data from +page.server.ts or +page.ts load functions. Main UI component for the route.';
		}
		if (name === '+page.server.ts') {
			return 'Server-side data loader that runs on the server. Used for fetching data, checking permissions (requirePermission), and preparing data for the page. Critical for security - runs on every page load including client-side navigation.';
		}
		if (name === '+page.ts') {
			return 'Client-side data loader that runs in the browser. Used for client-only data fetching and reactive data loading.';
		}
		if (name === '+error.svelte') {
			return 'Error boundary component that displays when errors occur in the route or its children. Handles error states gracefully.';
		}
		if (name.endsWith('Service.ts')) {
			return 'Service module implementing business logic following the Result pattern. Handles data access, validation, business rules, and coordinates between components and APIs. All methods return Result<T, AppError> for consistent error handling.';
		}
		if (name.endsWith('Store.ts')) {
			return 'Svelte store for state management. Can be a rune-based store (.svelte.ts) or traditional writable/readable store. Manages application state, UI state, or cached data.';
		}
		if (name.endsWith('.schema.ts')) {
			return 'Zod validation schema for a domain entity. Defines the shape and validation rules for data types. Used for input validation at service boundaries.';
		}
		if (name.endsWith('.svelte')) {
			return 'Svelte component following Svelte 5 runes pattern. Uses $props(), $state(), $derived(), and $effect() for reactivity. May include TypeScript interfaces for props and exported types.';
		}
		if (name.endsWith('.md')) {
			return 'Documentation file, typically component documentation with props, examples, and usage instructions.';
		}
		return 'Application file.';
	}
}

/**
 * Recursively build file tree structure
 */
async function buildFileTree(dirPath: string, basePath: string = ''): Promise<FileTreeNode[]> {
	const entries = await readdir(dirPath);
	const nodes: FileTreeNode[] = [];
	
	for (const entry of entries) {
		// Skip node_modules, .git, and other ignored directories
		if (entry.startsWith('.') && entry !== '.adding-components.md' && entry !== '.adding-routes.md') {
			continue;
		}
		
		const fullPath = join(dirPath, entry);
		const relativePath = basePath ? `${basePath}/${entry}` : entry;
		const stats = await stat(fullPath);
		
		if (stats.isDirectory()) {
			const children = await buildFileTree(fullPath, relativePath);
			nodes.push({
				name: entry,
				path: `src/${relativePath}`,
				type: 'directory',
				children,
				description: getShortDescription(`src/${relativePath}`, entry, true),
				detailedDescription: getDetailedDescription(`src/${relativePath}`, entry, true)
			});
		} else {
			nodes.push({
				name: entry,
				path: `src/${relativePath}`,
				type: 'file',
				description: getShortDescription(`src/${relativePath}`, entry, false),
				detailedDescription: getDetailedDescription(`src/${relativePath}`, entry, false)
			});
		}
	}
	
	// Sort: directories first, then files, both alphabetically
	return nodes.sort((a, b) => {
		if (a.type !== b.type) {
			return a.type === 'directory' ? -1 : 1;
		}
		return a.name.localeCompare(b.name);
	});
}

export const load: PageServerLoad = async () => {
	const srcPath = join(process.cwd(), 'src');
	const tree = await buildFileTree(srcPath);
	
	return {
		tree
	};
};




























