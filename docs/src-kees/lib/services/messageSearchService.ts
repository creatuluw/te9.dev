import { ok, err, type Result } from '$lib/types/result';
import type { AppError } from '$lib/types/errors';
import { queryTableResult } from '$lib/utils/postgrest';
import type { Message } from '$lib/schemas/message';

export interface SearchFilters {
  type?: string;      // msg_type filter
  from?: string;      // date from (ISO string)
  to?: string;        // date to (ISO string)
  cursor?: string;    // pagination cursor
  pageSize?: number;  // results per page (default 50)
}

export interface SearchResult {
  messages: Message[];
  totalEstimate: number;
  hasNextPage: boolean;
}

/**
 * Sanitize search query for PostgreSQL tsquery.
 * Strips special characters, keeps alphanumeric, spaces, and accented chars
 * (important for Dutch: ë, ï, é, etc.).
 * Joins terms with & for AND semantics in tsquery.
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[^\w\sÀ-ÿ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .join(' & ');
}

/**
 * Search messages using PostgreSQL full-text search with Dutch stemming.
 * FR-8: Full-Text Search
 *
 * Uses PostgREST fts(dutch) filter which triggers PostgreSQL's
 * to_tsvector('dutch', ...) for stemming with Dutch dictionary.
 *
 * Visibility: user must be sender OR recipient.
 * Results ranked by created_at descending (most recent first).
 * Max 50 results per query with cursor pagination support.
 */
export async function searchMessages(
  userId: string,
  query: string,
  filters?: SearchFilters
): Promise<Result<SearchResult, AppError>> {
  const sanitized = sanitizeSearchQuery(query);

  // Empty query returns empty results without hitting the database
  if (!sanitized) {
    return ok({ messages: [], totalEstimate: 0, hasNextPage: false });
  }

  // Cap page size at 50 maximum
  const pageSize = Math.min(filters?.pageSize || 50, 50);

  // Build PostgREST filters
  const filter: Record<string, string> = {};

  // Full-text search with Dutch stemming
  // fts(dutch).query triggers to_tsvector('dutch', column) @@ to_tsquery('dutch', query)
  // Convert & separators back to spaces for fts() filter
  filter['search_vector'] = `fts(dutch).${sanitized.replace(/ & /g, ' ')}`;

  // Visibility: user is sender OR recipient
  // PostgREST or syntax: or=(sender_user_id.eq.X,recipient_user_id.eq.X)
  filter['or'] = `(sender_user_id.eq.${userId},recipient_user_id.eq.${userId})`;

  // Optional: message type filter
  if (filters?.type) {
    filter['msg_type'] = `eq.${filters.type}`;
  }

  // Optional: date range filters
  if (filters?.from) {
    filter['created_at'] = `gte.${filters.from}`;
  }
  if (filters?.to) {
    const existing = filter['created_at'];
    filter['created_at'] = existing
      ? `${existing},lt.${filters.to}`
      : `lt.${filters.to}`;
  }

  // Fetch pageSize + 1 to determine if there's a next page
  const result = await queryTableResult<Message>('_bpm_messages', {
    select: '*',
    filter,
    order: 'created_at.desc',
    limit: pageSize + 1,
  });

  if (!result.success) {
    return err(result.error);
  }

  const messages = result.value.data || [];
  const hasNextPage = messages.length > pageSize;
  const trimmed = hasNextPage ? messages.slice(0, pageSize) : messages;

  return ok({
    messages: trimmed,
    totalEstimate: trimmed.length,
    hasNextPage,
  });
}
