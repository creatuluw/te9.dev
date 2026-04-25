/**
 * Audit Service - GDPR-compliant activity logging
 *
 * All service methods return Result<T, AppError> for consistent error handling.
 * Logs all data access and user actions for compliance and security monitoring.
 */

import {
  queryTableResult,
  insertRowResult,
  filter,
} from "$lib/utils/postgrest";
import type { AppError } from "$lib/types/errors";
import { NetworkError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";

interface ActivityLog {
  id?: number;
  user_id: string;
  activity_type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  action?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
}

/**
 * Log data access event
 *
 * @param userId - User performing the access
 * @param resource - Resource type (e.g., 'user', 'case', 'process')
 * @param resourceId - ID of the resource accessed
 * @param action - Action performed (e.g., 'view', 'list', 'search')
 * @param metadata - Additional context
 * @returns Result indicating success or error
 */
export async function logDataAccess(
  userId: string,
  resource: string,
  resourceId: string,
  action: string,
  metadata?: Record<string, any>,
): Promise<Result<void, AppError>> {
  return logActivity(userId, "data_access", {
    resource_type: resource,
    resource_id: resourceId,
    action,
    ...metadata,
  });
}

/**
 * Log user action event
 *
 * @param userId - User performing the action
 * @param action - Action type (e.g., 'login', 'logout', 'create_user', 'update_role')
 * @param metadata - Additional context
 * @returns Result indicating success or error
 */
export async function logUserAction(
  userId: string,
  action: string,
  metadata?: Record<string, any>,
): Promise<Result<void, AppError>> {
  return logActivity(userId, "user_action", {
    action,
    ...metadata,
  });
}

/**
 * Generic activity logging function
 *
 * @param userId - User ID
 * @param activityType - Type of activity
 * @param details - Activity details
 * @returns Result indicating success or error
 */
export async function logActivity(
  userId: string,
  activityType: string,
  details?: {
    resource_type?: string;
    resource_id?: string;
    action?: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
  },
): Promise<Result<void, AppError>> {
  try {
    const logEntry: ActivityLog = {
      user_id: userId,
      activity_type: activityType,
      resource_type: details?.resource_type || null,
      resource_id: details?.resource_id || null,
      action: details?.action || null,
      ip_address: details?.ip_address || null,
      user_agent: details?.user_agent || null,
      metadata: details?.metadata || null,
    };

    await insertRowResult("_auth_user_activity", logEntry);

    return ok(undefined);
  } catch (error) {
    console.error("Log activity error:", error);
    // Don't fail the main operation if logging fails
    return ok(undefined);
  }
}

/**
 * Get activity log for a specific user
 *
 * @param userId - User ID
 * @param options - Query options
 * @returns Result containing activity logs
 */
export async function getUserActivityLog(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    activityType?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<Result<ActivityLog[], AppError>> {
  try {
    const {
      limit = 50,
      offset = 0,
      activityType,
      startDate,
      endDate,
    } = options || {};

    let filterObj = filter().eq("user_id", userId);

    if (activityType) {
      filterObj = filterObj.eq("activity_type", activityType);
    }

    if (startDate) {
      filterObj = filterObj.gte("created_at", startDate);
    }

    if (endDate) {
      filterObj = filterObj.lte("created_at", endDate);
    }

    const result = await queryTableResult<ActivityLog>("_auth_user_activity", {
      filter: filterObj.build(),
      order: "created_at.desc",
      limit,
      offset,
    });

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value.data);
  } catch (error) {
    console.error("Get user activity log error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get system-wide activity log (admin only)
 *
 * @param options - Query options
 * @returns Result containing activity logs
 */
export async function getSystemActivityLog(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  activityType?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Result<ActivityLog[], AppError>> {
  try {
    const {
      limit = 100,
      offset = 0,
      userId,
      activityType,
      resourceType,
      startDate,
      endDate,
    } = options || {};

    let filterObj = filter();

    if (userId) {
      filterObj = filterObj.eq("user_id", userId);
    }

    if (activityType) {
      filterObj = filterObj.eq("activity_type", activityType);
    }

    if (resourceType) {
      filterObj = filterObj.eq("resource_type", resourceType);
    }

    if (startDate) {
      filterObj = filterObj.gte("created_at", startDate);
    }

    if (endDate) {
      filterObj = filterObj.lte("created_at", endDate);
    }

    const result = await queryTableResult<ActivityLog>("_auth_user_activity", {
      filter: filterObj.build(),
      order: "created_at.desc",
      limit,
      offset,
    });

    if (!result.success) {
      return err(result.error);
    }

    return ok(result.value.data);
  } catch (error) {
    console.error("Get system activity log error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Export activity log for a user (GDPR compliance)
 *
 * @param userId - User ID
 * @returns Result containing CSV string of activity logs
 */
export async function exportActivityLog(
  userId: string,
): Promise<Result<string, AppError>> {
  try {
    const result = await getUserActivityLog(userId, { limit: 10000 });

    if (!result.success) {
      return err(result.error);
    }

    const logs = result.value;

    // Generate CSV
    const headers = [
      "Date/Time",
      "Activity Type",
      "Resource Type",
      "Resource ID",
      "Action",
      "IP Address",
      "User Agent",
      "Metadata",
    ];

    const rows = logs.map((log) => [
      log.created_at || "",
      log.activity_type || "",
      log.resource_type || "",
      log.resource_id || "",
      log.action || "",
      log.ip_address || "",
      log.user_agent || "",
      log.metadata ? JSON.stringify(log.metadata) : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return ok(csv);
  } catch (error) {
    console.error("Export activity log error:", error);
    return err(NetworkError.from(error));
  }
}

/**
 * Get activity statistics
 *
 * @param options - Query options
 * @returns Result containing activity statistics
 */
export async function getActivityStatistics(options?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<
  Result<
    {
      totalActivities: number;
      byType: Record<string, number>;
      byResource: Record<string, number>;
      recentActivity: ActivityLog[];
    },
    AppError
  >
> {
  try {
    const { userId, startDate, endDate } = options || {};

    // Get logs
    const logsResult = await (userId
      ? getUserActivityLog(userId, { limit: 1000, startDate, endDate })
      : getSystemActivityLog({ limit: 1000, startDate, endDate }));

    if (!logsResult.success) {
      return err(logsResult.error);
    }

    const logs = logsResult.value;

    // Calculate statistics
    const byType: Record<string, number> = {};
    const byResource: Record<string, number> = {};

    for (const log of logs) {
      // Count by activity type
      if (log.activity_type) {
        byType[log.activity_type] = (byType[log.activity_type] || 0) + 1;
      }

      // Count by resource type
      if (log.resource_type) {
        byResource[log.resource_type] =
          (byResource[log.resource_type] || 0) + 1;
      }
    }

    return ok({
      totalActivities: logs.length,
      byType,
      byResource,
      recentActivity: logs.slice(0, 10),
    });
  } catch (error) {
    console.error("Get activity statistics error:", error);
    return err(NetworkError.from(error));
  }
}
