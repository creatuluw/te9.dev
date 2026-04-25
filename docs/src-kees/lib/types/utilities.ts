import type { Result } from "./result";

/**
 * Utility types and branded types for type safety
 */

/**
 * Branded types for IDs to prevent mixing different ID types
 */

/**
 * Base brand type
 */
type Brand<T, B> = T & { __brand: B };

/**
 * Case ID - branded number
 */
export type CaseId = Brand<number, "CaseId">;

/**
 * Process ID - branded number
 */
export type ProcessId = Brand<number, "ProcessId">;

/**
 * Process Step ID - branded number
 */
export type ProcessStepId = Brand<number, "ProcessStepId">;

/**
 * Process Task ID - branded number
 */
export type ProcessTaskId = Brand<number, "ProcessTaskId">;

/**
 * Case Step ID - branded number
 */
export type CaseStepId = Brand<number, "CaseStepId">;

/**
 * Task ID - branded number (unified for both process and manual tasks)
 */
export type TaskId = Brand<number, "TaskId">;

/**
 * Case Task ID - branded number (deprecated, use TaskId instead)
 * @deprecated Use TaskId instead
 */
export type CaseTaskId = Brand<number, "CaseTaskId">;

/**
 * User ID - branded string (PocketBase uses string IDs)
 */
export type UserId = Brand<string, "UserId">;

/**
 * Message ID - branded number
 * @deprecated Use MessageId instead
 */
export type NotificationId = Brand<number, "MessageId">;
export type MessageId = Brand<number, "MessageId">;

/**
 * Task Log ID - branded number
 */
export type TaskLogId = Brand<number, "TaskLogId">;

/**
 * Helper functions to create branded types
 */
export function toCaseId(id: number): CaseId {
  return id as CaseId;
}

export function toProcessId(id: number): ProcessId {
  return id as ProcessId;
}

export function toProcessStepId(id: number): ProcessStepId {
  return id as ProcessStepId;
}

export function toProcessTaskId(id: number): ProcessTaskId {
  return id as ProcessTaskId;
}

export function toCaseStepId(id: number): CaseStepId {
  return id as CaseStepId;
}

export function toTaskId(id: number): TaskId {
  return id as TaskId;
}

export function toCaseTaskId(id: number): CaseTaskId {
  return id as CaseTaskId;
}

export function toUserId(id: string): UserId {
  return id as UserId;
}

/**
 * @deprecated Use toMessageId instead
 */
export function toNotificationId(id: number): MessageId {
  return id as MessageId;
}
export function toMessageId(id: number): MessageId {
  return id as MessageId;
}

export function toTaskLogId(id: number): TaskLogId {
  return id as TaskLogId;
}

/**
 * Type guards for branded types
 */
export function isValidCaseId(id: number): id is CaseId {
  return typeof id === "number" && id > 0 && Number.isInteger(id);
}

export function isValidProcessId(id: number): id is ProcessId {
  return typeof id === "number" && id > 0 && Number.isInteger(id);
}

export function isValidUserId(id: string): id is UserId {
  return typeof id === "string" && id.length > 0;
}

/**
 * Utility types for common patterns
 */

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific keys optional
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Extract promise type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Function that returns a Promise
 */
export type AsyncFunction<T extends unknown[] = unknown[], R = unknown> = (
  ...args: T
) => Promise<R>;

/**
 * Function that returns a Result
 */
export type ResultFunction<
  T extends unknown[] = unknown[],
  R = unknown,
  E = Error,
> = (...args: T) => Promise<Result<R, E>>;

/**
 * Status types
 */
export type CaseStatus = "pending" | "active" | "completed" | "overdue";
export type StepStatus = "pending" | "active" | "completed" | "overdue";
export type TaskStatus = "backlog" | "gepland" | "ad-hoc";
/**
 * @deprecated Use MessageStatus instead
 */
export type NotificationStatus = "pending" | "sent" | "failed";
export type MessageStatus = "pending" | "sent" | "failed";

/**
 * Pagination types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Sort order
 */
export type SortOrder = "asc" | "desc";

export interface SortParams {
  field: string;
  order: SortOrder;
}

/**
 * Filter operators for PostgREST
 */
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is"
  | "in"
  | "cs"
  | "cd"
  | "ov"
  | "sl"
  | "sr"
  | "nxr"
  | "nxl"
  | "adj";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}
