/**
 * POST /api/auth/register - User self-registration (pending approval)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { insertRowResult } from '$lib/utils/postgrest';
import { validateSchema } from '$lib/utils/validation';
import { RegistrationInputSchema } from '$lib/schemas/auth';
import { hashPassword } from '$lib/utils/password';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateSchema(RegistrationInputSchema, body);
    if (!validation.success) {
      return json(
        { success: false, error: getUserMessage(validation.error) },
        { status: 400 }
      );
    }

    const { email, username, name, password } = validation.value;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create pending registration
    const result = await insertRowResult('_auth_pending_registrations', {
      email,
      username: username || null,
      name,
      password_hash: passwordHash,
      status: 'pending',
      requested_at: new Date().toISOString()
    });

    if (!result.success) {
      return json(
        { success: false, error: getUserMessage(result.error) },
        { status: 400 }
      );
    }

    return json({
      success: true,
      message: 'Registration submitted successfully. Your account is pending approval.'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration endpoint error:', error);
    return json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
};

