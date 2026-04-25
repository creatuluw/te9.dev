/**
 * Centralized Routes Data File
 *
 * Single source of truth for all routes, their actions, and navigation metadata.
 * This file is kept in sync with the app's routes and drives:
 * - Route protection
 * - Permission management
 * - Navigation filtering
 * - Permission seeding
 */

import type {
  RouteType,
  RouteAction,
  RouteNavigation,
  RouteDefinition,
} from "$lib/types/routes";

export type { RouteType, RouteAction, RouteNavigation, RouteDefinition };

/**
 * All routes in the application with their available actions
 *
 * When adding new routes:
 * 1. Add route definition here with all available actions
 * 2. Run syncPermissionsToDatabase() to create permissions
 * 3. Navigation will automatically update if showInNav: true
 */
export const ROUTES: RouteDefinition[] = [
  // ============================================
  // Public Routes (no authentication required)
  // ============================================

  // Error pages
  {
    path: "/401",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Unauthorized error page",
  },
  {
    path: "/403",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Forbidden error page",
  },
  {
    path: "/404",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Not found error page",
  },
  {
    path: "/500",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Server error page",
  },

  // Authentication & onboarding
  {
    path: "/login",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Login page",
  },
  {
    path: "/register",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Registration page",
  },
  {
    path: "/register/[token]",
    type: "page",
    actions: ["read"],
    isPublic: true,
    pattern: /^\/register\/[^/]+$/,
    description: "Complete registration with token",
  },
  {
    path: "/register/success",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Registration success page",
  },
  {
    path: "/forgot-password",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Forgot password page",
  },
  {
    path: "/reset-password",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Reset password page",
  },
  {
    path: "/verify-email",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Email verification landing page",
  },
  {
    path: "/verify-email/[token]",
    type: "page",
    actions: ["read"],
    isPublic: true,
    pattern: /^\/verify-email\/[^/]+$/,
    description: "Verify email with token",
  },
  {
    path: "/help",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Help page - accessible to all users including guests",
  },
  {
    path: "/deck",
    type: "page",
    actions: ["read"],
    isPublic: true,
    description: "Presentation deck - accessible to all users including guests",
  },
  {
    path: "/api/auth/login",
    type: "api",
    actions: ["execute"],
    isPublic: true,
    description: "Login API endpoint",
  },
  {
    path: "/api/auth/register",
    type: "api",
    actions: ["execute"],
    isPublic: true,
    description: "Registration API endpoint",
  },
  {
    path: "/api/auth/password/forgot",
    type: "api",
    actions: ["execute"],
    isPublic: true,
    description: "Forgot password API endpoint",
  },
  {
    path: "/api/auth/password/reset",
    type: "api",
    actions: ["execute"],
    isPublic: true,
    description: "Reset password API endpoint",
  },
  {
    path: "/api/auth/refresh",
    type: "api",
    actions: ["execute"],
    isPublic: true,
    description: "Token refresh API endpoint",
  },
  {
    path: "/api/users/public",
    type: "api",
    actions: ["read"],
    isPublic: false, // Requires authentication but NOT admin permissions
    description: "Public user list API endpoint (for authenticated users)",
  },

  // ============================================
  // Main Application Routes
  // ============================================
  {
    path: "/",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    navigation: {
      label: "Home",
      icon: "House",
      showInNav: true,
      order: 1,
      group: "main",
    },
    description: "Dashboard home page",
  },
  {
    path: "/gast",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Guest user welcome page",
  },
  {
    path: "/cases",
    type: "page",
    actions: ["read", "write", "delete"],
    defaultAction: "read",
    navigation: {
      label: "Cases",
      showInNav: true,
      order: 4,
      group: "main",
    },
    description: "Cases management page",
  },
  {
    path: "/cases/[id]",
    type: "page",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    pattern: /^\/cases\/[^/]+$/,
    description: "Case detail page",
  },
  {
    path: "/cases/new",
    type: "page",
    actions: ["read", "write"],
    defaultAction: "write",
    description: "Create new case page",
  },
  {
    path: "/processes",
    type: "page",
    actions: ["read", "write", "delete"],
    defaultAction: "read",
    navigation: {
      label: "Processen",
      showInNav: true,
      order: 3,
      group: "main",
    },
    description: "Processes management page",
  },
  {
    path: "/processes/[id]",
    type: "page",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "write",
    pattern: /^\/processes\/[^/]+$/,
    description: "Process detail page",
  },
  {
    path: "/processes/new",
    type: "page",
    actions: ["read", "write"],
    defaultAction: "write",
    description: "Create new process page",
  },
  {
    path: "/work",
    type: "page",
    actions: ["read", "write"],
    defaultAction: "read",
    navigation: {
      label: "Werk",
      showInNav: true,
      order: 5,
      group: "main",
      dropdownItems: [{ label: "Backlog", href: "/work/backlog" }],
    },
    description: "Work items page",
  },
  {
    path: "/work/[id]",
    type: "page",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    pattern: /^\/work\/[^/]+$/,
    description: "Work item detail page",
  },
  {
    path: "/work/backlog",
    type: "page",
    actions: ["read", "write"],
    defaultAction: "read",
    description: "Work backlog page",
  },
  {
    path: "/work-items",
    type: "page",
    actions: ["read", "write", "delete"],
    defaultAction: "read",
    description: "Work items management page",
  },
  {
    path: "/messages",
    type: "page",
    actions: ["read", "write", "delete"],
    defaultAction: "read",
    navigation: {
      label: "Berichten",
      showInNav: true,
      order: 6,
      group: "main",
    },
    description: "Messages page",
  },
  {
    path: "/users",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Users listing page",
  },
  {
    path: "/projects",
    type: "page",
    actions: ["read", "write", "delete"],
    defaultAction: "read",
    description: "Projects page",
    navigation: {
      label: "Projecten",
      showInNav: true,
      group: "placeholder",
      order: 1,
    },
  },
  {
    path: "/projects/[id]",
    type: "page",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    pattern: /^\/projects\/[^/]+$/,
    description: "Project detail page",
  },

  // ============================================
  // Public Sharing Routes (no authentication required)
  // ============================================
  {
    path: "/work/[id]/public/[token]",
    type: "page",
    actions: ["read"],
    isPublic: true,
    pattern: /^\/work\/[^/]+\/public\/[^/]+$/,
    description: "Public work item page",
  },
  {
    path: "/cases/[id]/public/[token]",
    type: "page",
    actions: ["read"],
    isPublic: true,
    pattern: /^\/cases\/[^/]+\/public\/[^/]+$/,
    description: "Public case page",
  },
  {
    path: "/projects/[id]/public/[token]",
    type: "page",
    actions: ["read"],
    isPublic: true,
    pattern: /^\/projects\/[^/]+\/public\/[^/]+$/,
    description: "Public project page",
  },

  {
    path: "/mijn-werk",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Personal work dashboard",
  },
  {
    path: "/closed",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Archive of closed tasks",
  },
  {
    path: "/account",
    type: "page",
    actions: ["read", "write", "update"],
    defaultAction: "read",
    description: "User account settings page",
  },
  {
    path: "/kees",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    navigation: {
      label: "Kees",
      showInNav: true,
      order: 2,
      group: "main",
    },
    description: "Kees page",
  },
  {
    path: "/rapporten",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    navigation: {
      label: "Rapporten",
      showInNav: true,
      order: 1,
      group: "placeholder",
    },
    description: "Reports page",
  },
  {
    path: "/rapporten/medewerkers",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Employee reports page",
  },
  {
    path: "/rapporten/operational",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Operational management report - work and progress monitoring",
  },
  {
    path: "/tools",
    type: "page",
    actions: ["read", "execute"],
    defaultAction: "read",
    navigation: {
      label: "Tools",
      showInNav: true,
      order: 2,
      group: "placeholder",
    },
    description: "Tools page",
  },
  {
    path: "/tools/typebot",
    type: "page",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "Typebot tools page",
  },
  {
    path: "/tools/typebot/send",
    type: "page",
    actions: ["read", "execute"],
    defaultAction: "execute",
    description: "Typebot send page",
  },
  {
    path: "/tools/formbricks",
    type: "page",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "Formbricks integration page",
  },
  {
    path: "/map",
    type: "page",
    actions: ["read"],
    defaultAction: "read",
    description: "Map page",
  },

  // ============================================
  // Admin Routes
  // ============================================
  {
    path: "/admin",
    type: "admin",
    actions: ["read"],
    defaultAction: "read",
    description: "Admin dashboard",
  },
  {
    path: "/admin/dashboard",
    type: "admin",
    actions: ["read"],
    defaultAction: "read",
    navigation: {
      label: "Dashboard",
      showInNav: false, // Shown in admin dropdown
      group: "admin",
      order: 1,
    },
    description: "Admin dashboard page",
  },
  {
    path: "/admin/users",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    description: "Admin user management page",
  },
  {
    path: "/admin/users/[id]",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    pattern: /^\/admin\/users\/[^/]+$/,
    description: "Admin user detail page",
  },
  {
    path: "/admin/gebruikers",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    navigation: {
      label: "Gebruikers",
      showInNav: false, // Shown in admin dropdown
      group: "admin",
    },
    description: "Admin user management page (Dutch)",
  },
  {
    path: "/admin/gebruikers/[id]",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    pattern: /^\/admin\/gebruikers\/[^/]+$/,
    description: "Admin user detail page (Dutch)",
  },
  {
    path: "/admin/roles",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    description: "Admin roles management page",
  },
  {
    path: "/admin/rollen",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    navigation: {
      label: "Rollen",
      showInNav: false, // Shown in admin dropdown
      group: "admin",
    },
    description: "Admin roles management page (Dutch)",
  },
  {
    path: "/admin/rollen/[id]",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    pattern: /^\/admin\/rollen\/[^/]+$/,
    description: "Admin role detail page (Dutch)",
  },
  {
    path: "/admin/permissions",
    type: "admin",
    actions: ["read", "write", "update", "delete"],
    defaultAction: "read",
    navigation: {
      label: "Permissies",
      showInNav: false, // Shown in admin dropdown
      group: "admin",
    },
    description: "Admin permissions management page",
  },
  {
    path: "/admin/activity",
    type: "admin",
    actions: ["read"],
    defaultAction: "read",
    navigation: {
      label: "Activiteiten",
      showInNav: false, // Shown in admin dropdown
      group: "admin",
    },
    description: "Admin activity log page",
  },

  // ============================================
  // API Endpoints - Auth
  // ============================================
  {
    path: "/api/auth/me",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    description: "Get current user API endpoint",
  },
  {
    path: "/api/auth/logout",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    description: "Logout API endpoint",
  },
  {
    path: "/api/auth/users",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Auth users API endpoint",
  },
  {
    path: "/api/auth/users/[id]",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/auth\/users\/[^/]+$/,
    description: "Auth user by ID API endpoint",
  },
  {
    path: "/api/auth/users/[id]/activate",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    pattern: /^\/api\/auth\/users\/[^/]+\/activate$/,
    description: "Activate user API endpoint",
  },
  {
    path: "/api/auth/users/[id]/deactivate",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    pattern: /^\/api\/auth\/users\/[^/]+\/deactivate$/,
    description: "Deactivate user API endpoint",
  },
  {
    path: "/api/auth/users/[id]/public",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    pattern: /^\/api\/auth\/users\/[^/]+\/public$/,
    description: "Get public user info API endpoint",
  },
  {
    path: "/api/auth/roles",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Roles API endpoint",
  },
  {
    path: "/api/auth/roles/[id]",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/auth\/roles\/[^/]+$/,
    description: "Role by ID API endpoint",
  },
  {
    path: "/api/auth/roles/[id]/permissions",
    type: "api",
    actions: ["read", "write", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/auth\/roles\/[^/]+\/permissions$/,
    description: "Role permissions API endpoint",
  },
  {
    path: "/api/auth/roles/set-default",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    description: "Set default role API endpoint",
  },
  {
    path: "/api/auth/roles/user-counts",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "Get role user counts API endpoint",
  },
  {
    path: "/api/auth/permissions",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Permissions API endpoint",
  },
  {
    path: "/api/auth/permissions/[id]",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/auth\/permissions\/[^/]+$/,
    description: "Permission by ID API endpoint",
  },
  {
    path: "/api/auth/invitations",
    type: "api",
    actions: ["read", "write", "execute"],
    defaultAction: "execute",
    description: "Invitations API endpoint",
  },
  {
    path: "/api/auth/password/validate-token",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    description: "Validate password reset token API endpoint",
  },
  {
    path: "/api/auth/verify-email/[token]",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    pattern: /^\/api\/auth\/verify-email\/[^/]+$/,
    description: "Verify email API endpoint",
  },
  {
    path: "/api/auth/resend-verification",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    description: "Resend verification email API endpoint",
  },
  {
    path: "/api/auth/register/validate-token",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    description: "Validate registration token API endpoint",
  },
  {
    path: "/api/auth/register/complete",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    description: "Complete registration API endpoint",
  },
  {
    path: "/api/help/generate-link",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    description:
      "Generate help link API endpoint - accessible to all including guests",
  },
  {
    path: "/api/files/upload",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    description:
      "File upload API endpoint - needed for public help page where unauthenticated users attach files",
  },
  {
    path: "/api/files/delete",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    isPublic: true,
    description:
      "File delete API endpoint - needed for public help page where unauthenticated users remove attached files",
  },

  // ============================================
  // API Endpoints - Admin
  // ============================================
  {
    path: "/api/admin/users",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Admin users API endpoint",
  },
  {
    path: "/api/admin/users/[id]",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/admin\/users\/[^/]+$/,
    description: "Admin user by ID API endpoint",
  },
  {
    path: "/api/admin/users/[id]/roles",
    type: "api",
    actions: ["read", "write", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/admin\/users\/[^/]+\/roles$/,
    description: "Admin user roles API endpoint",
  },
  {
    path: "/api/admin/users/invite",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    description: "Admin invite user API endpoint",
  },
  {
    path: "/api/admin/users/invitations",
    type: "api",
    actions: ["read", "write", "execute"],
    defaultAction: "execute",
    description: "Admin invitations API endpoint",
  },
  {
    path: "/api/admin/users/invitations/[id]",
    type: "api",
    actions: ["read", "write", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/admin\/users\/invitations\/[^/]+$/,
    description: "Admin invitation by ID API endpoint",
  },
  {
    path: "/api/admin/users/invitations/[id]/resend",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    pattern: /^\/api\/admin\/users\/invitations\/[^/]+\/resend$/,
    description: "Resend invitation API endpoint",
  },
  {
    path: "/api/admin/users/statistics",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "Admin user statistics API endpoint",
  },
  {
    path: "/api/admin/activity",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "Admin activity log API endpoint",
  },

  // ============================================
  // API Endpoints - Users
  // ============================================
  {
    path: "/api/users",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "Users API endpoint",
  },
  {
    path: "/api/users/[id]",
    type: "api",
    actions: ["read", "write", "update", "execute"],
    defaultAction: "read",
    pattern: /^\/api\/users\/[^/]+$/,
    description: "User by ID API endpoint",
  },
  {
    path: "/api/users/[id]/roles",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    pattern: /^\/api\/users\/[^/]+\/roles$/,
    description: "User roles API endpoint",
  },

  // ============================================
  // API Endpoints - Cases
  // ============================================
  {
    path: "/api/cases",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Cases API endpoint",
  },

  // ============================================
  // API Endpoints - Processes
  // ============================================
  {
    path: "/api/processes",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Processes API endpoint",
  },

  // ============================================
  // API Endpoints - Work Items
  // ============================================
  {
    path: "/api/work-items",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Work items API endpoint",
  },

  // ============================================
  // API Endpoints - Projects
  // ============================================
  {
    path: "/api/projects",
    type: "api",
    actions: ["read", "write", "execute"],
    defaultAction: "execute",
    description: "Projects API endpoint",
  },
  {
    path: "/api/projects/[id]",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/projects\/[^/]+$/,
    description: "Project by ID API endpoint",
  },
  {
    path: "/api/projects/[id]/members",
    type: "api",
    actions: ["read", "write", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/projects\/[^/]+\/members$/,
    description: "Project members API endpoint",
  },
  {
    path: "/api/projects/[id]/members/[userId]",
    type: "api",
    actions: ["write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/projects\/[^/]+\/members\/[^/]+$/,
    description: "Project member by user ID API endpoint",
  },

  // ============================================
  // API Endpoints - Tools
  // ============================================
  {
    path: "/api/tools/typebot",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "execute",
    description: "Typebot tools API endpoint",
  },
  {
    path: "/api/tools/typebot/[id]",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/tools\/typebot\/[^/]+$/,
    description: "Typebot by ID API endpoint",
  },
  {
    path: "/api/tools/typebot/list",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    description: "List typebots API endpoint",
  },
  {
    path: "/api/formbricks/[...path]",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/formbricks\/.+$/,
    description: "Formbricks API proxy endpoint",
  },

  // ============================================
  // API Endpoints - Messages
  // ============================================
  {
    path: "/api/messages/sse",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "execute",
    pattern: /^\/api\/messages\/sse$/,
    description: "Server-Sent Events endpoint for real-time notifications",
  },
  {
    path: "/api/messages/search",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    pattern: /^\/api\/messages\/search$/,
    description: "Search messages API endpoint",
  },

  // ============================================
  // API Endpoints - Subscriptions
  // ============================================
  {
    path: "/api/subscriptions",
    type: "api",
    actions: ["read", "write", "update", "delete", "execute"],
    defaultAction: "execute",
    description: "Message subscriptions CRUD API endpoint",
  },
  {
    path: "/api/subscriptions/[entityType]/[entityId]",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    pattern: /^\/api\/subscriptions\/[^/]+\/[^/]+$/,
    description: "Get subscription status for an entity",
  },
  {
    path: "/api/subscriptions/messages",
    type: "api",
    actions: ["read", "execute"],
    defaultAction: "read",
    pattern: /^\/api\/subscriptions\/messages$/,
    description: "Get subscription messages feed API endpoint",
  },

  // ============================================
  // API Endpoints - Public Entity Data
  // ============================================
  {
    path: "/api/cases/[id]/public",
    type: "api",
    actions: ["read"],
    defaultAction: "read",
    pattern: /^\/api\/cases\/[^/]+\/public$/,
    description: "Public case data API endpoint",
  },
  {
    path: "/api/work/[id]/public",
    type: "api",
    actions: ["read"],
    defaultAction: "read",
    pattern: /^\/api\/work\/[^/]+\/public$/,
    description: "Public work item data API endpoint",
  },
  {
    path: "/api/projects/[id]/public",
    type: "api",
    actions: ["read"],
    defaultAction: "read",
    pattern: /^\/api\/projects\/[^/]+\/public$/,
    description: "Public project data API endpoint",
  },

  // ============================================
  // API Endpoints - Analytics
  // ============================================
  {
    path: "/api/analytics/end-visit",
    type: "api",
    actions: ["execute"],
    defaultAction: "execute",
    description: "End analytics visit API endpoint",
  },
];

/**
 * Get route definition by path
 *
 * @param path - Route path to find
 * @returns Route definition or undefined
 */
export function getRouteDefinition(path: string): RouteDefinition | undefined {
  // First try exact match
  let route = ROUTES.find((r) => r.path === path);
  if (route) return route;

  // Then try pattern matching for dynamic routes
  // Sort by path length (longer = more specific) to match most specific route first
  const routesWithPatterns = ROUTES.filter((r) => r.pattern).sort(
    (a, b) => b.path.length - a.path.length,
  ); // Longer paths first (more specific)

  route = routesWithPatterns.find((r) => {
    if (r.pattern) {
      return r.pattern.test(path);
    }
    return false;
  });

  return route;
}

/**
 * Get route permission requirement for a path
 *
 * @param path - Request path
 * @param method - HTTP method (GET, POST, PUT, DELETE)
 * @returns Route permission requirement or null if public/no requirement
 */
export function getRoutePermission(
  path: string,
  method: string = "GET",
): { route: string; action: RouteAction } | null {
  const routeDef = getRouteDefinition(path);

  if (!routeDef) {
    // If route not found, check if it's an API route
    if (path.startsWith("/api/")) {
      return { route: path, action: "execute" };
    }
    // For unknown routes, require read permission
    return { route: path, action: "read" };
  }

  // Public routes don't require permissions
  if (routeDef.isPublic) {
    return null;
  }

  // Map HTTP method to action
  let action: RouteAction = routeDef.defaultAction || "read";

  if (method === "POST" || method === "PUT") {
    // Check if route supports write/update
    // Note: 'update' is mapped to 'write' in permissions
    if (
      routeDef.actions.includes("write") ||
      routeDef.actions.includes("update")
    ) {
      action = "write"; // Map update to write for permission checks
    } else if (routeDef.actions.includes("execute")) {
      action = "execute";
    }
  } else if (method === "DELETE") {
    if (routeDef.actions.includes("delete")) {
      action = "delete";
    }
  } else if (method === "GET") {
    if (routeDef.actions.includes("read")) {
      action = "read";
    } else if (routeDef.actions.includes("execute")) {
      action = "execute";
    }
  }

  return {
    route: routeDef.path,
    action,
  };
}

/**
 * Get all routes that should appear in navigation
 *
 * @returns Array of route definitions with navigation metadata
 */
export function getNavigationRoutes(): RouteDefinition[] {
  return ROUTES.filter((route) => route.navigation?.showInNav === true).sort(
    (a, b) => {
      const orderA = a.navigation?.order || 999;
      const orderB = b.navigation?.order || 999;
      return orderA - orderB;
    },
  );
}

/**
 * Get all routes for a specific group
 *
 * @param group - Navigation group name
 * @returns Array of route definitions in the group
 */
export function getRoutesByGroup(group: string): RouteDefinition[] {
  return ROUTES.filter((route) => route.navigation?.group === group);
}

/**
 * Get all available routes with their actions
 * Used in permissions management UI
 *
 * Merges static ROUTES configuration with dynamically discovered routes.
 * Static routes take precedence to preserve metadata like descriptions and navigation.
 *
 * @returns Array of all route definitions
 */
export async function getAllAvailableRoutes(): Promise<RouteDefinition[]> {
  // Import dynamic route discovery
  // We do this lazily to avoid issues during build/SSR
  let dynamicRoutes: RouteDefinition[] = [];

  try {
    // Only run in browser or during dev
    if (typeof window !== "undefined" || import.meta.env.DEV) {
      const { getDynamicRoutes } = await import("$lib/utils/routeDiscovery");
      dynamicRoutes = getDynamicRoutes();
    }
  } catch (error) {
    console.warn("Could not load dynamic routes:", error);
  }

  // Create a map of static routes by path for quick lookup
  const staticRoutesMap = new Map<string, RouteDefinition>();
  ROUTES.forEach((route) => {
    staticRoutesMap.set(route.path, route);
  });

  // Merge: static routes take precedence
  const mergedRoutes = [...ROUTES];

  for (const dynamicRoute of dynamicRoutes) {
    // Only add if not already in static routes
    if (!staticRoutesMap.has(dynamicRoute.path)) {
      mergedRoutes.push(dynamicRoute);
    }
  }

  return mergedRoutes;
}

/**
 * Check if a route is public (doesn't require authentication)
 *
 * @param path - Route path
 * @returns True if route is public
 */
export function isPublicRoute(path: string): boolean {
  const routeDef = getRouteDefinition(path);
  return routeDef?.isPublic === true;
}
