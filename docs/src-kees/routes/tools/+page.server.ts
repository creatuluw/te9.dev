/**
 * Server-side load function for /tools
 * Enforces permission check on every page load (including client-side navigation)
 * 
 * This file was auto-generated to fix the permission bypass vulnerability.
 */

import { requirePermission } from '$lib/server/requirePermission';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check permission: /tools with read action
  requirePermission(locals, '/tools', 'read');

  // Return empty object - page will load data client-side
  return {};
};
