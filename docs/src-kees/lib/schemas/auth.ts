/**
 * Zod validation schemas for Auth domain entities
 */

import { z } from "zod";

/**
 * User schema
 */
export const UserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  password_hash: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  email_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_sysadmin: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  last_login_at: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Role schema
 */
export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  is_system: z.boolean().default(false),
  is_default: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Role = z.infer<typeof RoleSchema>;

/**
 * Permission schema
 */
export const PermissionSchema = z.object({
  id: z.number(),
  route: z.string().min(1).max(255),
  actions: z.array(z.enum(["read", "write", "delete", "execute"])),
  description: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Session schema
 */
export const SessionSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  user_id: z.string(),
  token: z.string(),
  refresh_token: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  expires_at: z.string(),
  created_at: z.string().optional(),
  last_activity_at: z.string().optional(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * User activity schema
 */
export const UserActivitySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  activity_type: z.string(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  created_at: z.string().optional(),
});

export type UserActivity = z.infer<typeof UserActivitySchema>;

/**
 * Login input schema
 */
export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

/**
 * Registration input schema
 */
export const RegistrationInputSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z.string().min(3).max(50).optional(),
    name: z.string().min(1).max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegistrationInput = z.infer<typeof RegistrationInputSchema>;

/**
 * Create user input schema (admin creating users)
 */
export const CreateUserInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3).max(50).optional(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).optional(), // Optional - can send invitation instead
  role_ids: z.array(z.number()).min(1, "At least one role is required"),
  email_verified: z.boolean().default(false),
  is_active: z.boolean().default(true),
  send_invitation: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

/**
 * Update user input schema
 */
export const UpdateUserInputSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  username: z.string().min(3).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  is_active: z.boolean().optional(),
  is_sysadmin: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

/**
 * Change password input schema
 */
export const ChangePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

/**
 * Password reset request schema
 */
export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

/**
 * Password reset schema
 */
export const PasswordResetSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type PasswordReset = z.infer<typeof PasswordResetSchema>;

/**
 * JWT token payload schema
 *
 * Optimized to minimize token size:
 * - Removed `permissions`: Fetched server-side when needed (already done in hooks.server.ts)
 * - Removed `email`: Can be fetched from database when needed
 * - Kept `roles`: Small array of role names, useful for quick role checks
 * - Kept `is_sysadmin`: Essential for permission bypass logic
 *
 * This reduces token size significantly, especially for users with many permissions.
 */
export const TokenPayloadSchema = z.object({
  userId: z.string(),
  roles: z.array(z.string()),
  sessionId: z.string(),
  is_sysadmin: z.boolean().default(false),
  exp: z.number(),
  iat: z.number(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

/**
 * Auth data schema (stored in localStorage/cookies)
 */
export const AuthDataSchema = z.object({
  token: z.string(),
  refreshToken: z.string().optional(),
  user: UserSchema,
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
  expiresAt: z.string(),
});

export type AuthData = z.infer<typeof AuthDataSchema>;

/**
 * Invitation input schema
 */
export const InvitationInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  role_ids: z.array(z.number()).min(1, "At least one role is required"),
});

export type InvitationInput = z.infer<typeof InvitationInputSchema>;

/**
 * Create role input schema
 */
export const CreateRoleInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof CreateRoleInputSchema>;

/**
 * Create permission input schema
 */
export const CreatePermissionInputSchema = z.object({
  route: z.string().min(1).max(255),
  actions: z.array(z.enum(["read", "write", "delete", "execute"])).min(1),
  description: z.string().optional(),
});

export type CreatePermissionInput = z.infer<typeof CreatePermissionInputSchema>;

/**
 * User with roles schema
 */
export const UserWithRolesSchema = UserSchema.extend({
  roles: z.array(RoleSchema),
});

export type UserWithRoles = z.infer<typeof UserWithRolesSchema>;

/**
 * Role with permissions schema
 */
export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
});

export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;

/**
 * Registration invitation input schema (admin sends invitation)
 */
export const RegistrationInvitationInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type RegistrationInvitationInput = z.infer<
  typeof RegistrationInvitationInputSchema
>;

/**
 * Complete registration input schema (user completes registration)
 */
export const CompleteRegistrationInputSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    name: z.string().min(1, "Name is required").max(255),
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    avatar: z.string().optional().nullable(),
    bio: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type CompleteRegistrationInput = z.infer<
  typeof CompleteRegistrationInputSchema
>;
