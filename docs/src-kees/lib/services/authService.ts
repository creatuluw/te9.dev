/**
 * Authentication Service - Core authentication logic with JWT and sessions
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 */

import {
  queryTableResult,
  insertRowResult,
  updateRowsResult,
  deleteRowsResult,
  filter,
} from "$lib/utils/postgrest";
import { permissionCache } from "$lib/utils/serverCache";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NetworkError,
  UnauthorizedError,
  NotFoundError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { validateSchema } from "$lib/utils/validation";
import {
  LoginInputSchema,
  type LoginInput,
  type User,
  type Session,
  type TokenPayload,
  type AuthData,
  UserSchema,
  SessionSchema,
  ChangePasswordInputSchema,
  type ChangePasswordInput,
} from "$lib/schemas/auth";
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
} from "$lib/utils/password";
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  calculateExpirationTime,
  decodeTokenUnsafe,
  isTokenExpired,
} from "$lib/utils/jwt";
import type { Permission, Role } from "$lib/schemas/auth";
import * as eventLogService from "./eventLogService";
import * as crypto from "crypto";

/**
 * Login with email and password
 *
 * @param credentials - Login credentials
 * @param ipAddress - Client IP address
 * @param userAgent - Client user agent
 * @returns Result containing auth data or error
 */
export async function login(
  credentials: LoginInput,
  ipAddress?: string,
  userAgent?: string,
): Promise<Result<AuthData, AppError>> {
  // Validate input
  const validation = validateSchema(LoginInputSchema, credentials);
  if (!validation.success) {
    return err(validation.error);
  }

  const { email, password } = validation.value;

  try {
    // Fetch user by email
    const userResult = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("email", email).build(),
    });

    if (!userResult.success) {
      return err(userResult.error);
    }

    if (userResult.value.data.length === 0) {
      return err(UnauthorizedError.create("Invalid email or password"));
    }

    const user = userResult.value.data[0];

    // Check if user is active
    if (!user.is_active) {
      return err(UnauthorizedError.create("Account is deactivated"));
    }

    // Verify password
    if (!user.password_hash) {
      return err(
        UnauthorizedError.create(
          "Password not set. Please use password reset.",
        ),
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      // Log failed login attempt
      await logActivity(user.id, "login_failed", ipAddress, userAgent, {
        reason: "invalid_password",
      }).catch(console.error);

      // Log event to _bpm_event_log
      await eventLogService
        .logUserEvent("invalid_login_attempt", user.id, {
          newValues: {
            email: email,
            reason: "invalid_password",
          },
          metadata: {
            ip_address: ipAddress,
            user_agent: userAgent,
          },
        })
        .catch(console.error);

      return err(UnauthorizedError.create("Invalid email or password"));
    }

    // Fetch user roles and permissions in parallel (they're independent)
    // Pass user object to getUserPermissions to avoid re-fetching
    const [rolesResult, permissionsResult] = await Promise.all([
      getUserRoles(user.id),
      getUserPermissions(user.id, user),
    ]);

    if (!rolesResult.success) {
      return err(rolesResult.error);
    }

    if (!permissionsResult.success) {
      return err(permissionsResult.error);
    }

    const roles = rolesResult.value;
    const permissions = permissionsResult.value;

    // Generate session
    const sessionId = generateSecureToken();

    // Create token payload (optimized - no permissions/email to reduce token size)
    // Permissions are fetched server-side when needed (see hooks.server.ts)
    const tokenPayload: Omit<TokenPayload, "exp" | "iat"> = {
      userId: user.id,
      roles: roles.map((r) => r.name),
      sessionId,
      is_sysadmin: user.is_sysadmin || false,
    };

    // Generate tokens
    const token = await generateToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user.id, sessionId);
    const expiresAt = calculateExpirationTime();

    // Create session record
    const sessionResult = await insertRowResult<Session>("_auth_sessions", {
      session_id: sessionId,
      user_id: user.id,
      token,
      refresh_token: refreshToken,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    });

    if (!sessionResult.success) {
      return err(sessionResult.error);
    }

    // Update last login
    await updateRowsResult("_auth_users", filter().eq("id", user.id).build(), {
      last_login_at: new Date().toISOString(),
    }).catch(console.error);

    // Log successful login
    await logActivity(user.id, "login_success", ipAddress, userAgent, {
      sessionId,
    }).catch(console.error);

    // Return auth data
    const authData: AuthData = {
      token,
      refreshToken,
      user,
      roles,
      permissions,
      expiresAt,
    };

    return ok(authData);
  } catch (error) {
    console.error("Login error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Logout user by invalidating session
 *
 * @param sessionId - Session ID to invalidate
 * @returns Result with success or error
 */
export async function logout(
  sessionId: string,
): Promise<Result<void, AppError>> {
  try {
    // Delete session
    const deleteResult = await deleteRowsResult(
      "_auth_sessions",
      filter().eq("session_id", sessionId).build(),
    );

    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    return ok(undefined);
  } catch (error) {
    console.error("Logout error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Clear all sessions from the system
 * Used during registration to ensure clean state
 *
 * @returns Result with success status
 */
export async function clearAllSessions(): Promise<Result<void, AppError>> {
  try {
    // Delete all sessions from _auth_sessions table
    const deleteResult = await deleteRowsResult(
      "_auth_sessions",
      {}, // Empty filter deletes all rows
    );

    if (!deleteResult.success) {
      return err(deleteResult.error);
    }

    console.log("All sessions cleared from system");
    return ok(undefined);
  } catch (error) {
    console.error("Clear all sessions error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Verify session and get current user data
 *
 * @param token - JWT token
 * @returns Result containing auth data or error
 */
export async function verifySession(
  token: string,
): Promise<Result<AuthData, AppError>> {
  // Try to verify token - if expired, we'll check session and refresh if needed
  const tokenResult = await verifyToken(token);
  let payload: TokenPayload | null = null;
  let sessionId: string | null = null;

  if (tokenResult.success) {
    payload = tokenResult.value;
    sessionId = payload.sessionId;
  } else {
    // Token might be expired - try to extract session ID from token without verification
    // This allows us to check if session is still valid and refresh the token
    const decoded = decodeTokenUnsafe(token);
    if (decoded?.sessionId) {
      sessionId = decoded.sessionId;
    } else {
      // Can't decode token - return error
      return err(tokenResult.error);
    }
  }

  if (!sessionId) {
    return err(UnauthorizedError.create("Invalid token"));
  }

  // Check if session exists and is valid
  const sessionResult = await queryTableResult<Session>("_auth_sessions", {
    filter: filter().eq("session_id", sessionId).build(),
  });

  if (!sessionResult.success) {
    return err(sessionResult.error);
  }

  if (sessionResult.value.data.length === 0) {
    return err(UnauthorizedError.create("Session not found"));
  }

  const session = sessionResult.value.data[0];

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    return err(UnauthorizedError.create("Session expired"));
  }

  // If token was expired but session is valid, we need to get user info from session
  // Otherwise use the payload from token verification
  let userId: string;
  let userRoles: string[];
  let isSysadmin: boolean;

  if (payload) {
    userId = payload.userId;
    userRoles = payload.roles;
    isSysadmin = payload.is_sysadmin || false;
  } else {
    // Token expired - get user ID from session's user_id
    userId = session.user_id;
    // We'll fetch roles below
    userRoles = [];
    isSysadmin = false;
  }

  // Extend session expiration (sliding window - 4 hours from now)
  // This ensures sessions never expire while user is active
  const newExpiresAt = calculateExpirationTime();

  // Fetch user
  const userResult = await queryTableResult<User>("_auth_users", {
    filter: filter().eq("id", userId).build(),
  });

  if (!userResult.success) {
    return err(userResult.error);
  }

  if (userResult.value.data.length === 0) {
    return err(NotFoundError.resource("User", userId));
  }

  const user = userResult.value.data[0];

  // Check if user is still active
  if (!user.is_active) {
    return err(UnauthorizedError.create("Account is deactivated"));
  }

  // Fetch roles and permissions to generate new token with extended expiration
  const rolesResult = await getUserRoles(user.id);
  if (!rolesResult.success) {
    return err(rolesResult.error);
  }

  const permissionsResult = await getUserPermissions(user.id);
  const permissions = permissionsResult.success ? permissionsResult.value : [];

  // Generate new token with extended expiration to match session expiration
  const roles = rolesResult.value;
  const tokenPayload: Omit<TokenPayload, "exp" | "iat"> = {
    userId: user.id,
    roles: roles.map((r) => r.name),
    sessionId: sessionId,
    is_sysadmin: user.is_sysadmin || false,
  };

  const newToken = await generateToken(tokenPayload);

  // Update session with new token and extended expiration
  await updateRowsResult(
    "_auth_sessions",
    filter().eq("session_id", sessionId).build(),
    {
      token: newToken,
      last_activity_at: new Date().toISOString(),
      expires_at: newExpiresAt,
    },
  ).catch(console.error);

  // Return auth data with updated token and expiration
  const authData: AuthData = {
    token: newToken,
    refreshToken: session.refresh_token || undefined,
    user,
    roles,
    permissions,
    expiresAt: newExpiresAt, // Return the extended expiration time
  };

  return ok(authData);
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Refresh token
 * @returns Result containing new auth data or error
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<Result<AuthData, AppError>> {
  // Verify refresh token
  const tokenResult = await verifyToken(refreshToken);
  if (!tokenResult.success) {
    return err(tokenResult.error);
  }

  const payload = tokenResult.value as any;

  // Check if it's a refresh token
  if (payload.type !== "refresh") {
    return err(UnauthorizedError.create("Invalid refresh token"));
  }

  // Fetch session
  const sessionResult = await queryTableResult<Session>("_auth_sessions", {
    filter: filter().eq("session_id", payload.sessionId).build(),
  });

  if (!sessionResult.success) {
    return err(sessionResult.error);
  }

  if (sessionResult.value.data.length === 0) {
    return err(UnauthorizedError.create("Session not found"));
  }

  const session = sessionResult.value.data[0];

  // Fetch user with roles and permissions
  const userResult = await queryTableResult<User>("_auth_users", {
    filter: filter().eq("id", payload.userId).build(),
  });

  if (!userResult.success) {
    return err(userResult.error);
  }

  if (userResult.value.data.length === 0) {
    return err(NotFoundError.resource("User", payload.userId));
  }

  const user = userResult.value.data[0];

  if (!user.is_active) {
    return err(UnauthorizedError.create("Account is deactivated"));
  }

  // Fetch roles and permissions
  const rolesResult = await getUserRoles(user.id);
  if (!rolesResult.success) {
    return err(rolesResult.error);
  }

  const permissionsResult = await getUserPermissions(user.id);
  if (!permissionsResult.success) {
    return err(permissionsResult.error);
  }

  const roles = rolesResult.value;
  const permissions = permissionsResult.value;

  // Generate new access token (optimized - no permissions/email to reduce token size)
  const tokenPayload: Omit<TokenPayload, "exp" | "iat"> = {
    userId: user.id,
    roles: roles.map((r) => r.name),
    is_sysadmin: user.is_sysadmin || false,
    sessionId: payload.sessionId,
  };

  const newToken = await generateToken(tokenPayload);
  const expiresAt = calculateExpirationTime();

  // Update session with new token
  await updateRowsResult(
    "_auth_sessions",
    filter().eq("session_id", payload.sessionId).build(),
    {
      token: newToken,
      expires_at: expiresAt,
      last_activity_at: new Date().toISOString(),
    },
  ).catch(console.error);

  // Return new auth data
  const authData: AuthData = {
    token: newToken,
    refreshToken,
    user,
    roles,
    permissions,
    expiresAt,
  };

  return ok(authData);
}

/**
 * Get user roles
 *
 * @param userId - User ID
 * @returns Result containing array of roles
 */
export async function getUserRoles(
  userId: string,
): Promise<Result<Role[], AppError>> {
  try {
    // First, get role IDs from user_roles junction table
    const userRolesResult = await queryTableResult<{ role_id: number }>(
      "_auth_user_roles",
      { filter: filter().eq("user_id", userId).build() },
    );

    if (!userRolesResult.success) {
      return err(userRolesResult.error);
    }

    // If no roles, return empty array
    if (userRolesResult.value.data.length === 0) {
      return ok([]);
    }

    // Extract role IDs
    const roleIds = userRolesResult.value.data.map((ur) => ur.role_id);

    // Get roles by IDs
    const rolesResult = await queryTableResult<Role>("_auth_roles", {
      filter: filter().in("id", roleIds).build(),
    });

    if (!rolesResult.success) {
      return err(rolesResult.error);
    }

    return ok(rolesResult.value.data);
  } catch (error) {
    console.error("Get user roles error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get user permissions (aggregated from all roles)
 *
 * @param userId - User ID
 * @param user - Optional user object to avoid re-fetching
 * @returns Result containing array of permissions
 */
export async function getUserPermissions(
  userId: string,
  user?: User,
): Promise<Result<Permission[], AppError>> {
  try {
    // Check permission cache first
    const cacheKey = `permissions:${userId}`;
    const cached = permissionCache.get(cacheKey);
    if (cached !== null) {
      return ok(cached);
    }

    // Use provided user or fetch it
    let userData = user;
    if (!userData) {
      const userResult = await queryTableResult<User>("_auth_users", {
        filter: filter().eq("id", userId).build(),
      });

      if (!userResult.success) {
        return err(userResult.error);
      }

      if (userResult.value.data.length === 0) {
        return err(NotFoundError.resource("User", userId));
      }

      userData = userResult.value.data[0];
    }

    // If sysadmin, return all permissions
    if (userData.is_sysadmin) {
      const allPermissionsResult = await queryTableResult<Permission>(
        "_auth_permissions",
        {},
      );

      if (!allPermissionsResult.success) {
        return err(allPermissionsResult.error);
      }

      // Parse actions from JSON string to array
      const permissions = allPermissionsResult.value.data.map((p) => {
        let actions = p.actions as any;
        if (typeof actions === "string") {
          // Try to parse as JSON first
          try {
            actions = JSON.parse(actions);
          } catch {
            // If not valid JSON, treat as comma-separated string
            actions = (actions as string)
              .split(",")
              .map((a: string) => a.trim())
              .filter((a: string) => a.length > 0);
          }
        }
        return {
          ...p,
          actions: Array.isArray(actions) ? actions : [],
        };
      });

      // Cache sysadmin permissions
      permissionCache.set(cacheKey, permissions);
      return ok(permissions);
    }

    // First, get role IDs for the user
    const userRolesResult = await queryTableResult<{ role_id: number }>(
      "_auth_user_roles",
      { filter: filter().eq("user_id", userId).build() },
    );

    if (!userRolesResult.success) {
      return err(userRolesResult.error);
    }

    // If no roles, return empty array (cache it)
    if (userRolesResult.value.data.length === 0) {
      permissionCache.set(cacheKey, []);
      return ok([]);
    }

    // Extract role IDs
    const roleIds = userRolesResult.value.data.map((ur) => ur.role_id);

    // Get permission IDs from role_permissions junction table
    const rolePermissionsResult = await queryTableResult<{
      permission_id: number;
    }>("_auth_role_permissions", {
      filter: filter().in("role_id", roleIds).build(),
    });

    if (!rolePermissionsResult.success) {
      return err(rolePermissionsResult.error);
    }

    // If no permissions, return empty array (cache it)
    if (rolePermissionsResult.value.data.length === 0) {
      permissionCache.set(cacheKey, []);
      return ok([]);
    }

    // Extract unique permission IDs
    const permissionIds = [
      ...new Set(
        rolePermissionsResult.value.data.map((rp) => rp.permission_id),
      ),
    ];

    // Get permissions by IDs
    const permissionsResult = await queryTableResult<Permission>(
      "_auth_permissions",
      { filter: filter().in("id", permissionIds).build() },
    );

    if (!permissionsResult.success) {
      return err(permissionsResult.error);
    }

    // Parse actions from JSON string to array
    const permissions = permissionsResult.value.data.map((p) => {
      let actions = p.actions as any;
      if (typeof actions === "string") {
        // Try to parse as JSON first
        try {
          actions = JSON.parse(actions);
        } catch {
          // If not valid JSON, treat as comma-separated string
          actions = (actions as string)
            .split(",")
            .map((a: string) => a.trim())
            .filter((a: string) => a.length > 0);
        }
      }
      return {
        ...p,
        actions: Array.isArray(actions) ? actions : [],
      };
    });

    // Cache regular user permissions
    permissionCache.set(cacheKey, permissions);
    return ok(permissions);
  } catch (error) {
    console.error("Get user permissions error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Log user activity
 *
 * @param userId - User ID
 * @param activityType - Type of activity
 * @param ipAddress - IP address
 * @param userAgent - User agent
 * @param metadata - Additional metadata
 */
export async function logActivity(
  userId: string,
  activityType: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, any>,
): Promise<Result<void, AppError>> {
  try {
    await insertRowResult("_auth_user_activity", {
      user_id: userId,
      activity_type: activityType,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    });

    return ok(undefined);
  } catch (error) {
    console.error("Log activity error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Check if user has permission
 *
 * @param userId - User ID
 * @param route - Route to check
 * @param action - Action to check
 * @returns True if user has permission
 */
export async function hasPermission(
  userId: string,
  route: string,
  action: string,
): Promise<boolean> {
  try {
    // Check if user is sysadmin - sysadmins have all permissions
    const userResult = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("id", userId).build(),
    });

    if (userResult.success && userResult.value.data.length > 0) {
      const user = userResult.value.data[0];
      if (user.is_sysadmin) {
        return true; // Sysadmins can access everything
      }
    }

    const permissionsResult = await getUserPermissions(userId);
    if (!permissionsResult.success) {
      return false;
    }

    const permissions = permissionsResult.value;

    return permissions.some((p) => {
      let actions = p.actions as any;
      if (typeof actions === "string") {
        try {
          actions = JSON.parse(actions);
        } catch {
          // If not valid JSON, treat as comma-separated string
          actions = (actions as string)
            .split(",")
            .map((a: string) => a.trim())
            .filter((a: string) => a.length > 0);
        }
      }
      return (
        p.route === route &&
        Array.isArray(actions) &&
        actions.includes(action as any)
      );
    });
  } catch (error) {
    console.error("Has permission error:", error);
    return false;
  }
}

/**
 * Change user password
 *
 * @param userId - User ID
 * @param data - Password change data (current password, new password, confirm password)
 * @returns Result with success or error
 */
export async function changePassword(
  userId: string,
  data: ChangePasswordInput,
): Promise<Result<void, AppError>> {
  // Validate input
  const validation = validateSchema(ChangePasswordInputSchema, data);
  if (!validation.success) {
    return err(validation.error);
  }

  const { currentPassword, newPassword } = validation.value;

  try {
    // Fetch user
    const userResult = await queryTableResult<User>("_auth_users", {
      filter: filter().eq("id", userId).build(),
    });

    if (!userResult.success) {
      return err(userResult.error);
    }

    if (userResult.value.data.length === 0) {
      return err(NotFoundError.resource("User", userId));
    }

    const user = userResult.value.data[0];

    // Check if user has a password set
    if (!user.password_hash) {
      return err(
        ValidationError.create(
          "No password set. Please use password reset.",
          "currentPassword",
          "",
        ),
      );
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.password_hash,
    );
    if (!isValidPassword) {
      // Log failed password change attempt
      await logActivity(
        userId,
        "password_change_failed",
        undefined,
        undefined,
        { reason: "invalid_current_password" },
      ).catch(console.error);

      return err(UnauthorizedError.create("Huidig wachtwoord is onjuist"));
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    const updateResult = await updateRowsResult(
      "_auth_users",
      filter().eq("id", userId).build(),
      {
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      },
    );

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    // Log successful password change
    await logActivity(
      userId,
      "password_change_success",
      undefined,
      undefined,
      {},
    ).catch(console.error);

    return ok(undefined);
  } catch (error) {
    console.error("Change password error:", error);
    return err(NetworkError.from(error));
  }
}
