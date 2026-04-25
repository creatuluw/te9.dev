/**
 * Zod validation schemas for Message Subscription domain entities
 * FR-2: Subscription Zod Schemas
 */

import { z } from "zod";

/**
 * Subscription notification channel enum
 * Controls how subscription updates are delivered to the user
 */
export const SubscriptionChannelSchema = z.enum(["in-app", "email", "both"]);

/**
 * Entity type enum for subscriptions
 * Matches the entity types available in the MessagesTab
 */
export const EntityTypeSchema = z.enum([
  "process",
  "case",
  "work",
  "task",
  "project",
]);

/**
 * Full subscription record schema
 * Matches the _bpm_message_subscriptions table columns
 */
export const MessageSubscriptionSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().min(1, "User ID is required"),
  entity_type: EntityTypeSchema,
  entity_id: z.number().int().positive("Entity ID must be a positive integer"),
  entity_name: z.string().nullable().optional(),
  notification_channel: SubscriptionChannelSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Create subscription input schema
 * Used when subscribing to an entity's messages
 */
export const CreateSubscriptionInputSchema = z.object({
  entity_type: EntityTypeSchema,
  entity_id: z.number().int().positive("Entity ID must be a positive integer"),
  entity_name: z.string().optional(),
  notification_channel: SubscriptionChannelSchema.optional(),
});

/**
 * Update subscription input schema
 * Used when changing the notification channel
 */
export const UpdateSubscriptionInputSchema = z.object({
  notification_channel: SubscriptionChannelSchema,
});

/**
 * Full subscription message read record schema
 * Matches the _bpm_subscription_message_reads table columns
 * Tracks per-user read state for subscription messages
 */
export const SubscriptionMessageReadSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().min(1, "User ID is required"),
  message_id: z
    .number()
    .int()
    .positive("Message ID must be a positive integer"),
  read_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

/**
 * Mark single message as read input schema
 */
export const MarkMessageReadInputSchema = z.object({
  message_id: z
    .number()
    .int()
    .positive("Message ID must be a positive integer"),
});

/**
 * Mark all subscription messages as read input schema
 * No input needed — operates on all subscription messages for the authenticated user
 */
export const MarkAllMessagesReadInputSchema = z.object({}).optional();

/**
 * Type exports inferred from schemas
 */
export type SubscriptionChannel = z.infer<typeof SubscriptionChannelSchema>;
export type EntityType = z.infer<typeof EntityTypeSchema>;
export type MessageSubscription = z.infer<typeof MessageSubscriptionSchema>;
export type CreateSubscriptionInput = z.infer<
  typeof CreateSubscriptionInputSchema
>;
export type UpdateSubscriptionInput = z.infer<
  typeof UpdateSubscriptionInputSchema
>;
export type SubscriptionMessageRead = z.infer<
  typeof SubscriptionMessageReadSchema
>;
export type MarkMessageReadInput = z.infer<typeof MarkMessageReadInputSchema>;
