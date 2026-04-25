/**
 * Realtime Projects API - List projects with ETag caching
 * Supports conditional requests for efficient polling
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as projectService from '$lib/services/projectService';
import { generateEtag } from '$lib/utils/etag';

/**
 * GET /api/realtime/projects - Get all accessible projects with membership info
 * Supports If-None-Match header for 304 responses
 */
export const GET: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ifNoneMatch = request.headers.get('If-None-Match');

  // Get projects with membership info
  const result = await projectService.getProjectsWithMembership(
    locals.user.id,
    (locals.user as any).is_sysadmin === true
  );

  if (!result.success) {
    return json({ error: 'Failed to fetch projects' }, { status: 500 });
  }

  const projects = result.value;

  // Generate ETag from the latest updated_at timestamp
  const latestUpdate = projects.reduce((max, p) => {
    const timestamp = new Date(p.updated_at || 0).getTime();
    return timestamp > max ? timestamp : max;
  }, 0);

  const etag = `W/"${latestUpdate}-${projects.length}"`;

  // Check if client has the same version
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304 });
  }

  return json({
    data: projects,
    _version: etag
  }, {
    headers: {
      'ETag': etag,
      'Cache-Control': 'private, no-cache'
    }
  });
};
