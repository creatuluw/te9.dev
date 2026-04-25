/**
 * Entity search utility - Search across all entity types (users, projects, cases, tasks, processes)
 */

import * as pocketbaseService from '$lib/services/pocketbaseService';
import * as projectService from '$lib/services/projectService';
import * as caseService from '$lib/services/caseService';
import * as processService from '$lib/services/processService';
import * as taskService from '$lib/services/taskService';
import type { PocketBaseUser } from '$lib/services/pocketbaseService';
import { ok, err, type Result } from '$lib/types/result';
import type { AppError } from '$lib/types/errors';

/**
 * Search result for an entity
 */
export interface SearchResult {
	/**
	 * Entity type
	 */
	type: 'user' | 'project' | 'case' | 'task' | 'process';
	
	/**
	 * Entity ID (number for most entities, string for users)
	 */
	id: number | string;
	
	/**
	 * Entity name
	 */
	name: string;
	
	/**
	 * Additional display information (optional)
	 */
	subtitle?: string;
}

/**
 * Search across all entity types by name
 * 
 * Searches users, projects, cases, tasks, and processes.
 * Returns unified results with type and ID.
 * 
 * @param query - Search query string (case-insensitive)
 * @param limit - Maximum number of results per entity type (default: 10)
 * @returns Promise resolving to array of search results
 * 
 * @example
 * ```typescript
 * const results = await searchEntities('alpha');
 * // Returns:
 * // [
 * //   { type: 'user', id: 'user123', name: 'Alpha User' },
 * //   { type: 'project', id: 1, name: 'Alpha Project' },
 * //   { type: 'case', id: 2, name: 'Alpha Case' }
 * // ]
 * ```
 */
export async function searchEntities(
	query: string,
	limit: number = 10
): Promise<SearchResult[]> {
	const searchQuery = query?.trim() || '';
	const results: SearchResult[] = [];
	
	// If query is empty, only search users (most common for @mentions)
	if (searchQuery.length === 0) {
		const usersResult = await getAllUsersForMention(limit * 2); // Show more users when no query
		if (usersResult.success) {
			results.push(...usersResult.value);
		}
		return results;
	}
	
	const searchQueryLower = searchQuery.toLowerCase();
	
	// Search all entity types in parallel
	const [usersResult, projectsResult, casesResult, processesResult, tasksResult] = await Promise.all([
		searchUsers(searchQueryLower, limit),
		searchProjects(searchQueryLower, limit),
		searchCases(searchQueryLower, limit),
		searchProcesses(searchQueryLower, limit),
		searchTasks(searchQueryLower, limit)
	]);
	
	// Combine results
	if (usersResult.success) {
		results.push(...usersResult.value);
	}
	if (projectsResult.success) {
		results.push(...projectsResult.value);
	}
	if (casesResult.success) {
		results.push(...casesResult.value);
	}
	if (processesResult.success) {
		results.push(...processesResult.value);
	}
	if (tasksResult.success) {
		results.push(...tasksResult.value);
	}
	
	// Sort by relevance (exact match first, then partial matches)
	return results.sort((a, b) => {
		const aExact = a.name.toLowerCase() === searchQueryLower;
		const bExact = b.name.toLowerCase() === searchQueryLower;
		if (aExact && !bExact) return -1;
		if (!aExact && bExact) return 1;
		return a.name.localeCompare(b.name);
	});
}

/**
 * Get all users for mention (when query is empty)
 */
async function getAllUsersForMention(limit: number): Promise<Result<SearchResult[], AppError>> {
	try {
		const result = await pocketbaseService.getAllUsers();
		if (!result.success) {
			return err(result.error);
		}
		
		const users = result.value.slice(0, limit);
		const searchResults: SearchResult[] = users.map(user => ({
			type: 'user' as const,
			id: user.id,
			name: getUserDisplayName(user),
			subtitle: user.email || undefined
		}));
		
		return ok(searchResults);
	} catch (error) {
		return err(error as AppError);
	}
}

/**
 * Search users by name or email
 */
async function searchUsers(query: string, limit: number): Promise<Result<SearchResult[], AppError>> {
	try {
		const result = await pocketbaseService.searchUsers(query);
		if (!result.success) {
			return err(result.error);
		}
		
		const users = result.value.slice(0, limit);
		const searchResults: SearchResult[] = users.map(user => ({
			type: 'user' as const,
			id: user.id,
			name: getUserDisplayName(user),
			subtitle: user.email || undefined
		}));
		
		return ok(searchResults);
	} catch (error) {
		return err(error as AppError);
	}
}

/**
 * Get user display name
 */
function getUserDisplayName(user: PocketBaseUser): string {
	return user.name || user.username || user.email || 'Unknown User';
}

/**
 * Search projects by name
 */
async function searchProjects(query: string, limit: number): Promise<Result<SearchResult[], AppError>> {
	try {
		const result = await projectService.getAllProjectsIncludingArchived();
		if (!result.success) {
			return err(result.error);
		}
		
		const projects = result.value
			.filter(p => p.name.toLowerCase().includes(query))
			.slice(0, limit);
		
		const searchResults: SearchResult[] = projects.map(project => ({
			type: 'project' as const,
			id: project.id,
			name: project.name,
			subtitle: project.description || undefined
		}));
		
		return ok(searchResults);
	} catch (error) {
		return err(error as AppError);
	}
}

/**
 * Search cases by name
 */
async function searchCases(query: string, limit: number): Promise<Result<SearchResult[], AppError>> {
	try {
		const result = await caseService.getAllCases();
		if (!result.success) {
			return err(result.error);
		}
		
		const cases = result.value
			.filter(c => c.name.toLowerCase().includes(query))
			.slice(0, limit);
		
		const searchResults: SearchResult[] = cases.map(caseItem => ({
			type: 'case' as const,
			id: caseItem.id,
			name: caseItem.name
		}));
		
		return ok(searchResults);
	} catch (error) {
		return err(error as AppError);
	}
}

/**
 * Search processes by name
 */
async function searchProcesses(query: string, limit: number): Promise<Result<SearchResult[], AppError>> {
	try {
		const result = await processService.getAllProcessesIncludingArchived();
		if (!result.success) {
			return err(result.error);
		}
		
		const processes = result.value
			.filter(p => p.name.toLowerCase().includes(query))
			.slice(0, limit);
		
		const searchResults: SearchResult[] = processes.map(process => ({
			type: 'process' as const,
			id: process.id,
			name: process.name,
			subtitle: process.description || undefined
		}));
		
		return ok(searchResults);
	} catch (error) {
		return err(error as AppError);
	}
}

/**
 * Search tasks (work items) by subject
 */
async function searchTasks(query: string, limit: number): Promise<Result<SearchResult[], AppError>> {
	try {
		const result = await taskService.getAllWorkItems();
		if (!result.success) {
			return err(result.error);
		}
		
		const tasks = result.value
			.filter(t => t.subject?.toLowerCase().includes(query))
			.slice(0, limit);
		
		const searchResults: SearchResult[] = tasks.map(task => ({
			type: 'task' as const,
			id: task.id,
			name: task.subject || 'Untitled Task',
			subtitle: task.wat_ga_je_doen || undefined
		}));
		
		return ok(searchResults);
	} catch (error) {
		return err(error as AppError);
	}
}

