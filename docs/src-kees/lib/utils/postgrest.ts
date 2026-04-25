/**
 * PostgREST client utility for making API calls
 * Uses the same URL resolution as schema-mgr
 * Enhanced with new API client, type-safe query builders, and timeout handling
 */

import { createApiClient } from "$lib/api/client";
import {
  requestLogInterceptor,
  responseLogInterceptor,
} from "$lib/api/interceptors";
import type { AppError } from "$lib/types/errors";
import { NotFoundError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import type { FilterOperator, SortOrder } from "$lib/types/utilities";

const POSTGREST_URL = "https://pg-kees.up.railway.app";

// Create API client instance for PostgREST
// Note: PostgREST doesn't use PocketBase authentication, so we don't use auth interceptors
const postgrestClient = createApiClient({
  baseURL: POSTGREST_URL,
  defaultTimeout: 30000, // 30 seconds
  defaultRetries: 2,
  defaultRetryDelay: 1000,
});

// Setup interceptors (without auth interceptor for PostgREST)
// PostgREST doesn't use PocketBase authentication tokens
// Only use logging interceptors in dev mode
if (import.meta.env?.DEV) {
  postgrestClient.useRequestInterceptor(requestLogInterceptor);
  postgrestClient.useResponseInterceptor(responseLogInterceptor);
}

export interface PostgRESTQueryOptions {
  select?: string;
  filter?: Record<string, string>;
  order?: string | string[];
  limit?: number;
  offset?: number;
  conditionalHeaders?: {
    ifNoneMatch?: string;
    ifModifiedSince?: string;
  };
}

/**
 * Type-safe filter builder
 */
export class FilterBuilder {
  private filters: Map<string, string> = new Map();

  /**
   * Add equality filter
   */
  eq(field: string, value: string | number | boolean): this {
    // PostgREST requires boolean values as lowercase strings
    const filterValue =
      typeof value === "boolean" ? value.toString().toLowerCase() : value;
    this.filters.set(field, `eq.${filterValue}`);
    return this;
  }

  /**
   * Add not-equal filter
   */
  neq(field: string, value: string | number | boolean): this {
    // PostgREST requires boolean values as lowercase strings
    const filterValue =
      typeof value === "boolean" ? value.toString().toLowerCase() : value;
    this.filters.set(field, `neq.${filterValue}`);
    return this;
  }

  /**
   * Add greater-than filter
   */
  gt(field: string, value: string | number): this {
    this.filters.set(field, `gt.${value}`);
    return this;
  }

  /**
   * Add greater-than-or-equal filter
   */
  gte(field: string, value: string | number): this {
    this.filters.set(field, `gte.${value}`);
    return this;
  }

  /**
   * Add less-than filter
   */
  lt(field: string, value: string | number): this {
    this.filters.set(field, `lt.${value}`);
    return this;
  }

  /**
   * Add less-than-or-equal filter
   */
  lte(field: string, value: string | number): this {
    this.filters.set(field, `lte.${value}`);
    return this;
  }

  /**
   * Add like filter (case-sensitive pattern matching)
   */
  like(field: string, pattern: string): this {
    this.filters.set(field, `like.${pattern}`);
    return this;
  }

  /**
   * Add ilike filter (case-insensitive pattern matching)
   */
  ilike(field: string, pattern: string): this {
    this.filters.set(field, `ilike.${pattern}`);
    return this;
  }

  /**
   * Add OR filter (PostgREST or parameter)
   * Joins multiple conditions with comma, evaluated as OR.
   * Example: or('email.ilike.%search%,name.ilike.%search%')
   */
  or(conditions: string): this {
    this.filters.set("or", `(${conditions})`);
    return this;
  }

  /**
   * Add in filter (value is in array)
   */
  in(field: string, values: (string | number)[]): this {
    this.filters.set(field, `in.(${values.join(",")})`);
    return this;
  }

  /**
   * Add is null filter
   */
  isNull(field: string): this {
    this.filters.set(field, "is.null");
    return this;
  }

  /**
   * Add is not null filter
   */
  isNotNull(field: string): this {
    this.filters.set(field, "not.is.null");
    return this;
  }

  /**
   * Add custom filter
   */
  custom(
    field: string,
    operator: FilterOperator,
    value: string | number,
  ): this {
    this.filters.set(field, `${operator}.${value}`);
    return this;
  }

  /**
   * Build filter object
   */
  build(): Record<string, string> {
    return Object.fromEntries(this.filters);
  }

  /**
   * Clear all filters
   */
  clear(): this {
    this.filters.clear();
    return this;
  }
}

/**
 * Create a new filter builder
 */
export function filter(): FilterBuilder {
  return new FilterBuilder();
}

/**
 * Type-safe query builder
 */
export class QueryBuilder<T = unknown> {
  private select?: string;
  private filters: Record<string, string> = {};
  private order?: string;
  private limit?: number;
  private offset?: number;

  /**
   * Select specific columns
   */
  selectColumns(columns: string[]): this {
    this.select = columns.join(",");
    return this;
  }

  /**
   * Add filters
   */
  filter(filters: Record<string, string> | FilterBuilder): this {
    if (filters instanceof FilterBuilder) {
      this.filters = { ...this.filters, ...filters.build() };
    } else {
      this.filters = { ...this.filters, ...filters };
    }
    return this;
  }

  /**
   * Add order by clause
   */
  orderBy(field: string, order: SortOrder = "asc"): this {
    this.order = `${field}.${order}`;
    return this;
  }

  /**
   * Add limit
   */
  take(count: number): this {
    this.limit = count;
    return this;
  }

  /**
   * Add offset
   */
  skip(count: number): this {
    this.offset = count;
    return this;
  }

  /**
   * Build query options
   */
  build(): PostgRESTQueryOptions {
    return {
      select: this.select,
      filter: Object.keys(this.filters).length > 0 ? this.filters : undefined,
      order: this.order,
      limit: this.limit,
      offset: this.offset,
    };
  }
}

/**
 * Create a new query builder
 */
export function query<T = unknown>(): QueryBuilder<T> {
  return new QueryBuilder<T>();
}

/**
 * Build query string for PostgREST API
 */
function buildQueryString(options: PostgRESTQueryOptions = {}): string {
  const params: string[] = [];

  if (options.select) {
    params.push(`select=${encodeURIComponent(options.select)}`);
  }

  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      params.push(`${key}=${encodeURIComponent(value)}`);
    });
  }

  if (options.order) {
    if (Array.isArray(options.order)) {
      // Multiple order parameters
      options.order.forEach((order) => {
        params.push(`order=${encodeURIComponent(order)}`);
      });
    } else {
      // Single order parameter
      params.push(`order=${encodeURIComponent(options.order)}`);
    }
  }

  if (options.limit !== undefined) {
    params.push(`limit=${options.limit}`);
  }

  if (options.offset !== undefined) {
    params.push(`offset=${options.offset}`);
  }

  return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Query data from PostgREST API
 * @param tableName - Name of the table to query
 * @param options - Query options (filters, order, limit, etc.)
 * @returns Array of results or empty array
 */
export async function queryTable<T = any>(
  tableName: string,
  options: PostgRESTQueryOptions = {},
): Promise<T[]> {
  const queryString = buildQueryString(options);
  const url = `/${tableName}${queryString}`;

  const config: any = {
    headers: {
      Accept: "application/json",
      Prefer: "return=representation",
    },
  };

  // Add conditional headers if provided
  if (options.conditionalHeaders) {
    config.conditionalHeaders = options.conditionalHeaders;
  }

  const result = await postgrestClient.get<T[]>(url, config);

  if (!result.success) {
    throw result.error;
  }

  // Handle 304 Not Modified - return empty array (caller should use cache)
  if (result.value.status === 304) {
    return [];
  }

  const data = result.value.data;
  return Array.isArray(data) ? data : data ? [data] : [];
}

/**
 * Query data from PostgREST API with Result pattern
 * @param tableName - Name of the table to query
 * @param options - Query options (filters, order, limit, etc.)
 * @returns Result containing array of results or error
 */
export async function queryTableResult<T = any>(
  tableName: string,
  options: PostgRESTQueryOptions = {},
): Promise<Result<{ data: T[]; status: number; headers: Headers }, AppError>> {
  const queryString = buildQueryString(options);
  const url = `/${tableName}${queryString}`;

  const config: any = {
    headers: {
      Accept: "application/json",
      Prefer: "return=representation",
    },
  };

  // Add conditional headers if provided
  if (options.conditionalHeaders) {
    config.conditionalHeaders = options.conditionalHeaders;
  }

  const result = await postgrestClient.get<T[]>(url, config);

  if (!result.success) {
    return err(result.error);
  }

  // Handle 304 Not Modified - return null data with status and headers
  if (result.value.status === 304) {
    return ok({
      data: [] as T[],
      status: 304,
      headers: result.value.headers,
    });
  }

  // Handle 200 OK - extract data from response
  const data = result.value.data;
  const arrayData = Array.isArray(data) ? data : data ? [data] : [];

  return ok({
    data: arrayData as T[],
    status: result.value.status,
    headers: result.value.headers,
  });
}

/**
 * Insert a new row into a table
 * @param tableName - Name of the table
 * @param data - Data to insert
 * @returns Inserted row
 */
export async function insertRow<T = any>(
  tableName: string,
  data: Partial<T>,
): Promise<T> {
  const url = `/${tableName}`;

  const result = await postgrestClient.post<T | T[]>(url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
  });

  if (!result.success) {
    throw result.error;
  }

  const responseData = result.value;
  return Array.isArray(responseData) ? responseData[0] : responseData;
}

/**
 * Insert a new row into a table with Result pattern
 * @param tableName - Name of the table
 * @param data - Data to insert
 * @returns Result containing inserted row or error
 */
export async function insertRowResult<T = any>(
  tableName: string,
  data: Partial<T>,
): Promise<Result<T, AppError>> {
  const url = `/${tableName}`;

  // Debug logging for _bpm_tasks inserts
  if (import.meta.env?.DEV && tableName === "_bpm_tasks") {
    console.log("[postgrest] Inserting into _bpm_tasks:", {
      data,
      subject: (data as any).subject,
      subjectType: typeof (data as any).subject,
      assignee_id: (data as any).assignee_id,
      dataKeys: Object.keys(data),
      fullData: JSON.stringify(data, null, 2),
    });
  }

  const result = await postgrestClient.post<T | T[]>(url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
  });

  if (!result.success) {
    return err(result.error);
  }

  const responseData = result.value;
  const insertedData = Array.isArray(responseData)
    ? responseData[0]
    : responseData;
  return ok(insertedData);
}

/**
 * Update rows in a table
 * @param tableName - Name of the table
 * @param filter - Filter conditions
 * @param data - Data to update
 * @returns Array of updated rows
 */
export async function updateRows<T = any>(
  tableName: string,
  filter: Record<string, string>,
  data: Partial<T>,
): Promise<T[]> {
  const filterString = Object.entries(filter)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const url = `/${tableName}?${filterString}`;

  const result = await postgrestClient.patch<T | T[]>(url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
  });

  if (!result.success) {
    throw result.error;
  }

  const responseData = result.value;
  return Array.isArray(responseData) ? responseData : [responseData];
}

/**
 * Update rows in a table with Result pattern
 * @param tableName - Name of the table
 * @param filter - Filter conditions
 * @param data - Data to update
 * @returns Result containing array of updated rows or error
 */
export async function updateRowsResult<T = any>(
  tableName: string,
  filter: Record<string, string>,
  data: Partial<T>,
): Promise<Result<T[], AppError>> {
  const filterString = Object.entries(filter)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const url = `/${tableName}?${filterString}`;

  const result = await postgrestClient.patch<T | T[]>(url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation",
    },
  });

  if (!result.success) {
    return err(result.error);
  }

  const responseData = result.value;
  const arrayData = Array.isArray(responseData) ? responseData : [responseData];
  return ok(arrayData);
}

/**
 * Delete rows from a table
 * @param tableName - Name of the table
 * @param filter - Filter conditions
 */
export async function deleteRows(
  tableName: string,
  filter: Record<string, string>,
): Promise<void> {
  const filterString = Object.entries(filter)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const url = `/${tableName}?${filterString}`;

  const result = await postgrestClient.delete(url);

  if (!result.success) {
    throw result.error;
  }
}

/**
 * Delete rows from a table with Result pattern
 * @param tableName - Name of the table
 * @param filter - Filter conditions
 * @returns Result containing void or error
 */
export async function deleteRowsResult(
  tableName: string,
  filter: Record<string, string>,
): Promise<Result<void, AppError>> {
  const filterString = Object.entries(filter)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  const url = `/${tableName}?${filterString}`;

  const result = await postgrestClient.delete(url);

  if (!result.success) {
    return err(result.error);
  }

  return ok(undefined);
}

/**
 * Get a single row by ID
 * @param tableName - Name of the table
 * @param id - ID of the row
 * @returns Row data or null if not found
 */
export async function getRowById<T = any>(
  tableName: string,
  id: number | string,
): Promise<T | null> {
  const rows = await queryTable<T>(tableName, {
    filter: { id: `eq.${id}` },
    limit: 1,
  });
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get a single row by ID with Result pattern
 * @param tableName - Name of the table
 * @param id - ID of the row
 * @returns Result containing row data or error (NotFoundError if not found)
 */
export async function getRowByIdResult<T = any>(
  tableName: string,
  id: number | string,
): Promise<Result<T, AppError>> {
  const rowsResult = await queryTableResult<T>(tableName, {
    filter: { id: `eq.${id}` },
    limit: 1,
  });

  if (!rowsResult.success) {
    return err(rowsResult.error);
  }

  // Handle 304 Not Modified - this shouldn't happen for getById, but handle it
  if (rowsResult.value.status === 304) {
    return err(
      new NotFoundError(`${tableName} with ID ${id} not found`, tableName, id),
    );
  }

  if (rowsResult.value.data.length === 0) {
    return err(
      new NotFoundError(`${tableName} with ID ${id} not found`, tableName, id),
    );
  }

  return ok(rowsResult.value.data[0]);
}
