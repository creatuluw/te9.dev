/**
 * POST /api/auth/password/forgot - Request password reset
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as invitationService from '$lib/services/invitationService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Get origin from request to construct proper reset links
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    
    const result = await invitationService.requestPasswordReset(body, origin);

    if (!result.success) {
      return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
    }

    return json({ 
      success: true, 
      message: 'If an account exists with that email, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('Password reset request endpoint error:', error);
    return json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
};

