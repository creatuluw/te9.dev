/**
 * KomtVan service - Get distinct komt_van values for autocomplete
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { queryTableResult } from '$lib/utils/postgrest';
import type { AppError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';
import type { Task } from '$lib/schemas/task';

/**
 * Get all distinct komt_van values from tasks
 * 
 * @returns Result containing array of unique komt_van strings, or error if query fails
 */
export async function getAllKomtVanValues(): Promise<Result<string[], AppError>> {
  const result = await queryTableResult<Task>('_bpm_tasks', {
    select: 'komt_van',
    filter: { komt_van: 'not.is.null' }
  });

  if (!result.success) {
    return err(result.error);
  }

  // Extract all komt_van values and get unique set
  const allValues = new Set<string>();
  for (const item of result.value.data) {
    if (item.komt_van && typeof item.komt_van === 'string' && item.komt_van.trim().length > 0) {
      allValues.add(item.komt_van.trim());
    }
  }

  // Return sorted array
  return ok(Array.from(allValues).sort());
}

/**
 * Get komt_van values that match a search query (for autocomplete)
 * 
 * @param query - Search query string
 * @returns Result containing array of matching komt_van strings, or error if query fails
 */
export async function searchKomtVanValues(query: string): Promise<Result<string[], AppError>> {
  if (!query || query.trim().length === 0) {
    return getAllKomtVanValues();
  }

  const allValuesResult = await getAllKomtVanValues();
  if (!allValuesResult.success) {
    return err(allValuesResult.error);
  }

  const searchLower = query.toLowerCase().trim();
  const matchingValues = allValuesResult.value.filter(value =>
    value.toLowerCase().includes(searchLower)
  );

  return ok(matchingValues);
}

