/**
 * Server hooks for SvelteKit
 * Handles authentication, authorization, and security
 */

import type { Handle } from "@sveltejs/kit";
import { verifyToken } from "$lib/utils/jwt";
import * as authService from "$lib/services/authService";
import {
  getRoutePermission,
  isPublicRoute as isPublicRouteFromConfig,
} from "$lib/config/routes";
import { autoSyncPermissions } from "$lib/services/autoSyncPermissions";
import { queryTableResult } from "$lib/utils/postgrest";
import { filter } from "$lib/utils/postgrest";
import type { User } from "$lib/schemas/auth";
import { createCache } from "$lib/utils/serverCache";
import { startTimer, logPerformance } from "$lib/utils/perfLogger";

// Common paths that security scanners/bots probe for
const SECURITY_PROBE_PATHS = [
  "/.env",
  "/.env.local",
  "/.env.production",
  "/.env.development",
  "/.git/config",
  "/.git/HEAD",
  "/wp-admin",
  "/wp-login.php",
  "/phpmyadmin",
  "/config.php",
  "/web.config",
];

/**
 * Check if a path is a security probe
 */
function isSecurityProbe(path: string): boolean {
  return SECURITY_PROBE_PATHS.some(
    (probePath) => path === probePath || path.startsWith(probePath),
  );
}

/**
 * Check if route is public (doesn't require authentication)
 */
function isPublicRoute(path: string): boolean {
  // Explicit check for public sharing routes FIRST (most specific)
  // Pattern: /{entity}/{id}/public/{token}
  const publicSharingPattern =
    /^\/(work|cases|projects)\/[^/]+\/public\/[^/]+$/;
  if (publicSharingPattern.test(path)) {
    if (import.meta.env.DEV) {
      console.log(`[hooks.server] Public sharing route detected: ${path}`);
    }
    return true;
  }

  // Check routes.ts
  if (isPublicRouteFromConfig(path)) {
    return true;
  }

  // Fallback: check common public routes (for onboarding and general usage)
  const publicRoutes = [
    // Error pages
    "/401",
    "/403",
    "/404",
    "/500",
    // Authentication & onboarding pages
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/help",
    // Authentication API endpoints
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/password/forgot",
    "/api/auth/password/reset",
    "/api/auth/refresh",
    "/api/auth/verify-email",
    "/api/help/generate-link",
    // File upload/delete endpoints (needed for public help page where unauthenticated users attach files)
    "/api/files/upload",
    "/api/files/delete",
    // Public user name endpoint for attribution (no auth required)
    "/api/public/users",
    // Email endpoints (called server-side by emailService or by external services, no auth possible)
    "/api/email/send",
    "/api/email/track/open",
    "/api/email/track/click",
    "/api/email/webhooks/maileroo",
  ];

  return publicRoutes.some((route) => {
    // Exact match or starts with for dynamic routes
    return path === route || path.startsWith(route);
  });
}

/**
 * Extract JWT token from cookies or authorization header
 */
function extractToken(event: any): string | null {
  // Try authorization header first (for API requests)
  const authHeader = event.request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try cookie (for page requests)
  const token = event.cookies.get("auth_token");
  return token || null;
}

/**
 * Check if a route only requires authentication (no specific permissions)
 *
 * These routes verify the user is authenticated but never check specific permissions:
 * - /api/auth/me - get current user info
 * - /api/users/public - fetch user list for dropdowns/selectors
 * - /api/files/upload - upload files
 * - /api/files/delete - delete files
 * - /api/subscriptions - manage message subscriptions
 * - /api/subscriptions/* - subscription CRUD operations
 * - /api/messages/* - SSE notifications and message search
 * - /api/{entity}/{id}/public - fetch public entity data
 *
 * Exported for testability.
 */
export function isAuthOnlyRoute(path: string): boolean {
  return (
    path === "/api/users/public" ||
    path === "/api/auth/me" ||
    path === "/api/auth/api-tokens" ||
    path.startsWith("/api/auth/api-tokens/") ||
    path === "/api/files/upload" ||
    path === "/api/files/delete" ||
    path === "/api/subscriptions" ||
    path.startsWith("/api/subscriptions/") ||
    path.startsWith("/api/messages/") ||
    /^\/api\/(cases|work|projects)\/\d+\/public$/.test(path)
  );
}

// Auto-sync permissions on first request (server startup)
let permissionsSynced = false;

// Cache for sysadmin checks (old tokens without is_sysadmin field)
// TTL of 60s — sysadmin status changes very rarely
const sysadminCache = createCache<boolean>(60000);

/**
 * Server handle hook
 * Handles authentication, authorization, and security
 */
export const handle: Handle = async ({ event, resolve }) => {
  /**
   * Resolve event with increased max request size for file uploads
   * Default SvelteKit limit is 512KB, we increase to 50MB
   *
   * IMPORTANT: Apply maxRequestSize to ALL requests to ensure body parser
   * uses the increased limit before any parsing happens.
   */
  const resolveWithLargeBody = (evt: typeof event) => {
    return resolve(evt, {
      maxRequestSize: 50 * 1024 * 1024, // 50MB - applies to all requests
    } as any); // Type assertion needed - maxRequestSize is valid but types may be outdated
  };

  // Start performance timer for authenticated request tracking
  const timer = startTimer();

  // Auto-sync permissions on first request if new routes detected
  if (!permissionsSynced) {
    permissionsSynced = true;
    // Run async without blocking request
    autoSyncPermissions()
      .then((result) => {
        if (result.success && result.value) {
          console.log(
            `✅ Auto-synced ${result.value.created} new permissions, updated ${result.value.updated}`,
          );
        }
      })
      .catch((error) => {
        console.error("Auto-sync permissions error:", error);
      });
  }

  const path = event.url.pathname;

  // Silently handle security probe requests
  if (isSecurityProbe(path)) {
    return new Response("Not Found", { status: 404 });
  }

  // Initialize locals
  event.locals.user = null;
  event.locals.permissions = [];
  event.locals.roles = [];

  // Skip auth check for public routes
  if (isPublicRoute(path)) {
    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] Public route detected: ${path} - skipping authentication`,
      );
    }
    return resolveWithLargeBody(event);
  }

  // Extract token
  const token = extractToken(event);

  // Check if route requires authentication (using routes.ts)
  const routePermission = getRoutePermission(path, event.request.method);
  const requiresAuth = routePermission !== null && !isPublicRoute(path);

  if (!requiresAuth) {
    // Route doesn't require auth - continue
    return resolveWithLargeBody(event);
  }

  // No token - unauthorized
  if (!token) {
    if (path.startsWith("/api/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    // Redirect to login with return URL
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?redirect=${encodeURIComponent(path)}` },
    });
  }

  // Verify token
  const tokenResult = await verifyToken(token);
  if (!tokenResult.success) {
    // Invalid token
    if (path.startsWith("/api/")) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    // Redirect to login
    return new Response(null, {
      status: 302,
      headers: { Location: `/login?redirect=${encodeURIComponent(path)}` },
    });
  }

  const payload = tokenResult.value;

  // Check if user is sysadmin - sysadmins bypass all permission checks
  let isSysadmin = false;

  if (payload.is_sysadmin === true) {
    // Fast path: JWT says sysadmin — trust it, skip DB
    isSysadmin = true;
    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] User ${payload.userId} is sysadmin (from token)`,
      );
    }
  } else if (payload.is_sysadmin === false) {
    // Fast path: JWT says not sysadmin — trust it, skip DB
    // If admin status was recently granted, it'll be picked up on next token refresh
    isSysadmin = false;
    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] User ${payload.userId} is not sysadmin (from token)`,
      );
    }
  } else {
    // Fallback: JWT doesn't have is_sysadmin field (old tokens)
    // Check cache first, then DB
    const cacheKey = payload.userId;
    const cached = sysadminCache.get(cacheKey);
    if (cached !== null) {
      isSysadmin = cached;
      if (import.meta.env.DEV) {
        console.log(
          `[hooks.server] User ${payload.userId} sysadmin check from cache: ${isSysadmin}`,
        );
      }
    } else {
      const userResult = await queryTableResult<User>("_auth_users", {
        filter: filter().eq("id", payload.userId).build(),
      });
      if (userResult.success && userResult.value.data.length > 0) {
        const user = userResult.value.data[0];
        isSysadmin = user.is_sysadmin === true;
        if (import.meta.env.DEV) {
          console.log(
            `[hooks.server] User ${payload.userId} database check: is_sysadmin=${user.is_sysadmin}, isSysadmin=${isSysadmin}`,
          );
        }
      } else {
        if (import.meta.env.DEV) {
          console.log(
            `[hooks.server] WARNING: Could not find user ${payload.userId} in database for sysadmin check`,
          );
        }
      }
      // Cache the result for future requests (60s TTL)
      sysadminCache.set(cacheKey, isSysadmin, 60000);
    }
  }

  // Auth-only routes: only require authentication, no specific permissions needed.
  // Skip getUserPermissions() entirely — saves 2-4 DB queries per request.
  // This check MUST happen after token verification + sysadmin check but before
  // getUserPermissions() to avoid wasted queries on routes that never check permissions.
  if (isAuthOnlyRoute(path)) {
    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] ${path} - auth-only route, skipping permission loading for user ${payload.userId}`,
      );
    }
    // Set minimal user data from JWT payload + sysadmin check already done
    event.locals.user = {
      id: payload.userId,
      roles: payload.roles,
      permissions: [],
      is_sysadmin: isSysadmin,
    };
    event.locals.permissions = [];
    event.locals.roles = payload.roles;

    const authMs = timer();
    const response = await resolveWithLargeBody(event);
    const totalMs = timer();
    logPerformance({
      path,
      method: event.request.method,
      userId: payload.userId ?? null,
      authMs,
      totalMs,
    });
    return response;
  }

  // --- Permission loading paths (auth-only routes have already returned above) ---

  if (isSysadmin) {
    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] User ${payload.userId} is sysadmin - bypassing permission check for ${path}`,
      );
    }
    // Fetch user permissions (will return all for sysadmin)
    const permissionsResult = await authService.getUserPermissions(
      payload.userId,
    );
    const permissions = permissionsResult.success
      ? permissionsResult.value
      : [];

    // Set user data in locals
    event.locals.user = {
      id: payload.userId,
      roles: payload.roles,
      permissions: permissions,
      is_sysadmin: true,
    };
    event.locals.permissions = permissions;
    event.locals.roles = payload.roles;

    // Sysadmin can access everything - continue
    const authMs = timer();
    const response = await resolveWithLargeBody(event);
    const totalMs = timer();
    logPerformance({
      path,
      method: event.request.method,
      userId: payload.userId ?? null,
      authMs,
      totalMs,
    });
    return response;
  }

  // Fetch user permissions for non-sysadmin, non-auth-only routes
  const permissionsResult = await authService.getUserPermissions(
    payload.userId,
  );
  const permissions = permissionsResult.success ? permissionsResult.value : [];

  // Set user data in locals
  event.locals.user = {
    id: payload.userId,
    roles: payload.roles,
    permissions: permissions,
    is_sysadmin: false,
  };
  event.locals.permissions = permissions;
  event.locals.roles = payload.roles;

  // Check specific permission if required
  if (routePermission) {
    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] Checking permission for ${path}: route=${routePermission.route}, action=${routePermission.action}, userId=${payload.userId}`,
      );
      console.log(
        `[hooks.server] User permissions:`,
        permissions.map((p) => {
          const actions = p.actions;
          return `${p.route}:${Array.isArray(actions) ? actions.join(",") : ""}`;
        }),
      );
    }
    // Check permission against already-loaded permissions (no DB query)
    const hasPermission = event.locals.permissions.some((p: any) => {
      if (p.route !== routePermission.route) return false;
      let actions = p.actions;
      if (typeof actions === "string") {
        try {
          actions = JSON.parse(actions);
        } catch {
          actions = actions
            .split(",")
            .map((a: string) => a.trim())
            .filter((a: string) => a.length > 0);
        }
      }
      return Array.isArray(actions) && actions.includes(routePermission.action);
    });

    if (import.meta.env.DEV) {
      console.log(
        `[hooks.server] Local permission check result for ${path}: hasPermission=${hasPermission}`,
      );
    }

    if (!hasPermission) {
      // Forbidden
      if (import.meta.env.DEV) {
        console.log(
          `[hooks.server] Permission denied for ${path} - user lacks permission for route=${routePermission.route}, action=${routePermission.action}`,
        );
      }
      if (path.startsWith("/api/")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Forbidden - insufficient permissions",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
      // Return simple 403 page in Dutch
      const html = `
				<!DOCTYPE html>
				<html lang="nl">
				<head>
					<title>403 - Geen toegang</title>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
						body {
							font-family: system-ui, -apple-system, sans-serif;
							padding: 2rem;
							max-width: 600px;
							margin: 0 auto;
							background-color: #fafafa;
						}
						.container {
							background: white;
							padding: 2rem;
							border-radius: 8px;
							box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
						}
						h1 {
							color: #dc2626;
							margin-top: 0;
						}
						p {
							line-height: 1.6;
							color: #374151;
						}
						.details {
							background: #fef2f2;
							border-left: 4px solid #dc2626;
							padding: 1rem;
							margin: 1.5rem 0;
							font-size: 0.9rem;
						}
						.actions {
							margin-top: 2rem;
							padding-top: 1.5rem;
							border-top: 1px solid #e5e7eb;
						}
						a {
							color: #2563eb;
							text-decoration: none;
							font-weight: 500;
						}
						a:hover {
							text-decoration: underline;
						}
					</style>
				</head>
				<body>
					<div class="container">
						<h1>⛔ Geen toegang</h1>
						<p>U heeft geen toegang tot deze pagina.</p>
						<p>Neem contact op met de systeembeheerder om toegang aan te vragen voor deze pagina.</p>

						<div class="details">
							<strong>Benodigde rechten:</strong><br>
							Route: <code>${routePermission.route}</code><br>
							Actie: <code>${routePermission.action}</code>
						</div>

						<div class="actions">
							<a href="/login">← Terug naar inloggen</a> |
							<a href="/help">Hulp nodig?</a>
						</div>
					</div>
				</body>
				</html>
			`;
      return new Response(html, {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  // Continue with normal request handling
  const authMs = timer();
  const response = await resolveWithLargeBody(event);
  const totalMs = timer();
  logPerformance({
    path,
    method: event.request.method,
    userId: payload.userId ?? null,
    authMs,
    totalMs,
  });
  return response;
};
