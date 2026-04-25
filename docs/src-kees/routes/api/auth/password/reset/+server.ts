/**
 * POST /api/auth/password/reset - Reset password with token
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as invitationService from '$lib/services/invitationService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const result = await invitationService.resetPassword(body);

    if (!result.success) {
      return json({ success: false, error: getUserMessage(result.error) }, { status: 400 });
    }

    return json({ 
      success: true, 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Password reset endpoint error:', error);
    return json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
};

