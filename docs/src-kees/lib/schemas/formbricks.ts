/**
 * Zod validation schemas for Formbricks Management API entities
 * Based on: https://formbricks.com/docs/api-reference/rest-api
 */

import { z } from "zod";

/**
 * Action Class schema
 */
export const ActionClassSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    type: z.enum(["code", "noCode", "automatic"]).optional(),
    key: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type ActionClass = z.infer<typeof ActionClassSchema>;

/**
 * Create Action Class input schema
 */
export const CreateActionClassInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["code", "noCode", "automatic"]).optional(),
  key: z.string().optional(),
});

export type CreateActionClassInput = z.infer<
  typeof CreateActionClassInputSchema
>;

/**
 * Attribute Class schema
 */
export const AttributeClassSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    type: z.enum(["code", "noCode"]).optional(),
    archived: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type AttributeClass = z.infer<typeof AttributeClassSchema>;

/**
 * Create Attribute Class input schema
 */
export const CreateAttributeClassInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["code", "noCode"]).optional(),
});

export type CreateAttributeClassInput = z.infer<
  typeof CreateAttributeClassInputSchema
>;

/**
 * Me (Account Information) schema
 */
export const MeSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    emailVerified: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Me = z.infer<typeof MeSchema>;

/**
 * Person schema
 */
export const PersonSchema = z
  .object({
    id: z.string(),
    userId: z.string().optional().nullable(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Person = z.infer<typeof PersonSchema>;

/**
 * Response schema
 */
export const ResponseSchema = z
  .object({
    id: z.string(),
    surveyId: z.string(),
    personId: z.string().optional().nullable(),
    person: z
      .object({
        id: z.string(),
        userId: z.string().optional().nullable(),
        environmentId: z.string().optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional()
      .nullable(),
    personAttributes: z.record(z.string(), z.unknown()).optional().nullable(),
    data: z.record(z.string(), z.unknown()).optional(),
    finished: z.boolean().optional(),
    singleUseId: z.string().optional().nullable(),
    language: z.string().optional().nullable(),
    tags: z.array(z.unknown()).optional(),
    ttc: z.record(z.string(), z.unknown()).optional(),
    meta: z
      .object({
        userAgent: z.record(z.string(), z.unknown()).optional(),
        url: z.string().optional(),
        ip: z.string().optional(),
        action: z.string().optional(),
        source: z.string().optional(),
      })
      .passthrough()
      .optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Response = z.infer<typeof ResponseSchema>;

/**
 * Update Response input schema
 */
export const UpdateResponseInputSchema = z
  .object({
    finished: z.boolean().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type UpdateResponseInput = z.infer<typeof UpdateResponseInputSchema>;

/**
 * Survey schema
 */
export const SurveySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["app", "website", "link", "email"]).optional(),
    status: z
      .enum(["draft", "inProgress", "paused", "completed", "archived"])
      .optional(),
    questions: z.array(z.unknown()).optional(),
    thankYouCard: z
      .object({
        enabled: z.boolean().optional(),
        headline: z.string().optional(),
        subheader: z.string().optional(),
      })
      .optional(),
    // hiddenFields is an object in the API response, not an array
    hiddenFields: z
      .union([
        z.array(z.unknown()),
        z.object({
          enabled: z.boolean().optional(),
          fieldIds: z.array(z.string()).optional(),
        }),
      ])
      .optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Survey = z.infer<typeof SurveySchema>;

/**
 * Create Survey input schema
 */
export const CreateSurveyInputSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(["app", "website", "link", "email"]).optional(),
    questions: z.array(z.unknown()).optional(),
    thankYouCard: z
      .object({
        enabled: z.boolean().optional(),
        headline: z.string().optional(),
        subheader: z.string().optional(),
      })
      .optional(),
    hiddenFields: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type CreateSurveyInput = z.infer<typeof CreateSurveyInputSchema>;

/**
 * Update Survey input schema
 */
export const UpdateSurveyInputSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.enum(["app", "website", "link", "email"]).optional(),
    status: z
      .enum(["draft", "inProgress", "paused", "completed", "archived"])
      .optional(),
    questions: z.array(z.unknown()).optional(),
    thankYouCard: z
      .object({
        enabled: z.boolean().optional(),
        headline: z.string().optional(),
        subheader: z.string().optional(),
      })
      .optional(),
    hiddenFields: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type UpdateSurveyInput = z.infer<typeof UpdateSurveyInputSchema>;

/**
 * Webhook schema
 */
export const WebhookSchema = z
  .object({
    id: z.string(),
    name: z.string().optional().nullable(),
    url: z.string().url(),
    triggerIds: z.array(z.string()).optional(),
    surveyIds: z.array(z.string()).optional(),
    secret: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Webhook = z.infer<typeof WebhookSchema>;

/**
 * Create Webhook input schema
 */
export const CreateWebhookInputSchema = z.object({
  name: z.string().optional().nullable(),
  url: z.string().url(),
  triggerIds: z.array(z.string()).optional(),
  surveyIds: z.array(z.string()).optional(),
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookInputSchema>;

/**
 * Send survey links input schema
 */
export const SendSurveyLinksInputSchema = z
  .object({
    surveyId: z.string().min(1, "Survey ID is required"),
    employeeIds: z.array(z.union([z.string(), z.number()])),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    additionalEmails: z.array(z.string().email()).optional(),
  })
  .refine(
    (data) =>
      data.employeeIds.length > 0 ||
      (data.additionalEmails && data.additionalEmails.length > 0),
    { message: "At least one employee or additional email must be provided" },
  );

export type SendSurveyLinksInput = z.infer<typeof SendSurveyLinksInputSchema>;
