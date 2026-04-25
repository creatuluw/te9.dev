/**
 * Zod validation schemas for Analytics Log domain entities
 */

import { z } from 'zod';

/**
 * Analytics log schema
 */
export const AnalyticsLogSchema = z.object({
  id: z.number().int().positive(),
  event_type: z.string().min(1).max(50),
  event_category: z.enum(['navigation', 'auth', 'engagement', 'performance', 'business']),
  user_id: z.string().nullable(),
  session_id: z.string().min(1).max(100),
  page_url: z.string().max(500).nullable(),
  referrer_url: z.string().max(500).nullable(),
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  screen_resolution: z.string().max(20).nullable(),
  viewport_size: z.string().max(20).nullable(),
  event_data: z.record(z.string(), z.unknown()).nullable(),
  duration_ms: z.number().int().nonnegative().nullable(),
  start_time: z.string().datetime().nullable(),
  end_time: z.string().datetime().nullable(),
  timestamp: z.string().datetime(),
  created_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

/**
 * Create analytics input schema
 */
export const CreateAnalyticsInputSchema = z.object({
  event_type: z.string().min(1).max(50),
  event_category: z.enum(['navigation', 'auth', 'engagement', 'performance', 'business']),
  user_id: z.string().optional(),
  session_id: z.string().min(1).max(100),
  page_url: z.string().max(500).optional(),
  referrer_url: z.string().max(500).optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
  screen_resolution: z.string().max(20).optional(),
  viewport_size: z.string().max(20).optional(),
  event_data: z.record(z.string(), z.unknown()).optional(),
  duration_ms: z.number().int().nonnegative().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional()
});

export type AnalyticsLog = z.infer<typeof AnalyticsLogSchema>;
export type CreateAnalyticsInput = z.infer<typeof CreateAnalyticsInputSchema>;
