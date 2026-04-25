/**
 * Deadline calculation utilities
 * 
 * These are pure utility functions and don't require Result pattern since they
 * don't perform async operations or external calls. They are synchronous helpers.
 */
import { addDays, parseISO, format } from 'date-fns';

export interface DeadlineInfo {
  startDate: Date;
  daysOffset: number;
  deadline: Date;
  daysRemaining: number;
  isOverdue: boolean;
}

/**
 * Calculate deadline from start date and days offset
 * 
 * @param startDate - Start date as Date object or ISO string
 * @param daysOffset - Number of days to add
 * @returns Calculated deadline date
 * 
 * @example
 * ```typescript
 * const deadline = calculateDeadline(new Date(), 7); // 7 days from now
 * ```
 */
export function calculateDeadline(startDate: Date | string, daysOffset: number): Date {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  return addDays(start, daysOffset);
}

/**
 * Get deadline information including days remaining and overdue status
 * 
 * @param startDate - Start date as Date object or ISO string
 * @param daysOffset - Number of days to add
 * @returns Deadline information object
 * 
 * @example
 * ```typescript
 * const info = getDeadlineInfo('2025-01-01', 30);
 * console.log(`Days remaining: ${info.daysRemaining}`);
 * ```
 */
export function getDeadlineInfo(startDate: Date | string, daysOffset: number): DeadlineInfo {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const deadline = calculateDeadline(start, daysOffset);
  const now = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    startDate: start,
    daysOffset,
    deadline,
    daysRemaining,
    isOverdue: daysRemaining < 0,
  };
}

/**
 * Format date for display (YYYY-MM-DD)
 * 
 * @param date - Date to format
 * @returns Formatted date string or 'N/A' if null
 * 
 * @example
 * ```typescript
 * formatDate(new Date()); // '2025-01-26'
 * ```
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Format datetime for display (YYYY-MM-DD HH:mm)
 * 
 * @param date - Date to format
 * @returns Formatted datetime string or 'N/A' if null
 * 
 * @example
 * ```typescript
 * formatDateTime(new Date()); // '2025-01-26 14:30'
 * ```
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm');
}

