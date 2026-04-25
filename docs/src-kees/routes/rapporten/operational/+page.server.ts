/**
 * Server-side load function for /rapporten/operational
 * Enforces permission check on every page load (including client-side navigation)
 */

import { requirePermission } from '$lib/server/requirePermission';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check permission: /rapporten/operational with read action
  requirePermission(locals, '/rapporten/operational', 'read');

  // Return empty object - page will load data client-side
  return {};
};

