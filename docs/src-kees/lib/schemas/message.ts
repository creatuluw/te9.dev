/**
 * Zod validation schemas for Message domain entities
 */

import { z } from "zod";

/**
 * Message status enum
 */
export const MessageStatusSchema = z.enum(["pending", "sent", "failed"]);

/**
 * Message type enum - categorizes messages into different types
 */
export const MessageTypeSchema = z.enum([
  "chat",
  "reminder",
  "email",
  "in-app",
  "comment",
  "notification",
  "direct",
]);

/**
 * Entity reference schema for @mentions and entity references.
 *
 * **Important (FR-5)**: The `type` enum includes project/case/task/process for backward
 * compatibility with existing data, but the mention resolution pipeline in new code
 * MUST only resolve `type: 'user'` references. Non-user entity types are never produced
 * by the mention autocomplete or resolution logic. Any `preResolvedReferences` containing
 * `type !== 'user'` are silently filtered out by `messageParser.ts` before processing.
 *
 * @see `.specs/refactor-messaging-system/spec.md` - FR-5, EC-7b
 */
export const EntityReferenceSchema = z.object({
  /** Entity type. Only 'user' is used in new mention code. Other types exist for backward compat. */
  type: z.enum(["project", "case", "task", "process", "user"]),
  id: z.union([z.number(), z.string()]),
  name: z.string(),
});

/**
 * Message schema
 */
export const MessageSchema = z.object({
  id: z.number().int().positive(),
  type: z.string().min(1, "Message type is required"),
  msg_type: MessageTypeSchema.default("notification"),
  recipient_email: z.string().email("Invalid email address"),
  recipient_user_id: z.string().optional().nullable(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string(), // Full HTML for emails, or plain text for in-app only
  message_text: z.string().optional().nullable(), // Plain text for in-app display
  status: MessageStatusSchema,
  in_app_read: z.boolean().default(false),
  source: z.string().optional().nullable(), // Source URL where message was created
  entity_type: z.string().optional().nullable(), // Direct entity type link (task, case, process, project)
  entity_id: z.number().int().positive().optional().nullable(), // Direct entity ID link
  attachments: z.array(z.string()).default([]), // Array of file URLs
  references: z.array(EntityReferenceSchema).default([]), // Array of entity references (@mentions)
  sender_user_id: z.string().optional().nullable(), // Who sent the message
  sender_email: z.string().optional().nullable(), // Sender email for display
  sent_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),

  // Conversation threading (FR-3: Threaded conversations with materialized path pattern)
  conversation_id: z.string().uuid().optional().nullable(), // Groups messages into a conversation
  parent_message_id: z.number().int().positive().optional().nullable(), // FK to parent message for threaded replies
  thread_depth: z.number().int().min(0).default(0), // Nesting level (0 = top-level)
  thread_path: z.string().default(""), // Materialized path (e.g., /1/5/23/)

  // Delivery tracking (FR-6: Delivery Status Tracking)
  delivery_status: z
    .enum(["pending", "delivered", "failed"])
    .default("pending"), // Current delivery state
  delivery_attempts: z.number().int().min(0).default(0), // Number of delivery attempts made
  delivery_error_message: z.string().optional().nullable(), // Error message from last failed attempt
});

/**
 * Create message input schema
 */
export const CreateMessageInputSchema = z.object({
  type: z.string().min(1, "Message type is required"),
  msg_type: MessageTypeSchema.default("notification"),
  recipient_email: z.string().email("Invalid email address"),
  recipient_user_id: z.string().optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(255, "Subject is too long"),
  body: z.string().min(1, "Body is required"),
  message_text: z.string().optional(), // Plain text for in-app display
  source: z.string().optional(), // Source URL where message was created
  attachments: z.array(z.string()).optional().default([]), // Array of file URLs
  references: z.array(EntityReferenceSchema).optional().default([]), // Array of entity references
  sender_user_id: z.string().optional(), // Who sent the message
  sender_email: z.string().optional(), // Sender email for display
});

/**
 * Create message with @mentions input schema
 */
export const CreateMessageWithMentionsInputSchema = z.object({
  message_text: z.string().min(1, "Message text is required"),
  source: z.string().min(1, "Source URL is required"), // Source URL where message was created
  attachments: z.array(z.string()).optional(), // Array of file URLs
  entity_type: z.string().optional(), // Entity type (project, case, task, process)
  entity_id: z.number().optional(), // Entity ID
  preResolvedReferences: z.array(EntityReferenceSchema).optional(), // Pre-resolved entity references (from autocomplete selection)
  parent_message_id: z.number().int().positive().optional(), // For threaded replies (FR-3)
});

/**
 * Email message input schema (includes HTML)
 */
export const EmailMessageInputSchema = z.object({
  type: z.string().min(1, "Message type is required"),
  msg_type: MessageTypeSchema.default("email"),
  recipient_email: z.string().email("Invalid email address"),
  recipient_user_id: z.string().optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(255, "Subject is too long"),
  html: z.string().min(1, "HTML content is required"),
  message_text: z.string().optional(), // Plain text for in-app display
  body: z.string().optional(), // Plain text fallback for email clients
});

/**
 * Update message status input schema
 */
export const UpdateMessageStatusInputSchema = z.object({
  status: MessageStatusSchema,
  errorMessage: z.string().optional(),
});

/**
 * Task log schema
 */
export const TaskLogSchema = z.object({
  id: z.number().int().positive(),
  case_task_id: z.number().int().positive(),
  task_id: z.number().int().positive(),
  case_id: z.number().int().positive(),
  owner_id: z.string().optional().nullable(),
  completed_at: z.string().datetime(),
  completion_notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  created_at: z.string().datetime(),
});

/**
 * Type exports inferred from schemas
 */
export type MessageStatus = z.infer<typeof MessageStatusSchema>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
export type DeliveryStatus = "pending" | "delivered" | "failed";
export type EntityReference = z.infer<typeof EntityReferenceSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type CreateMessageInput = z.infer<typeof CreateMessageInputSchema>;
export type CreateMessageWithMentionsInput = z.infer<
  typeof CreateMessageWithMentionsInputSchema
>;
export type EmailMessageInput = z.infer<typeof EmailMessageInputSchema>;
export type UpdateMessageStatusInput = z.infer<
  typeof UpdateMessageStatusInputSchema
>;
export type TaskLog = z.infer<typeof TaskLogSchema>;
