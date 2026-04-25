/**
 * User-only search utility for @mention autocomplete
 *
 * Restricts search to users only (no projects, cases, tasks, or processes).
 * Used by MentionAutocomplete component for @mention functionality.
 *
 * Calls /api/users/public directly via authFetch, bypassing
 * pocketbaseService.searchUsers which has a <2 char guard that
 * blocks valid searches.
 */

import * as pocketbaseService from "$lib/services/pocketbaseService";
import type { SearchResult } from "$lib/utils/entitySearch";

/**
 * Get display name for a user with fallback chain: name → username → email → 'Unknown User'
 */
function getUserDisplayName(user: any): string {
  return user.name || user.username || user.email || "Unknown User";
}

/**
 * Search only users by query string.
 *
 * - Query length > 1: calls /api/users/public?search=... directly
 * - Empty query: calls pocketbaseService.getAllUsers() to list all users
 *
 * Returns only SearchResult items with type: 'user'
 *
 * @param query - Search query string (trimmed internally)
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise resolving to array of user SearchResult items
 */
export async function searchUsersOnly(
  query: string,
  limit: number = 10,
): Promise<SearchResult[]> {
  const trimmedQuery = (query || "").trim();

  try {
    // Always use getAllUsers — it's cached in-pocketbaseService (single request)
    // then filter client-side. This is more reliable than the search endpoint
    // which has guards and can fail silently.
    const result = await pocketbaseService.getAllUsers();
    if (!result.success) {
      return [];
    }

    let users = result.value;

    // Filter client-side when there's a query (> 1 char)
    if (trimmedQuery.length > 1) {
      const lowerQuery = trimmedQuery.toLowerCase();
      users = users.filter((u: any) => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const username = (u.username || "").toLowerCase();
        return (
          name.includes(lowerQuery) ||
          email.includes(lowerQuery) ||
          username.includes(lowerQuery)
        );
      });
    }

    // Map users to SearchResult with type: 'user'
    const searchResults: SearchResult[] = users
      .slice(0, limit)
      .map((user: any) => ({
        type: "user" as const,
        id: user.id,
        name: getUserDisplayName(user),
        subtitle: user.email || undefined,
      }));

    // Sort alphabetically by name
    searchResults.sort((a, b) => a.name.localeCompare(b.name));

    return searchResults;
  } catch (error) {
    console.error("Error in searchUsersOnly:", error);
    return [];
  }
}

/**
 * Debounced search utility for @mention autocomplete
 *
 * Prevents excessive API calls while the user is typing.
 * Uses setTimeout/clearTimeout for debouncing.
 *
 * @param delay - Debounce delay in milliseconds (default: 300)
 * @returns Object with search, setCallback, and cancel functions
 *
 * @example
 * ```typescript
 * const debounced = createDebouncedSearch(300);
 * debounced.setCallback((results) => {
 *   // Update UI with results
 * });
 * debounced.search('john');
 * // After 300ms without further calls, the search executes
 * ```
 */
export function createDebouncedSearch(delay: number = 300): {
  search: (query: string, limit?: number) => void;
  setCallback: (cb: (results: SearchResult[]) => void) => void;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let callback: ((results: SearchResult[]) => void) | null = null;

  return {
    search(query: string, limit?: number) {
      // Clear any pending search
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Schedule new search after delay
      timeoutId = setTimeout(async () => {
        timeoutId = null;
        try {
          const results = await searchUsersOnly(query, limit);
          if (callback) {
            callback(results);
          }
        } catch (error) {
          console.error("Debounced search error:", error);
          if (callback) {
            callback([]);
          }
        }
      }, delay);
    },

    setCallback(cb: (results: SearchResult[]) => void) {
      callback = cb;
    },

    cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}
