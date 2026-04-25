/**
 * Magic link schemas and types
 * 
 * Used for passwordless authentication to view support tickets
 */
import { z } from 'zod';

/**
 * Magic link schema
 */
export const MagicLinkSchema = z.object({
  id: z.number().int().positive(),
  token: z.string().min(1),
  email: z.string().email(),
  used: z.boolean().default(false),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
  used_at: z.string().datetime().nullable().optional(),
});

export type MagicLink = z.infer<typeof MagicLinkSchema>;

/**
 * Create magic link input schema
 */
export const CreateMagicLinkInputSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
});

export type CreateMagicLinkInput = z.infer<typeof CreateMagicLinkInputSchema>;

/**
 * Validate magic link input schema
 */
export const ValidateMagicLinkInputSchema = z.object({
  token: z.string().min(1, 'Token is vereist'),
});

export type ValidateMagicLinkInput = z.infer<typeof ValidateMagicLinkInputSchema>;

