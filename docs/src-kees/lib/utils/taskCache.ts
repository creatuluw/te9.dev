/**
 * Centralized Task Cache - Record-level task caching system
 * 
 * Provides:
 * - Record-level caching (by task ID)
 * - Immediate updates on CRUD operations
 * - Reactive subscriptions for components
 * - Unified interface for all task data access
 * 
 * **Usage:**
 * ```typescript
 * import { taskCache } from '$lib/utils/taskCache';
 * 
 * // Get task (from cache or fetch)
 * const result = await taskCache.getTask(123);
 * 
 * // Subscribe to updates
 * const unsubscribe = taskCache.subscribe(123, (task) => {
 *   console.log('Task updated:', task);
 * });
 * 
 * // Update task immediately
 * taskCache.updateTask(123, updatedTask);
 * ```
 */
import { ok, err, type Result } from '$lib/types/result';
import { ValidationError, NotFoundError, type AppError } from '$lib/types/errors';
import * as taskService from '$lib/services/taskService';
import type { Task } from '$lib/schemas/task';

/**
 * Cache entry with task data and metadata
 */
interface CacheEntry {
	task: Task;
	timestamp: number;
}

/**
 * Subscriber callback type
 */
type Subscriber = (task: Task | null) => void;

/**
 * Centralized Task Cache
 */
class TaskCache {
	private cache = new Map<number, CacheEntry>();
	private subscribers = new Map<number, Set<Subscriber>>();
	private pendingFetches = new Map<number, Promise<Result<Task, AppError>>>();

	/**
	 * Get task by ID (from cache or fetch from service)
	 * 
	 * @param id - Task ID
	 * @returns Result containing task or error
	 */
	async getTask(id: number): Promise<Result<Task, AppError>> {
		// Validate ID
		if (!Number.isInteger(id) || id <= 0) {
			return err(ValidationError.create('Invalid task ID', 'id', id));
		}

		// Check cache first
		const entry = this.cache.get(id);
		if (entry) {
			return ok(entry.task);
		}

		// Check if fetch is already in progress (deduplication)
		const pendingFetch = this.pendingFetches.get(id);
		if (pendingFetch) {
			return pendingFetch;
		}

		// Fetch from service
		const fetchPromise = taskService.getWorkItemById(id).then((result) => {
			// Remove from pending fetches
			this.pendingFetches.delete(id);

			if (result.success) {
				// Store in cache
				this.updateTask(id, result.value);
			}

			return result;
		});

		// Store pending fetch for deduplication
		this.pendingFetches.set(id, fetchPromise);

		return fetchPromise;
	}

	/**
	 * Get task synchronously from cache (no fetch)
	 * Returns null if not in cache
	 * 
	 * @param id - Task ID
	 * @returns Task or null
	 */
	getTaskSync(id: number): Task | null {
		const entry = this.cache.get(id);
		return entry ? entry.task : null;
	}

	/**
	 * Get multiple tasks by IDs
	 * 
	 * @param ids - Array of task IDs
	 * @returns Result containing array of tasks
	 */
	async getTasks(ids: number[]): Promise<Result<Task[], AppError>> {
		const tasks: Task[] = [];
		const missingIds: number[] = [];

		// Get from cache first
		for (const id of ids) {
			const entry = this.cache.get(id);
			if (entry) {
				tasks.push(entry.task);
			} else {
				missingIds.push(id);
			}
		}

		// Fetch missing tasks
		if (missingIds.length > 0) {
			const fetchPromises = missingIds.map(id => this.getTask(id));
			const results = await Promise.all(fetchPromises);

			for (const result of results) {
				if (result.success) {
					tasks.push(result.value);
				} else {
					// Return first error encountered
					return err(result.error);
				}
			}
		}

		return ok(tasks);
	}

	/**
	 * Update task in cache immediately
	 * Notifies all subscribers
	 * 
	 * @param id - Task ID
	 * @param task - Updated task data
	 */
	updateTask(id: number, task: Task): void {
		// Validate ID matches
		if (task.id !== id) {
			console.warn(`[TaskCache] Task ID mismatch: expected ${id}, got ${task.id}`);
			return;
		}

		// Update cache
		this.cache.set(id, {
			task,
			timestamp: Date.now()
		});

		// Notify subscribers
		this.notifySubscribers(id, task);
	}

	/**
	 * Create new task in cache immediately
	 * Notifies all subscribers
	 * 
	 * @param task - New task data
	 */
	createTask(task: Task): void {
		this.updateTask(task.id, task);
	}

	/**
	 * Delete task from cache immediately
	 * Notifies all subscribers with null
	 * 
	 * @param id - Task ID to delete
	 */
	deleteTask(id: number): void {
		this.cache.delete(id);
		this.notifySubscribers(id, null);
	}

	/**
	 * Subscribe to task updates
	 * 
	 * @param id - Task ID to subscribe to
	 * @param callback - Callback function called when task updates
	 * @returns Unsubscribe function
	 */
	subscribe(id: number, callback: Subscriber): () => void {
		// Initialize subscriber set for this task if needed
		if (!this.subscribers.has(id)) {
			this.subscribers.set(id, new Set());
		}

		const subscriberSet = this.subscribers.get(id)!;
		subscriberSet.add(callback);

		// Call callback immediately with current task if available
		const entry = this.cache.get(id);
		if (entry) {
			callback(entry.task);
		}

		// Return unsubscribe function
		return () => {
			const set = this.subscribers.get(id);
			if (set) {
				set.delete(callback);
				if (set.size === 0) {
					this.subscribers.delete(id);
				}
			}
		};
	}

	/**
	 * Get all tasks in cache
	 * 
	 * @returns Array of all cached tasks
	 */
	getAllTasks(): Task[] {
		return Array.from(this.cache.values()).map(entry => entry.task);
	}

	/**
	 * Clear all tasks from cache
	 */
	clear(): void {
		this.cache.clear();
		this.subscribers.clear();
		this.pendingFetches.clear();
	}

	/**
	 * Notify all subscribers for a task
	 * 
	 * @param id - Task ID
	 * @param task - Task data (or null if deleted)
	 */
	private notifySubscribers(id: number, task: Task | null): void {
		const subscriberSet = this.subscribers.get(id);
		if (subscriberSet) {
			for (const callback of subscriberSet) {
				try {
					callback(task);
				} catch (error) {
					console.error(`[TaskCache] Error in subscriber callback for task ${id}:`, error);
				}
			}
		}
	}

	/**
	 * Get cache statistics (for debugging)
	 */
	getStats(): { size: number; taskIds: number[]; subscriberCount: number } {
		return {
			size: this.cache.size,
			taskIds: Array.from(this.cache.keys()),
			subscriberCount: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0)
		};
	}
}

// Export singleton instance
export const taskCache = new TaskCache();

