/**
 * Server-side load function for /projects
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side with membership info for faster initial page render
 */

import { requirePermission } from '$lib/server/requirePermission';
import type { PageServerLoad } from './$types';
import * as projectService from '$lib/services/projectService';
import { getUserMessage } from '$lib/types/errors';

export const load: PageServerLoad = async ({ locals, depends }) => {
  // Check permission: /projects with read action
  requirePermission(locals, '/projects', 'read');
  
  // Register dependencies for cache invalidation
  depends('projects');
  
  // Helper function to serialize errors for SSR
  const serializeError = (error: any) => {
    if (!error) return null;
    if (error.toJSON && typeof error.toJSON === 'function') {
      return error.toJSON();
    }
    // Fallback for non-AppError errors
    return {
      name: error.name || 'Error',
      message: error.message || String(error),
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || {}
    };
  };

  // Load projects with membership info server-side (single query, no N+1)
  // Note: requirePermission already ensures locals.user exists
  const userId = locals.user?.id || '';
  const isSysadmin = (locals.user as any)?.is_sysadmin === true;
  
  const projectsResult = await projectService.getProjectsWithMembership(
    userId,
    isSysadmin
  );
  
  // Generate version from latest updated_at timestamp
  let version = '';
  if (projectsResult.success && projectsResult.value.length > 0) {
    const latestUpdate = projectsResult.value.reduce((max, p) => {
      const timestamp = new Date(p.updated_at || 0).getTime();
      return timestamp > max ? timestamp : max;
    }, 0);
    version = `W/"${latestUpdate}-${projectsResult.value.length}"`;
  }
  
  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately)
    projects: projectsResult.success ? projectsResult.value : [],
    
    // Version for realtime updates
    _version: version,
    
    // Errors for graceful handling (serialized)
    errors: {
      projects: serializeError(projectsResult.success ? null : projectsResult.error)
    },
    
    // Metadata
    timestamp: Date.now()
  };
};
