/**
 * Public sharing service - Manage public sharing for work items, cases, and projects
 * 
 * All service methods return Result<T, AppError> for consistent error handling.
 */
import { 
  queryTableResult, 
  updateRowsResult, 
  getRowByIdResult 
} from '$lib/utils/postgrest';
import * as eventLogService from './eventLogService';
import type { AppError } from '$lib/types/errors';
import { ValidationError, NotFoundError } from '$lib/types/errors';
import { ok, err, type Result } from '$lib/types/result';

export type EntityType = 'work_item' | 'case' | 'project';

/**
 * Table name mapping for entity types
 */
const ENTITY_TABLES: Record<EntityType, string> = {
  work_item: '_bpm_tasks', // Work items are stored in _bpm_tasks with task_type = 'manual'
  case: '_bpm_cases',
  project: '_bpm_projects'
};

/**
 * Generate a secure random token using crypto
 * Returns a URL-safe base64 encoded string (32 bytes = 43 chars)
 * Works in both browser and Node.js environments
 */
function generatePublicToken(): string {
  // Use Web Crypto API (available in both browser and Node.js 15+)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    // Convert to base64url (URL-safe base64)
    const base64 = btoa(String.fromCharCode(...array));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  
  // Fallback for older Node.js environments
  try {
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(32).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch {
    // Last resort: generate a simple random string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let token = '';
    for (let i = 0; i < 43; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

/**
 * Get entity by public token
 * 
 * @param entityType - Type of entity ('work_item', 'case', or 'project')
 * @param token - Public token
 * @returns Result containing entity data, or error if not found or expired
 */
export async function getPublicEntity(
  entityType: EntityType,
  token: string
): Promise<Result<any, AppError>> {
  if (!token || token.length < 10) {
    return err(ValidationError.create('Invalid public token', 'token', token));
  }

  const tableName = ENTITY_TABLES[entityType];
  if (!tableName) {
    return err(ValidationError.create('Invalid entity type', 'entityType', entityType));
  }

  // Query entity by token
  // For work items (_bpm_tasks), filter by task_type = 'manual' to only get work items, not case tasks
  const filter: Record<string, string> = {
    public_token: `eq.${token}`,
    is_public: 'eq.true'
  };
  
  if (entityType === 'work_item') {
    filter.task_type = `eq.manual`;
  }
  
  const result = await queryTableResult<any>(tableName, {
    filter,
    limit: 1
  });

  if (!result.success) {
    return err(result.error);
  }

  if (result.value.data.length === 0) {
    return err(NotFoundError.resource('Public entity', token));
  }

  const entity = result.value.data[0];

  // Check expiration if set
  if (entity.public_token_expires_at) {
    const expiresAt = new Date(entity.public_token_expires_at);
    const now = new Date();
    if (now > expiresAt) {
      return err(NotFoundError.resource('Public entity', token));
    }
  }

  return ok(entity);
}

/**
 * Validate public token
 * 
 * @param entityType - Type of entity
 * @param token - Public token
 * @returns Result containing true if valid, or error if invalid/expired
 */
export async function validatePublicToken(
  entityType: EntityType,
  token: string
): Promise<Result<boolean, AppError>> {
  const result = await getPublicEntity(entityType, token);
  if (result.success) {
    return ok(true);
  }
  return err(result.error);
}

/**
 * Toggle public sharing for an entity
 * 
 * @param entityType - Type of entity ('work_item', 'case', or 'project')
 * @param entityId - Entity ID
 * @param isPublic - Whether to enable or disable public sharing
 * @param userId - User ID performing the action (for event logging)
 * @param sourceUrl - Optional source URL for event logging
 * @returns Result containing updated entity with sharing status, or error
 */
export async function togglePublicSharing(
  entityType: EntityType,
  entityId: number,
  isPublic: boolean,
  userId?: string,
  sourceUrl?: string
): Promise<Result<any, AppError>> {
  const tableName = ENTITY_TABLES[entityType];
  if (!tableName) {
    return err(ValidationError.create('Invalid entity type', 'entityType', entityType));
  }

  // Get current entity state
  const currentResult = await getRowByIdResult<any>(tableName, entityId);
  if (!currentResult.success) {
    return err(currentResult.error);
  }

  const currentEntity = currentResult.value;
  const oldIsPublic = currentEntity.is_public || false;
  const oldToken = currentEntity.public_token || null;

  // Prepare update data
  let updateData: Record<string, any> = {
    is_public: isPublic,
    updated_at: new Date().toISOString()
  };

  if (isPublic) {
    // Generate new token if enabling sharing
    if (!oldToken) {
      updateData.public_token = generatePublicToken();
    }
    // Keep existing token if already public
  } else {
    // Clear token when disabling sharing
    updateData.public_token = null;
    updateData.public_token_expires_at = null;
  }

  // Update entity
  const updateResult = await updateRowsResult<any>(tableName, { id: `eq.${entityId}` }, updateData);
  if (!updateResult.success) {
    return err(updateResult.error);
  }

  const updatedEntity = updateResult.value[0];

  // Log event to _bpm_event_log
  const eventType = isPublic ? 'entity_shared' : 'entity_unshared';
  const publicUrl = isPublic && updatedEntity.public_token
    ? `/${entityType === 'work_item' ? 'work' : entityType === 'case' ? 'cases' : 'projects'}/${entityId}/public/${updatedEntity.public_token}`
    : null;

  await eventLogService.logEvent(
    eventType,
    entityType,
    entityId,
    {
      oldValues: {
        is_public: oldIsPublic,
        public_token: oldToken
      },
      newValues: {
        is_public: isPublic,
        public_token: updatedEntity.public_token || null
      },
      metadata: {
        public_url: publicUrl
      },
      userId,
      sourceUrl
    }
  ).catch(console.error); // Don't fail if logging fails

  return ok(updatedEntity);
}

/**
 * Get current public sharing status for an entity
 * 
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @returns Result containing sharing status and public URL, or error
 */
export async function getPublicSharingStatus(
  entityType: EntityType,
  entityId: number
): Promise<Result<{ isPublic: boolean; token: string | null; publicUrl: string | null }, AppError>> {
  const tableName = ENTITY_TABLES[entityType];
  if (!tableName) {
    return err(ValidationError.create('Invalid entity type', 'entityType', entityType));
  }

  const result = await getRowByIdResult<any>(tableName, entityId);
  if (!result.success) {
    // If entity not found, return default status instead of error
    // This allows the component to work even if entity doesn't exist yet
    return ok({
      isPublic: false,
      token: null,
      publicUrl: null
    });
  }

  const entity = result.value;
  const isPublic = entity.is_public || false;
  const token = entity.public_token || null;

  let publicUrl: string | null = null;
  if (isPublic && token) {
    const routePrefix = entityType === 'work_item' ? 'work' : entityType === 'case' ? 'cases' : 'projects';
    publicUrl = `/${routePrefix}/${entityId}/public/${token}`;
  }

  return ok({
    isPublic,
    token,
    publicUrl
  });
}

