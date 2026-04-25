/**
 * Process store - Manages process data with polling and optimistic updates
 * 
 * Provides reactive process data with automatic polling for multi-user synchronization.
 * Follows standardized store patterns with middleware support.
 * Uses cache-first loading with optimistic updates.
 */
import { createStore, createLoggingMiddleware } from './storeFactory';
import * as processService from '$lib/services/processService';
import { persistentCache } from '$lib/utils/persistentCache';
import { backgroundSyncService } from '$lib/services/backgroundSyncService';
import type { Process } from '$lib/services/processService';
import type { CreateProcessInput } from '$lib/schemas/process';
import type { UpdateProcessInput } from '$lib/schemas/process';

interface ProcessStoreData {
	processes: Process[];
	lastFetch: number | null;
	loading: boolean;
	syncing: boolean; // Background sync in progress
}

interface ProcessStore {
	subscribe: (callback: (data: ProcessStoreData) => void) => () => void;
	refresh: (showLoading?: boolean) => Promise<void>;
	createProcess: (data: CreateProcessInput) => Promise<Process>; // Optimistic create
	updateProcess: (id: number, data: UpdateProcessInput) => Promise<void>; // Optimistic update
	deleteProcess: (id: number) => Promise<void>; // Optimistic delete
	startPolling: (interval?: number) => void;
	stopPolling: () => void;
	reset: () => void;
	getValue: () => ProcessStoreData;
	initialize: (processes: Process[]) => void; // Initialize with SSR data
}

/**
 * Create process store
 * 
 * @returns Process store instance
 */
function createProcessStore(): ProcessStore {
	const store = createStore<ProcessStoreData>({
		initialValue: {
			processes: [],
			lastFetch: null,
			loading: false,
			syncing: false
		},
		name: 'process',
		middleware: [
			createLoggingMiddleware('process'),
		],
	});

	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let isPolling = false;

	// Load from persistent cache on initialization
	const cacheKey = 'processes:all';
	const cachedProcesses = persistentCache.get<Process[]>(cacheKey);
	if (cachedProcesses && cachedProcesses.length > 0) {
		store.set({
			processes: cachedProcesses,
			lastFetch: Date.now(),
			loading: false,
			syncing: false
		});
	}

	return {
		subscribe: store.subscribe,
		
		/**
		 * Refresh process data (loads from cache first, then server)
		 * 
		 * @param showLoading - Whether to show loading state (default: false for silent refresh)
		 * 
		 * @example
		 * ```typescript
		 * await processStore.refresh(true); // Show loading
		 * await processStore.refresh(); // Silent refresh
		 * ```
		 */
		async refresh(showLoading = false): Promise<void> {
			if (isPolling) return; // Prevent concurrent polls
			isPolling = true;
			
			// 1. Load from cache immediately (if available)
			const cacheKey = 'processes:all';
			const cached = persistentCache.get<Process[]>(cacheKey);
			
			if (cached && cached.length > 0 && !showLoading) {
				// Use cached data immediately (optimistic)
				store.set({
					processes: cached,
					lastFetch: Date.now(),
					loading: false,
					syncing: true // Background sync in progress
				});
			} else if (showLoading) {
				store.update(s => ({ ...s, loading: true }));
			}
			
			// 2. Fetch from server in background
			const result = await processService.getAllProcesses();
			
			if (result.success) {
				// Update cache
				persistentCache.set(cacheKey, result.value, false);
				
				// Update store
				const current = store.getValue().processes;
				const currentJson = JSON.stringify(current);
				const newJson = JSON.stringify(result.value);
				
				if (currentJson !== newJson) {
					store.set({
						processes: result.value,
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
				console.error('Error loading processes:', result.error);
				if (showLoading) {
					store.update(s => ({ ...s, loading: false, syncing: false }));
				} else {
					store.update(s => ({ ...s, syncing: false }));
				}
			}
			
			isPolling = false;
		},
		
		/**
		 * Create process optimistically
		 * 
		 * @param data - Process creation data
		 * @returns Optimistic process (with temporary ID)
		 * 
		 * @example
		 * ```typescript
		 * const newProcess = await processStore.createProcess({
		 *   name: 'New Process',
		 *   completion_days: 30
		 * });
		 * // UI updates immediately!
		 * ```
		 */
		async createProcess(data: CreateProcessInput): Promise<Process> {
			// Generate temporary ID
			const tempId = Date.now();
			const optimisticProcess: Process = {
				...data,
				id: tempId,
				status: 'active',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			} as Process;
			
			// 1. Update cache optimistically
			const cacheKey = 'processes:all';
			const cached = persistentCache.get<Process[]>(cacheKey) || [];
			persistentCache.set(cacheKey, [...cached, optimisticProcess], true); // Mark as optimistic
			
			// 2. Update store immediately
			const current = store.getValue();
			store.set({
				...current,
				processes: [...current.processes, optimisticProcess]
			});
			
			// 3. Queue mutation for background sync
			persistentCache.queueMutation({
				type: 'create',
				entityType: 'process',
				data
			});
			
			// 4. Start background sync
			backgroundSyncService.sync();
			
			return optimisticProcess;
		},
		
		/**
		 * Update process optimistically
		 * 
		 * @param id - Process ID to update
		 * @param data - Partial process data to update
		 * 
		 * @example
		 * ```typescript
		 * await processStore.updateProcess(123, { name: 'Updated Process' });
		 * // UI updates immediately!
		 * ```
		 */
		async updateProcess(id: number, data: UpdateProcessInput): Promise<void> {
			// 1. Update cache optimistically
			const cacheKey = 'processes:all';
			const cached = persistentCache.get<Process[]>(cacheKey) || [];
			const updated = cached.map(p => 
				p.id === id 
					? { ...p, ...data, updated_at: new Date().toISOString() } 
					: p
			);
			persistentCache.set(cacheKey, updated, true);
			
			// Mark individual item as optimistic
			persistentCache.set(`process:${id}`, updated.find(p => p.id === id), true);
			
			// 2. Update store immediately
			const current = store.getValue();
			store.set({
				...current,
				processes: current.processes.map(p => p.id === id ? { ...p, ...data } : p)
			});
			
			// 3. Queue mutation
			persistentCache.queueMutation({
				type: 'update',
				entityType: 'process',
				entityId: id,
				data
			});
			
			// 4. Sync in background
			backgroundSyncService.sync();
		},
		
		/**
		 * Delete process optimistically
		 * 
		 * @param id - Process ID to delete
		 * 
		 * @example
		 * ```typescript
		 * await processStore.deleteProcess(123);
		 * // UI updates immediately!
		 * ```
		 */
		async deleteProcess(id: number): Promise<void> {
			// 1. Update cache optimistically
			const cacheKey = 'processes:all';
			const cached = persistentCache.get<Process[]>(cacheKey) || [];
			persistentCache.set(cacheKey, cached.filter(p => p.id !== id), true);
			
			// 2. Update store immediately
			const current = store.getValue();
			store.set({
				...current,
				processes: current.processes.filter(p => p.id !== id)
			});
			
			// 3. Queue mutation
			persistentCache.queueMutation({
				type: 'delete',
				entityType: 'process',
				entityId: id,
				data: {}
			});
			
			// 4. Sync in background
			backgroundSyncService.sync();
		},
		
		/**
		 * Start polling for process updates
		 * 
		 * @param interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
		 * 
		 * @example
		 * ```typescript
		 * processStore.startPolling(30000); // Poll every 30 seconds
		 * ```
		 */
		startPolling(interval: number = 30000): void {
			// Load from cache immediately
			const cacheKey = 'processes:all';
			const cached = persistentCache.get<Process[]>(cacheKey);
			if (cached && cached.length > 0) {
				store.set({
					processes: cached,
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
		 * Stop polling for process updates
		 * 
		 * @example
		 * ```typescript
		 * processStore.stopPolling();
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
		 * processStore.reset();
		 * ```
		 */
		reset(): void {
			store.reset();
			persistentCache.invalidate('processes');
			this.stopPolling();
		},
		
		/**
		 * Initialize store with SSR data
		 * 
		 * @param processes - Processes from server-side render
		 * 
		 * @example
		 * ```typescript
		 * processStore.initialize(ssrProcesses);
		 * ```
		 */
		initialize(processes: Process[]): void {
			if (processes.length > 0) {
				persistentCache.set('processes:all', processes, false);
				store.set({
					processes,
					lastFetch: Date.now(),
					loading: false,
					syncing: false
				});
			}
		},
		
		getValue: store.getValue
	};
}

export const processStore = createProcessStore();

