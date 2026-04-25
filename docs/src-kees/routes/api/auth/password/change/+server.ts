/**
 * POST /api/auth/password/change - Change user password
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as authService from '$lib/services/authService';
import { extractTokenFromHeader } from '$lib/utils/jwt';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return json(
        { success: false, error: 'Geen autorisatie token gevonden' },
        { status: 401 }
      );
    }

    // Verify session to get authenticated user
    const sessionResult = await authService.verifySession(token);
    if (!sessionResult.success) {
      return json(
        { success: false, error: getUserMessage(sessionResult.error) },
        { status: 401 }
      );
    }

    const userId = sessionResult.value.user.id;

    // Get request body
    const body = await request.json();

    // Change password
    const result = await authService.changePassword(userId, body);

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 }
      );
    }

    return json({
      success: true,
      message: 'Wachtwoord succesvol gewijzigd'
    });

  } catch (error) {
    console.error('Change password endpoint error:', error);
    return json(
      { success: false, error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
};

