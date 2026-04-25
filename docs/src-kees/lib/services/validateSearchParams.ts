/**
 * Search parameter validation utility for GET /api/messages/search
 * search-002: Extracts and validates query parameters from URL
 */

import { ok, err, type Result } from '$lib/types/result';
import { AppError, ErrorCode } from '$lib/types/errors';
import type { SearchFilters } from '$lib/services/messageSearchService';

/**
 * Validated search parameters extracted from the request URL
 */
export interface ValidatedSearchParams {
  query: string;
  filters?: SearchFilters;
}

/**
 * Validation error returned when search params are invalid
 */
export interface SearchValidationError {
  message: string;
  field: string;
}

/**
 * Type alias for the validation result
 */
export type SearchValidation = Result<ValidatedSearchParams, SearchValidationError>;

/**
 * Validate and extract search parameters from a URL.
 *
 * Required: `q` (search query) - must be non-empty after trimming
 * Optional: `type`, `from`, `to`, `cursor`
 *
 * @param url - The request URL containing search params
 * @returns Result with ValidatedSearchParams on success, or SearchValidationError on failure
 */
export function validateSearchParams(url: URL): SearchValidation {
  const rawQuery = url.searchParams.get('q');
  const query = rawQuery?.trim() || '';

  if (!query) {
    return err({
      message: 'Search query (q) is required',
      field: 'q',
    });
  }

  // Extract optional filter parameters, converting empty strings to undefined
  const type = url.searchParams.get('type') || undefined;
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  const cursor = url.searchParams.get('cursor') || undefined;

  // Only include filters if at least one is defined
  const hasFilters = type || from || to || cursor;

  const filters: SearchFilters | undefined = hasFilters
    ? { type, from, to, cursor }
    : undefined;

  return ok({
    query,
    filters,
  });
}
