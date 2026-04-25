/**
 * Project Authorization Service - Helper functions for project access control
 *
 * Provides authorization helpers that throw errors when access is denied.
 * Use these in API routes and server-side code to enforce project permissions.
 */
import { error } from "@sveltejs/kit";
import * as projectMemberService from "./projectMemberService";
import { getRowByIdResult } from "$lib/utils/postgrest";
import type { Project } from "$lib/schemas/project";

export { batchCanAccessProjects } from "./projectMemberService";

/**
 * Require that a user is an owner of a project
 * Throws 403 error if user is not an owner
 *
 * @param projectId - Project ID
 * @param userId - User ID to check
 * @throws 403 if user is not an owner
 */
export async function requireProjectOwner(
  projectId: number,
  userId: string,
): Promise<void> {
  const isOwner = await projectMemberService.isProjectOwner(projectId, userId);

  if (!isOwner) {
    throw error(
      403,
      `Forbidden - You must be a project owner to perform this action (project: ${projectId}, user: ${userId})`,
    );
  }
}

/**
 * Require that a user is a member of a project
 * Throws 403 error if user is not a member
 *
 * @param projectId - Project ID
 * @param userId - User ID to check
 * @throws 403 if user is not a member
 */
export async function requireProjectMember(
  projectId: number,
  userId: string,
): Promise<void> {
  const isMember = await projectMemberService.isProjectMember(
    projectId,
    userId,
  );

  if (!isMember) {
    throw error(
      403,
      `Forbidden - You must be a project member to access this resource (project: ${projectId}, user: ${userId})`,
    );
  }
}

/**
 * Require that a user can access a project (public OR member)
 * Throws 403 error if user cannot access
 *
 * @param projectId - Project ID
 * @param userId - User ID to check (optional for public projects)
 * @throws 404 if project not found
 * @throws 403 if user cannot access private project
 */
export async function requireProjectAccess(
  projectId: number,
  userId?: string,
): Promise<void> {
  // First check if project exists
  const projectResult = await getRowByIdResult<Project>(
    "_bpm_projects",
    projectId,
  );

  if (!projectResult.success) {
    throw error(404, `Project not found (id: ${projectId})`);
  }

  const project = projectResult.value;

  // If project is public, anyone can access
  if (!project.is_private) {
    return;
  }

  // If project is private and no user provided, deny access
  if (!userId) {
    throw error(
      403,
      `Forbidden - This is a private project (id: ${projectId})`,
    );
  }

  // Check if user is a member
  const isMember = await projectMemberService.isProjectMember(
    projectId,
    userId,
  );

  if (!isMember) {
    throw error(
      403,
      `Forbidden - You must be a project member to access this private project (project: ${projectId}, user: ${userId})`,
    );
  }
}

/**
 * Check if user can interact with a project's tasks/cases
 * Returns true if project is public OR user is a member
 * Does not throw - use for UI logic
 *
 * @param projectId - Project ID (nullable)
 * @param userId - User ID to check
 * @returns True if user can interact, false otherwise
 */
export async function canInteractWithProject(
  projectId: number | null,
  userId?: string,
): Promise<boolean> {
  // If no project linked, user can interact
  if (!projectId) {
    return true;
  }

  // Check access
  return await projectMemberService.canAccessProject(projectId, userId);
}
