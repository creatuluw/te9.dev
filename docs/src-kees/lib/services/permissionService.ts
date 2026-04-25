/**
 * Permission Service - Permission management
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
  ForbiddenError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  type Permission,
  PermissionSchema,
  CreatePermissionInputSchema,
  type CreatePermissionInput,
} from "$lib/schemas/auth";
import { syncPermissionsToDatabase } from "./permissionSyncService";

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
 * Get permissions by route pattern
 *
 * @param routePattern - Route pattern to filter by

    return ok(result.value.data);

  } catch (error) {
    console.error('Get permissions by route error:', error);
    return err(NetworkError.from(error));
  }
}

/**
 * Create new permission
 *
 * @param data - Permission creation data
 * @returns Result containing created permission
 */
export async function createPermission(
  data: CreatePermissionInput,
): Promise<Result<Permission, AppError>> {
  // Validate input
  const validation = validateSchema(CreatePermissionInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  try {
    // Check if permission with this route already exists
    const existingResult = await queryTableResult<Permission>(
      "_auth_permissions",
      { filter: filter().eq("route", data.route).build() },
    );

    if (existingResult.success && existingResult.value.data.length > 0) {
      return err(
        ValidationError.create(
          "Permission with this route already exists",
          "route",
          data.route,
        ),
      );
    }

    // Create permission
    const result = await insertRowResult<Permission>("_auth_permissions", {
      route: data.route,
      actions: data.actions,
      description: data.description || null,
    });

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value);
  } catch (error) {
    console.error("Create permission error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Update permission
 *
 * @param id - Permission ID
 * @param data - Partial permission update data
 * @returns Result containing updated permission
 */
export async function updatePermission(
  id: number,
  data: Partial<CreatePermissionInput>,
): Promise<Result<Permission, AppError>> {
  try {
    // Check if permission exists
    const existingResult = await getPermissionById(id);
    if (!existingResult.success) {
      return existingResult;
    }

    // If updating route, check for conflicts
    if (data.route && data.route !== existingResult.value.route) {
      const conflictResult = await queryTableResult<Permission>(
        "_auth_permissions",
        { filter: filter().eq("route", data.route).build() },
      );

      if (conflictResult.success && conflictResult.value.data.length > 0) {
        return err(
          ValidationError.create(
            "Permission with this route already exists",
            "route",
            data.route,
          ),
        );
      }
    }

    // Update permission
    const updateData: any = {};
    if (data.route !== undefined) updateData.route = data.route;
    if (data.actions !== undefined) updateData.actions = data.actions;
    if (data.description !== undefined)
      updateData.description = data.description;
    updateData.updated_at = new Date().toISOString();

    const result = await updateRowsResult(
      "_auth_permissions",
      filter().eq("id", id).build(),
      updateData,
    );

    if (!result.success) {
      return err(result.error);
    }

    // Fetch updated permission
    return getPermissionById(id);
  } catch (error) {
    console.error("Update permission error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Delete permission
 *
 * @param id - Permission ID
 * @returns Result indicating success or error
 */
export async function deletePermission(
  id: number,
): Promise<Result<void, AppError>> {
  try {
    // Check if permission exists
    const existingResult = await getPermissionById(id);
    if (!existingResult.success) {
      return err(existingResult.error);
    }

    // Check if permission is in use by any roles
    const rolesResult = await queryTableResult<{ role_id: number }>(
      "_auth_role_permissions",
      { filter: filter().eq("permission_id", id).build() },
    );

    if (rolesResult.success && rolesResult.value.data.length > 0) {
      return err(
        ForbiddenError.create(
          `Cannot delete permission. It is assigned to ${rolesResult.value.data.length} role(s).`,
        ),
      );
    }

    // Delete permission
    const result = await deleteRowsResult(
      "_auth_permissions",
      filter().eq("id", id).build(),
    );

    if (!result.success) {
      return err(result.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Delete permission error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get permissions grouped by route pattern
 *
 * @returns Result containing permissions grouped by base route
 */
export async function getPermissionsGrouped(): Promise<
  Result<Map<string, Permission[]>, AppError>
> {
  try {
    const result = await getAllPermissions();
    if (!result.success) {
      return err(result.error);
    }

    const grouped = new Map<string, Permission[]>();

    for (const permission of result.value) {
      // Extract base route (e.g., '/admin/users' -> '/admin')
      const parts = permission.route.split("/").filter(Boolean);
      const baseRoute = parts.length > 0 ? `/${parts[0]}` : "/";

      if (!grouped.has(baseRoute)) {
        grouped.set(baseRoute, []);
      }

      grouped.get(baseRoute)!.push(permission);
    }

    return ok(grouped);
  } catch (error) {
    console.error("Get grouped permissions error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Sync permissions from route definitions
 * This would ideally scan the routes directory and create missing permissions
 * For now, returns an error indicating manual seeding is required
 *
 * @returns Result indicating success or error
 */
export async function syncPermissionsFromRoutes(): Promise<
  Result<{ created: number; skipped: number }, AppError>
> {
  const result = await syncPermissionsToDatabase();

  if (!result.success) {
    return err(result.error);
  }

  return ok({
    created: result.value.created,
    skipped: result.value.total - result.value.created - result.value.updated,
  });
}

/**
 * Bulk create permissions
 *
 * @param permissionsData - Array of permission creation data
 * @returns Result containing created permissions
 */
export async function bulkCreatePermissions(
  permissionsData: CreatePermissionInput[],
): Promise<Result<{ created: Permission[]; skipped: string[] }, AppError>> {
  const created: Permission[] = [];
  const skipped: string[] = [];

  for (const data of permissionsData) {
    const result = await createPermission(data);

    if (result.success) {
      created.push(result.value);
    } else {
      skipped.push(data.route);
      console.warn(`Skipped permission ${data.route}:`, result.error);
    }
  }

  return ok({ created, skipped });
}
