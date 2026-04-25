/**
 * Projects API - Get, update, delete specific project
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as projectService from '$lib/services/projectService';
import * as projectAuthService from '$lib/services/projectAuthService';
import { getUserMessage } from '$lib/types/errors';

/**
 * GET /api/projects/[id] - Get project by ID with membership info
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

  const result = await projectService.getProjectWithMembership(projectId, locals.user.id);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 404 }
    );
  }

  return json(result.value);
};

/**
 * PUT /api/projects/[id] - Update project (owners or sysadmins only)
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // Only project owners or sysadmins can update
  const isSysadmin = (locals.user as any).is_sysadmin === true;
  
  if (!isSysadmin) {
    try {
      await projectAuthService.requireProjectOwner(projectId, locals.user.id);
    } catch (err: any) {
      return json({ error: err.body?.message || 'Only project owners can update this project' }, { status: err.status || 403 });
    }
  }

  const data = await request.json();
  const result = await projectService.updateProject(projectId, data);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 400 }
    );
  }

  return json(result.value);
};

/**
 * DELETE /api/projects/[id] - Delete project (owners or sysadmins only)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // Only project owners or sysadmins can delete
  const isSysadmin = (locals.user as any).is_sysadmin === true;
  
  if (!isSysadmin) {
    try {
      await projectAuthService.requireProjectOwner(projectId, locals.user.id);
    } catch (err: any) {
      return json({ error: err.body?.message || 'Only project owners can delete this project' }, { status: err.status || 403 });
    }
  }

  const result = await projectService.deleteProject(projectId);

  if (!result.success) {
    return json(
      { error: getUserMessage(result.error) },
      { status: 400 }
    );
  }

  return json({ success: true });
};

/**
 * PATCH /api/projects/[id] - Archive project (owners or sysadmins only)
 * Supports version checking via If-Match header for optimistic locking
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const projectId = parseInt(params.id);
  if (isNaN(projectId)) {
    return json({ error: 'Invalid project ID' }, { status: 400 });
  }

  const body = await request.json();
  const { action, ...updateData } = body;
  const ifMatch = request.headers.get('If-Match');

  // Only project owners or sysadmins can archive/update
  const isSysadmin = (locals.user as any).is_sysadmin === true;
  
  if (!isSysadmin) {
    try {
      await projectAuthService.requireProjectOwner(projectId, locals.user.id);
    } catch (err: any) {
      return json({ error: err.body?.message || 'Only project owners can modify this project' }, { status: err.status || 403 });
    }
  }

  if (action === 'archive') {
    // Use versioned archive if If-Match header is provided
    if (ifMatch) {
      const result = await projectService.archiveProjectWithVersion(projectId, ifMatch);

      if (!result.success) {
        // Check for version conflict
        if (result.error.code === 'VERSION_CONFLICT') {
          return json({
            error: 'Dit project is gewijzigd door een andere gebruiker. Vernieuw de pagina.',
            code: 'VERSION_CONFLICT'
          }, { status: 412 }); // 412 Precondition Failed
        }
        return json(
          { error: getUserMessage(result.error) },
          { status: 400 }
        );
      }

      return json({
        success: true,
        data: result.value.project,
        _version: result.value.newVersion
      }, {
        headers: {
          'ETag': result.value.newVersion
        }
      });
    } else {
      // Fallback to non-versioned archive for backward compatibility
      const result = await projectService.archiveProject(projectId);

      if (!result.success) {
        return json(
          { error: getUserMessage(result.error) },
          { status: 400 }
        );
      }

      return json({ success: true });
    }
  }

  // Handle general updates with version checking
  if (Object.keys(updateData).length > 0) {
    if (ifMatch) {
      const result = await projectService.updateProjectWithVersion(projectId, updateData, ifMatch);

      if (!result.success) {
        if (result.error.code === 'VERSION_CONFLICT') {
          return json({
            error: 'Dit project is gewijzigd door een andere gebruiker. Vernieuw de pagina.',
            code: 'VERSION_CONFLICT'
          }, { status: 412 });
        }
        return json(
          { error: getUserMessage(result.error) },
          { status: 400 }
        );
      }

      return json({
        success: true,
        data: result.value.project,
        _version: result.value.newVersion
      }, {
        headers: {
          'ETag': result.value.newVersion
        }
      });
    } else {
      // Fallback to non-versioned update
      const result = await projectService.updateProject(projectId, updateData);

      if (!result.success) {
        return json(
          { error: getUserMessage(result.error) },
          { status: 400 }
        );
      }

      return json(result.value);
    }
  }

  return json({ error: 'Invalid action' }, { status: 400 });
};

