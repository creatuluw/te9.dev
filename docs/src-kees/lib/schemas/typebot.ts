/**
 * Zod validation schemas for Typebot domain entities
 */

import { z } from 'zod';

/**
 * Typebot block schema
 */
export const TypebotBlockSchema = z.object({
	id: z.string(),
	type: z.string(),
	content: z.any().optional(),
	options: z.any().optional(),
	outgoingEdgeId: z.string().optional(),
}).passthrough();

/**
 * Typebot group schema
 */
export const TypebotGroupSchema = z.object({
	id: z.string(),
	title: z.string().optional().nullable(),
	blocks: z.array(TypebotBlockSchema),
	graphCoordinates: z.object({
		x: z.number(),
		y: z.number(),
	}).optional(),
}).passthrough();

/**
 * Typebot edge schema
 * 
 * Note: `from` and `to` can be objects with properties like:
 * - `eventId` (for start events)
 * - `groupId` (for groups)
 * - `blockId` (for blocks)
 */
export const TypebotEdgeSchema = z.object({
	id: z.string(),
	from: z.union([
		z.string(),
		z.object({
			eventId: z.string().optional(),
			groupId: z.string().optional(),
			blockId: z.string().optional(),
		}).passthrough()
	]),
	to: z.union([
		z.string(),
		z.object({
			eventId: z.string().optional(),
			groupId: z.string().optional(),
			blockId: z.string().optional(),
		}).passthrough()
	]),
	condition: z.any().optional(),
}).passthrough();

/**
 * Typebot variable schema
 */
export const TypebotVariableSchema = z.object({
	id: z.string(),
	name: z.string(),
	type: z.string().optional(),
}).passthrough();

/**
 * Typebot settings schema
 */
export const TypebotSettingsSchema = z.object({
	publicShare: z.object({
		isEnabled: z.boolean().optional(),
	}).optional(),
}).passthrough();

/**
 * Typebot schema - represents a typebot from the API
 */
export const TypebotSchema = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string().optional().nullable(),
	publicId: z.string().optional().nullable(),
	workspaceId: z.string().optional(),
	folderId: z.string().optional().nullable(),
	groups: z.array(TypebotGroupSchema).optional(),
	edges: z.array(TypebotEdgeSchema).optional(),
	variables: z.array(TypebotVariableSchema).optional(),
	settings: TypebotSettingsSchema.optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
}).passthrough();

export type Typebot = z.infer<typeof TypebotSchema>;
export type TypebotGroup = z.infer<typeof TypebotGroupSchema>;
export type TypebotBlock = z.infer<typeof TypebotBlockSchema>;
export type TypebotEdge = z.infer<typeof TypebotEdgeSchema>;
export type TypebotVariable = z.infer<typeof TypebotVariableSchema>;

/**
 * Parsed typebot structure for display
 */
export interface ParsedTypebotStructure {
	groups: Array<{
		id: string;
		title: string | null;
		blocks: Array<{
			id: string;
			type: string;
			content?: any;
			options?: any;
		}>;
	}>;
	edges: Array<{
		id: string;
		from: string;
		to: string;
		condition?: any;
	}>;
	variables: Array<{
		id: string;
		name: string;
		type?: string;
	}>;
}

/**
 * Send typebot links input schema
 */
export const SendTypebotLinksInputSchema = z.object({
	typebotId: z.string().min(1, 'Typebot ID is required'),
	publicId: z.string().min(1, 'Public ID is required'),
	employeeIds: z.array(z.union([z.string(), z.number()])).min(1, 'At least one employee must be selected'),
	subject: z.string().min(1, 'Subject is required'),
	message: z.string().min(1, 'Message is required'),
});

export type SendTypebotLinksInput = z.infer<typeof SendTypebotLinksInputSchema>;

