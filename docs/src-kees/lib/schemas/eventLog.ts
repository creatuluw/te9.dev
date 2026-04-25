/**
 * Zod validation schemas for Event Log domain entities
 */

import { z } from 'zod';

/**
 * Event log schema
 */
export const EventLogSchema = z.object({
  id: z.number().int().positive(),
  event_type: z.string().min(1).max(50),
  entity_type: z.string().min(1).max(30),
  entity_id: z.number().int().positive(),
  user_id: z.string().nullable(),
  old_values: z.record(z.string(), z.unknown()).nullable(),
  new_values: z.record(z.string(), z.unknown()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  source_url: z.string().max(500).nullable(),
  timestamp: z.string().datetime(),
  session_id: z.string().max(100).nullable()
});

/**
 * Create event log input schema
 */
export const CreateEventLogInputSchema = z.object({
  event_type: z.string().min(1).max(50),
  entity_type: z.string().min(1).max(30),
  entity_id: z.number().int().positive(),
  user_id: z.string().optional(),
  old_values: z.record(z.string(), z.unknown()).optional(),
  new_values: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  source_url: z.string().max(500).optional(),
  session_id: z.string().max(100).optional()
});

export type EventLog = z.infer<typeof EventLogSchema>;
export type CreateEventLogInput = z.infer<typeof CreateEventLogInputSchema>;
