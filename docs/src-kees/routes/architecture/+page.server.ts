/**
 * Server-side load function for /architecture
 * Loads architecture page data server-side
 */

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  const userId = locals.user?.id;

  if (!userId) {
    // User not authenticated - the client-side will handle redirect
    return {
      userId: null,
      timestamp: Date.now()
    };
  }

  // Return data for architecture page
  return {
    userId: userId,
    timestamp: Date.now()
  };
};
