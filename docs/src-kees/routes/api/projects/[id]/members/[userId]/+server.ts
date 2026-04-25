/**
 * Project Member API - Update or remove a specific member
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as projectMemberService from '$lib/services/projectMemberService';
import * as projectAuthService from '$lib/services/projectAuthService';
import { getUserMessage } from '$lib/types/errors';

/**
 * PUT /api/projects/[id]/members/[userId] - Update member role (owners only)
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const userId = params.userId;
  if (!userId) {
    return json({ error: 'User ID is required' }, { status: 400 });
  }

  // Only project owners can change roles
  try {
    await projectAuthService.requireProjectOwner(projectId, locals.user.id);
  } catch (err: any) {
    return json({ error: err.body?.message || 'Access denied' }, { status: err.status || 403 });
  }

  const { is_owner } = await request.json();

  if (typeof is_owner !== 'boolean') {
    return json({ error: 'is_owner must be a boolean' }, { status: 400 });
  }

  const result = await projectMemberService.updateMemberRole(projectId, userId, is_owner);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 400 }
    );
  }

  return json(result.value);
};

/**
 * DELETE /api/projects/[id]/members/[userId] - Remove member from project (owners only)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const userId = params.userId;
  if (!userId) {
    return json({ error: 'User ID is required' }, { status: 400 });
  }

  // Only project owners can remove members
  try {
    await projectAuthService.requireProjectOwner(projectId, locals.user.id);
  } catch (err: any) {
    return json({ error: err.body?.message || 'Access denied' }, { status: err.status || 403 });
  }

  const result = await projectMemberService.removeProjectMember(projectId, userId);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 400 }
    );
  }

  return json({ success: true });
};

