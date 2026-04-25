/**
 * Server-side load function for /projects/[id]
 * Enforces permission check on every page load (including client-side navigation)
 * Also checks project-specific access for private projects
 * Loads data server-side with eager loading for faster initial render
 */

import { requirePermission } from '$lib/server/requirePermission';
import { requireProjectAccess } from '$lib/services/projectAuthService';
import type { PageServerLoad } from './$types';
import * as projectService from '$lib/services/projectService';
import * as projectMemberService from '$lib/services/projectMemberService';
import * as taskService from '$lib/services/taskService';
import * as dashboardService from '$lib/services/dashboardService';
import { generateCombinedEtag } from '$lib/utils/etag';
import { getUserMessage } from '$lib/types/errors';

export const load: PageServerLoad = async ({ locals, params, depends }) => {
  // Check route permission: /projects/[id] with read action
  requirePermission(locals, '/projects/[id]', 'read');

  const projectId = parseInt(params.id);
  
  // Check project-specific access (public OR member)
  if (!isNaN(projectId) && locals.user) {
    await requireProjectAccess(projectId, locals.user.id);
  }

  // Register dependencies for cache invalidation
  depends(`project:${projectId}`);

  // Helper function to serialize errors for SSR
  const serializeError = (error: any) => {
    if (!error) return null;
    if (error.toJSON && typeof error.toJSON === 'function') {
      return error.toJSON();
    }
    return {
      name: error.name || 'Error',
      message: error.message || String(error),
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {}
    };
  };

  // Eager loading: fetch all data in parallel for instant tab access
  const [projectResult, statsResult, membershipResult, tasksResult] = await Promise.all([
    projectService.getProjectById(projectId),
    dashboardService.getProjectTaskStats(projectId),
    projectMemberService.getUserProjectMembership(projectId, locals.user?.id || ''),
    taskService.getAllUnifiedWorkItems(undefined, undefined, locals.user?.id, { project_id: projectId })
  ]);

  // Generate combined version from all data timestamps
  const timestamps: string[] = [];
  if (projectResult.success && projectResult.value.updated_at) {
    timestamps.push(projectResult.value.updated_at);
  }
  if (tasksResult.success && tasksResult.value.length > 0) {
    const latestTaskUpdate = Math.max(...tasksResult.value.map(t => new Date(t.updated_at || 0).getTime()));
    if (latestTaskUpdate > 0) timestamps.push(latestTaskUpdate.toString());
  }
  
  const version = generateCombinedEtag(timestamps.map(t => `W/"${t}"`));

  return {
    // User data for client-side access
    user: locals.user ? {
      id: locals.user.id,
      is_sysadmin: (locals.user as any).is_sysadmin === true
    } : null,
    
    // Critical data (rendered immediately)
    project: projectResult.success ? projectResult.value : null,
    taskStats: statsResult.success ? statsResult.value : null,
    membership: membershipResult.success ? membershipResult.value : { isMember: false, isOwner: false },
    tasks: tasksResult.success ? tasksResult.value : [],
    
    // Version for realtime updates
    _version: version,
    
    // Errors for graceful handling
    errors: {
      project: serializeError(projectResult.success ? null : projectResult.error),
      tasks: serializeError(tasksResult.success ? null : tasksResult.error)
    },
    
    // Metadata
    projectId,
    timestamp: Date.now()
  };
};
