/**
 * Project Member Service - CRUD operations and access checks for project members
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
  getRowByIdResult,
} from "$lib/utils/postgrest";
import { requestCache } from "$lib/utils/requestCache";
import * as eventLogService from "./eventLogService";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  CreateProjectMemberInputSchema,
  UpdateProjectMemberInputSchema,
  type ProjectMember,
  type ProjectMemberWithUser,
  type CreateProjectMemberInput,
  type UpdateProjectMemberInput,
} from "$lib/schemas/projectMember";

/**
 * Get all members of a project with user details
 *
 * @param projectId - Project ID
 * @returns Result containing array of project members with user info, or error if query fails
 */
export async function getProjectMembers(
  projectId: number,
): Promise<Result<ProjectMemberWithUser[], AppError>> {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return err(
      ValidationError.create("Invalid project ID", "projectId", projectId),
    );
  }

  console.log(
    "[projectMemberService] getProjectMembers called for project:",
    projectId,
  );

  // Disable cache temporarily to ensure fresh data
  const cacheKey = `project:${projectId}:members`;
  requestCache.invalidate(cacheKey);

  return await requestCache.get(
    cacheKey,
    async () => {
      // Get project members without join (since PostgREST isn't seeing the FK)
      const result = await queryTableResult<ProjectMember>(
        "_bpm_project_members",
        {
          filter: { project_id: `eq.${projectId}` },
          order: "is_owner.desc,created_at.asc",
        },
      );

      if (!result.success) {
        return err<ProjectMemberWithUser[], AppError>(result.error);
      }

      console.log("[projectMemberService] Loaded members:", result.value.data);

      // Fetch user data for each member separately
      const members: ProjectMemberWithUser[] = [];

      for (const member of result.value.data) {
        // Fetch user data
        const userResult = await queryTableResult<any>("_auth_users", {
          filter: { id: `eq.${member.user_id}` },
          select: "id,name,email,avatar",
          limit: 1,
        });

        const userData =
          userResult.success && userResult.value.data.length > 0
            ? userResult.value.data[0]
            : null;

        console.log(
          "[projectMemberService] User data for",
          member.user_id,
          ":",
          userData,
        );

        members.push({
          ...member,
          user_name: userData?.name || "",
          user_email: userData?.email || "",
          user_avatar: userData?.avatar || null,
        });
      }

      console.log("[projectMemberService] Final transformed members:", members);
      return ok<ProjectMemberWithUser[], AppError>(members);
    },
    { ttl: 60000 },
  ); // 60 seconds TTL
}

/**
 * Add a member to a project
 *
 * @param projectId - Project ID
 * @param userId - User ID to add
 * @param isOwner - Whether to make the user an owner
 * @param addedBy - User ID of who is adding the member
 * @returns Result containing created project member, or error if creation fails
 */
export async function addProjectMember(
  projectId: number,
  userId: string,
  isOwner: boolean = false,
  addedBy?: string,
): Promise<Result<ProjectMember, AppError>> {
  // Validate input
  const validation = validateSchema(CreateProjectMemberInputSchema, {
    project_id: projectId,
    user_id: userId,
    is_owner: isOwner,
    created_by: addedBy,
  });

  if (!validation.success) {
    return err(validation.error);
  }

  const result = await insertRowResult<ProjectMember>("_bpm_project_members", {
    project_id: projectId,
    user_id: userId,
    is_owner: isOwner,
    created_by: addedBy,
  });

  // Log member addition event
  if (result.success) {
    await eventLogService
      .logEvent("project_member_added", "project", projectId, {
        metadata: { userId, isOwner, addedBy },
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidate(`project:${projectId}:members`);
  }

  return result;
}

/**
 * Remove a member from a project
 *
 * @param projectId - Project ID
 * @param userId - User ID to remove
 * @returns Result with success/error status
 */
export async function removeProjectMember(
  projectId: number,
  userId: string,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return err(
      ValidationError.create("Invalid project ID", "projectId", projectId),
    );
  }

  if (!userId || userId.trim() === "") {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  const result = await deleteRowsResult("_bpm_project_members", {
    project_id: `eq.${projectId}`,
    user_id: `eq.${userId}`,
  });

  if (!result.success) {
    return err(result.error);
  }

  // Log member removal event
  await eventLogService
    .logEvent("project_member_removed", "project", projectId, {
      userId,
    })
    .catch(console.error);

  // Invalidate cache
  requestCache.invalidate(`project:${projectId}:members`);

  return ok(undefined);
}

/**
 * Update a member's role (owner status)
 *
 * @param projectId - Project ID
 * @param userId - User ID to update
 * @param isOwner - New owner status
 * @returns Result with success/error status
 */
export async function updateMemberRole(
  projectId: number,
  userId: string,
  isOwner: boolean,
): Promise<Result<ProjectMember[], AppError>> {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return err(
      ValidationError.create("Invalid project ID", "projectId", projectId),
    );
  }

  if (!userId || userId.trim() === "") {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  // Validate input data
  const validation = validateSchema(UpdateProjectMemberInputSchema, {
    is_owner: isOwner,
  });
  if (!validation.success) {
    return err(validation.error);
  }

  const result = await updateRowsResult<ProjectMember>(
    "_bpm_project_members",
    {
      project_id: `eq.${projectId}`,
      user_id: `eq.${userId}`,
    },
    { is_owner: isOwner },
  );

  // Log role update event
  if (result.success) {
    await eventLogService
      .logEvent("project_member_role_updated", "project", projectId, {
        metadata: { userId, isOwner },
      })
      .catch(console.error);

    // Invalidate cache
    requestCache.invalidate(`project:${projectId}:members`);
  }

  return result;
}

/**
 * Check if a user is a member of a project
 *
 * @param projectId - Project ID
 * @param userId - User ID to check
 * @returns True if user is a member, false otherwise
 */
export async function isProjectMember(
  projectId: number,
  userId: string,
): Promise<boolean> {
  if (!Number.isInteger(projectId) || projectId <= 0 || !userId) {
    return false;
  }

  const result = await queryTableResult<ProjectMember>("_bpm_project_members", {
    filter: {
      project_id: `eq.${projectId}`,
      user_id: `eq.${userId}`,
    },
    limit: 1,
  });

  if (!result.success) {
    return false;
  }

  return result.value.data.length > 0;
}

/**
 * Check if a user is an owner of a project
 *
 * @param projectId - Project ID
 * @param userId - User ID to check
 * @returns True if user is an owner, false otherwise
 */
export async function isProjectOwner(
  projectId: number,
  userId: string,
): Promise<boolean> {
  if (!Number.isInteger(projectId) || projectId <= 0 || !userId) {
    return false;
  }

  const result = await queryTableResult<ProjectMember>("_bpm_project_members", {
    filter: {
      project_id: `eq.${projectId}`,
      user_id: `eq.${userId}`,
      is_owner: "eq.true",
    },
    limit: 1,
  });

  if (!result.success) {
    return false;
  }

  return result.value.data.length > 0;
}

/**
 * Get all projects a user is a member of
 *
 * @param userId - User ID
 * @returns Result containing array of project IDs, or error if query fails
 */
export async function getUserProjects(
  userId: string,
): Promise<Result<number[], AppError>> {
  if (!userId || userId.trim() === "") {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  const result = await queryTableResult<ProjectMember>("_bpm_project_members", {
    filter: { user_id: `eq.${userId}` },
    select: "project_id",
  });

  if (!result.success) {
    return err(result.error);
  }

  const projectIds = result.value.data.map((m) => m.project_id);
  return ok(projectIds);
}

/**
 * Check if a user can access a project (public OR member)
 *
 * @param projectId - Project ID
 * @param userId - User ID to check (optional for public check)
 * @returns True if user can access, false otherwise
 */
export async function canAccessProject(
  projectId: number,
  userId?: string,
): Promise<boolean> {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return false;
  }

  // Get project to check if it's private
  const projectResult = await getRowByIdResult<{ is_private?: boolean }>(
    "_bpm_projects",
    projectId,
  );

  if (!projectResult.success) {
    return false;
  }

  const project = projectResult.value;

  // If project is public, anyone can access
  if (!project.is_private) {
    return true;
  }

  // If project is private and no user provided, cannot access
  if (!userId) {
    return false;
  }

  // Check if user is a member
  return await isProjectMember(projectId, userId);
}

/**
 * Batch check access for multiple projects at once
 *
 * This is much more efficient than calling canAccessProject() N times,
 * as it fetches all project data and memberships in just 2 queries.
 *
 * @param projectIds - Array of project IDs to check
 * @param userId - User ID to check (optional for public check)
 * @returns Map of projectId -> canAccess (boolean)
 */
export async function batchCanAccessProjects(
  projectIds: (number | null | undefined)[],
  userId?: string,
): Promise<Map<number | null, boolean>> {
  const result = new Map<number | null, boolean>();

  const validProjectIds = [
    ...new Set(
      projectIds.filter(
        (id): id is number =>
          typeof id === "number" && Number.isInteger(id) && id > 0,
      ),
    ),
  ];

  for (const nullId of projectIds) {
    if (nullId === null || nullId === undefined) {
      result.set(null, true);
    }
  }

  if (validProjectIds.length === 0) {
    return result;
  }

  const [projectsResult, membersResult] = await Promise.all([
    queryTableResult<{ id: number; is_private?: boolean }>("_bpm_projects", {
      filter: { id: `in.(${validProjectIds.join(",")})` },
      select: "id,is_private",
    }),
    userId
      ? queryTableResult<ProjectMember>("_bpm_project_members", {
          filter: {
            project_id: `in.(${validProjectIds.join(",")})`,
            user_id: `eq.${userId}`,
          },
          select: "project_id",
        })
      : Promise.resolve({ success: true, value: { data: [] } } as any),
  ]);

  const projectPrivacyMap = new Map<number, boolean>();
  if (projectsResult.success) {
    for (const project of projectsResult.value.data) {
      projectPrivacyMap.set(project.id, project.is_private ?? false);
    }
  }

  const memberProjectIds = new Set<number>();
  if (membersResult.success) {
    for (const member of membersResult.value.data) {
      memberProjectIds.add(member.project_id);
    }
  }

  for (const projectId of validProjectIds) {
    const isPrivate = projectPrivacyMap.get(projectId) ?? true;
    if (!isPrivate) {
      result.set(projectId, true);
    } else if (userId && memberProjectIds.has(projectId)) {
      result.set(projectId, true);
    } else {
      result.set(projectId, false);
    }
  }

  return result;
}

/**
 * Get user's membership info for a specific project
 * Efficient single query that returns membership status
 *
 * @param projectId - Project ID
 * @param userId - User ID to check
 * @returns Result containing { isMember, isOwner } or error
 */
export async function getUserProjectMembership(
  projectId: number,
  userId: string,
): Promise<Result<{ isMember: boolean; isOwner: boolean }, AppError>> {
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return err(
      ValidationError.create("Invalid project ID", "projectId", projectId),
    );
  }

  if (!userId || userId.trim() === "") {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  const result = await queryTableResult<ProjectMember>("_bpm_project_members", {
    filter: {
      project_id: `eq.${projectId}`,
      user_id: `eq.${userId}`,
    },
    limit: 1,
  });

  if (!result.success) {
    return err(result.error);
  }

  const membership = result.value.data[0];
  return ok({
    isMember: !!membership,
    isOwner: membership?.is_owner || false,
  });
}

/**
 * Batch get membership info for multiple projects for a user
 * Efficient single query that returns membership for all specified projects
 *
 * @param projectIds - Array of project IDs to check
 * @param userId - User ID to check
 * @returns Map of projectId -> { isMember, isOwner }
 */
export async function batchGetUserProjectMemberships(
  projectIds: number[],
  userId: string,
): Promise<
  Result<Map<number, { isMember: boolean; isOwner: boolean }>, AppError>
> {
  const result = new Map<number, { isMember: boolean; isOwner: boolean }>();

  // Initialize all projects as non-member
  for (const id of projectIds) {
    result.set(id, { isMember: false, isOwner: false });
  }

  const validProjectIds = projectIds.filter(
    (id) => Number.isInteger(id) && id > 0,
  );

  if (validProjectIds.length === 0 || !userId) {
    return ok(result);
  }

  const queryResult = await queryTableResult<ProjectMember>(
    "_bpm_project_members",
    {
      filter: {
        project_id: `in.(${validProjectIds.join(",")})`,
        user_id: `eq.${userId}`,
      },
    },
  );

  if (!queryResult.success) {
    return err(queryResult.error);
  }

  // Update membership info for projects where user is a member
  for (const member of queryResult.value.data) {
    result.set(member.project_id, {
      isMember: true,
      isOwner: member.is_owner || false,
    });
  }

  return ok(result);
}

// Re-export types for convenience
export type {
  ProjectMember,
  ProjectMemberWithUser,
} from "$lib/schemas/projectMember";
