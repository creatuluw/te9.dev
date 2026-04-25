/**
 * Project service - CRUD operations for projects
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
import * as projectMemberService from "./projectMemberService";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NotFoundError,
  AppError as AppErrorClass,
  ErrorCode,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import { getUserMessage } from "$lib/types/errors";
import {
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
  type Project,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "$lib/schemas/project";

/**
 * Get all projects (excludes archived)
 *
 * @returns Result containing array of active projects, or error if query fails
 */
export async function getAllProjects(): Promise<Result<Project[], AppError>> {
  return (await requestCache.get("projects:all", async (conditionalHeaders) => {
    try {
      const result = await queryTableResult<Project>("_bpm_projects", {
        filter: { status: "neq.archived" },
        order: "created_at.desc",
        conditionalHeaders,
      });

      if (!result.success) {
        return {
          data: err(result.error) as any,
          metadata: { status: 0, headers: new Headers() },
        };
      }

      if (result.value.status === 304) {
        return {
          data: null,
          metadata: { status: 304, headers: result.value.headers },
          isNotModified: true,
        };
      }

      return {
        data: ok(result.value.data) as any,
        metadata: {
          status: result.value.status,
          headers: result.value.headers,
        },
      };
    } catch (error) {
      // Catch any unexpected errors and wrap them
      const appError =
        error instanceof AppErrorClass
          ? error
          : AppErrorClass.from(
              error instanceof Error ? error : new Error(String(error)),
            );
      return {
        data: err(appError) as any,
        metadata: { status: 0, headers: new Headers() },
      };
    }
  })) as Promise<Result<Project[], AppError>>;
}

/**
 * Get all projects including archived ones
 *
 * @returns Result containing array of all projects (including archived), or error if query fails
 */
export async function getAllProjectsIncludingArchived(): Promise<
  Result<Project[], AppError>
> {
  const result = await queryTableResult<Project>("_bpm_projects", {
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.data);
}

/**
 * Get project by ID
 *
 * @param id - Project ID
 * @returns Result containing project data, or error if not found
 */
export async function getProjectById(
  id: number,
): Promise<Result<Project, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid project ID", "id", id));
  }

  return await requestCache.get<Result<Project, AppError>>(
    `project:${id}`,
    async () => {
      const result = await getRowByIdResult<Project>("_bpm_projects", id);
      if (!result.success) {
        return err(result.error);
      }

      return ok(result.value);
    },
    { ttl: 60000 },
  ); // 60 seconds TTL for single entities
}

/**
 * Create a new project
 *
 * @param data - Project creation data
 * @param createdBy - User ID of the project creator (becomes owner)
 * @returns Result containing created project, or error if creation fails
 */
export async function createProject(
  data: CreateProjectInput,
  createdBy?: string,
): Promise<Result<Project, AppError>> {
  // Validate input
  const validation = validateSchema(CreateProjectInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const insertData = {
    ...data,
    created_by: createdBy,
    updated_at: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.log("[ProjectService] Creating project with data:", insertData);
    console.log("[ProjectService] createdBy value:", createdBy);
  }

  const result = await insertRowResult<Project>("_bpm_projects", insertData);

  // Log project creation event and add creator as owner
  if (result.success) {
    await eventLogService
      .logEvent("project_created", "project", result.value.id, {
        newValues: result.value,
      })
      .catch(console.error);

    // Add creator as project owner if createdBy is provided
    if (createdBy) {
      if (import.meta.env.DEV) {
        console.log("[ProjectService] Adding creator as owner:", {
          projectId: result.value.id,
          userId: createdBy,
          isOwner: true,
        });
      }

      const memberResult = await projectMemberService.addProjectMember(
        result.value.id,
        createdBy,
        true, // is_owner = true
        createdBy,
      );

      // If adding the creator as owner fails, this is a critical error
      if (!memberResult.success) {
        console.error(
          "[ProjectService] Failed to add creator as owner:",
          memberResult.error,
        );
        console.error(
          "[ProjectService] Error details:",
          getUserMessage(memberResult.error),
        );
        // Still return success for the project creation, but log the issue
        // The user can be added as owner manually if needed
      } else {
        if (import.meta.env.DEV) {
          console.log("[ProjectService] Successfully added creator as owner");
        }
      }
    } else {
      console.warn(
        "[ProjectService] No createdBy provided - creator will NOT be added as owner!",
      );
    }

    // Invalidate cache (both singular and plural forms)
    requestCache.invalidateEntity("project");
    requestCache.invalidate("projects:all");
  }

  return result;
}

/**
 * Update a project
 *
 * @param id - Project ID to update
 * @param data - Partial project data to update
 * @returns Result containing updated project array, or error if update fails
 */
export async function updateProject(
  id: number,
  data: UpdateProjectInput,
): Promise<Result<Project[], AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid project ID", "id", id));
  }

  // Validate input data
  const validation = validateSchema(UpdateProjectInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Get current project for logging
  const currentProjectResult = await getRowByIdResult<Project>(
    "_bpm_projects",
    id,
  );
  if (!currentProjectResult.success) {
    return err(currentProjectResult.error);
  }
  const currentProject = currentProjectResult.value;

  const result = await updateRowsResult<Project>(
    "_bpm_projects",
    { id: `eq.${id}` },
    {
      ...data,
      updated_at: new Date().toISOString(),
    },
  );

  // Log project update event
  if (result.success) {
    await eventLogService
      .logEvent("project_updated", "project", id, {
        oldValues: currentProject,
        newValues: data,
      })
      .catch(console.error);

    // Invalidate cache (both singular and plural forms)
    requestCache.invalidateEntity("project", id);
    requestCache.invalidate("projects:all");
  }

  return result;
}

/**
 * Archive a project (soft delete - sets status to 'archived')
 *
 * @param id - Project ID to archive
 * @returns Result with success/error status
 */
export async function archiveProject(
  id: number,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid project ID", "id", id));
  }

  const result = await updateRowsResult(
    "_bpm_projects",
    { id: `eq.${id}` },
    {
      status: "archived",
      updated_at: new Date().toISOString(),
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // Invalidate cache (both singular and plural forms)
  requestCache.invalidateEntity("project", id);
  requestCache.invalidate("projects:all");

  return ok(undefined);
}

/**
 * Delete a project (hard delete - use with caution)
 *
 * @param id - Project ID to delete
 * @returns Result with success/error status
 */
export async function deleteProject(
  id: number,
): Promise<Result<void, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid project ID", "id", id));
  }

  // Get project data before deletion for logging
  const projectResult = await getRowByIdResult<Project>("_bpm_projects", id);
  const projectData = projectResult.success ? projectResult.value : null;

  const result = await deleteRowsResult("_bpm_projects", { id: `eq.${id}` });

  // Log project deletion event if successful
  if (result.success && projectData) {
    await eventLogService
      .logEvent("project_deleted", "project", id, {
        oldValues: projectData,
      })
      .catch(console.error);

    // Invalidate cache (both singular and plural forms)
    requestCache.invalidateEntity("project", id);
    requestCache.invalidate("projects:all");
  }

  return result;
}

/**
 * Get projects accessible to a user (public projects + projects user is member of)
 *
 * @param userId - User ID
 * @returns Result containing array of accessible projects, or error if query fails
 */
export async function getProjectsForUser(
  userId: string,
  isSysadmin: boolean = false,
): Promise<Result<Project[], AppError>> {
  console.log(
    "[projectService.getProjectsForUser] userId:",
    userId,
    "isSysadmin:",
    isSysadmin,
  );

  if (!userId || userId.trim() === "") {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  // Sysadmins can see all projects
  if (isSysadmin) {
    console.log(
      "[projectService.getProjectsForUser] User is admin - fetching all projects",
    );
    const result = await queryTableResult<Project>("_bpm_projects", {
      filter: { status: "neq.archived" },
      order: "created_at.desc",
    });

    if (!result.success) {
      console.log(
        "[projectService.getProjectsForUser] Error fetching all projects:",
        result.error,
      );
      return err(result.error);
    }

    console.log(
      "[projectService.getProjectsForUser] Admin sees",
      result.value.data.length,
      "projects",
    );
    return ok(result.value.data);
  }

  // Get user's project memberships
  console.log(
    "[projectService.getProjectsForUser] Fetching user memberships...",
  );
  const memberProjectsResult =
    await projectMemberService.getUserProjects(userId);
  if (!memberProjectsResult.success) {
    console.log(
      "[projectService.getProjectsForUser] Error fetching memberships:",
      memberProjectsResult.error,
    );
    return err(memberProjectsResult.error);
  }

  const memberProjectIds = memberProjectsResult.value;
  console.log(
    "[projectService.getProjectsForUser] User is member of project IDs:",
    memberProjectIds,
  );

  // Query for public projects OR projects user is member of
  let filter: any = { status: "neq.archived" };

  if (memberProjectIds.length > 0) {
    // User can see public projects OR projects they're member of
    filter = {
      status: "neq.archived",
      or: `(is_private.eq.false,id.in.(${memberProjectIds.join(",")}))`,
    };
    console.log(
      "[projectService.getProjectsForUser] Filter (with memberships):",
      filter,
    );
  } else {
    // User can only see public projects
    filter = {
      status: "neq.archived",
      is_private: "eq.false",
    };
    console.log(
      "[projectService.getProjectsForUser] Filter (public only):",
      filter,
    );
  }

  const result = await queryTableResult<Project>("_bpm_projects", {
    filter,
    order: "created_at.desc",
  });

  if (!result.success) {
    console.log(
      "[projectService.getProjectsForUser] Error querying projects:",
      result.error,
    );
    return err(result.error);
  }

  console.log(
    "[projectService.getProjectsForUser] Found",
    result.value.data.length,
    "projects",
  );
  return ok(result.value.data);
}

/**
 * Get project by ID with membership information for a user
 *
 * @param projectId - Project ID
 * @param userId - User ID to check membership for
 * @returns Result containing project with membership info, or error if not found
 */
export async function getProjectWithMembership(
  projectId: number,
  userId: string,
): Promise<
  Result<Project & { isMember: boolean; isOwner: boolean }, AppError>
> {
  const projectResult = await getProjectById(projectId);
  if (!projectResult.success) {
    return err(projectResult.error);
  }

  const project = projectResult.value;
  const isMember = await projectMemberService.isProjectMember(
    projectId,
    userId,
  );
  const isOwner = await projectMemberService.isProjectOwner(projectId, userId);

  return ok({
    ...project,
    isMember,
    isOwner,
  });
}

/**
 * Project with membership info
 */
export type ProjectWithMembership = Project & {
  isMember: boolean;
  isOwner: boolean;
};

/**
 * Get all accessible projects with membership info for a user
 * Single efficient query that avoids N+1 membership lookups
 *
 * @param userId - User ID
 * @param isSysadmin - Whether user is sysadmin (sees all projects)
 * @returns Result containing array of projects with membership info, or error
 */
export async function getProjectsWithMembership(
  userId: string,
  isSysadmin: boolean = false,
): Promise<Result<ProjectWithMembership[], AppError>> {
  if (!userId || userId.trim() === "") {
    return err(ValidationError.create("Invalid user ID", "userId", userId));
  }

  // Step 1: Get all accessible projects
  const projectsResult = await getProjectsForUser(userId, isSysadmin);
  if (!projectsResult.success) {
    return err(projectsResult.error);
  }

  const projects = projectsResult.value;

  if (projects.length === 0) {
    return ok([]);
  }

  // Step 2: Get membership info for all projects in a single batch query
  const projectIds = projects.map((p) => p.id);
  const membershipsResult =
    await projectMemberService.batchGetUserProjectMemberships(
      projectIds,
      userId,
    );

  if (!membershipsResult.success) {
    // If membership lookup fails, return projects without membership info
    console.warn(
      "[projectService.getProjectsWithMembership] Failed to get memberships:",
      membershipsResult.error,
    );
    return ok(projects.map((p) => ({ ...p, isMember: false, isOwner: false })));
  }

  const memberships = membershipsResult.value;

  // Step 3: Combine projects with membership info
  const projectsWithMembership: ProjectWithMembership[] = projects.map(
    (project) => {
      const membership = memberships.get(project.id) || {
        isMember: false,
        isOwner: false,
      };
      return {
        ...project,
        isMember: membership.isMember,
        isOwner: membership.isOwner,
      };
    },
  );

  return ok(projectsWithMembership);
}

/**
 * Archive a project with version checking (optimistic locking)
 *
 * @param id - Project ID to archive
 * @param expectedVersion - Expected version (updated_at timestamp)
 * @returns Result containing updated project and new version, or conflict error
 */
export async function archiveProjectWithVersion(
  id: number,
  expectedVersion: string,
): Promise<Result<{ project: Project; newVersion: string }, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid project ID", "id", id));
  }

  // Get current project to check version
  const currentResult = await getRowByIdResult<Project>("_bpm_projects", id);
  if (!currentResult.success) {
    return err(currentResult.error);
  }

  const currentProject = currentResult.value;
  const currentVersion = currentProject.updated_at || "";

  // Check for version conflict
  if (currentVersion !== expectedVersion) {
    return err(
      new AppErrorClass(
        "Project is gewijzigd door een andere gebruiker",
        ErrorCode.VERSION_CONFLICT,
        { currentVersion, expectedVersion },
      ),
    );
  }

  // Perform update
  const result = await updateRowsResult<Project>(
    "_bpm_projects",
    { id: `eq.${id}` },
    {
      status: "archived",
      updated_at: new Date().toISOString(),
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // Invalidate cache
  requestCache.invalidateEntity("project", id);
  requestCache.invalidate("projects:all");

  const updatedProject = result.value[0];
  return ok({
    project: updatedProject,
    newVersion: updatedProject.updated_at || "",
  });
}

/**
 * Update a project with version checking (optimistic locking)
 *
 * @param id - Project ID to update
 * @param data - Partial project data to update
 * @param expectedVersion - Expected version (updated_at timestamp)
 * @returns Result containing updated project and new version, or conflict error
 */
export async function updateProjectWithVersion(
  id: number,
  data: UpdateProjectInput,
  expectedVersion: string,
): Promise<Result<{ project: Project; newVersion: string }, AppError>> {
  if (!Number.isInteger(id) || id <= 0) {
    return err(ValidationError.create("Invalid project ID", "id", id));
  }

  // Validate input data
  const validation = validateSchema(UpdateProjectInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  // Get current project to check version
  const currentResult = await getRowByIdResult<Project>("_bpm_projects", id);
  if (!currentResult.success) {
    return err(currentResult.error);
  }

  const currentProject = currentResult.value;
  const currentVersion = currentProject.updated_at || "";

  // Check for version conflict
  if (currentVersion !== expectedVersion) {
    return err(
      new AppErrorClass(
        "Project is gewijzigd door een andere gebruiker",
        ErrorCode.VERSION_CONFLICT,
        { currentVersion, expectedVersion },
      ),
    );
  }

  // Perform update
  const result = await updateRowsResult<Project>(
    "_bpm_projects",
    { id: `eq.${id}` },
    {
      ...data,
      updated_at: new Date().toISOString(),
    },
  );

  if (!result.success) {
    return err(result.error);
  }

  // Log update event
  await eventLogService
    .logEvent("project_updated", "project", id, {
      oldValues: currentProject,
      newValues: data,
    })
    .catch(console.error);

  // Invalidate cache
  requestCache.invalidateEntity("project", id);
  requestCache.invalidate("projects:all");

  const updatedProject = result.value[0];
  return ok({
    project: updatedProject,
    newVersion: updatedProject.updated_at || "",
  });
}

// Re-export types for backward compatibility
export type { Project } from "$lib/schemas/project";
