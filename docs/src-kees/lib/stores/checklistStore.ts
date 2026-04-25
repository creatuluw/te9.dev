/**
 * Checklist store - Manages open checklist items count for current work item
 * 
 * Provides reactive open checklist count for the current work item.
 * Follows standardized store patterns with middleware support.
 */
import { createStore, createLoggingMiddleware } from './storeFactory';
import { authStore } from './authStore';
import * as noteService from '$lib/services/noteService';
import { toastStore } from './toastStore';
import { getUserMessage } from '$lib/types/errors';

interface ChecklistStoreData {
  openCount: number;
  workItemId: number | null;
  loading: boolean;
}

interface ChecklistStore {
  subscribe: (callback: (data: ChecklistStoreData) => void) => () => void;
  loadOpenCount: (workItemId: number) => Promise<void>;
  refresh: () => void;
  reset: () => void;
  setWorkItemId: (workItemId: number | null) => void;
}

/**
 * Create checklist store
 * 
 * @returns Checklist store instance
 */
function createChecklistStore(): ChecklistStore {
  const store = createStore<ChecklistStoreData>({
    initialValue: {
      openCount: 0,
      workItemId: null,
      loading: false,
    },
    name: 'checklist',
    middleware: [
      createLoggingMiddleware('checklist'),
    ],
  });

  return {
    subscribe: store.subscribe,
    
    /**
     * Set the current work item ID
     * 
     * @param workItemId - Work item ID, or null to clear
     */
    setWorkItemId(workItemId: number | null): void {
      const currentState = store.getValue();
      store.set({ ...currentState, workItemId });
      if (workItemId) {
        this.loadOpenCount(workItemId);
      } else {
        store.set({ openCount: 0, workItemId: null, loading: false });
      }
    },
    
    /**
     * Load open checklist items count for a work item
     * 
     * @param workItemId - Work item ID
     * 
     * @example
     * ```typescript
     * await checklistStore.loadOpenCount(1555);
     * ```
     */
    async loadOpenCount(workItemId: number): Promise<void> {
      const auth = authStore.getAuth();
      if (!auth?.user?.id) {
        store.set({ openCount: 0, workItemId: null, loading: false });
        return;
      }

      if (!workItemId) {
        store.set({ openCount: 0, workItemId: null, loading: false });
        return;
      }

      store.update(state => ({ ...state, loading: true }));

      // Get all checklist items for this work item
      const result = await noteService.getNotesByType('task', workItemId, 'checklist_item', true);
      
      if (result.success) {
        // Count open items: not closed and not checked
        const openCount = result.value.filter(note => !note.closed && !note.checked).length;
        console.log('[checklistStore] Loaded open count:', openCount, 'for work item', workItemId);
        store.set({ openCount, workItemId, loading: false });
      } else {
        console.error('[checklistStore] Error loading checklist count:', result.error);
        // Show error toast in dev mode
        if (import.meta.env.DEV) {
          toastStore.add(getUserMessage(result.error), 'error');
        }
        store.set({ openCount: 0, workItemId, loading: false });
      }
    },

    /**
     * Manually refresh the open count for the current work item
     * 
     * @example
     * ```typescript
     * checklistStore.refresh();
     * ```
     */
    refresh(): void {
      const currentState = store.getValue();
      if (currentState.workItemId) {
        this.loadOpenCount(currentState.workItemId);
      }
    },

    /**
     * Reset the store to initial state
     * 
     * @example
     * ```typescript
     * checklistStore.reset();
     * ```
     */
    reset(): void {
      store.reset();
    }
  };
}

export const checklistStore = createChecklistStore();

