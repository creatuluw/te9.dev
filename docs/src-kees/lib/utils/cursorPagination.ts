/**
 * Cursor-based pagination utilities for message list queries.
 * Uses composite cursor (created_at + id) to handle EC-8: pagination cursor collision.
 */

export interface PaginationCursor {
  timestamp: string;
  id: number;
}

export interface PaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
  endCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/**
 * Encodes a timestamp and id into a base64 cursor string.
 * Format: {timestamp}_{id}
 */
export function encodeCursor(timestamp: string, id: number): string {
  const raw = `${timestamp}_${id}`;
  return btoa(raw);
}

/**
 * Decodes a base64 cursor string into its components.
 * Returns null for invalid or null/undefined cursors.
 */
export function decodeCursor(
  cursor: string | null | undefined,
): PaginationCursor | null {
  if (!cursor) return null;
  try {
    const decoded = atob(cursor);
    const separatorIndex = decoded.lastIndexOf("_");
    if (separatorIndex === -1) return null;
    const timestamp = decoded.substring(0, separatorIndex);
    const id = parseInt(decoded.substring(separatorIndex + 1), 10);
    if (isNaN(id)) return null;
    return { timestamp, id };
  } catch {
    return null;
  }
}

/**
 * Creates a paginated result from an array of messages.
 * Expects the caller to fetch pageSize + 1 items to detect hasNextPage.
 */
export function createPaginatedResult<
  T extends { created_at: string; id: number },
>(messages: T[], pageSize: number = DEFAULT_PAGE_SIZE): PaginatedResult<T> {
  const effectivePageSize =
    pageSize < 1 ? DEFAULT_PAGE_SIZE : Math.min(pageSize, MAX_PAGE_SIZE);
  const hasNextPage = messages.length > effectivePageSize;
  const data = hasNextPage ? messages.slice(0, effectivePageSize) : messages;
  const lastItem = data[data.length - 1];
  const endCursor = lastItem
    ? encodeCursor(lastItem.created_at, lastItem.id)
    : null;

  return { data, hasNextPage, endCursor };
}

/**
 * Validates and normalizes a page size value.
 * Returns default (50) for invalid values, caps at maximum (100).
 */
export function validatePageSize(size?: number): number {
  if (!size || size < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(size, MAX_PAGE_SIZE);
}
