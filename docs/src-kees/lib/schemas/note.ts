/**
 * Zod validation schemas for Note domain entities
 */

import { z } from 'zod';

/**
 * Note type schema - supports default types and custom types
 */
export const NoteTypeSchema = z.string().min(1, 'Note type is required').max(50, 'Note type is too long');

/**
 * Default note types
 */
export const DEFAULT_NOTE_TYPES = ['note', 'checklist_item', 'reminder'] as const;

/**
 * Entity type schema for notes
 */
export const NoteEntitySchema = z.enum(['project', 'case', 'task', 'process']);

/**
 * Note schema
 */
export const NoteSchema = z.object({
	id: z.number().int().positive(),
	entity: NoteEntitySchema,
	entity_id: z.number().int().positive(),
	type: NoteTypeSchema,
	title: z.string().max(255).optional().nullable(),
	text: z.string().min(1, 'Note text is required'),
	assignee_id: z.array(z.string()).default([]), // JSONB array of user IDs
	due_date: z.string().datetime().optional().nullable(),
	source_url: z.string().max(255).optional().nullable(),
	checked: z.boolean().default(false),
	closed: z.boolean().default(false),
	created_by: z.string().optional().nullable(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime()
});

/**
 * Create note input schema
 */
export const CreateNoteInputSchema = z.object({
	entity: NoteEntitySchema,
	entity_id: z.number().int().positive(),
	type: NoteTypeSchema,
	title: z.string().max(255).optional().nullable(),
	text: z.string().min(1, 'Note text is required'),
	assignee_id: z.array(z.string()).optional().default([]),
	due_date: z.string().datetime().optional().nullable(),
	source_url: z.string().max(255).optional().nullable(),
	checked: z.boolean().optional().default(false)
});

/**
 * Update note input schema
 */
export const UpdateNoteInputSchema = z.object({
	title: z.string().max(255).optional().nullable(),
	text: z.string().min(1, 'Note text is required').optional(),
	type: NoteTypeSchema.optional(),
	assignee_id: z.array(z.string()).optional(),
	due_date: z.string().datetime().optional().nullable(),
	checked: z.boolean().optional(),
	closed: z.boolean().optional()
});

/**
 * Type exports inferred from schemas
 */
export type Note = z.infer<typeof NoteSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>;
export type NoteEntity = z.infer<typeof NoteEntitySchema>;
export type NoteType = z.infer<typeof NoteTypeSchema>;

