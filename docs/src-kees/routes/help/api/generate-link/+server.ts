/**
 * API endpoint to generate magic link for viewing support tickets
 * 
 * POST /help/api/generate-link
 * Body: { email: string }
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as magicLinkService from '$lib/services/magicLinkService';
import { getUserMessage } from '$lib/types/errors';

export const POST: RequestHandler = async ({ request, url }) => {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('[generate-link] Received request:', { email, url: url.toString() });

    if (!email || typeof email !== 'string') {
      console.log('[generate-link] Invalid email:', email);
      return json(
        { success: false, error: 'E-mailadres is vereist' },
        { status: 400 }
      );
    }

    // Get base URL from request
    const baseUrl = url.origin;
    console.log('[generate-link] Base URL:', baseUrl);

    if (!baseUrl) {
      console.error('[generate-link] No origin available in URL:', url);
      return json(
        { success: false, error: 'Kon de basis URL niet bepalen' },
        { status: 500 }
      );
    }

    // Generate magic link
    const result = await magicLinkService.generateMagicLink(email, baseUrl);

    if (result.success) {
      console.log('[generate-link] Success for email:', email);
      return json({
        success: true,
        message: 'Er is een link naar uw e-mailadres gestuurd. Controleer uw inbox.'
      });
    } else {
      console.error('[generate-link] Magic link generation error:', result.error);
      const errorMessage = getUserMessage(result.error);
      console.error('[generate-link] Error message:', errorMessage);
      console.error('[generate-link] Full error details:', {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
      });
      return json(
        { 
          success: false, 
          error: errorMessage
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[generate-link] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[generate-link] Error stack:', error.stack);
    }
    return json(
      { 
        success: false, 
        error: 'Er is een fout opgetreden bij het genereren van de link.'
      },
      { status: 500 }
    );
  }
};

