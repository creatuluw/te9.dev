/**
 * Project store - Manages project data with polling and optimistic updates
 * 
 * Provides reactive project data with automatic polling for multi-user synchronization.
 * Follows standardized store patterns with middleware support.
 * Uses cache-first loading with optimistic updates.
 */
import { createStore, createLoggingMiddleware } from './storeFactory';
import * as projectService from '$lib/services/projectService';
import { persistentCache } from '$lib/utils/persistentCache';
import { backgroundSyncService } from '$lib/services/backgroundSyncService';
import type { Project } from '$lib/schemas/project';
import type { CreateProjectInput } from '$lib/schemas/project';
import type { UpdateProjectInput } from '$lib/schemas/project';

interface ProjectStoreData {
	projects: Project[];
	lastFetch: number | null;
	loading: boolean;
	syncing: boolean; // Background sync in progress
}

interface ProjectStore {
	subscribe: (callback: (data: ProjectStoreData) => void) => () => void;
	refresh: (showLoading?: boolean) => Promise<void>;
	createProject: (data: CreateProjectInput, createdBy?: string) => Promise<Project>; // Optimistic create
	updateProject: (id: number, data: UpdateProjectInput) => Promise<void>; // Optimistic update
	deleteProject: (id: number) => Promise<void>; // Optimistic delete
	startPolling: (interval?: number) => void;
	stopPolling: () => void;
	reset: () => void;
	getValue: () => ProjectStoreData;
	initialize: (projects: Project[]) => void; // Initialize with SSR data
}

/**
 * Create project store
 * 
 * @returns Project store instance
 */
function createProjectStore(): ProjectStore {
	const store = createStore<ProjectStoreData>({
		initialValue: {
			projects: [],
			lastFetch: null,
			loading: false,
			syncing: false
		},
		name: 'project',
		middleware: [
			createLoggingMiddleware('project'),
		],
	});

	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let isPolling = false;

	// Load from persistent cache on initialization
	const cacheKey = 'projects:all';
	const cachedProjects = persistentCache.get<Project[]>(cacheKey);
	if (cachedProjects && cachedProjects.length > 0) {
		store.set({
			projects: cachedProjects,
			lastFetch: Date.now(),
			loading: false,
			syncing: false
		});
	}

	return {
		subscribe: store.subscribe,
		
		/**
		 * Refresh project data (loads from cache first, then server)
		 * 
		 * @param showLoading - Whether to show loading state (default: false for silent refresh)
		 * 
		 * @example
		 * ```typescript
		 * await projectStore.refresh(true); // Show loading
		 * await projectStore.refresh(); // Silent refresh
		 * ```
		 */
		async refresh(showLoading = false): Promise<void> {
			if (isPolling) return; // Prevent concurrent polls
			isPolling = true;
			
			// 1. Load from cache immediately (if available)
			const cacheKey = 'projects:all';
			const cached = persistentCache.get<Project[]>(cacheKey);
			
			if (cached && cached.length > 0 && !showLoading) {
				// Use cached data immediately (optimistic)
				store.set({
					projects: cached,
					lastFetch: Date.now(),
					loading: false,
					syncing: true // Background sync in progress
				});
			} else if (showLoading) {
				store.update(s => ({ ...s, loading: true }));
			}
			
			// 2. Fetch from server in background
			const result = await projectService.getAllProjects();
			
			if (result.success) {
				// Update cache
				persistentCache.set(cacheKey, result.value, false);
				
				// Update store
				const current = store.getValue().projects;
				const currentJson = JSON.stringify(current);
				const newJson = JSON.stringify(result.value);
				
				if (currentJson !== newJson) {
					store.set({
						projects: result.value,
						lastFetch: Date.now(),
						loading: false,
						syncing: false
					});
				} else if (showLoading) {
					store.update(s => ({ ...s, loading: false, syncing: false }));
				} else {
					store.update(s => ({ ...s, syncing: false }));
				}
			} else {
				console.error('Error loading projects:', result.error);
				if (showLoading) {
					store.update(s => ({ ...s, loading: false, syncing: false }));
				} else {
					store.update(s => ({ ...s, syncing: false }));
				}
			}
			
			isPolling = false;
		},
		
		/**
		 * Create project optimistically
		 * 
		 * @param data - Project creation data
		 * @param createdBy - User ID of the project creator
		 * @returns Optimistic project (with temporary ID)
		 * 
		 * @example
		 * ```typescript
		 * const newProject = await projectStore.createProject({
		 *   name: 'New Project',
		 *   status: 'active'
		 * });
		 * // UI updates immediately!
		 * ```
		 */
		async createProject(data: CreateProjectInput, createdBy?: string): Promise<Project> {
			// Generate temporary ID
			const tempId = Date.now();
			const optimisticProject: Project = {
				...data,
				id: tempId,
				status: data.status || 'active',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				created_by: createdBy || null,
				bijlagen: (data as any).bijlagen || []
			} as Project;
			
			// 1. Update cache optimistically
			const cacheKey = 'projects:all';
			const cached = persistentCache.get<Project[]>(cacheKey) || [];
			persistentCache.set(cacheKey, [...cached, optimisticProject], true); // Mark as optimistic
			
			// 2. Update store immediately
			const current = store.getValue();
			store.set({
				...current,
				projects: [...current.projects, optimisticProject]
			});
			
			// 3. Queue mutation for background sync
			persistentCache.queueMutation({
				type: 'create',
				entityType: 'project',
				data: { ...data, createdBy }
			});
			
			// 4. Start background sync
			backgroundSyncService.sync();
			
			return optimisticProject;
		},
		
		/**
		 * Update project optimistically
		 * 
		 * @param id - Project ID to update
		 * @param data - Partial project data to update
		 * 
		 * @example
		 * ```typescript
		 * await projectStore.updateProject(123, { name: 'Updated Project' });
		 * // UI updates immediately!
		 * ```
		 */
		async updateProject(id: number, data: UpdateProjectInput): Promise<void> {
			// 1. Update cache optimistically
			const cacheKey = 'projects:all';
			const cached = persistentCache.get<Project[]>(cacheKey) || [];
			const updated = cached.map(p => 
				p.id === id 
					? { ...p, ...data, updated_at: new Date().toISOString() } 
					: p
			);
			persistentCache.set(cacheKey, updated, true);
			
			// Mark individual item as optimistic
			persistentCache.set(`project:${id}`, updated.find(p => p.id === id), true);
			
			// 2. Update store immediately
			const current = store.getValue();
			store.set({
				...current,
				projects: current.projects.map(p => p.id === id ? { ...p, ...data } : p)
			});
			
			// 3. Queue mutation
			persistentCache.queueMutation({
				type: 'update',
				entityType: 'project',
				entityId: id,
				data
			});
			
			// 4. Sync in background
			backgroundSyncService.sync();
		},
		
		/**
		 * Delete project optimistically
		 * 
		 * @param id - Project ID to delete
		 * 
		 * @example
		 * ```typescript
		 * await projectStore.deleteProject(123);
		 * // UI updates immediately!
		 * ```
		 */
		async deleteProject(id: number): Promise<void> {
			// 1. Update cache optimistically
			const cacheKey = 'projects:all';
			const cached = persistentCache.get<Project[]>(cacheKey) || [];
			persistentCache.set(cacheKey, cached.filter(p => p.id !== id), true);
			
			// 2. Update store immediately
			const current = store.getValue();
			store.set({
				...current,
				projects: current.projects.filter(p => p.id !== id)
			});
			
			// 3. Queue mutation
			persistentCache.queueMutation({
				type: 'delete',
				entityType: 'project',
				entityId: id,
				data: {}
			});
			
			// 4. Sync in background
			backgroundSyncService.sync();
		},
		
		/**
		 * Start polling for project updates
		 * 
		 * @param interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
		 * 
		 * @example
		 * ```typescript
		 * projectStore.startPolling(30000); // Poll every 30 seconds
		 * ```
		 */
		startPolling(interval: number = 30000): void {
			// Load from cache immediately
			const cacheKey = 'projects:all';
			const cached = persistentCache.get<Project[]>(cacheKey);
			if (cached && cached.length > 0) {
				store.set({
					projects: cached,
					lastFetch: Date.now(),
					loading: false,
					syncing: true
				});
			}
			
			// Refresh from server
			this.refresh();
			
			// Start background sync service
			backgroundSyncService.start(interval);
			
			// Clear existing interval if any
			if (pollInterval) {
				clearInterval(pollInterval);
			}
			
			// Set up polling interval
			pollInterval = setInterval(() => {
				this.refresh(); // Silent background refresh
			}, interval);
		},
		
		/**
		 * Stop polling for project updates
		 * 
		 * @example
		 * ```typescript
		 * projectStore.stopPolling();
		 * ```
		 */
		stopPolling(): void {
			if (pollInterval) {
				clearInterval(pollInterval);
				pollInterval = null;
			}
			backgroundSyncService.stop();
		},
		
		/**
		 * Reset the store to initial state
		 * 
		 * @example
		 * ```typescript
		 * projectStore.reset();
		 * ```
		 */
		reset(): void {
			store.reset();
			persistentCache.invalidate('projects');
			this.stopPolling();
		},
		
		/**
		 * Initialize store with SSR data
		 * 
		 * @param projects - Projects from server-side render
		 * 
		 * @example
		 * ```typescript
		 * projectStore.initialize(ssrProjects);
		 * ```
		 */
		initialize(projects: Project[]): void {
			if (projects.length > 0) {
				persistentCache.set('projects:all', projects, false);
				store.set({
					projects,
					lastFetch: Date.now(),
					loading: false,
					syncing: false
				});
			}
		},
		
		getValue: store.getValue
	};
}

export const projectStore = createProjectStore();

