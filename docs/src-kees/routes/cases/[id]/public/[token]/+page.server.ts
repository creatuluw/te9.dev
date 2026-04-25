/**
 * Public case page - Server-side load
 * Validates public token and loads case data
 * Bypasses authentication/permission checks
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as publicSharingService from '$lib/services/publicSharingService';
import * as caseService from '$lib/services/caseService';
import { queryTableResult } from '$lib/utils/postgrest';
import { filter } from '$lib/utils/postgrest';

export const load: PageServerLoad = async ({ params }) => {
  const caseId = parseInt(params.id);
  const token = params.token;

  if (isNaN(caseId) || !token) {
    throw error(404, 'Not found');
  }

  // Validate public token
  const tokenResult = await publicSharingService.validatePublicToken('case', token);
  if (!tokenResult.success) {
    throw error(404, 'Not found');
  }

  // Get public entity to verify it matches the ID
  const entityResult = await publicSharingService.getPublicEntity('case', token);
  if (!entityResult.success) {
    throw error(404, 'Not found');
  }

  const publicEntity = entityResult.value;
  if (publicEntity.id !== caseId) {
    throw error(404, 'Not found');
  }

  // Load case data with steps and tasks
  const caseResult = await caseService.getCaseById(caseId);
  if (!caseResult.success) {
    throw error(404, 'Not found');
  }

  const caseData = caseResult.value.case;

  // Fetch owner name if owner_id exists
  let ownerName: string | null = null;
  if (caseData.owner_id) {
    const userResult = await queryTableResult<any>('_auth_users', {
      filter: filter().eq('id', caseData.owner_id).build(),
      select: 'id,name,email,username',
      limit: 1
    });
    if (userResult.success && userResult.value.data.length > 0) {
      const user = userResult.value.data[0];
      ownerName = user.name || user.username || user.email || null;
    }
  }

  return {
    caseData: caseResult.value,
    ownerName,
    isPublic: true
  };
};

