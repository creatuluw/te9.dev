/**
 * Server-side load function for /admin/rollen/[id]
 * Enforces permission check on every page load (including client-side navigation)
 */

import { requirePermission } from '$lib/server/requirePermission';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check permission: /admin/rollen with read action
  requirePermission(locals, '/admin/rollen', 'read');

  // Return empty object - page will load data client-side
  return {};
};













































