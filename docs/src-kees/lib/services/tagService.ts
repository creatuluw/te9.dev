/**
 * Tag service - Get existing tags for autocomplete
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { queryTableResult } from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import type { Task } from "$lib/schemas/task";
import type { WorkItem } from "$lib/schemas/workItem";

/**
 * Get all unique tags from work items
 *
 * @returns Result containing array of unique tag strings, or error if query fails
 */
export async function getAllTags(): Promise<Result<string[], AppError>> {
  const result = await queryTableResult<WorkItem>("_bpm_tasks", {
    filter: { task_type: "eq.manual" },
    select: "tags",
  });

  if (!result.success) {
    return err(result.error);
  }

  // Extract all tags and get unique set
  const allTags = new Set<string>();
  for (const item of result.value.data) {
    if (Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        if (typeof tag === "string" && tag.trim().length > 0) {
          allTags.add(tag.trim());
        }
      }
    }
  }

  // Return sorted array
  return ok(Array.from(allTags).sort());
}

/**
 * Get tags that match a search query (for autocomplete)
 *
 * @param query - Search query string
 * @returns Result containing array of matching tag strings, or error if query fails
 */
export async function searchTags(
  query: string,
): Promise<Result<string[], AppError>> {
  if (!query || query.trim().length === 0) {
    return getAllTags();
  }

  const allTagsResult = await getAllTags();
  if (!allTagsResult.success) {
    return err(allTagsResult.error);
  }

  const searchLower = query.toLowerCase().trim();
  const matchingTags = allTagsResult.value.filter((tag) =>
    tag.toLowerCase().includes(searchLower),
  );

  return ok(matchingTags);
}

/**
 * Get most used tags with their usage counts
 *
 * @param limit - Maximum number of tags to return (default: 5)
 * @returns Result containing array of tag strings sorted by usage count (descending), or error if query fails
 */
export async function getMostUsedTags(
  limit: number = 5,
): Promise<Result<string[], AppError>> {
  const result = await queryTableResult<WorkItem>("_bpm_tasks", {
    select: "tags",
  });

  if (!result.success) {
    return err(result.error);
  }

  // Count tag usage
  const tagCounts = new Map<string, number>();
  for (const item of result.value.data) {
    if (Array.isArray(item.tags)) {
      for (const tag of item.tags) {
        if (typeof tag === "string" && tag.trim().length > 0) {
          const trimmedTag = tag.trim();
          tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
        }
      }
    }
  }

  // Sort by count (descending) and return top N tags
  const sortedTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, limit)
    .map(([tag]) => tag); // Extract just the tag names

  return ok(sortedTags);
}
