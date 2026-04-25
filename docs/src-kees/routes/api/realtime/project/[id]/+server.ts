/**
 * Realtime Project API - Get single project with all data and ETag caching
 * Supports conditional requests for efficient polling
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as projectService from '$lib/services/projectService';
import * as projectMemberService from '$lib/services/projectMemberService';
import * as taskService from '$lib/services/taskService';
import * as projectAuthService from '$lib/services/projectAuthService';
import * as dashboardService from '$lib/services/dashboardService';
import { generateCombinedEtag } from '$lib/utils/etag';

/**
 * GET /api/realtime/project/[id] - Get project with all data
 * Supports If-None-Match header for 304 responses
 */
export const GET: RequestHandler = async ({ params, request, locals }) => {
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

  const ifNoneMatch = request.headers.get('If-None-Match');

  // Fetch all project data in parallel (eager loading)
  const [projectResult, statsResult, membershipResult, tasksResult] = await Promise.all([
    projectService.getProjectById(projectId),
    dashboardService.getProjectTaskStats(projectId),
    projectMemberService.getUserProjectMembership(projectId, locals.user.id),
    taskService.getAllUnifiedWorkItems(undefined, undefined, locals.user.id, { project_id: projectId })
  ]);

  if (!projectResult.success) {
    return json({ error: 'Project not found' }, { status: 404 });
  }

  const project = projectResult.value;
  const taskStats = statsResult.success ? statsResult.value : null;
  const membership = membershipResult.success ? membershipResult.value : { isMember: false, isOwner: false };
  const tasks = tasksResult.success ? tasksResult.value : [];

  // Generate combined ETag from all data timestamps
  const timestamps = [
    project.updated_at,
    taskStats ? (taskStats as any).updated_at : null,
    tasks.length > 0 ? Math.max(...tasks.map(t => new Date(t.updated_at || 0).getTime())).toString() : null
  ].filter(Boolean) as string[];

  const etag = generateCombinedEtag(timestamps.map(t => `W/"${t}"`));

  // Check if client has the same version
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return json({
    data: {
      project,
      taskStats,
      membership,
      tasks
    },
    _version: etag
  }, {
    headers: {
      'ETag': etag,
      'Cache-Control': 'private, no-cache'
    }
  });
};
