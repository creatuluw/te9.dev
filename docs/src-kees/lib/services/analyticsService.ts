/**
 * Analytics service - Minimal user behavior tracking
 * 
 * Tracks only: page visits (with start_time/end_time), sessions, and login events.
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { insertRowResult, updateRowsResult, getRowByIdResult } from '$lib/utils/postgrest';
import { getCurrentUserId } from '$lib/utils/userUtils';
import { validateSchema } from '$lib/utils/validation';
import { CreateAnalyticsInputSchema, type AnalyticsLog, type CreateAnalyticsInput } from '$lib/schemas/analytics';
import { ok, err, type Result } from '$lib/types/result';
import type { AppError } from '$lib/types/errors';

let currentSessionId: string | null = null;

/**
 * Generate a unique session ID
 * 
 * @returns Session ID string
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create current session ID
 * 
 * @returns Current session ID
 */
export function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = generateSessionId();
  }
  return currentSessionId;
}

/**
 * Track an analytics event
 * 
 * @param eventType - Type of event (e.g., 'page_visit', 'login', 'click')
 * @param eventCategory - Category of event
 * @param options - Optional event data including user info, page info, timing
 * @returns Result containing created analytics log entry, or error if tracking fails
 * 
 * @example
 * ```typescript
 * const result = await trackEvent('page_visit', 'navigation', {
 *   pageUrl: '/cases',
 *   referrerUrl: '/dashboard',
 *   eventData: { page_title: 'Cases' }
 * });
 * ```
 */
export async function trackEvent(
  eventType: string,
  eventCategory: 'navigation' | 'auth',
  options: {
    userId?: string;
    pageUrl?: string;
    eventData?: Record<string, any>;
    durationMs?: number;
    sessionId?: string;
    startTime?: string;
    endTime?: string;
  } = {}
): Promise<Result<AnalyticsLog, AppError>> {
  const userId = options.userId || getCurrentUserId();
  const sessionId = options.sessionId || getSessionId();
  
  // Truncate URLs to prevent "value too long" errors (max 2000 chars in DB)
  const truncateUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    return url.length > 1900 ? url.substring(0, 1900) : url;
  };
  
  // Minimal data collection - only essential fields
  const analyticsData: CreateAnalyticsInput = {
    event_type: eventType,
    event_category: eventCategory,
    session_id: sessionId,
    ...(userId != null && { user_id: userId }),
    ...(options.pageUrl != null && { page_url: truncateUrl(options.pageUrl) }),
    ...(options.eventData != null && { event_data: options.eventData }),
    ...(options.durationMs != null && { duration_ms: options.durationMs }),
    ...(options.startTime != null && { start_time: options.startTime }),
    ...(options.endTime != null && { end_time: options.endTime })
  };

  const validation = validateSchema(CreateAnalyticsInputSchema, analyticsData);
  if (!validation.success) {
    return err(validation.error);
  }

  return await insertRowResult<AnalyticsLog>('_bpm_analytics_log', analyticsData);
}

/**
 * Track page visit start - creates a record with start_time
 * 
 * @param url - Page URL
 * @param title - Page title
 * @returns Result containing created analytics log entry with ID
 */
export async function trackPageVisitStart(url: string, title: string): Promise<Result<AnalyticsLog, AppError>> {
  const startTime = new Date().toISOString();
  return trackEvent('page_visit', 'navigation', { 
    pageUrl: url, 
    eventData: { page_title: title },
    startTime
  });
}

/**
 * Update page visit end time
 * 
 * @param recordId - Analytics log record ID to update
 * @returns Result containing updated analytics log entry
 */
export async function trackPageVisitEnd(recordId: number): Promise<Result<AnalyticsLog[], AppError>> {
  const endTime = new Date().toISOString();
  
  // Calculate duration if start_time exists
  const recordResult = await getRowByIdResult<AnalyticsLog>('_bpm_analytics_log', recordId);
  if (!recordResult.success) {
    return err(recordResult.error);
  }
  
  const record = recordResult.value;
  let durationMs: number | undefined;
  
  if (record.start_time) {
    const startTime = new Date(record.start_time).getTime();
    const endTimeMs = new Date(endTime).getTime();
    durationMs = endTimeMs - startTime;
  }
  
  return updateRowsResult<AnalyticsLog>(
    '_bpm_analytics_log',
    { id: `eq.${recordId}` },
    {
      end_time: endTime,
      ...(durationMs != null && { duration_ms: durationMs })
    }
  );
}

/**
 * Track user login
 * 
 * @param userId - User ID
 * @param method - Login method (default: 'email')
 * @returns Result containing created analytics log entry
 */
export const trackLogin = (userId: string, method: string = 'email') =>
  trackEvent('login', 'auth', { 
    userId, 
    eventData: { login_method: method } 
  });
