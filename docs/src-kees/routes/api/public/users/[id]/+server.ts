/**
 * GET /api/public/users/[id] - Get public user name for attribution
 * 
 * This endpoint returns only user name/email for public attribution.
 * No authentication required - used for public sharing pages.
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { queryTableResult } from '$lib/utils/postgrest';
import { filter } from '$lib/utils/postgrest';
import { NotFoundError } from '$lib/types/errors';
import { err, ok } from '$lib/types/result';

// GET - Get public user name by ID (no auth required)
export const GET: RequestHandler = async ({ params }) => {
  try {
    const userId = params.id;
    
    if (!userId) {
      return json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    // Query user - only return public fields (name, email)
    const result = await queryTableResult<any>('_auth_users', {
      filter: filter().eq('id', userId).build(),
      select: 'id,name,email,username',
      limit: 1
    });

    if (!result.success) {
      return json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
    }

    if (result.value.data.length === 0) {
      return json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = result.value.data[0];
    
    // Return only public fields
    const publicData = {
      id: user.id,
      name: user.name || null,
      email: user.email || null,
      username: user.username || null,
      displayName: user.name || user.username || user.email || 'Unknown'
    };

    return json({ success: true, data: publicData });

  } catch (error) {
    console.error('Get public user name endpoint error:', error);
    return json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
};






































