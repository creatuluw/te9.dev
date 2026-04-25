/**
 * Server-side load function for /cases
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side for faster initial page render
 */

import { requirePermission } from '$lib/server/requirePermission';
import type { PageServerLoad } from './$types';
import * as caseService from '$lib/services/caseService';
import * as processService from '$lib/services/processService';
import * as userManagementService from '$lib/services/userManagementService';
import * as projectService from '$lib/services/projectService';

export const load: PageServerLoad = async ({ locals, url, depends }) => {
  // Check permission: /cases with read action
  requirePermission(locals, '/cases', 'read');
  
  // Register dependencies for cache invalidation
  depends('cases', 'processes', 'users', 'projects');
  
  // Get current user info for authorization
  const userId = locals.user?.id;
  const isAdmin = locals.user?.is_sysadmin === true;
  
  // Parse filters from URL (for SSR filtering)
  const searchParams = url.searchParams;
  const filters = {
    status: searchParams.get('status') || undefined,
    process_id: searchParams.get('process') 
      ? parseInt(searchParams.get('process')!) 
      : undefined,
    owner_id: searchParams.get('owner') || undefined
  };
  
  // Load critical data in parallel (server-side)
  // This runs BEFORE HTML is sent to client
  // Add error handling to prevent hangs if any API call fails
  const [casesResult, processesResult, usersResult, allProcessesResult, projectsResult] = await Promise.all([
    caseService.getAllCases(filters).catch(err => {
      console.error('[cases/+page.server] Error loading cases:', err);
      return { success: false, error: err } as any;
    }),
    processService.getAllProcesses().catch(err => {
      console.error('[cases/+page.server] Error loading processes:', err);
      return { success: false, error: err } as any;
    }),
    userManagementService.getAllUsers({ isActive: true, limit: 1000 }).catch(err => {
      console.error('[cases/+page.server] Error loading users:', err);
      return { success: false, error: err } as any;
    }),
    processService.getAllProcessesIncludingArchived().catch(err => {
      console.error('[cases/+page.server] Error loading all processes:', err);
      return { success: false, error: err } as any;
    }),
    projectService.getProjectsForUser(userId || '', isAdmin).catch(err => {
      console.error('[cases/+page.server] Error loading projects:', err);
      return { success: false, error: err } as any;
    })
  ]);
  
  // Helper function to serialize errors for SSR
  const serializeError = (error: any): any => {
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

  // Transform users to PocketBase format for component compatibility
  const users = usersResult.success ? usersResult.value.map((user: any) => ({
    id: user.id,
    email: user.email,
    username: user.username || '',
    name: user.name || '',
    avatar: user.avatar || '',
    verified: user.email_verified || false,
    emailVisibility: true,
    created: user.created_at,
    updated: user.updated_at
  })) : [];
  
  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately)
    cases: casesResult.success ? casesResult.value : [],
    processes: processesResult.success ? processesResult.value : [],
    users: users,
    allProcesses: allProcessesResult.success ? allProcessesResult.value : [],
    projects: projectsResult.success ? projectsResult.value : [],
    userId: userId || '',
    isAdmin: isAdmin,
    
    // Filter state from URL
    filters: {
      search: searchParams.get('search') || '',
      scope: searchParams.get('scope') || 'alle',
      processes: searchParams.get('process')?.split(',').map(p => parseInt(p)).filter(id => !isNaN(id)) || [],
      projects: searchParams.get('project')?.split(',').map(p => parseInt(p)).filter(id => !isNaN(id)) || [],
      statuses: searchParams.get('status')?.split(',') || [],
      owners: searchParams.get('owner')?.split(',') || []
    },
    
    // Errors for graceful handling (serialized)
    errors: {
      cases: serializeError(casesResult.success ? null : casesResult.error),
      processes: serializeError(processesResult.success ? null : processesResult.error),
      users: serializeError(usersResult.success ? null : usersResult.error),
      allProcesses: serializeError(allProcessesResult.success ? null : allProcessesResult.error),
      projects: serializeError(projectsResult.success ? null : projectsResult.error)
    },
    
    // Metadata
    timestamp: Date.now()
  };
};
