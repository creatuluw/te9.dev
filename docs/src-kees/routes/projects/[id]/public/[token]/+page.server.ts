/**
 * Public project page - Server-side load
 * Validates public token and loads project data
 * Bypasses authentication/permission checks
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as publicSharingService from '$lib/services/publicSharingService';
import * as projectService from '$lib/services/projectService';

export const load: PageServerLoad = async ({ params }) => {
  const projectId = parseInt(params.id);
  const token = params.token;

  if (isNaN(projectId) || !token) {
    throw error(404, 'Not found');
  }

  // Validate public token
  const tokenResult = await publicSharingService.validatePublicToken('project', token);
  if (!tokenResult.success) {
    throw error(404, 'Not found');
  }

  // Get public entity to verify it matches the ID
  const entityResult = await publicSharingService.getPublicEntity('project', token);
  if (!entityResult.success) {
    throw error(404, 'Not found');
  }

  const publicEntity = entityResult.value;
  if (publicEntity.id !== projectId) {
    throw error(404, 'Not found');
  }

  // Load project data
  // Note: We use getProjectById which doesn't require membership check
  // For public view, we'll load basic project data
  const projectResult = await projectService.getProjectById(projectId);
  if (!projectResult.success) {
    throw error(404, 'Not found');
  }

  return {
    project: projectResult.value,
    isPublic: true
  };
};

