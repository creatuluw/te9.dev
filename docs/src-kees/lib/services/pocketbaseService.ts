/**
 * User management service - Migrated from PocketBase to new auth system
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 * Maintains backward compatibility with PocketBase interface.
 */
import * as analyticsService from "./analyticsService";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { PocketBaseUserSchema, type PocketBaseUser } from "$lib/schemas/user";
import { validateSchema } from "$lib/utils/validation";

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const authDataStr = localStorage.getItem("auth_data");
    if (!authDataStr) return null;

    const authData = JSON.parse(authDataStr);
    return authData?.token || null;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get all users from PocketBase
 *
 * @returns Result containing array of users, or error if query fails
 *
 * @example
 * ```typescript
 * const result = await getAllUsers();
 * if (result.success) {
 *   console.log(result.value); // PocketBaseUser[]
 * }
 * ```
 */
// Track in-flight requests to prevent duplicates
let getAllUsersRequest: Promise<Result<PocketBaseUser[], AppError>> | null =
  null;

export async function getAllUsers(): Promise<
  Result<PocketBaseUser[], AppError>
> {
  // If a request is already in flight, return it to prevent duplicates
  if (getAllUsersRequest) {
    return getAllUsersRequest;
  }

  getAllUsersRequest = (async () => {
    try {
      // Request a high limit to get all users (default is 20)
      // Use public endpoint that doesn't require admin permissions
      const response = await authFetch("/api/users/public?limit=1000");

      if (!response.ok) {
        if (response.status === 401) {
          console.error("[pocketbaseService] 401 Unauthorized");
          return err(
            UnauthorizedError.create("Authentication required to fetch users"),
          );
        }
        if (response.status === 403) {
          console.error("[pocketbaseService] 403 Forbidden");
          return err(
            UnauthorizedError.create("Permission denied to fetch users"),
          );
        }
        const errorData = await response.json().catch(() => ({}));
        console.error("[pocketbaseService] Error response:", errorData);
        return err(
          NetworkError.from(
            new Error(errorData.error || "Failed to fetch users"),
          ),
        );
      }

      const result = await response.json();

      if (!result.success) {
        console.error(
          "[pocketbaseService] API returned success:false:",
          result.error,
        );
        return err(
          NetworkError.from(new Error(result.error || "Failed to fetch users")),
        );
      }

      // Transform new API format to PocketBase format for compatibility
      // API returns { success: true, data: UserWithRoles[] }
      // Handle both possible structures: result.data.users (legacy) or result.data (current)
      let users: any[] = [];
      if (result.data) {
        if (Array.isArray(result.data)) {
          users = result.data;
        } else if (result.data.users && Array.isArray(result.data.users)) {
          users = result.data.users;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          users = result.data.data;
        }
      }

      // Validate and transform records
      const validatedUsers: PocketBaseUser[] = [];
      let validationErrors = 0;
      for (const record of users) {
        // Transform new format to PocketBase format
        const pbUser = {
          id: record.id,
          email: record.email,
          username: record.username,
          name: record.name,
          avatar: record.avatar,
          verified: record.email_verified,
          emailVisibility: true,
          created: record.created_at,
          updated: record.updated_at,
        };

        const validation = PocketBaseUserSchema.safeParse(pbUser);
        if (validation.success) {
          validatedUsers.push(validation.data);
        } else {
          validationErrors++;
          if (import.meta.env.DEV) {
            console.warn(
              "User record validation failed:",
              validation.error,
              pbUser,
            );
          }
        }
      }

      if (validationErrors > 0 && import.meta.env.DEV) {
        console.warn(`Skipped ${validationErrors} invalid user record(s)`);
      }

      console.log(
        "[pocketbaseService] Returning",
        validatedUsers.length,
        "validated users",
      );
      return ok(validatedUsers);
    } catch (error: any) {
      console.error("Error fetching users from API:", error);
      return err(NetworkError.from(error));
    } finally {
      // Clear the request promise so future calls can make new requests
      getAllUsersRequest = null;
    }
  })();

  return getAllUsersRequest;
}

// Track in-flight requests per user ID to prevent duplicates
const getUserByIdRequests: Map<
  string,
  Promise<Result<PocketBaseUser, AppError>>
> = new Map();

/**
 * Get user by ID from PocketBase
 *
 * @param id - User ID (PocketBase user ID)
 * @returns Result containing user, or error if not found
 *
 * @example
 * ```typescript
 * const result = await getUserById('user123');
 * if (result.success) {
 *   console.log(result.value); // PocketBaseUser
 * }
 * ```
 */
export async function getUserById(
  id: string | number,
): Promise<Result<PocketBaseUser, AppError>> {
  // Convert to string if it's a number
  const idString = String(id);
  if (!idString || idString.trim().length === 0) {
    return err(ValidationError.create("Invalid user ID", "id", id));
  }

  // If a request for this user ID is already in flight, return it to prevent duplicates
  const existingRequest = getUserByIdRequests.get(idString);
  if (existingRequest) {
    return existingRequest;
  }

  const requestPromise = (async () => {
    try {
      // Use the public endpoint that doesn't require admin permissions
      const response = await authFetch(`/api/auth/users/${idString}/public`);

      if (!response.ok) {
        if (response.status === 401) {
          return err<PocketBaseUser, AppError>(
            UnauthorizedError.create("Authentication required to fetch user"),
          );
        }
        if (response.status === 404) {
          return err<PocketBaseUser, AppError>(
            NotFoundError.resource("User", idString),
          );
        }
        const errorData = await response.json().catch(() => ({}));
        return err<PocketBaseUser, AppError>(
          NetworkError.from(
            new Error(errorData.error || "Failed to fetch user"),
          ),
        );
      }

      const result = await response.json();

      if (!result.success) {
        return err<PocketBaseUser, AppError>(
          NetworkError.from(new Error(result.error || "Failed to fetch user")),
        );
      }

      // Transform new API format to PocketBase format for compatibility
      const userData = result.data;
      const pbUser = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        name: userData.name,
        avatar: userData.avatar,
        verified: userData.email_verified,
        emailVisibility: true,
        created: userData.created_at,
        updated: userData.updated_at,
      };

      const validation = validateSchema(PocketBaseUserSchema, pbUser);
      if (!validation.success) {
        return err<PocketBaseUser, AppError>(validation.error);
      }

      return ok<PocketBaseUser, AppError>(validation.value);
    } catch (error: any) {
      console.error("Error fetching user from API:", error);
      return err<PocketBaseUser, AppError>(NetworkError.from(error));
    } finally {
      // Clear the request promise so future calls can make new requests
      getUserByIdRequests.delete(idString);
    }
  })();

  // Store the request promise
  getUserByIdRequests.set(idString, requestPromise);

  return requestPromise;
}

/**
 * Get current authenticated user from localStorage
 *
 * @returns PocketBaseUser or null if not authenticated
 *
 * @example
 * ```typescript
 * const user = getCurrentUser();
 * if (user) {
 *   console.log(user.email);
 * }
 * ```
 */
export function getCurrentUser(): PocketBaseUser | null {
  if (typeof window === "undefined") return null;

  try {
    const authData = localStorage.getItem("auth_data");
    if (!authData) return null;

    const parsed = JSON.parse(authData);
    // Transform new auth format to PocketBase format for compatibility
    const userData = parsed.user || parsed.record; // Support both new and legacy formats
    if (!userData) return null;

    const pbUser = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      name: userData.name,
      avatar: userData.avatar,
      verified: userData.email_verified || userData.verified,
      emailVisibility: true,
      created: userData.created_at || userData.created,
      updated: userData.updated_at || userData.updated,
    };

    const validation = PocketBaseUserSchema.safeParse(pbUser);
    if (validation.success) {
      return validation.data;
    }
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Search users by name or email
 *
 * @param query - Search query string
 * @returns Result containing array of matching users, or error if search fails
 *
 * @example
 * ```typescript
 * const result = await searchUsers('john');
 * if (result.success) {
 *   console.log(result.value); // PocketBaseUser[]
 * }
 * ```
 */
export async function searchUsers(
  query: string,
): Promise<Result<PocketBaseUser[], AppError>> {
  if (!query || query.trim().length === 0) {
    return err(
      ValidationError.create("Search query cannot be empty", "query", query),
    );
  }

  // Skip search for very short queries (less than 2 characters) to avoid API errors
  // Return empty result instead
  if (query.trim().length < 2) {
    return ok([]);
  }

  try {
    // Use public endpoint for user search (no admin permission required)
    // This is used for @mentions and other public user selection features
    const response = await authFetch(
      `/api/users/public?search=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      if (response.status === 401) {
        return err(
          UnauthorizedError.create("Authentication required to search users"),
        );
      }
      const errorData = await response.json().catch(() => ({}));
      return err(
        NetworkError.from(
          new Error(errorData.error || "Failed to search users"),
        ),
      );
    }

    const result = await response.json();

    if (!result.success) {
      return err(
        NetworkError.from(new Error(result.error || "Failed to search users")),
      );
    }

    // Transform new API format to PocketBase format for compatibility
    const users = result.data.users || result.data || [];

    // Validate and transform records
    const validatedUsers: PocketBaseUser[] = [];
    let validationErrors = 0;
    for (const record of users) {
      // Transform new format to PocketBase format
      const pbUser = {
        id: record.id,
        email: record.email,
        username: record.username,
        name: record.name,
        avatar: record.avatar,
        verified: record.email_verified,
        emailVisibility: true,
        created: record.created_at,
        updated: record.updated_at,
      };

      const validation = PocketBaseUserSchema.safeParse(pbUser);
      if (validation.success) {
        validatedUsers.push(validation.data);
      } else {
        validationErrors++;
        if (import.meta.env.DEV) {
          console.warn(
            "User record validation failed:",
            validation.error,
            pbUser,
          );
        }
      }
    }

    if (validationErrors > 0 && import.meta.env.DEV) {
      console.warn(
        `Skipped ${validationErrors} invalid user record(s) in search`,
      );
    }

    return ok(validatedUsers);
  } catch (error: any) {
    console.error("Error searching users:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Track user login for analytics
 *
 * @param userId - User ID
 * @param method - Login method (default: 'email')
 * @returns Promise that resolves when tracking is complete
 */
export async function trackUserLogin(
  userId: string,
  method: string = "email",
): Promise<void> {
  await analyticsService.trackLogin(userId, method).catch(console.error);
}

/**
 * Track user logout for analytics
 * Note: Logout tracking removed - only login events are tracked
 *
 * @param userId - User ID
 * @param sessionStart - Session start timestamp in milliseconds
 * @returns Promise that resolves immediately (no-op)
 */
export async function trackUserLogout(
  userId: string,
  sessionStart: number,
): Promise<void> {
  // Logout tracking removed - only login events are tracked
  return Promise.resolve();
}

// Re-export types for backward compatibility
export type { PocketBaseUser } from "$lib/schemas/user";
