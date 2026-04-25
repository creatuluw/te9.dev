/**
 * JWT Token utilities
 */

import { SignJWT, jwtVerify, decodeJwt, type JWTPayload } from 'jose';
import type { TokenPayload } from '$lib/schemas/auth';
import type { AppError } from '$lib/types/errors';
import { UnauthorizedError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET || 'default-dev-secret-change-in-production';
const JWT_EXPIRY = env.JWT_EXPIRY || '4h';
const REFRESH_TOKEN_EXPIRY = env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Convert duration string to seconds
 * @param duration - Duration string like '1h', '7d', '30m'
 * @returns Duration in seconds
 */
function durationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default 1 hour
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 3600;
  }
}

/**
 * Generate JWT token
 * @param payload - Token payload
 * @param expiresIn - Expiration duration (default: JWT_EXPIRY)
 * @returns JWT token string
 */
export async function generateToken(
  payload: Omit<TokenPayload, 'exp' | 'iat'>,
  expiresIn: string = JWT_EXPIRY
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
  
  return token;
}

/**
 * Generate refresh token
 * @param userId - User ID
 * @param sessionId - Session ID
 * @returns Refresh token string
 */
export async function generateRefreshToken(
  userId: string,
  sessionId: string
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT({ userId, sessionId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);
  
  return token;
}

/**
 * Verify and decode JWT token
 * @param token - JWT token string
 * @returns Result containing decoded token payload or error
 */
export async function verifyToken(token: string): Promise<Result<TokenPayload, AppError>> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Validate required fields
    if (!payload.userId || !payload.sessionId) {
      return err(UnauthorizedError.create('Invalid token payload'));
    }
    
    return ok(payload as unknown as TokenPayload);
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      return err(UnauthorizedError.create('Token expired'));
    }
    return err(UnauthorizedError.create('Invalid token'));
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Calculate token expiration timestamp
 * @param expiresIn - Expiration duration
 * @returns ISO timestamp when token expires
 */
export function calculateExpirationTime(expiresIn: string = JWT_EXPIRY): string {
  const seconds = durationToSeconds(expiresIn);
  const expirationDate = new Date(Date.now() + seconds * 1000);
  return expirationDate.toISOString();
}

/**
 * Check if token is expired
 * @param expiresAt - Expiration timestamp (ISO string)
 * @returns True if expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Decode JWT token without verification (for extracting session ID from expired tokens)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeTokenUnsafe(token: string): { sessionId?: string; userId?: string } | null {
  try {
    const decoded = decodeJwt(token);
    return {
      sessionId: decoded.sessionId as string | undefined,
      userId: decoded.userId as string | undefined
    };
  } catch {
    return null;
  }
}

