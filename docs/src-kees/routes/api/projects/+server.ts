/**
 * Projects API - List and create projects
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as projectService from '$lib/services/projectService';
import { getUserMessage } from '$lib/types/errors';

/**
 * GET /api/projects - Get all projects accessible to user
 */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[API /api/projects] User:', locals.user.id);
  console.log('[API /api/projects] Roles:', locals.user.roles);
  console.log('[API /api/projects] is_sysadmin:', locals.user.is_sysadmin);

  // Check if user is sysadmin OR has Admin role
  const isAdmin = locals.user.is_sysadmin || locals.user.roles.includes('Admin');
  
  console.log('[API /api/projects] Treating as admin:', isAdmin);
  
  const result = await projectService.getProjectsForUser(locals.user.id, isAdmin);

  console.log('[API /api/projects] Result success:', result.success);
  if (result.success) {
    console.log('[API /api/projects] Projects count:', result.value.length);
    console.log('[API /api/projects] Projects:', result.value);
  } else {
    console.log('[API /api/projects] Error:', result.error);
  }

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 500 }
    );
  }

  return json(result.value);
};

/**
 * POST /api/projects - Create a new project
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  
  console.log('[API] Creating project - User ID:', locals.user.id);
  console.log('[API] User object:', locals.user);
  
  // Create project with current user as creator
  const result = await projectService.createProject(data, locals.user.id);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 400 }
    );
  }

  console.log('[API] Project created successfully:', result.value);
  console.log('[API] created_by in result:', result.value.created_by);

  return json(result.value, { status: 201 });
};

