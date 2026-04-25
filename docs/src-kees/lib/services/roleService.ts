/**
 * Role Service - Role and Permission management
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
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NetworkError,
  NotFoundError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  type Role,
  type Permission,
  RoleSchema,
  PermissionSchema,
  CreateRoleInputSchema,
  type CreateRoleInput,
  CreatePermissionInputSchema,
  type CreatePermissionInput,
} from "$lib/schemas/auth";
import { logActivity } from "./authService";

// ============ ROLE METHODS ============

/**
 * Get all roles
 *
 * @returns Result containing array of roles
 */
export async function getAllRoles(): Promise<Result<Role[], AppError>> {
  try {
    const result = await queryTableResult<Role>("_auth_roles", {
      order: "name.asc",
    });

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value.data);
  } catch (error) {
    console.error("Get all roles error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get role by ID with permissions
 *
 * @param id - Role ID
 * @returns Result containing role with permissions
 */
export async function getRoleById(
  id: number,
): Promise<Result<Role & { permissions: Permission[] }, AppError>> {
  try {
    const roleResult = await queryTableResult<Role>("_auth_roles", {
      filter: filter().eq("id", id).build(),
    });

    if (!roleResult.success) {
      return err(roleResult.error);
    }

    if (roleResult.value.data.length === 0) {
      return err(NotFoundError.resource("Role", id.toString()));
    }

    const role = roleResult.value.data[0];

    // Fetch role permissions
    const permissionsResult = await getRolePermissions(id);
    const permissions = permissionsResult.success
      ? permissionsResult.value
      : [];

    return ok({ ...role, permissions });
  } catch (error) {
    console.error("Get role by ID error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Create new role
 *
 * @param data - Role creation data
 * @param createdBy - User ID of creator
 * @returns Result containing created role
 */
export async function createRole(
  data: CreateRoleInput,
  createdBy?: string,
): Promise<Result<Role, AppError>> {
  // Validate input
  const validation = validateSchema(CreateRoleInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const validated = validation.value;

  try {
    // Check if role name already exists
    const existingResult = await queryTableResult<Role>("_auth_roles", {
      filter: filter().eq("name", validated.name).build(),
    });

    if (existingResult.success && existingResult.value.data.length > 0) {
      return err(
        ValidationError.create(
          "Role name already exists",
          "name",
          validated.name,
        ),
      );
    }

    // Create role
    const roleResult = await insertRowResult<Role>("_auth_roles", {
      name: validated.name,
      description: validated.description || null,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!roleResult.success) {
      return err(roleResult.error);
    }

    // Log activity
    if (createdBy) {
      await logActivity(createdBy, "role_created", undefined, undefined, {
        role_id: roleResult.value.id,
        role_name: validated.name,
      }).catch(console.error);
    }

    return ok(roleResult.value);
  } catch (error) {
    console.error("Create role error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Update role
 *
 * @param id - Role ID
 * @param data - Update data
 * @param updatedBy - User ID of updater
 * @returns Result containing updated role
 */
export async function updateRole(
  id: number,
  data: Partial<CreateRoleInput>,
  updatedBy?: string,
): Promise<Result<Role, AppError>> {
  try {
    // Check if role exists
    const existingResult = await getRoleById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Check if it's a system role
    if (existingResult.value.is_system) {
      return err(
        ValidationError.create(
          "Cannot modify system role",
          "id",
          id.toString(),
        ),
      );
    }

    // Check if new name already exists
    if (data.name && data.name !== existingResult.value.name) {
      const nameCheck = await queryTableResult<Role>("_auth_roles", {
        filter: filter().eq("name", data.name).build(),
      });

      if (nameCheck.success && nameCheck.value.data.length > 0) {
        return err(
          ValidationError.create("Role name already exists", "name", data.name),
        );
      }
    }

    // Update role
    const updateResult = await updateRowsResult(
      "_auth_roles",
      filter().eq("id", id).build(),
      {
        ...data,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Fetch updated role
    const roleResult = await getRoleById(id);
    if (!roleResult.success) {
      return err(roleResult.error);
    }

    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, "role_updated", undefined, undefined, {
        role_id: id,
        changes: data,
      }).catch(console.error);
    }

    return ok(roleResult.value);
  } catch (error) {
    console.error("Update role error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Delete role
 *
 * @param id - Role ID
 * @param deletedBy - User ID of deleter
 * @returns Result with success
 */
export async function deleteRole(
  id: number,
  deletedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if role exists
    const existingResult = await getRoleById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Check if it's a system role
    if (existingResult.value.is_system) {
      return err(
        ValidationError.create(
          "Cannot delete system role",
          "id",
          id.toString(),
        ),
      );
    }

    // Check if role has users assigned
    const userCountResult = await queryTableResult("_auth_user_roles", {
      filter: filter().eq("role_id", id).build(),
    });

    if (!userCountResult.success) {
      return err(userCountResult.error);
    }

    const userCount = userCountResult.value.data.length;
    if (userCount > 0) {
      return err(
        ValidationError.create(
          `Cannot delete role with ${userCount} assigned user${userCount !== 1 ? "s" : ""}. Remove users from this role first.`,
          "id",
          id.toString(),
        ),
      );
    }

    // Delete role (will cascade delete role_permissions)
    const deleteResult = await deleteRowsResult(
      "_auth_roles",
      filter().eq("id", id).build(),
    );

    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    // Log activity
    if (deletedBy) {
      await logActivity(deletedBy, "role_deleted", undefined, undefined, {
        role_id: id,
        role_name: existingResult.value.name,
      }).catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Delete role error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get role permissions
 *
 * @param roleId - Role ID
 * @returns Result containing array of permissions
 */
export async function getRolePermissions(
  roleId: number,
): Promise<Result<Permission[], AppError>> {
  try {
    // First, get permission IDs from role_permissions junction table
    const rolePermissionsResult = await queryTableResult<{
      permission_id: number;
    }>("_auth_role_permissions", {
      filter: filter().eq("role_id", roleId).build(),
    });

    if (!rolePermissionsResult.success) {
      return err(rolePermissionsResult.error);
    }

    // If no permissions, return empty array
    if (rolePermissionsResult.value.data.length === 0) {
      return ok([]);
    }

    // Extract permission IDs
    const permissionIds = rolePermissionsResult.value.data.map(
      (rp) => rp.permission_id,
    );

    // Get permissions by IDs
    const permissionsResult = await queryTableResult<Permission>(
      "_auth_permissions",
      {
        filter: filter().in("id", permissionIds).build(),
        order: "route.asc",
      },
    );

    if (!permissionsResult.success) {
      return err(permissionsResult.error);
    }

    return ok(permissionsResult.value.data);
  } catch (error) {
    console.error("Get role permissions error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Assign permissions to role
 *
 * @param roleId - Role ID
 * @param permissionIds - Array of permission IDs
 * @param assignedBy - User ID of assigner
 * @returns Result with success
 */
export async function assignPermissions(
  roleId: number,
  permissionIds: number[],
  assignedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if role exists
    const roleCheck = await getRoleById(roleId);
    if (!roleCheck.success) {
      return err(roleCheck.error);
    }

    // Clear existing permissions
    await deleteRowsResult(
      "_auth_role_permissions",
      filter().eq("role_id", roleId).build(),
    ).catch(console.error);

    // Assign new permissions
    for (const permissionId of permissionIds) {
      await insertRowResult("_auth_role_permissions", {
        role_id: roleId,
        permission_id: permissionId,
        created_at: new Date().toISOString(),
      }).catch(console.error);
    }

    // Log activity
    if (assignedBy) {
      await logActivity(
        assignedBy,
        "permissions_assigned_to_role",
        undefined,
        undefined,
        {
          role_id: roleId,
          permission_ids: permissionIds,
        },
      ).catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Assign permissions error:", error);
    return err(NetworkError.from(error));
  }
}

// ============ PERMISSION METHODS ============

/**
 * Get all permissions
 *
 * @returns Result containing array of permissions
 */
export async function getAllPermissions(): Promise<
  Result<Permission[], AppError>
> {
  try {
    const result = await queryTableResult<Permission>("_auth_permissions", {
      order: "route.asc",
    });

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value.data);
  } catch (error) {
    console.error("Get all permissions error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get permission by ID
 *
 * @param id - Permission ID
 * @returns Result containing permission
 */
export async function getPermissionById(
  id: number,
): Promise<Result<Permission, AppError>> {
  try {
    const result = await queryTableResult<Permission>("_auth_permissions", {
      filter: filter().eq("id", id).build(),
    });

    if (!result.success) {
      return err(result.error);
    }

    if (result.value.data.length === 0) {
      return err(NotFoundError.resource("Permission", id.toString()));
    }

    return ok(result.value.data[0]);
  } catch (error) {
    console.error("Get permission by ID error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Create new permission
 *
 * @param data - Permission creation data
 * @param createdBy - User ID of creator
 * @returns Result containing created permission
 */
export async function createPermission(
  data: CreatePermissionInput,
  createdBy?: string,
): Promise<Result<Permission, AppError>> {
  // Validate input
  const validation = validateSchema(CreatePermissionInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const validated = validation.value;

  try {
    // Check if permission route already exists
    const existingResult = await queryTableResult<Permission>(
      "_auth_permissions",
      { filter: filter().eq("route", validated.route).build() },
    );

    if (existingResult.success && existingResult.value.data.length > 0) {
      return err(
        ValidationError.create(
          "Permission for this route already exists",
          "route",
          validated.route,
        ),
      );
    }

    // Create permission
    const permissionResult = await insertRowResult<Permission>(
      "_auth_permissions",
      {
        route: validated.route,
        actions: validated.actions,
        description: validated.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    );

    if (!permissionResult.success) {
      return err(permissionResult.error);
    }

    // Log activity
    if (createdBy) {
      await logActivity(createdBy, "permission_created", undefined, undefined, {
        permission_id: permissionResult.value.id,
        route: validated.route,
      }).catch(console.error);
    }

    return ok(permissionResult.value);
  } catch (error) {
    console.error("Create permission error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Update permission
 *
 * @param id - Permission ID
 * @param data - Update data
 * @param updatedBy - User ID of updater
 * @returns Result containing updated permission
 */
export async function updatePermission(
  id: number,
  data: Partial<CreatePermissionInput>,
  updatedBy?: string,
): Promise<Result<Permission, AppError>> {
  try {
    // Check if permission exists
    const existingResult = await getPermissionById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Check if new route already exists
    if (data.route && data.route !== existingResult.value.route) {
      const routeCheck = await queryTableResult<Permission>(
        "_auth_permissions",
        { filter: filter().eq("route", data.route).build() },
      );

      if (routeCheck.success && routeCheck.value.data.length > 0) {
        return err(
          ValidationError.create(
            "Permission for this route already exists",
            "route",
            data.route,
          ),
        );
      }
    }

    // Update permission
    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (data.actions) {
      updateData.actions = data.actions;
    }

    const updateResult = await updateRowsResult(
      "_auth_permissions",
      filter().eq("id", id).build(),
      updateData,
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Fetch updated permission
    const permissionResult = await getPermissionById(id);
    if (!permissionResult.success) {
      return err(permissionResult.error);
    }

    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, "permission_updated", undefined, undefined, {
        permission_id: id,
        changes: data,
      }).catch(console.error);
    }

    return ok(permissionResult.value);
  } catch (error) {
    console.error("Update permission error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Delete permission
 *
 * @param id - Permission ID
 * @param deletedBy - User ID of deleter
 * @returns Result with success
 */
export async function deletePermission(
  id: number,
  deletedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if permission exists
    const existingResult = await getPermissionById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Delete permission (will cascade delete role_permissions)
    const deleteResult = await deleteRowsResult(
      "_auth_permissions",
      filter().eq("id", id).build(),
    );

    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    // Log activity
    if (deletedBy) {
      await logActivity(deletedBy, "permission_deleted", undefined, undefined, {
        permission_id: id,
        route: existingResult.value.route,
      }).catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Delete permission error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get user counts per role
 *
 * Note: PostgREST doesn't support simple count aggregations on related tables easily without
 * using a view or RPC. For now we fetch all assignments and count in JS.
 *
 * TODO: Optimize this by creating a database view `role_user_counts` or using an RPC function.
 * Example View: CREATE VIEW role_user_counts AS SELECT role_id, COUNT(*) as count FROM _auth_user_roles GROUP BY role_id;
 */
export async function getUserCountsPerRole(): Promise<
  Result<Record<number, number>, AppError>
> {
  try {
    // Fetch all user-role assignments
    // We only need role_id, so we select just that to minimize data transfer
    const result = await queryTableResult<{ role_id: number }>(
      "_auth_user_roles",
      { select: "role_id" },
    );

    if (!result.success) {
      return err(result.error);
    }

    // Count users per role
    const counts: Record<number, number> = {};

    for (const assignment of result.value.data) {
      const roleId = assignment.role_id;
      counts[roleId] = (counts[roleId] || 0) + 1;
    }

    return ok(counts);
  } catch (error) {
    console.error("Get user counts per role error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Set role permissions (replaces all permissions for a role)
 *
 * @param roleId - Role ID
 * @param permissionIds - Array of permission IDs to assign
 * @param updatedBy - User ID of updater
 * @returns Result with success
 */
export async function setRolePermissions(
  roleId: number,
  permissionIds: number[],
  updatedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if role exists
    const roleResult = await getRoleById(roleId);
    if (!roleResult.success) {
      return err(roleResult.error);
    }

    // Delete existing permissions
    await deleteRowsResult(
      "_auth_role_permissions",
      filter().eq("role_id", roleId).build(),
    );

    // Insert new permissions
    for (const permId of permissionIds) {
      await insertRowResult("_auth_role_permissions", {
        role_id: roleId,
        permission_id: permId,
      });
    }

    // Log activity
    if (updatedBy) {
      await logActivity(
        updatedBy,
        "role_permissions_updated",
        undefined,
        undefined,
        {
          role_id: roleId,
          permission_count: permissionIds.length,
        },
      ).catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Set role permissions error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Set default role (only one role can be default at a time)
 *
 * @param roleId - Role ID to set as default
 * @param updatedBy - User ID of updater
 * @returns Result with success
 */
export async function setDefaultRole(
  roleId: number,
  updatedBy?: string,
): Promise<Result<void, AppError>> {
  try {
    // Check if role exists
    const roleResult = await getRoleById(roleId);
    if (!roleResult.success) {
      return err(roleResult.error);
    }

    // First, unset all other default roles
    await updateRowsResult(
      "_auth_roles",
      filter().eq("is_default", true).build(),
      { is_default: false, updated_at: new Date().toISOString() },
    ).catch(console.error);

    // Set this role as default
    const updateResult = await updateRowsResult(
      "_auth_roles",
      filter().eq("id", roleId).build(),
      {
        is_default: true,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Log activity
    if (updatedBy) {
      await logActivity(updatedBy, "default_role_set", undefined, undefined, {
        role_id: roleId,
        role_name: roleResult.value.name,
      }).catch(console.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Set default role error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get default role
 *
 * @returns Result containing default role or null if none set
 */
export async function getDefaultRole(): Promise<Result<Role | null, AppError>> {
  try {
    const result = await queryTableResult<Role>("_auth_roles", {
      filter: filter().eq("is_default", true).build(),
      limit: 1,
    });

    if (!result.success) {
      return err(result.error);
    }

    if (result.value.data.length === 0) {
      return ok(null);
    }

    return ok(result.value.data[0]);
  } catch (error) {
    console.error("Get default role error:", error);
    return err(NetworkError.from(error));
  }
}
