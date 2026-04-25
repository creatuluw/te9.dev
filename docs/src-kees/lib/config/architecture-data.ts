/**
 * Architecture Data Structure
 * Hierarchical representation of application architecture
 * Maps user-facing routes → components → services → data storage
 */

export interface ArchitectureNode {
  id: string;
  name: string;
  type: "route" | "component" | "service" | "api" | "store" | "database";
  description?: string;
  path?: string;
  children?: ArchitectureNode[];
}

export const architectureData: ArchitectureNode = {
  id: "root",
  name: "Kees Application",
  type: "route",
  description: "Main application entry point",
  children: [
    {
      id: "login",
      name: "🔐 /login",
      type: "route",
      path: "/login",
      description: "User authentication and login",
      children: [
        {
          id: "login-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "login-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
          ],
        },
        {
          id: "login-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "login-authService",
              name: "authService",
              type: "service",
              path: "$lib/services/authService.ts",
            },
            {
              id: "login-authStore",
              name: "authStore",
              type: "store",
              path: "$lib/stores/authStore.ts",
            },
          ],
        },
        {
          id: "login-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "login-api-auth",
              name: "POST /api/auth/login",
              type: "api",
              path: "/api/auth/login",
            },
          ],
        },
        {
          id: "login-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "login-pb-users",
              name: "PocketBase: _auth_users",
              type: "database",
            },
            {
              id: "login-pb-sessions",
              name: "PocketBase: _auth_sessions",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "register",
      name: "📝 /register",
      type: "route",
      path: "/register",
      description: "New user registration",
      children: [
        {
          id: "register-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "register-registrationService",
              name: "registrationService",
              type: "service",
              path: "$lib/services/registrationService.ts",
            },
          ],
        },
        {
          id: "register-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "register-api-auth",
              name: "POST /api/auth/register",
              type: "api",
              path: "/api/auth/register",
            },
          ],
        },
      ],
    },
    {
      id: "forgot-password",
      name: "🔑 /forgot-password",
      type: "route",
      path: "/forgot-password",
      description: "Password recovery",
      children: [
        {
          id: "forgot-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "forgot-magicLinkService",
              name: "magicLinkService",
              type: "service",
              path: "$lib/services/magicLinkService.ts",
            },
            {
              id: "forgot-emailService",
              name: "emailService",
              type: "service",
              path: "$lib/services/emailService.ts",
            },
          ],
        },
        {
          id: "forgot-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "forgot-api-auth",
              name: "POST /api/auth/password/forgot",
              type: "api",
              path: "/api/auth/password/forgot",
            },
          ],
        },
      ],
    },
    {
      id: "home",
      name: "🏠 / (Home)",
      type: "route",
      path: "/",
      description: "Dashboard and overview",
      children: [
        {
          id: "home-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "home-navcard",
              name: "NavCard",
              type: "component",
              path: "$lib/components/NavCard.svelte",
            },
            {
              id: "home-kanban",
              name: "Kanban",
              type: "component",
              path: "$lib/components/Kanban.svelte",
            },
            {
              id: "home-workItemCard",
              name: "WorkItemCard",
              type: "component",
              path: "$lib/components/WorkItemCard.svelte",
            },
            {
              id: "home-backlogDrawer",
              name: "BacklogDrawer",
              type: "component",
              path: "$lib/components/BacklogDrawer.svelte",
            },
            {
              id: "home-chatDrawer",
              name: "ChatDrawer",
              type: "component",
              path: "$lib/components/ChatDrawer.svelte",
            },
            {
              id: "home-userAvailabilityInput",
              name: "UserAvailabilityInput",
              type: "component",
              path: "$lib/components/UserAvailabilityInput.svelte",
            },
            {
              id: "home-backlogWeeklyStats",
              name: "BacklogWeeklyStats",
              type: "component",
              path: "$lib/components/BacklogWeeklyStats.svelte",
            },
          ],
        },
        {
          id: "home-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "home-taskService",
              name: "taskService",
              type: "service",
              path: "$lib/services/taskService.ts",
            },
            {
              id: "home-projectService",
              name: "projectService",
              type: "service",
              path: "$lib/services/projectService.ts",
            },
            {
              id: "home-processService",
              name: "processService",
              type: "service",
              path: "$lib/services/processService.ts",
            },
            {
              id: "home-deadlineService",
              name: "deadlineService",
              type: "service",
              path: "$lib/services/deadlineService.ts",
            },
            {
              id: "home-chatService",
              name: "chatService",
              type: "service",
              path: "$lib/services/chatService.ts",
            },
          ],
        },
        {
          id: "home-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "home-taskStore",
              name: "taskStore",
              type: "store",
              path: "$lib/stores/taskStore.ts",
            },
            {
              id: "home-navigationStore",
              name: "navigationStore",
              type: "store",
              path: "$lib/stores/navigationStore.ts",
            },
          ],
        },
        {
          id: "home-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "home-api-work",
              name: "GET/POST /api/work",
              type: "api",
              path: "/api/work",
            },
            {
              id: "home-api-backlog",
              name: "GET /api/work/backlog",
              type: "api",
              path: "/api/work/backlog",
            },
          ],
        },
        {
          id: "home-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "home-db-work-items",
              name: "PostgreSQL: _bpm_work_items",
              type: "database",
            },
            {
              id: "home-db-tasks",
              name: "PostgreSQL: _bpm_tasks",
              type: "database",
            },
            {
              id: "home-db-projects",
              name: "PostgreSQL: _bpm_projects",
              type: "database",
            },
            {
              id: "home-db-processes",
              name: "PostgreSQL: _bpm_processes",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "account",
      name: "👤 /account",
      type: "route",
      path: "/account",
      description: "User account settings",
      children: [
        {
          id: "account-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "account-checkboxGroup",
              name: "CheckboxGroup",
              type: "component",
              path: "$lib/components/CheckboxGroup.svelte",
            },
            {
              id: "account-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
          ],
        },
        {
          id: "account-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "account-userPreferencesService",
              name: "userPreferencesService",
              type: "service",
              path: "$lib/services/userPreferencesService.ts",
            },
            {
              id: "account-authService",
              name: "authService",
              type: "service",
              path: "$lib/services/authService.ts",
            },
          ],
        },
        {
          id: "account-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "account-api-me",
              name: "GET /api/auth/me",
              type: "api",
              path: "/api/auth/me",
            },
            {
              id: "account-api-password-change",
              name: "POST /api/auth/password/change",
              type: "api",
              path: "/api/auth/password/change",
            },
            {
              id: "account-api-prefs",
              name: "GET/POST /api/user/preferences",
              type: "api",
              path: "/api/user/preferences",
            },
          ],
        },
        {
          id: "account-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "account-db-prefs",
              name: "PostgreSQL: _bpm_user_preferences",
              type: "database",
            },
            {
              id: "account-db-pb-users",
              name: "PocketBase: _auth_users",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "processes",
      name: "🔄 /processes",
      type: "route",
      path: "/processes",
      description: "Business process management and templates",
      children: [
        {
          id: "processes-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "processes-processDrawer",
              name: "ProcessDrawer",
              type: "component",
              path: "$lib/components/ProcessDrawer.svelte",
            },
            {
              id: "processes-processStepEditor",
              name: "ProcessStepEditor",
              type: "component",
              path: "$lib/components/ProcessStepEditor.svelte",
            },
            {
              id: "processes-modal",
              name: "Modal",
              type: "component",
              path: "$lib/components/Modal.svelte",
            },
            {
              id: "processes-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
            {
              id: "processes-navcard",
              name: "NavCard",
              type: "component",
              path: "$lib/components/NavCard.svelte",
            },
            {
              id: "processes-searchInput",
              name: "SearchInput",
              type: "component",
              path: "$lib/components/SearchInput.svelte",
            },
            {
              id: "processes-select",
              name: "Select",
              type: "component",
              path: "$lib/components/Select.svelte",
            },
            {
              id: "processes-drawer",
              name: "Drawer",
              type: "component",
              path: "$lib/components/Drawer.svelte",
            },
            {
              id: "processes-dateRangePicker",
              name: "DateRangePicker",
              type: "component",
              path: "$lib/components/DateRangePicker.svelte",
            },
          ],
        },
        {
          id: "processes-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "processes-processService",
              name: "processService",
              type: "service",
              path: "$lib/services/processService.ts",
            },
          ],
        },
        {
          id: "processes-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "processes-processStore",
              name: "processStore",
              type: "store",
              path: "$lib/stores/processStore.ts",
            },
          ],
        },
        {
          id: "processes-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "processes-db-processes",
              name: "PostgreSQL: _bpm_processes",
              type: "database",
            },
            {
              id: "processes-db-process-steps",
              name: "PostgreSQL: _bpm_process_steps",
              type: "database",
            },
            {
              id: "processes-db-process-tasks",
              name: "PostgreSQL: _bpm_process_tasks",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "cases",
      name: "📋 /cases",
      type: "route",
      path: "/cases",
      description: "Case management",
      children: [
        {
          id: "cases-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "cases-caseDrawer",
              name: "CaseDrawer",
              type: "component",
              path: "$lib/components/CaseDrawer.svelte",
            },
            {
              id: "cases-caseTaskDrawer",
              name: "CaseTaskDrawer",
              type: "component",
              path: "$lib/components/CaseTaskDrawer.svelte",
            },
            {
              id: "cases-caseTaskEditForm",
              name: "CaseTaskEditForm",
              type: "component",
              path: "$lib/components/CaseTaskEditForm.svelte",
            },
            {
              id: "cases-searchInput",
              name: "SearchInput",
              type: "component",
              path: "$lib/components/SearchInput.svelte",
            },
            {
              id: "cases-userSelector",
              name: "UserSelector",
              type: "component",
              path: "$lib/components/UserSelector.svelte",
            },
            {
              id: "cases-select",
              name: "Select",
              type: "component",
              path: "$lib/components/Select.svelte",
            },
            {
              id: "cases-toggle",
              name: "Toggle",
              type: "component",
              path: "$lib/components/Toggle.svelte",
            },
            {
              id: "cases-label",
              name: "Label",
              type: "component",
              path: "$lib/components/Label.svelte",
            },
            {
              id: "cases-userAvatar",
              name: "UserAvatar",
              type: "component",
              path: "$lib/components/UserAvatar.svelte",
            },
          ],
        },
        {
          id: "cases-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "cases-caseService",
              name: "caseService",
              type: "service",
              path: "$lib/services/caseService.ts",
            },
            {
              id: "cases-processService",
              name: "processService",
              type: "service",
              path: "$lib/services/processService.ts",
            },
            {
              id: "cases-pocketbaseService",
              name: "pocketbaseService",
              type: "service",
              path: "$lib/services/pocketbaseService.ts",
            },
            {
              id: "cases-deadlineService",
              name: "deadlineService",
              type: "service",
              path: "$lib/services/deadlineService.ts",
            },
            {
              id: "cases-eventLogService",
              name: "eventLogService",
              type: "service",
              path: "$lib/services/eventLogService.ts",
            },
          ],
        },
        {
          id: "cases-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "cases-caseStore",
              name: "caseStore",
              type: "store",
              path: "$lib/stores/caseStore.ts",
            },
            {
              id: "cases-processStore",
              name: "processStore",
              type: "store",
              path: "$lib/stores/processStore.ts",
            },
          ],
        },
        {
          id: "cases-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "cases-api-cases",
              name: "GET/POST /api/cases",
              type: "api",
              path: "/api/cases",
            },
            {
              id: "cases-api-cases-id",
              name: "GET/PUT/DELETE /api/cases/[id]",
              type: "api",
              path: "/api/cases/[id]",
            },
          ],
        },
        {
          id: "cases-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "cases-db-cases",
              name: "PostgreSQL: _bpm_cases",
              type: "database",
            },
            {
              id: "cases-db-case-tasks",
              name: "PostgreSQL: _bpm_case_tasks",
              type: "database",
            },
            {
              id: "cases-db-case-notes",
              name: "PostgreSQL: _bpm_case_notes",
              type: "database",
            },
            {
              id: "cases-db-processes",
              name: "PostgreSQL: _bpm_processes",
              type: "database",
            },
            {
              id: "cases-db-process-steps",
              name: "PostgreSQL: _bpm_process_steps",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "projects",
      name: "📁 /projects",
      type: "route",
      path: "/projects",
      description: "Project management",
      children: [
        {
          id: "projects-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "projects-projectDrawer",
              name: "ProjectDrawer",
              type: "component",
              path: "$lib/components/ProjectDrawer.svelte",
            },
            {
              id: "projects-archivedProjectsDrawer",
              name: "ArchivedProjectsDrawer",
              type: "component",
              path: "$lib/components/ArchivedProjectsDrawer.svelte",
            },
            {
              id: "projects-projectMemberManager",
              name: "ProjectMemberManager",
              type: "component",
              path: "$lib/components/ProjectMemberManager.svelte",
            },
          ],
        },
        {
          id: "projects-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "projects-projectService",
              name: "projectService",
              type: "service",
              path: "$lib/services/projectService.ts",
            },
            {
              id: "projects-projectMemberService",
              name: "projectMemberService",
              type: "service",
              path: "$lib/services/projectMemberService.ts",
            },
            {
              id: "projects-projectAuthService",
              name: "projectAuthService",
              type: "service",
              path: "$lib/services/projectAuthService.ts",
            },
          ],
        },
        {
          id: "projects-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "projects-api-projects",
              name: "GET/POST /api/projects",
              type: "api",
              path: "/api/projects",
            },
            {
              id: "projects-api-projects-id",
              name: "GET/PUT/DELETE /api/projects/[id]",
              type: "api",
              path: "/api/projects/[id]",
            },
            {
              id: "projects-api-projects-members",
              name: "GET/POST /api/projects/[id]/members",
              type: "api",
              path: "/api/projects/[id]/members",
            },
          ],
        },
        {
          id: "projects-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "projects-db-projects",
              name: "PostgreSQL: _bpm_projects",
              type: "database",
            },
            {
              id: "projects-db-project-members",
              name: "PostgreSQL: _bpm_project_members",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "work",
      name: "⚡ /work",
      type: "route",
      path: "/work",
      description: "Work items and task management",
      children: [
        {
          id: "work-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "work-kanban",
              name: "Kanban",
              type: "component",
              path: "$lib/components/Kanban.svelte",
            },
            {
              id: "work-searchInput",
              name: "SearchInput",
              type: "component",
              path: "$lib/components/SearchInput.svelte",
            },
            {
              id: "work-select",
              name: "Select",
              type: "component",
              path: "$lib/components/Select.svelte",
            },
            {
              id: "work-dateRangePicker",
              name: "DateRangePicker",
              type: "component",
              path: "$lib/components/DateRangePicker.svelte",
            },
            {
              id: "work-backlogDrawer",
              name: "BacklogDrawer",
              type: "component",
              path: "$lib/components/BacklogDrawer.svelte",
            },
            {
              id: "work-caseTaskDrawer",
              name: "CaseTaskDrawer",
              type: "component",
              path: "$lib/components/CaseTaskDrawer.svelte",
            },
          ],
        },
        {
          id: "work-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "work-taskService",
              name: "taskService",
              type: "service",
              path: "$lib/services/taskService.ts",
            },
            {
              id: "work-taskAssigneeService",
              name: "taskAssigneeService",
              type: "service",
              path: "$lib/services/taskAssigneeService.ts",
            },
            {
              id: "work-dependencyService",
              name: "dependencyService",
              type: "service",
              path: "$lib/services/dependencyService.ts",
            },
          ],
        },
        {
          id: "work-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "work-taskStore",
              name: "taskStore",
              type: "store",
              path: "$lib/stores/taskStore.ts",
            },
          ],
        },
        {
          id: "work-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "work-api-work",
              name: "GET/POST /api/work",
              type: "api",
              path: "/api/work",
            },
            {
              id: "work-api-backlog",
              name: "GET /api/work/backlog",
              type: "api",
              path: "/api/work/backlog",
            },
            {
              id: "work-api-id",
              name: "GET/PUT/DELETE /api/work/[id]",
              type: "api",
              path: "/api/work/[id]",
            },
          ],
        },
        {
          id: "work-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "work-db-work-items",
              name: "PostgreSQL: _bpm_work_items",
              type: "database",
            },
            {
              id: "work-db-tasks",
              name: "PostgreSQL: _bpm_tasks",
              type: "database",
            },
            {
              id: "work-db-task-assignees",
              name: "PostgreSQL: _bpm_task_assignees",
              type: "database",
            },
            {
              id: "work-db-task-dependencies",
              name: "PostgreSQL: _bpm_task_dependencies",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "work-items",
      name: "📝 /work-items",
      type: "route",
      path: "/work-items",
      description: "Work items management and planning",
      children: [
        {
          id: "work-items-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "workitems-workItemCard",
              name: "WorkItemCard",
              type: "component",
              path: "$lib/components/WorkItemCard.svelte",
            },
            {
              id: "workitems-backlogDrawer",
              name: "BacklogDrawer",
              type: "component",
              path: "$lib/components/BacklogDrawer.svelte",
            },
            {
              id: "workitems-caseTaskDrawer",
              name: "CaseTaskDrawer",
              type: "component",
              path: "$lib/components/CaseTaskDrawer.svelte",
            },
            {
              id: "workitems-toggle",
              name: "Toggle",
              type: "component",
              path: "$lib/components/Toggle.svelte",
            },
            {
              id: "workitems-navcard",
              name: "NavCard",
              type: "component",
              path: "$lib/components/NavCard.svelte",
            },
            {
              id: "workitems-searchInput",
              name: "SearchInput",
              type: "component",
              path: "$lib/components/SearchInput.svelte",
            },
            {
              id: "workitems-select",
              name: "Select",
              type: "component",
              path: "$lib/components/Select.svelte",
            },
            {
              id: "workitems-drawer",
              name: "Drawer",
              type: "component",
              path: "$lib/components/Drawer.svelte",
            },
            {
              id: "workitems-dateRangePicker",
              name: "DateRangePicker",
              type: "component",
              path: "$lib/components/DateRangePicker.svelte",
            },
            {
              id: "workitems-pagination",
              name: "Pagination",
              type: "component",
              path: "$lib/components/Pagination.svelte",
            },
          ],
        },
        {
          id: "work-items-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "workitems-taskService",
              name: "taskService",
              type: "service",
              path: "$lib/services/taskService.ts",
            },
            {
              id: "workitems-caseService",
              name: "caseService",
              type: "service",
              path: "$lib/services/caseService.ts",
            },
            {
              id: "workitems-pocketbaseService",
              name: "pocketbaseService",
              type: "service",
              path: "$lib/services/pocketbaseService.ts",
            },
            {
              id: "workitems-projectService",
              name: "projectService",
              type: "service",
              path: "$lib/services/projectService.ts",
            },
          ],
        },
        {
          id: "work-items-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "workitems-taskStore",
              name: "taskStore",
              type: "store",
              path: "$lib/stores/taskStore.ts",
            },
            {
              id: "workitems-navigationStore",
              name: "navigationStore",
              type: "store",
              path: "$lib/stores/navigationStore.ts",
            },
          ],
        },
        {
          id: "work-items-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "workitems-api-work",
              name: "GET/POST /api/work",
              type: "api",
              path: "/api/work",
            },
            {
              id: "workitems-api-backlog",
              name: "GET /api/work/backlog",
              type: "api",
              path: "/api/work/backlog",
            },
            {
              id: "workitems-api-id",
              name: "GET/PUT/DELETE /api/work/[id]",
              type: "api",
              path: "/api/work/[id]",
            },
          ],
        },
        {
          id: "work-items-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "workitems-db-work-items",
              name: "PostgreSQL: _bpm_work_items",
              type: "database",
            },
            {
              id: "workitems-db-tasks",
              name: "PostgreSQL: _bpm_tasks",
              type: "database",
            },
            {
              id: "workitems-db-task-assignees",
              name: "PostgreSQL: _bpm_task_assignees",
              type: "database",
            },
            {
              id: "workitems-db-task-dependencies",
              name: "PostgreSQL: _bpm_task_dependencies",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "mijn-werk",
      name: "🗓️ /mijn-werk",
      type: "route",
      path: "/mijn-werk",
      description: "Personal work planning and availability",
      children: [
        {
          id: "mijnwerk-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "mijnwerk-heatmapTable",
              name: "HeatmapTable",
              type: "component",
              path: "$lib/components/HeatmapTable.svelte",
            },
            {
              id: "mijnwerk-workItemCard",
              name: "WorkItemCard",
              type: "component",
              path: "$lib/components/WorkItemCard.svelte",
            },
            {
              id: "mijnwerk-backlogDrawer",
              name: "BacklogDrawer",
              type: "component",
              path: "$lib/components/BacklogDrawer.svelte",
            },
            {
              id: "mijnwerk-caseTaskDrawer",
              name: "CaseTaskDrawer",
              type: "component",
              path: "$lib/components/CaseTaskDrawer.svelte",
            },
            {
              id: "mijnwerk-toggle",
              name: "Toggle",
              type: "component",
              path: "$lib/components/Toggle.svelte",
            },
            {
              id: "mijnwerk-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
          ],
        },
        {
          id: "mijnwerk-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "mijnwerk-taskService",
              name: "taskService",
              type: "service",
              path: "$lib/services/taskService.ts",
            },
            {
              id: "mijnwerk-caseService",
              name: "caseService",
              type: "service",
              path: "$lib/services/caseService.ts",
            },
          ],
        },
        {
          id: "mijnwerk-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "mijnwerk-db-work-items",
              name: "PostgreSQL: _bpm_work_items",
              type: "database",
            },
            {
              id: "mijnwerk-db-tasks",
              name: "PostgreSQL: _bpm_tasks",
              type: "database",
            },
            {
              id: "mijnwerk-db-user-availability",
              name: "PostgreSQL: _bpm_user_availability",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "files",
      name: "📁 /files",
      type: "route",
      path: "/files",
      description: "File management (MinIO)",
      children: [
        {
          id: "files-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "files-minioFileManager",
              name: "MinIOFileManager",
              type: "component",
              path: "$lib/components/MinIOFileManager.svelte",
            },
            {
              id: "files-tabs",
              name: "Tabs",
              type: "component",
              path: "$lib/components/Tabs.svelte",
            },
            {
              id: "files-fileUpload",
              name: "FileUpload",
              type: "component",
              path: "$lib/components/FileUpload.svelte",
            },
            {
              id: "files-modal",
              name: "Modal",
              type: "component",
              path: "$lib/components/Modal.svelte",
            },
            {
              id: "files-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
            {
              id: "files-select",
              name: "Select",
              type: "component",
              path: "$lib/components/Select.svelte",
            },
            {
              id: "files-iconButton",
              name: "IconButton",
              type: "component",
              path: "$lib/components/IconButton.svelte",
            },
          ],
        },
        {
          id: "files-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "files-minioService",
              name: "minioService",
              type: "service",
              path: "$lib/services/minioService.ts",
            },
          ],
        },
        {
          id: "files-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "files-api-upload",
              name: "POST /api/files/upload",
              type: "api",
              path: "/api/files/upload",
            },
            {
              id: "files-api-delete",
              name: "DELETE /api/files/delete",
              type: "api",
              path: "/api/files/delete",
            },
            {
              id: "files-api-proxy",
              name: "GET /api/files/proxy",
              type: "api",
              path: "/api/files/proxy",
            },
          ],
        },
        {
          id: "files-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "files-db-minio",
              name: "MinIO: Object Storage",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "kees",
      name: "🏠 /kees",
      type: "route",
      path: "/kees",
      description: "Dashboard overview",
      children: [
        {
          id: "kees-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "kees-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
            {
              id: "kees-label",
              name: "Label",
              type: "component",
              path: "$lib/components/Label.svelte",
            },
          ],
        },
        {
          id: "kees-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "kes-dashboardService",
              name: "dashboardService",
              type: "service",
              path: "$lib/services/dashboardService.ts",
            },
            {
              id: "kees-caseService",
              name: "caseService",
              type: "service",
              path: "$lib/services/caseService.ts",
            },
            {
              id: "kees-processService",
              name: "processService",
              type: "service",
              path: "$lib/services/processService.ts",
            },
          ],
        },
        {
          id: "kees-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "kees-dashboardCache",
              name: "dashboardCache",
              type: "store",
              path: "$lib/stores/dashboardCache.ts",
            },
          ],
        },
        {
          id: "kees-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "kees-api-cases",
              name: "GET /api/cases",
              type: "api",
              path: "/api/cases",
            },
            {
              id: "kees-api-backlog",
              name: "GET /api/work/backlog",
              type: "api",
              path: "/api/work/backlog",
            },
          ],
        },
        {
          id: "kees-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "kees-db-cases",
              name: "PostgreSQL: _bpm_cases",
              type: "database",
            },
            {
              id: "kees-db-work-items",
              name: "PostgreSQL: _bpm_work_items",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "designs",
      name: "🎨 /designs",
      type: "route",
      path: "/designs",
      description: "Architecture and ERD documentation",
      children: [
        {
          id: "designs-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "designs-architecture",
              name: "Architecture",
              type: "component",
              path: "$lib/routes/designs/Architecture.svelte",
            },
            {
              id: "designs-erd",
              name: "ERD",
              type: "component",
              path: "$lib/routes/designs/ERD.svelte",
            },
          ],
        },
      ],
    },
    {
      id: "messages",
      name: "💬 /messages",
      type: "route",
      path: "/messages",
      description: "Messages and notifications",
      children: [
        {
          id: "messages-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "messages-timeline",
              name: "Timeline",
              type: "component",
              path: "$lib/components/Timeline.svelte",
            },
            {
              id: "messages-imageViewerModal",
              name: "ImageViewerModal",
              type: "component",
              path: "$lib/components/ImageViewerModal.svelte",
            },
            {
              id: "messages-chatDrawer",
              name: "ChatDrawer",
              type: "component",
              path: "$lib/components/ChatDrawer.svelte",
            },
          ],
        },
        {
          id: "messages-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "messages-messageService",
              name: "messageService",
              type: "service",
              path: "$lib/services/messageService.ts",
            },
            {
              id: "messages-pocketbaseService",
              name: "pocketbaseService",
              type: "service",
              path: "$lib/services/pocketbaseService.ts",
            },
          ],
        },
        {
          id: "messages-stores",
          name: "State Management",
          type: "store",
          children: [
            {
              id: "messages-messageStore",
              name: "messageStore",
              type: "store",
              path: "$lib/stores/messageStore.ts",
            },
          ],
        },
        {
          id: "messages-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "messages-api-messages",
              name: "GET/POST /api/messages",
              type: "api",
              path: "/api/messages",
            },
            {
              id: "messages-api-id",
              name: "GET/PUT/DELETE /api/messages/[id]",
              type: "api",
              path: "/api/messages/[id]",
            },
          ],
        },
        {
          id: "messages-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "messages-db-messages",
              name: "PostgreSQL: _bpm_messages",
              type: "database",
            },
            {
              id: "messages-db-read-status",
              name: "PostgreSQL: _bpm_message_read_status",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "admin-dashboard",
      name: "📊 /admin/dashboard",
      type: "route",
      path: "/admin/dashboard",
      description: "Admin dashboard",
      children: [
        {
          id: "admin-dashboard-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "admin-dashboard-spinner",
              name: "Spinner",
              type: "component",
              path: "$lib/components/Spinner.svelte",
            },
          ],
        },
        {
          id: "admin-dashboard-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "admin-dashboard-api-users-stats",
              name: "GET /api/admin/users/statistics",
              type: "api",
              path: "/api/admin/users/statistics",
            },
            {
              id: "admin-dashboard-api-roles",
              name: "GET /api/auth/roles",
              type: "api",
              path: "/api/auth/roles",
            },
            {
              id: "admin-dashboard-api-permissions",
              name: "GET /api/auth/permissions",
              type: "api",
              path: "/api/auth/permissions",
            },
          ],
        },
        {
          id: "admin-dashboard-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "admin-dashboard-db-users",
              name: "PocketBase: _auth_users",
              type: "database",
            },
            {
              id: "admin-dashboard-db-roles",
              name: "PocketBase: _auth_roles",
              type: "database",
            },
            {
              id: "admin-dashboard-db-permissions",
              name: "PocketBase: _auth_permissions",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "admin-gebruikers",
      name: "👥 /admin/gebruikers",
      type: "route",
      path: "/admin/gebruikers",
      description: "User management",
      children: [
        {
          id: "admin-gebruikers-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "admin-gebruikers-userDrawer",
              name: "UserDrawer",
              type: "component",
              path: "$lib/components/UserDrawer.svelte",
            },
            {
              id: "admin-gebruikers-userAvatar",
              name: "UserAvatar",
              type: "component",
              path: "$lib/components/UserAvatar.svelte",
            },
            {
              id: "admin-gebruikers-userRoleManager",
              name: "UserRoleManager",
              type: "component",
              path: "$lib/components/UserRoleManager.svelte",
            },
          ],
        },
        {
          id: "admin-gebruikers-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "admin-gebruikers-userManagementService",
              name: "userManagementService",
              type: "service",
              path: "$lib/services/userManagementService.ts",
            },
            {
              id: "admin-gebruikers-roleService",
              name: "roleService",
              type: "service",
              path: "$lib/services/roleService.ts",
            },
            {
              id: "admin-gebruikers-permissionService",
              name: "permissionService",
              type: "service",
              path: "$lib/services/permissionService.ts",
            },
            {
              id: "admin-gebruikers-invitationService",
              name: "invitationService",
              type: "service",
              path: "$lib/services/invitationService.ts",
            },
          ],
        },
        {
          id: "admin-gebruikers-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "admin-gebruikers-api-users",
              name: "GET /api/users",
              type: "api",
              path: "/api/users",
            },
            {
              id: "admin-gebruikers-api-id",
              name: "GET/PUT/DELETE /api/users/[id]",
              type: "api",
              path: "/api/users/[id]",
            },
            {
              id: "admin-gebruikers-api-permissions",
              name: "GET/POST /api/users/[id]/permissions",
              type: "api",
              path: "/api/users/[id]/permissions",
            },
            {
              id: "admin-gebruikers-api-roles",
              name: "GET/POST /api/auth/roles",
              type: "api",
              path: "/api/auth/roles",
            },
            {
              id: "admin-gebruikers-api-invitations",
              name: "GET/POST /api/auth/invitations",
              type: "api",
              path: "/api/auth/invitations",
            },
          ],
        },
        {
          id: "admin-gebruikers-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "admin-gebruikers-db-users",
              name: "PocketBase: _auth_users",
              type: "database",
            },
            {
              id: "admin-gebruikers-db-roles",
              name: "PocketBase: _auth_roles",
              type: "database",
            },
            {
              id: "admin-gebruikers-db-permissions",
              name: "PocketBase: _auth_permissions",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "admin-permissions",
      name: "🔐 /admin/permissions",
      type: "route",
      path: "/admin/permissions",
      description: "Permission management",
      children: [
        {
          id: "admin-permissions-components",
          name: "Components",
          type: "component",
          children: [
            {
              id: "admin-permissions-permissionTree",
              name: "PermissionTree",
              type: "component",
              path: "$lib/components/PermissionTree.svelte",
            },
          ],
        },
        {
          id: "admin-permissions-services",
          name: "Services",
          type: "service",
          children: [
            {
              id: "admin-permissions-permissionService",
              name: "permissionService",
              type: "service",
              path: "$lib/services/permissionService.ts",
            },
            {
              id: "admin-permissions-permissionSyncService",
              name: "permissionSyncService",
              type: "service",
              path: "$lib/services/permissionSyncService.ts",
            },
          ],
        },
        {
          id: "admin-permissions-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "admin-permissions-api-admin-permissions",
              name: "GET/POST /api/admin/permissions",
              type: "api",
              path: "/api/admin/permissions",
            },
            {
              id: "admin-permissions-api-sync",
              name: "POST /api/admin/permissions/sync",
              type: "api",
              path: "/api/admin/permissions/sync",
            },
          ],
        },
        {
          id: "admin-permissions-db",
          name: "Data Storage",
          type: "database",
          children: [
            {
              id: "admin-permissions-db-permissions",
              name: "PocketBase: _auth_permissions",
              type: "database",
            },
            {
              id: "admin-permissions-db-roles",
              name: "PocketBase: _auth_roles",
              type: "database",
            },
          ],
        },
      ],
    },
    {
      id: "help",
      name: "❓ /help",
      type: "route",
      path: "/help",
      description: "Help and documentation",
      children: [
        {
          id: "help-api",
          name: "API Endpoints",
          type: "api",
          children: [
            {
              id: "help-api-generate-link",
              name: "GET /api/help/generate-link",
              type: "api",
              path: "/api/help/generate-link",
            },
          ],
        },
      ],
    },
  ],
};
