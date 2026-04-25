/**
 * API Token Service - Manages persistent API tokens for MCP server authentication
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
import { encrypt, decrypt } from "$lib/utils/encryption";
import type { AppError } from "$lib/types/errors";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";
import { generateSecureToken } from "$lib/utils/password";
import * as crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Database row shape for _auth_api_tokens */
interface ApiTokenRow {
  id: number;
  user_id: string;
  name: string;
  token_hash: string;
  token_prefix: string;
  token_encrypted: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape returned by createToken – plain-text token is only exposed once */
export interface CreatedApiToken {
  token: string;
  id: number;
  name: string;
  token_prefix: string;
  created_at: string;
}

/** Shape returned by listTokens – hash is never included */
export interface ApiTokenInfo {
  id: number;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

/** Shape returned by verifyApiToken */
export interface VerifiedApiTokenUser {
  userId: string;
  is_sysadmin: boolean;
  roles: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TOKENS_PER_USER = 5;
const TOKEN_BYTE_LENGTH = 48;
const TOKEN_PREFIX_LENGTH = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Hash a plain-text token with SHA-256.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Extract the first N characters of a token for identification purposes.
 */
function tokenPrefix(token: string): string {
  return token.substring(0, TOKEN_PREFIX_LENGTH);
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

/**
 * Create a new API token for the given user.
 *
 * The plain-text token is returned **only** by this method. Store it
 * immediately – it cannot be retrieved later.
 *
 * @param userId  - Owner of the token
 * @param name    - Human-readable label (defaults to "MCP Token")
 * @returns Result containing the created token info with plain-text token
 */
export async function createToken(
  userId: string,
  name?: string,
): Promise<Result<CreatedApiToken, AppError>> {
  // ----- Validate input -----
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("User ID is required", "user_id", userId),
    );
  }

  const tokenName = name?.trim() || "MCP Token";

  // ----- Enforce token limit per user -----
  const existingResult = await queryTableResult<ApiTokenRow>(
    "_auth_api_tokens",
    {
      filter: filter().eq("user_id", userId).build(),
    },
  );

  if (!existingResult.success) {
    return err(existingResult.error);
  }

  if (existingResult.value.data.length >= MAX_TOKENS_PER_USER) {
    return err(
      ValidationError.create(
        `Maximum of ${MAX_TOKENS_PER_USER} API tokens reached. Revoke an existing token first.`,
        "tokens",
        existingResult.value.data.length,
      ),
    );
  }

  // ----- Generate & hash token -----
  const plainToken = generateSecureToken(TOKEN_BYTE_LENGTH);
  const hashed = hashToken(plainToken);
  const prefix = tokenPrefix(plainToken);

  // ----- Persist -----
  const encrypted = encrypt(plainToken);

  const insertResult = await insertRowResult<ApiTokenRow>("_auth_api_tokens", {
    user_id: userId,
    name: tokenName,
    token_hash: hashed,
    token_prefix: prefix,
    token_encrypted: encrypted,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (!insertResult.success) {
    return err(insertResult.error);
  }

  const row = insertResult.value;

  return ok({
    token: plainToken,
    id: row.id,
    name: row.name,
    token_prefix: row.token_prefix,
    created_at: row.created_at,
  });
}

/**
 * List all API tokens for a user.
 *
 * The token hash is never included in the response.
 *
 * @param userId - Owner of the tokens
 * @returns Result containing an array of token info objects
 */
export async function listTokens(
  userId: string,
): Promise<Result<ApiTokenInfo[], AppError>> {
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("User ID is required", "user_id", userId),
    );
  }

  const result = await queryTableResult<ApiTokenRow>("_auth_api_tokens", {
    select: "id,name,token_prefix,last_used_at,created_at,expires_at",
    filter: filter().eq("user_id", userId).build(),
    order: "created_at.desc",
  });

  if (!result.success) {
    return err(result.error);
  }

  const tokens: ApiTokenInfo[] = result.value.data.map((row) => ({
    id: row.id,
    name: row.name,
    token_prefix: row.token_prefix,
    last_used_at: row.last_used_at,
    created_at: row.created_at,
    expires_at: row.expires_at,
  }));

  return ok(tokens);
}

/**
 * Revoke (delete) an API token.
 *
 * Only the owning user can revoke their own tokens.
 *
 * @param userId - Owner of the token
 * @param tokenId - ID of the token to revoke
 * @returns Result containing void on success
 */
export async function revokeToken(
  userId: string,
  tokenId: number,
): Promise<Result<void, AppError>> {
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("User ID is required", "user_id", userId),
    );
  }

  if (!tokenId || typeof tokenId !== "number") {
    return err(
      ValidationError.create("Token ID is required", "token_id", tokenId),
    );
  }

  const deleteResult = await deleteRowsResult("_auth_api_tokens", {
    user_id: `eq.${userId}`,
    id: `eq.${tokenId}`,
  });

  if (!deleteResult.success) {
    return err(deleteResult.error);
  }

  return ok(undefined);
}

/**
 * Reveal the plaintext API token for a given token ID.
 *
 * Decrypts the stored encrypted token. Only works for tokens created
 * after the token_encrypted column was added.
 *
 * @param userId - Owner of the token (for authorization)
 * @param tokenId - ID of the token to reveal
 * @returns Result containing the plaintext token string
 */
export async function revealToken(
  userId: string,
  tokenId: number,
): Promise<Result<string, AppError>> {
  if (!userId || userId.trim() === "") {
    return err(
      ValidationError.create("User ID is required", "user_id", userId),
    );
  }

  if (!tokenId || typeof tokenId !== "number") {
    return err(
      ValidationError.create("Token ID is required", "token_id", tokenId),
    );
  }

  const result = await queryTableResult<ApiTokenRow>("_auth_api_tokens", {
    select: "id,user_id,token_encrypted",
    filter: filter().eq("id", tokenId).eq("user_id", userId).build(),
    limit: 1,
  });

  if (!result.success) {
    return err(result.error);
  }

  if (result.value.data.length === 0) {
    return err(NotFoundError.create("API token not found"));
  }

  const row = result.value.data[0];

  if (!row.token_encrypted) {
    return err(
      ValidationError.create(
        "This token was created before encrypted storage was enabled. Please refresh the token to enable revealing.",
        "token_encrypted",
        null,
      ),
    );
  }

  try {
    const plaintext = decrypt(row.token_encrypted);
    return ok(plaintext);
  } catch (error) {
    console.error("[apiTokenService] Failed to decrypt token:", error);
    return err(
      ValidationError.create(
        "Failed to decrypt token",
        "token_encrypted",
        null,
      ),
    );
  }
}

/**
 * Verify an API token and return the associated user information.
 *
 * This method:
 * 1. Hashes the provided token and looks it up in `_auth_api_tokens`
 * 2. Checks expiration
 * 3. Fetches user info from `_auth_users`
 * 4. Fetches roles from `_auth_user_roles` + `_auth_roles`
 * 5. Updates `last_used_at`
 *
 * @param token - The plain-text API token to verify
 * @returns Result containing user ID, sysadmin flag, and role names
 */
export async function verifyApiToken(
  token: string,
): Promise<Result<VerifiedApiTokenUser, AppError>> {
  // ----- Validate input -----
  if (!token || token.trim() === "") {
    return err(ValidationError.create("Token is required", "token", undefined));
  }

  // ----- Hash & look up token -----
  const hashed = hashToken(token);

  const tokenResult = await queryTableResult<ApiTokenRow>("_auth_api_tokens", {
    filter: filter().eq("token_hash", hashed).build(),
    limit: 1,
  });

  if (!tokenResult.success) {
    return err(tokenResult.error);
  }

  if (tokenResult.value.data.length === 0) {
    return err(NotFoundError.create("API token not found"));
  }

  const tokenRow = tokenResult.value.data[0];

  // ----- Check expiration -----
  if (tokenRow.expires_at) {
    const expiresAt = new Date(tokenRow.expires_at);
    const now = new Date();

    if (isNaN(expiresAt.getTime())) {
      return err(
        ValidationError.create(
          "Invalid token expiration date",
          "expires_at",
          tokenRow.expires_at,
        ),
      );
    }

    if (now.getTime() > expiresAt.getTime()) {
      return err(UnauthorizedError.create("API token has expired"));
    }
  }

  // ----- Fetch user to confirm active status -----
  const userResult = await queryTableResult<{
    id: string;
    is_sysadmin: boolean;
  }>("_auth_users", {
    filter: filter().eq("id", tokenRow.user_id).build(),
    limit: 1,
  });

  if (!userResult.success) {
    return err(userResult.error);
  }

  if (userResult.value.data.length === 0) {
    return err(
      NotFoundError.create("User associated with API token not found"),
    );
  }

  const user = userResult.value.data[0];

  // ----- Fetch roles -----
  // Step 1: Get role IDs from _auth_user_roles
  const userRolesResult = await queryTableResult<{ role_id: number }>(
    "_auth_user_roles",
    {
      filter: filter().eq("user_id", user.id).build(),
    },
  );

  let roles: string[] = [];

  if (userRolesResult.success && userRolesResult.value.data.length > 0) {
    const roleIds = userRolesResult.value.data.map((ur) => ur.role_id);

    // Step 2: Get role names from _auth_roles
    if (roleIds.length > 0) {
      const rolesResult = await queryTableResult<{ name: string }>(
        "_auth_roles",
        {
          filter: filter().in("id", roleIds).build(),
        },
      );

      if (rolesResult.success) {
        roles = rolesResult.value.data.map((r) => r.name);
      }
    }
  }

  // ----- Update last_used_at (fire-and-forget, don't block the response) -----
  updateRowsResult<ApiTokenRow>(
    "_auth_api_tokens",
    { id: `eq.${tokenRow.id}` },
    { last_used_at: new Date().toISOString() },
  ).catch((error) => {
    console.error("[apiTokenService] Failed to update last_used_at:", error);
  });

  // ----- Return verified user info -----
  return ok({
    userId: user.id,
    is_sysadmin: user.is_sysadmin ?? false,
    roles,
  });
}
