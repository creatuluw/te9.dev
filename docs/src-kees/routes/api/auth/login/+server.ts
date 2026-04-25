/**
 * POST /api/auth/login - User login endpoint
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import * as authService from '$lib/services/authService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Perform login
    const result = await authService.login(
      { email, password },
      ipAddress,
      userAgent
    );

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 401 }
      );
    }

    // Set auth_token cookie for server-side authentication
    // This allows the server-side hooks to authenticate page requests
    const authData = result.value;
    cookies.set('auth_token', authData.token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days (matches token expiration)
    });

    return json({
      success: true,
      data: authData
    });

  } catch (error) {
    console.error('Login endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
};

