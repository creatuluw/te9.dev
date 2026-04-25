/**
 * Project Members API - List and add members
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as projectMemberService from '$lib/services/projectMemberService';
import * as projectAuthService from '$lib/services/projectAuthService';
import { getUserMessage } from '$lib/types/errors';

/**
 * GET /api/projects/[id]/members - Get all members of a project
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // Check if user can access this project
  try {
    await projectAuthService.requireProjectAccess(projectId, locals.user.id);
  } catch (err: any) {
    return json({ error: err.body?.message || 'Access denied' }, { status: err.status || 403 });
  }

  const result = await projectMemberService.getProjectMembers(projectId);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 500 }
    );
  }

  return json(result.value);
};

/**
 * POST /api/projects/[id]/members - Add a member to project (owners only)
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // Only project owners can add members
  try {
    await projectAuthService.requireProjectOwner(projectId, locals.user.id);
  } catch (err: any) {
    return json({ error: err.body?.message || 'Access denied' }, { status: err.status || 403 });
  }

  const { user_id, is_owner = false } = await request.json();

  if (!user_id) {
    return json({ error: 'User ID is required' }, { status: 400 });
  }

  const result = await projectMemberService.addProjectMember(
    projectId,
    user_id,
    is_owner,
    locals.user.id
  );

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 400 }
    );
  }

  return json(result.value, { status: 201 });
};

