/**
 * Server-side load function for /processes
 * Enforces permission check on every page load (including client-side navigation)
 * Loads data server-side for faster initial page render
 */

import { requirePermission } from '$lib/server/requirePermission';
import type { PageServerLoad } from './$types';
import * as processService from '$lib/services/processService';

export const load: PageServerLoad = async ({ locals, depends }) => {
  // Check permission: /processes with read action
  requirePermission(locals, '/processes', 'read');
  
  // Register dependencies for cache invalidation
  depends('processes');
  
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

  // Load processes server-side
  // This runs BEFORE HTML is sent to client
  // Add error handling to prevent hangs if API call fails
  const processesResult = await processService.getAllProcesses().catch(err => {
    console.error('[processes/+page.server] Error loading processes:', err);
    return { success: false, error: err } as any;
  });
  
  // Return data for immediate SSR render
  return {
    // Critical data (rendered immediately)
    processes: processesResult.success ? processesResult.value : [],
    
    // Errors for graceful handling (serialized)
    errors: {
      processes: serializeError(processesResult.success ? null : processesResult.error)
    },
    
    // Metadata
    timestamp: Date.now()
  };
};
