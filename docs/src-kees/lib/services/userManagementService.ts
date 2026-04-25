/**
 * User Management Service - Administrative user management operations
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */

import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
  filter,
} from "$lib/utils/postgrest";
import { createCache } from "$lib/utils/serverCache";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import { hashPassword } from "$lib/utils/password";
import { logUserAction } from "$lib/services/auditService";
import * as eventLogService from "./eventLogService";
import * as sysadminNotificationService from "./sysadminNotificationService";
import { z } from "zod";

// Cache for user list (30s TTL — user data changes rarely)
const userListCache = createCache<UserWithRoles[]>(30000);

// Validation schemas
export const CreateUserInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .optional(),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  is_active: z.boolean().optional().default(true),
});

export const UpdateUserInputSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  password: z.string().min(8).optional(),
  is_active: z.boolean().optional(),
  is_sysadmin: z.boolean().optional(),
  avatar: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  first_name: string;
  last_name: string;
  password_hash?: string | null;
  avatar?: string | null;
  email_verified: boolean;
  is_active: boolean;
  is_sysadmin?: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  bio?: string | null;
}

export interface UserWithRoles extends User {
  roles: Array<{
    id: number;
    name: string;
    description?: string | null;
    is_system: boolean;
  }>;
}

/**
 * Get all users with their roles
 *
 * @param options - Query options (limit, offset, filter)
 * @returns Result containing array of users with roles
 */
export async function getAllUsers(options?: {
  limit?: number;
  offset?: number;
  isActive?: boolean;
  search?: string;
}): Promise<Result<UserWithRoles[], AppError>> {
  try {
    let filterBuilder = filter();

    if (options?.isActive !== undefined) {
      filterBuilder = filterBuilder.eq("is_active", options.isActive);
    }

    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filterBuilder = filterBuilder.or(
        `email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`,
      );
    }

    const queryOptions: any = {
      filter: filterBuilder.build(),
      order: "created_at.desc",
    };

    if (options?.limit) {
      queryOptions.limit = options.limit;
    }

    if (options?.offset) {
      queryOptions.offset = options.offset;
    }

    // Check cache first
    const cacheKey = `all:${options?.isActive ?? "any"}:${options?.search ?? ""}:${options?.limit ?? "all"}:${options?.offset ?? 0}`;
    const cached = userListCache.get(cacheKey);
    if (cached) {
      return ok(cached);
    }

    // Step 1: Fetch all users (1 query)
    const result = await queryTableResult<User>("_auth_users", queryOptions);

    if (!result.success) {
      return err(result.error);
    }

    // No users — return early
    if (result.value.data.length === 0) {
      return ok([]);
    }

    // Step 2: Batch fetch ALL user-role mappings in ONE query
    const userIds = result.value.data.map((u) => u.id);
    const allUserRolesResult = await queryTableResult<{
      user_id: string;
      role_id: number;
    }>("_auth_user_roles", {
      filter: filter().in("user_id", userIds).build(),
    });

    // Step 3: Get unique role IDs and batch fetch ALL roles in ONE query
    const roleMap = new Map<number, any>();
    if (
      allUserRolesResult.success &&
      allUserRolesResult.value.data.length > 0
    ) {
      const roleIds = [
        ...new Set(allUserRolesResult.value.data.map((ur) => ur.role_id)),
      ];
      if (roleIds.length > 0) {
        const allRolesResult = await queryTableResult<any>("_auth_roles", {
          filter: filter().in("id", roleIds).build(),
        });
        if (allRolesResult.success) {
          for (const r of allRolesResult.value.data) {
            roleMap.set(r.id, r);
          }
        }
      }
    }

    // Step 4: Build user-with-roles in memory (zero DB queries)
    const userRolesMap = new Map<string, number[]>();
    if (allUserRolesResult.success) {
      for (const ur of allUserRolesResult.value.data) {
        if (!userRolesMap.has(ur.user_id)) {
          userRolesMap.set(ur.user_id, []);
        }
        userRolesMap.get(ur.user_id)!.push(ur.role_id);
      }
    }

    const usersWithRoles: UserWithRoles[] = result.value.data.map((user) => ({
      ...user,
      roles: (userRolesMap.get(user.id) || [])
        .map((rid) => roleMap.get(rid))
        .filter(Boolean),
    }));

    // Store in cache
    userListCache.set(cacheKey, usersWithRoles);

    return ok(usersWithRoles);
  } catch (error) {
    console.error("Get all users error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get user by ID with roles
 *
 * @param id - User ID
 * @returns Result containing user with roles
 */
export async function getUserById(
  id: string,
): Promise<Result<UserWithRoles, AppError>> {
  try {
    const result = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("id", id).build(),
    });

    if (!result.success) {
      return err(result.error);
    }

    if (result.value.data.length === 0) {
      return err(NotFoundError.resource("User", id));
    }

    const user = result.value.data[0];

    // Fetch user roles
    const rolesResult = await getUserRoles(id);

    return ok({
      ...user,
      roles: rolesResult.success ? rolesResult.value : [],
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Create new user
 *
 * @param data - User creation data
 * @param createdBy - User ID of creator (for audit log)
 * @returns Result containing created user
 */
export async function createUser(
  data: CreateUserInput,
  createdBy?: string,
): Promise<Result<User, AppError>> {
  // Validate input
  const validation = validateSchema(CreateUserInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const validated = validation.value;

  try {
    // Check if email already exists
    const emailCheck = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("email", validated.email).build(),
    });

    if (emailCheck.success && emailCheck.value.data.length > 0) {
      return err(
        ValidationError.create(
          "Een gebruiker met dit e-mailadres bestaat al",
          "email",
          validated.email,
        ),
      );
    }

    // Check if username already exists (if provided)
    if (validated.username) {
      const usernameCheck = await queryTableResult<User>("_auth_users", {
        filter: filter().eq("username", validated.username).build(),
      });

      if (usernameCheck.success && usernameCheck.value.data.length > 0) {
        return err(
          ValidationError.create(
            "Een gebruiker met deze gebruikersnaam bestaat al",
            "username",
            validated.username,
          ),
        );
      }
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Combine first_name and last_name into name (schema only has name field)
    const fullName = `${validated.first_name} ${validated.last_name}`.trim();

    // Create user
    const userData: any = {
      email: validated.email,
      name: fullName,
      password_hash: passwordHash,
      is_active: validated.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add username if provided
    if (validated.username) {
      userData.username = validated.username;
    }

    const userResult = await insertRowResult<User>("_auth_users", userData);

    if (!userResult.success) {
      // Handle database constraint violations (e.g., race conditions)
      // PostgREST returns 409 for unique constraint violations
      if (
        userResult.error instanceof NetworkError &&
        userResult.error.statusCode === 409
      ) {
        // Try to determine which field caused the conflict
        const errorMessage = userResult.error.message.toLowerCase();
        if (errorMessage.includes("email") || errorMessage.includes("e-mail")) {
          return err(
            ValidationError.create(
              "Een gebruiker met dit e-mailadres bestaat al",
              "email",
              validated.email,
            ),
          );
        } else if (
          errorMessage.includes("username") ||
          errorMessage.includes("gebruikersnaam")
        ) {
          return err(
            ValidationError.create(
              "Een gebruiker met deze gebruikersnaam bestaat al",
              "username",
              validated.username,
            ),
          );
        }
        return err(
          ValidationError.create(
            "Deze gegevens zijn al in gebruik",
            undefined,
            undefined,
          ),
        );
      }
      return err(userResult.error);
    }

    // Log activity
    if (createdBy) {
      await logUserAction(createdBy, "create_user", {
        target_user_id: userResult.value.id,
        email: validated.email,
      }).catch(console.error);
    }

    // Invalidate user list cache
    userListCache.clear();

    return ok(userResult.value);
  } catch (error) {
    console.error("Create user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Update user
 *
 * @param id - User ID
 * @param data - Update data
 * @param updatedBy - User ID of updater (for audit log)
 * @returns Result containing updated user
 */
export async function updateUser(
  id: string,
  data: UpdateUserInput,
  updatedBy?: string,
): Promise<Result<User, AppError>> {
  // Validate input
  const validation = validateSchema(UpdateUserInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    // Check if user exists
    const existingResult = await getUserById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Protect sysadmin flag: only admins can set/modify is_sysadmin
    if (data.is_sysadmin !== undefined && updatedBy) {
      // Check if updater is admin
      const updaterResult = await getUserById(updatedBy);
      if (!updaterResult.success) {
        return err(updaterResult.error);
      }

      const updater = updaterResult.value;
      // Only allow if updater is sysadmin or has Admin role
      // Note: We check roles via a separate query since userManagementService doesn't have direct role access
      // For now, we'll check if updater is sysadmin - role check should be done at API level
      if (!updater.is_sysadmin) {
        // Check if updater has Admin role (this is a simplified check - API layer should enforce this)
        // Return error - only admins can modify sysadmin flag
        return err(
          ValidationError.create(
            "Alleen beheerders kunnen de sysadmin vlag wijzigen",
            "is_sysadmin",
            data.is_sysadmin,
          ),
        );
      }
    }

    // Check if new email already exists (if changed)
    if (data.email && data.email !== existingResult.value.email) {
      const emailCheck = await queryTableResult<User>("_auth_users", {
        filter: filter().eq("email", data.email).build(),
      });

      if (emailCheck.success && emailCheck.value.data.length > 0) {
        return err(
          ValidationError.create(
            "Een gebruiker met dit e-mailadres bestaat al",
            "email",
            data.email,
          ),
        );
      }
    }

    // Check if new username already exists (if provided and changed)
    if (data.username !== undefined) {
      const existingUsername = (existingResult.value as any).username;
      if (data.username !== existingUsername) {
        // Only check if username is being set (not being cleared)
        if (data.username) {
          const usernameCheck = await queryTableResult<User>("_auth_users", {
            filter: filter().eq("username", data.username).build(),
          });

          if (usernameCheck.success && usernameCheck.value.data.length > 0) {
            return err(
              ValidationError.create(
                "Een gebruiker met deze gebruikersnaam bestaat al",
                "username",
                data.username,
              ),
            );
          }
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map fields to database schema
    if (data.email) updateData.email = data.email;
    if (data.username !== undefined)
      updateData.username = data.username || null; // Allow clearing username
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.is_sysadmin !== undefined)
      updateData.is_sysadmin = data.is_sysadmin;
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null; // Allow clearing avatar
    if (data.bio !== undefined) updateData.bio = data.bio || null; // Allow clearing bio

    // Combine first_name and last_name into name if provided (schema only has name field)
    if (data.first_name !== undefined || data.last_name !== undefined) {
      // If both are provided, combine them
      if (data.first_name !== undefined && data.last_name !== undefined) {
        updateData.name = `${data.first_name} ${data.last_name}`.trim();
      } else {
        // If only one is provided, try to split existing name or use the provided value
        const existingName = (existingResult.value as any).name || "";
        const nameParts = existingName.split(" ");
        const firstName = data.first_name ?? nameParts[0] ?? "";
        const lastName = data.last_name ?? (nameParts.slice(1).join(" ") || "");
        updateData.name = `${firstName} ${lastName}`.trim();
      }
    }

    // Hash password if provided
    if (data.password) {
      updateData.password_hash = await hashPassword(data.password);
      delete updateData.password;
    }

    // Update user
    const updateResult = await updateRowsResult(
      "_auth_users",
      filter().eq("id", id).build(),
      updateData,
    );

    if (!updateResult.success) {
      // Handle database constraint violations (e.g., race conditions)
      // PostgREST returns 409 for unique constraint violations
      if (
        updateResult.error instanceof NetworkError &&
        updateResult.error.statusCode === 409
      ) {
        // Try to determine which field caused the conflict
        const errorMessage = updateResult.error.message.toLowerCase();
        if (errorMessage.includes("email") || errorMessage.includes("e-mail")) {
          return err(
            ValidationError.create(
              "Een gebruiker met dit e-mailadres bestaat al",
              "email",
              data.email,
            ),
          );
        } else if (
          errorMessage.includes("username") ||
          errorMessage.includes("gebruikersnaam")
        ) {
          return err(
            ValidationError.create(
              "Een gebruiker met deze gebruikersnaam bestaat al",
              "username",
              data.username,
            ),
          );
        }
        return err(
          ValidationError.create(
            "Deze gegevens zijn al in gebruik",
            undefined,
            undefined,
          ),
        );
      }
      return err(updateResult.error);
    }

    // Fetch updated user
    const userResult = await getUserById(id);
    if (!userResult.success) {
      return err(userResult.error);
    }

    // Log activity
    if (updatedBy) {
      await logUserAction(updatedBy, "update_user", {
        target_user_id: id,
        changes: Object.keys(data),
      }).catch(console.error);
    }

    // Check if sysadmin status changed
    if (data.is_sysadmin !== undefined) {
      const oldSysadminStatus =
        (existingResult.value as any).is_sysadmin || false;
      const newSysadminStatus = data.is_sysadmin;

      if (oldSysadminStatus !== newSysadminStatus) {
        // Log event to _bpm_event_log
        await eventLogService
          .logUserEvent(
            newSysadminStatus
              ? "user_sysadmin_activated"
              : "user_sysadmin_deactivated",
            id,
            {
              oldValues: {
                is_sysadmin: oldSysadminStatus,
              },
              newValues: {
                is_sysadmin: newSysadminStatus,
                email: existingResult.value.email,
              },
              metadata: {
                updated_by: updatedBy,
              },
            },
          )
          .catch(console.error);

        // Notify sysadmins
        await sysadminNotificationService
          .notifySysadminStatusChanged(
            existingResult.value.email,
            newSysadminStatus,
            existingResult.value.name || undefined,
            updatedBy,
          )
          .catch(console.error);
      }
    }

    // Check if active status changed
    if (data.is_active !== undefined) {
      const oldActiveStatus = existingResult.value.is_active;
      const newActiveStatus = data.is_active;

      if (oldActiveStatus !== newActiveStatus) {
        // Log event to _bpm_event_log
        await eventLogService
          .logUserEvent(
            newActiveStatus ? "user_activated" : "user_deactivated",
            id,
            {
              oldValues: {
                is_active: oldActiveStatus,
              },
              newValues: {
                is_active: newActiveStatus,
                email: existingResult.value.email,
              },
              metadata: {
                updated_by: updatedBy,
              },
            },
          )
          .catch(console.error);

        // Notify sysadmins for deactivation (activation is less critical)
        if (!newActiveStatus) {
          await sysadminNotificationService
            .notifyUserDeactivated(
              existingResult.value.email,
              existingResult.value.name || undefined,
              updatedBy,
            )
            .catch(console.error);
        }
      }
    }

    // Invalidate user list cache
    userListCache.clear();

    return ok(userResult.value);
  } catch (error) {
    console.error("Update user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Soft delete user (mark as inactive)
 *
 * @param id - User ID
 * @param deletedBy - User ID of deleter (for audit log)
 * @returns Result with success
 */
export async function deleteUser(
  id: string,
  deletedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if user exists
    const existingResult = await getUserById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Soft delete by marking as inactive
    const updateResult = await updateRowsResult(
      "_auth_users",
      filter().eq("id", id).build(),
      {
        is_active: false,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Log activity
    if (deletedBy) {
      await logUserAction(deletedBy, "delete_user", {
        target_user_id: id,
        email: existingResult.value.email,
      }).catch(console.error);
    }

    // Invalidate user list cache
    userListCache.clear();

    return ok(undefined);
  } catch (error) {
    console.error("Delete user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Permanently delete user - moves user to _auth_users_deleted table
 * This preserves the user record for audit purposes while removing from active system.
 * All associated data (cases, tasks, etc.) remains in the system.
 *
 * @param id - User ID
 * @param deletedBy - User ID of deleter (for audit log)
 * @param reason - Optional reason for deletion
 * @returns Result with success
 */
export async function deleteUserPermanently(
  id: string,
  deletedBy?: string,
  reason?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if user exists
    const existingResult = await getUserById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    const user = existingResult.value;

    // Prepare data for deleted users table
    const deletedUserData: any = {
      id: user.id,
      email: user.email,
      username: (user as any).username || null,
      name: (user as any).name || null,
      password_hash: (user as any).password_hash || null,
      avatar: (user as any).avatar || null,
      email_verified: user.email_verified,
      is_active: false,
      is_sysadmin: (user as any).is_sysadmin || false,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: (user as any).last_login_at || null,
      bio: (user as any).bio || null,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy || null,
      deletion_reason: reason || null,
    };

    // Insert into deleted users table
    const insertResult = await insertRowResult(
      "_auth_users_deleted",
      deletedUserData,
    );
    if (!insertResult.success) {
      return err(insertResult.error);
    }

    // Delete from active users table
    const deleteResult = await deleteRowsResult(
      "_auth_users",
      filter().eq("id", id).build(),
    );

    if (!deleteResult.success) {
      // Rollback: remove from deleted table if main delete fails
      await deleteRowsResult(
        "_auth_users_deleted",
        filter().eq("id", id).build(),
      ).catch(console.error);

      return err(deleteResult.error);
    }

    // Log activity
    if (deletedBy) {
      await logUserAction(deletedBy, "permanently_delete_user", {
        target_user_id: id,
        email: user.email,
        deletion_reason: reason,
      }).catch(console.error);
    }

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_permanently_deleted", id, {
        oldValues: {
          email: user.email,
          name: (user as any).name,
        },
        metadata: {
          deleted_by: deletedBy,
          deletion_reason: reason,
        },
      })
      .catch(console.error);

    // Notify sysadmins
    await sysadminNotificationService
      .notifyUserDeleted(
        user.email,
        (user as any).name || undefined,
        deletedBy,
        reason,
      )
      .catch(console.error);

    // Invalidate user list cache
    userListCache.clear();

    return ok(undefined);
  } catch (error) {
    console.error("Permanently delete user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get user's roles
 *
 * @param userId - User ID
 * @returns Result containing array of roles
 */
export async function getUserRoles(userId: string): Promise<
  Result<
    Array<{
      id: number;
      name: string;
      description?: string | null;
      is_system: boolean;
    }>,
    AppError
  >
> {
  try {
    const result = await queryTableResult<{ role_id: number }>(
      "_auth_user_roles",
      {
        filter: filter().eq("user_id", userId).build(),
        select: "role_id",
      },
    );

    if (!result.success) {
      return err(result.error);
    }

    // Fetch role details
    const roles = [];
    for (const userRole of result.value.data) {
      const roleResult = await queryTableResult<any>("_auth_roles", {
        filter: filter().eq("id", userRole.role_id).build(),
      });

      if (roleResult.success && roleResult.value.data.length > 0) {
        roles.push(roleResult.value.data[0]);
      }
    }

    return ok(roles);
  } catch (error) {
    console.error("Get user roles error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Assign role to user
 *
 * @param userId - User ID
 * @param roleId - Role ID
 * @param assignedBy - User ID of assigner (for audit log)
 * @returns Result with success
 */
export async function assignRoleToUser(
  userId: string,
  roleId: number,
  assignedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if user exists
    const userResult = await getUserById(userId);
    if (!userResult.success) {
      return err(userResult.error);
    }

    // Check if role exists
    const roleResult = await queryTableResult<any>("_auth_roles", {
      filter: filter().eq("id", roleId).build(),
    });

    if (!roleResult.success || roleResult.value.data.length === 0) {
      return err(NotFoundError.resource("Role", String(roleId)));
    }

    // Check if assignment already exists
    const existingResult = await queryTableResult<any>("_auth_user_roles", {
      filter: filter().eq("user_id", userId).eq("role_id", roleId).build(),
    });

    if (existingResult.success && existingResult.value.data.length > 0) {
      return err(
        ValidationError.create(
          "User already has this role",
          "role_id",
          String(roleId),
        ),
      );
    }

    // Assign role
    const assignResult = await insertRowResult("_auth_user_roles", {
      user_id: userId,
      role_id: roleId,
      assigned_at: new Date().toISOString(),
    });

    if (!assignResult.success) {
      return err(assignResult.error);
    }

    // Log activity
    if (assignedBy) {
      await logUserAction(assignedBy, "assign_role", {
        target_user_id: userId,
        role_id: roleId,
        role_name: roleResult.value.data[0].name,
      }).catch(console.error);
    }

    // Invalidate user list cache (roles changed)
    userListCache.clear();

    return ok(undefined);
  } catch (error) {
    console.error("Assign role to user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Assign multiple roles to user
 *
 * @param userId - User ID
 * @param roleIds - Array of role IDs
 * @param assignedBy - User ID of assigner (for audit log)
 * @returns Result with success
 */
export async function assignRoles(
  userId: string,
  roleIds: number[],
  assignedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Assign each role
    for (const roleId of roleIds) {
      const result = await assignRoleToUser(userId, roleId, assignedBy);
      if (!result.success) {
        // Log error but continue with other roles
        console.error(
          `Failed to assign role ${roleId} to user ${userId}:`,
          result.error,
        );
      }
    }

    return ok(undefined);
  } catch (error) {
    console.error("Assign roles to user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Remove role from user
 *
 * @param userId - User ID
 * @param roleId - Role ID
 * @param removedBy - User ID of remover (for audit log)
 * @returns Result with success
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: number,
  removedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if assignment exists
    const existingResult = await queryTableResult<any>("_auth_user_roles", {
      filter: filter().eq("user_id", userId).eq("role_id", roleId).build(),
    });

    if (!existingResult.success || existingResult.value.data.length === 0) {
      return err(
        NotFoundError.resource("User role assignment", `${userId}-${roleId}`),
      );
    }

    // Remove role
    const deleteResult = await deleteRowsResult(
      "_auth_user_roles",
      filter().eq("user_id", userId).eq("role_id", roleId).build(),
    );

    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    // Log activity
    if (removedBy) {
      await logUserAction(removedBy, "remove_role", {
        target_user_id: userId,
        role_id: roleId,
      }).catch(console.error);
    }

    // Invalidate user list cache (roles changed)
    userListCache.clear();

    return ok(undefined);
  } catch (error) {
    console.error("Remove role from user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get users by role
 *
 * @param roleId - Role ID
 * @returns Result containing array of users
 */
export async function getUsersByRole(
  roleId: number,
): Promise<Result<User[], AppError>> {
  try {
    const result = await queryTableResult<{ user_id: string }>(
      "_auth_user_roles",
      {
        filter: filter().eq("role_id", roleId).build(),
        select: "user_id",
      },
    );

    if (!result.success) {
      return err(result.error);
    }

    // Fetch user details
    const users = [];
    for (const userRole of result.value.data) {
      const userResult = await queryTableResult<User>("_auth_users", {
        filter: filter().eq("id", userRole.user_id).build(),
      });

      if (userResult.success && userResult.value.data.length > 0) {
        users.push(userResult.value.data[0]);
      }
    }

    return ok(users);
  } catch (error) {
    console.error("Get users by role error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get user statistics
 *
 * @returns Result containing user statistics
 */
export async function getUserStatistics(): Promise<
  Result<
    {
      total: number;
      active: number;
      inactive: number;
    },
    AppError
  >
> {
  try {
    const allResult = await queryTableResult<User>("_auth_users", {});

    if (!allResult.success) {
      return err(allResult.error);
    }

    const users = allResult.value.data;
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = total - active;

    return ok({ total, active, inactive });
  } catch (error) {
    console.error("Get user statistics error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get all sysadmin users
 *
 * @returns Result containing array of sysadmin users
 */
export async function getSysadmins(): Promise<Result<User[], AppError>> {
  try {
    const result = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("is_sysadmin", true).eq("is_active", true).build(),
    });

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value.data);
  } catch (error) {
    console.error("Get sysadmins error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Activate user
 *
 * @param id - User ID
 * @param activatedBy - User ID of activator (for audit log)
 * @returns Result containing updated user
 */
export async function activateUser(
  id: string,
  activatedBy?: string,
): Promise<Result<User, AppError>> {
  try {
    // Check if user exists
    const existingResult = await getUserById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Update user to active
    const updateResult = await updateRowsResult(
      "_auth_users",
      filter().eq("id", id).build(),
      {
        is_active: true,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Fetch updated user
    const userResult = await getUserById(id);
    if (!userResult.success) {
      return err(userResult.error);
    }

    // Log activity
    if (activatedBy) {
      await logUserAction(activatedBy, "activate_user", {
        target_user_id: id,
        email: existingResult.value.email,
      }).catch(console.error);
    }

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_activated", id, {
        oldValues: {
          is_active: false,
        },
        newValues: {
          is_active: true,
          email: existingResult.value.email,
        },
        metadata: {
          activated_by: activatedBy,
        },
      })
      .catch(console.error);

    // Invalidate user list cache
    userListCache.clear();

    return ok(userResult.value);
  } catch (error) {
    console.error("Activate user error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Deactivate user
 *
 * @param id - User ID
 * @param deactivatedBy - User ID of deactivator (for audit log)
 * @returns Result containing updated user
 */
export async function deactivateUser(
  id: string,
  deactivatedBy?: string,
): Promise<Result<User, AppError>> {
  try {
    // Check if user exists
    const existingResult = await getUserById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Update user to inactive
    const updateResult = await updateRowsResult(
      "_auth_users",
      filter().eq("id", id).build(),
      {
        is_active: false,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Fetch updated user
    const userResult = await getUserById(id);
    if (!userResult.success) {
      return err(userResult.error);
    }

    // Log activity
    if (deactivatedBy) {
      await logUserAction(deactivatedBy, "deactivate_user", {
        target_user_id: id,
        email: existingResult.value.email,
      }).catch(console.error);
    }

    // Log event to _bpm_event_log
    await eventLogService
      .logUserEvent("user_deactivated", id, {
        oldValues: {
          is_active: true,
        },
        newValues: {
          is_active: false,
          email: existingResult.value.email,
        },
        metadata: {
          deactivated_by: deactivatedBy,
        },
      })
      .catch(console.error);

    // Notify sysadmins
    await sysadminNotificationService
      .notifyUserDeactivated(
        existingResult.value.email,
        existingResult.value.name || undefined,
        deactivatedBy,
      )
      .catch(console.error);

    // Invalidate user list cache
    userListCache.clear();

    return ok(userResult.value);
  } catch (error) {
    console.error("Deactivate user error:", error);
    return err(NetworkError.from(error));
  }
}
