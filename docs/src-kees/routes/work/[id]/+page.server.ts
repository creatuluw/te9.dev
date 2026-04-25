/**
 * Server-side data loading for work item page
 * Loads users server-side to avoid 431 header size issues
 * Checks project access control before allowing access to work items
 */
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import * as userManagementService from "$lib/services/userManagementService";
import { PocketBaseUserSchema } from "$lib/schemas/user";
import { hasPermission } from "$lib/services/authService";
import { getRowByIdResult } from "$lib/utils/postgrest";
import * as projectAuthService from "$lib/services/projectAuthService";

export const load: PageServerLoad = async ({ locals, params }) => {
  const workItemId = parseInt(params.id);

  if (isNaN(workItemId)) {
    throw error(404, "Work item not found");
  }

  // Load the work item to check its project_id
  const taskResult = await getRowByIdResult<any>("_bpm_tasks", workItemId);

  if (!taskResult.success) {
    throw error(404, "Work item not found");
  }

  const task = taskResult.value;

  // Check project access if the task is associated with a project
  if (task.project_id) {
    const userId = locals.user?.id;
    const isSysadmin = locals.user?.is_sysadmin === true;

    // Sysadmins can access everything
    if (!isSysadmin) {
      // Check if user can access the project
      // This will throw 403 if user doesn't have access to a private project
      try {
        await projectAuthService.requireProjectAccess(task.project_id, userId);
      } catch (err: any) {
        // Re-throw SvelteKit errors as-is
        if (err.status) {
          throw err;
        }
        // Wrap other errors
        throw error(403, "You do not have access to this work item");
      }
    }
  }

  // Load users server-side to avoid 431 header size issues
  // Transform to PocketBase format for compatibility
  let users: any[] = [];

  // Any authenticated user should be able to see the list of users for assignment
  // No permission check needed - user data should be public to all logged-in users

  try {
    const result = await userManagementService.getAllUsers({
      limit: 1000,
      isActive: true, // Only get active users for dropdown
    });

    if (result.success) {
      // Transform UserWithRoles to PocketBaseUser format
      users = result.value
        .map((user) => {
          const pbUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
            verified: user.email_verified,
            emailVisibility: true,
            created: user.created_at,
            updated: user.updated_at,
          };

          // Validate with schema
          const validation = PocketBaseUserSchema.safeParse(pbUser);
          if (validation.success) {
            return validation.data;
          }
          return null;
        })
        .filter((user): user is NonNullable<typeof user> => user !== null);
    }
  } catch (err) {
    console.error("[work/[id]/+page.server] Error loading users:", err);
    // Return empty array on error - component will handle gracefully
  }

  return {
    users,
  };
};
