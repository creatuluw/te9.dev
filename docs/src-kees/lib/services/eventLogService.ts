/**
 * Event log service - Business event logging for audit trails
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 * Automatically uses the same session_id from analytics tracking.
 */
import { insertRowResult } from '$lib/utils/postgrest';
import { getCurrentUserId } from '$lib/utils/userUtils';
import { getSessionId } from './analyticsService';
import { validateSchema } from '$lib/utils/validation';
import { CreateEventLogInputSchema, type EventLog, type CreateEventLogInput } from '$lib/schemas/eventLog';
import { ok, err, type Result } from '$lib/types/result';
import type { AppError } from '$lib/types/errors';

/**
 * Log a business event to the event log
 * 
 * @param eventType - Type of event (e.g., 'case_created', 'task_completed')
 * @param entityType - Type of entity (e.g., 'case', 'task', 'work_item')
 * @param entityId - ID of the entity
 * @param options - Optional event data including old/new values, metadata, source URL
 * @returns Result containing created event log entry, or error if logging fails
 * 
 * @example
 * ```typescript
 * const result = await logEvent('case_created', 'case', 123, {
 *   newValues: { name: 'New Case', status: 'pending' },
 *   sourceUrl: '/cases/create'
 * });
 * ```
 */
export async function logEvent(
  eventType: string,
  entityType: string,
  entityId: number,
  options: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    sourceUrl?: string;
    userId?: string;
    sessionId?: string;
  } = {}
): Promise<Result<EventLog, AppError>> {
  const currentUserId = options.userId || getCurrentUserId();
  
  // Always capture the current page URL if available (browser environment)
  // Use provided sourceUrl if available, otherwise get from window.location
  const sourceUrl = options.sourceUrl || (typeof window !== 'undefined' ? window.location.href : null);
  
  // Use provided sessionId or get from analytics service (same session as analytics tracking)
  const sessionId = options.sessionId || (typeof window !== 'undefined' ? getSessionId() : null);
  
  const eventData: CreateEventLogInput = {
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    ...(currentUserId != null && { user_id: currentUserId }),
    ...(options.oldValues != null && { old_values: options.oldValues }),
    ...(options.newValues != null && { new_values: options.newValues }),
    ...(options.metadata != null && { metadata: options.metadata }),
    ...(sourceUrl != null && { source_url: sourceUrl }),
    ...(sessionId != null && { session_id: sessionId })
  };

  const validation = validateSchema(CreateEventLogInputSchema, eventData);
  if (!validation.success) {
    return err(validation.error);
  }

  return await insertRowResult<EventLog>('_bpm_event_log', eventData);
}

/**
 * Log case creation event
 * 
 * @param caseId - Case ID
 * @param caseData - Case data to log
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logCaseCreated = (caseId: number, caseData: any, sourceUrl?: string) =>
  logEvent('case_created', 'case', caseId, { newValues: caseData, sourceUrl });

/**
 * Log case update event
 * 
 * @param caseId - Case ID
 * @param oldData - Previous case data
 * @param newData - Updated case data
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logCaseUpdated = (caseId: number, oldData: any, newData: any, sourceUrl?: string) =>
  logEvent('case_updated', 'case', caseId, { oldValues: oldData, newValues: newData, sourceUrl });

/**
 * Log task completion event
 * 
 * @param taskId - Task ID
 * @param taskData - Task data to log
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logTaskCompleted = (taskId: number, taskData: any, sourceUrl?: string) =>
  logEvent('task_completed', 'task', taskId, { newValues: taskData, sourceUrl });

/**
 * Log task assignment event
 * 
 * @param taskId - Task ID
 * @param oldAssignee - Previous assignee ID (or null)
 * @param newAssignee - New assignee ID
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logTaskAssigned = (taskId: number, oldAssignee: string | null, newAssignee: string, sourceUrl?: string) =>
  logEvent('task_assigned', 'task', taskId, { 
    oldValues: { assignee_id: oldAssignee }, 
    newValues: { assignee_id: newAssignee }, 
    sourceUrl 
  });

/**
 * Log user assignment change event
 * 
 * @param entityType - Type of entity (e.g., 'case', 'task', 'work_item')
 * @param entityId - Entity ID
 * @param oldUserId - Previous user ID (or null)
 * @param newUserId - New user ID
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logUserAssignmentChanged = (
  entityType: string, 
  entityId: number, 
  oldUserId: string | null, 
  newUserId: string, 
  sourceUrl?: string
) =>
  logEvent('user_assignment_changed', entityType, entityId, { 
    oldValues: { user_id: oldUserId }, 
    newValues: { user_id: newUserId }, 
    sourceUrl 
  });

/**
 * Log deadline change event
 * 
 * @param entityType - Type of entity (e.g., 'case', 'task', 'work_item')
 * @param entityId - Entity ID
 * @param oldDeadline - Previous deadline (ISO date string or null)
 * @param newDeadline - New deadline (ISO date string)
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logDeadlineChanged = (
  entityType: string, 
  entityId: number, 
  oldDeadline: string | null, 
  newDeadline: string, 
  sourceUrl?: string
) =>
  logEvent('deadline_changed', entityType, entityId, { 
    oldValues: { deadline: oldDeadline }, 
    newValues: { deadline: newDeadline }, 
    sourceUrl 
  });

/**
 * Log project assignment change event
 * 
 * @param entityType - Type of entity (e.g., 'case', 'task', 'work_item')
 * @param entityId - Entity ID
 * @param oldProjectId - Previous project ID (or null)
 * @param newProjectId - New project ID
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logProjectAssignmentChanged = (
  entityType: string, 
  entityId: number, 
  oldProjectId: number | null, 
  newProjectId: number, 
  sourceUrl?: string
) =>
  logEvent('project_assignment_changed', entityType, entityId, { 
    oldValues: { project_id: oldProjectId }, 
    newValues: { project_id: newProjectId }, 
    sourceUrl 
  });

/**
 * Log komt_van (source) value change event
 * 
 * @param entityType - Type of entity (e.g., 'case', 'task', 'work_item')
 * @param entityId - Entity ID
 * @param oldKomtVan - Previous komt_van value (or null)
 * @param newKomtVan - New komt_van value
 * @param sourceUrl - Optional source URL
 * @returns Result containing created event log entry
 */
export const logKomtVanChanged = (
  entityType: string, 
  entityId: number, 
  oldKomtVan: string | null, 
  newKomtVan: string, 
  sourceUrl?: string
) =>
  logEvent('komt_van_changed', entityType, entityId, { 
    oldValues: { komt_van: oldKomtVan }, 
    newValues: { komt_van: newKomtVan }, 
    sourceUrl 
  });

/**
 * Log user-related event (handles string user IDs by using 0 as entity_id and storing user_id in metadata)
 * 
 * @param eventType - Type of event (e.g., 'user_registration', 'password_reset')
 * @param userId - User ID (string)
 * @param options - Optional event data
 * @returns Result containing created event log entry
 */
export async function logUserEvent(
  eventType: string,
  userId: string,
  options: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    sourceUrl?: string;
    sessionId?: string;
  } = {}
): Promise<Result<EventLog, AppError>> {
  // Use 0 as entity_id placeholder and store actual user_id in metadata
  const metadata = {
    ...options.metadata,
    user_id: userId
  };

  return logEvent(
    eventType,
    'user',
    0, // Placeholder since entity_id is INTEGER but user IDs are strings
    {
      ...options,
      metadata,
      userId // Also set userId in options so it appears in user_id column
    }
  );
}