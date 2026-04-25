import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { queryTableResult } from '$lib/utils/postgrest';
import { filter } from '$lib/utils/postgrest';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return json({ success: false, error: 'Token is verplicht' }, { status: 400 });
    }
    
    // Find reset token in database
    const resetResult = await queryTableResult<any>(
      '_auth_password_resets',
      { filter: filter().eq('token', token).build() }
    );
    
    if (!resetResult.success || resetResult.value.data.length === 0) {
      return json({ success: false, error: 'Ongeldige token' }, { status: 400 });
    }
    
    const reset = resetResult.value.data[0];
    
    // Check if expired
    if (new Date(reset.expires_at) < new Date()) {
      return json({ success: false, error: 'Token is verlopen' }, { status: 400 });
    }
    
    // Check if already used
    if (reset.used_at) {
      return json({ success: false, error: 'Token is al gebruikt' }, { status: 400 });
    }
    
    return json({ success: true });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return json({ success: false, error: 'Ongeldige token' }, { status: 400 });
  }
};

