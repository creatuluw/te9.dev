# Services Directory

This directory contains all service layer modules that handle business logic, data access, and external integrations for the Business Process Management system. All services follow the Result pattern for consistent error handling.

## Core BPM Services

### `caseService.ts`
Manages case lifecycle from creation to completion, including case templates and step progression. Handles case CRUD operations, status transitions, and integration with process templates. Creates cases from process definitions and manages their execution flow.

**Event Logging:**
- `case_created` - When a new case is created (entity: `case`)
- `case_updated` - When a case is updated (entity: `case`)
- `case_deleted` - When a case is deleted (entity: `case`)
- `case_status_changed` - When a case status changes (entity: `case`)
- `task_status_changed` - When a task status changes (entity: `task`)
- `task_assigned` - When a task is assigned to a user (entity: `task`)

### `processService.ts`
Handles business process definitions including steps, tasks, and workflow templates. Manages process CRUD operations, step sequencing, and task definitions. Provides the foundation for creating executable cases from process templates.

**Event Logging:**
- `process_created` - When a new process is created (entity: `process`)
- `process_updated` - When a process is updated (entity: `process`)
- `process_deleted` - When a process is deleted (entity: `process`)
- `process_step_created` - When a process step is created (entity: `process_step`)
- `process_step_updated` - When a process step is updated (entity: `process_step`)
- `process_step_deleted` - When a process step is deleted (entity: `process_step`)
- `process_task_created` - When a process task is created (entity: `process_task`)
- `process_task_updated` - When a process task is updated (entity: `process_task`)
- `process_task_deleted` - When a process task is deleted (entity: `process_task`)

### `taskService.ts`
Manages task activation logic and status transitions within case workflows. Handles task completion, automatic progression to next tasks, and task state management. Coordinates task dependencies and workflow progression.

**Event Logging:**
- `task_completed` - When a task is completed (entity: `task`)
- `task_activated` - When a task is activated (entity: `task`)

### `taskService.ts`
Manages individual tasks (both manual work items and process tasks) with kanban-style status tracking and project assignment. Handles task CRUD operations, status transitions (gepland, mee_bezig, in_review, afgerond), and project associations. Supports filtering by assignee, project, and status. Provides unified access to both manual tasks and case tasks from the `_bpm_tasks` table.

**Event Logging:**
- `work_item_created` - When a new work item is created (entity: `work_item`)
- `task_assigned` - When a work item is assigned to a user (entity: `work_item`)
- `task_unassigned` - When a work item is unassigned (entity: `work_item`)
- `work_item_status_changed` - When a work item kanban status changes (entity: `work_item`)
- `work_item_deleted` - When a work item is deleted (entity: `work_item`)

## Data & Analytics Services

### `dashboardService.ts`
Aggregates statistics across processes, cases, and tasks for dashboard displays. Provides comprehensive metrics including case counts by status, overdue tasks, and process-specific statistics. Generates real-time analytics for management reporting.

**Event Logging:** None (read-only service)

### `analyticsService.ts`
Tracks user behavior and interaction analytics including page visits, login/logout events, click tracking, and session management. Provides comprehensive user analytics for understanding application usage patterns and user engagement metrics.

**Event Logging:** None (logs to `_bpm_analytics_log` table, not `_bpm_event_log`)

### `eventLogService.ts`
Provides business event logging for audit trails and compliance. Tracks all significant business transactions including case creation, task completion, status changes, and user assignments. Enables comprehensive audit logging across all core business operations.

**Event Logging:** None (this service IS the event logging mechanism)

### `tagService.ts`
Extracts and manages unique tags from work items for autocomplete functionality. Provides tag suggestions and maintains tag consistency across the system.

**Event Logging:** None (read-only service)

### `taskLogService.ts`
Tracks task completion history and provides audit trails for completed tasks. Maintains logs of task state changes, completion timestamps, and user actions for compliance and reporting.

**Event Logging:** None (logs to `_bpm_task_logs` table, not `_bpm_event_log`)

## Communication Services

### `messageService.ts`
Handles in-app messaging and email notifications with template support. Manages message creation, delivery tracking, and integration with email service. Supports various message types including task assignments and deadline notifications.

**Event Logging:**
- `message_created` - When a new message is created (entity: `message`)
- `email_sent` - When an email message is sent (entity: `message`)

### `emailService.ts`
Integrates with external email backend API for sending transactional emails. Handles email composition, delivery, attachment support, and delivery status tracking. Provides email template processing and error handling.

**Event Logging:**
- `email_status_updated` - When email delivery status is updated (entity: `message`)

### `tinyTalkService.ts`
Provides AI chat completion capabilities through TinyTalk API integration. Supports streaming responses, conversation management, and bot configuration. Enables AI-powered assistance within the BPM system.

**Event Logging:** None

## Storage & File Management

### `minioService.ts`
Provides S3-compatible file storage using MinIO with comprehensive bucket management. Handles object storage operations, presigned URLs, bucket creation, and file lifecycle management. Offers enterprise-grade file storage capabilities.

**Event Logging:**
- `minio_file_uploaded` - When a file is uploaded to MinIO (entity: `file`)
- `minio_file_deleted` - When a file is deleted from MinIO (entity: `file`)

## User & Project Management

### `pocketbaseService.ts`
Manages user authentication and profile data through PocketBase integration. Handles user CRUD operations, authentication state, and profile management. Provides secure user management with token-based authentication.

**Event Logging:** None

### `projectService.ts`
Handles project lifecycle management including creation, updates, and archival. Manages project metadata, status tracking, and associations with work items. Supports project-based organization of work.

**Event Logging:**
- `project_created` - When a new project is created (entity: `project`)
- `project_updated` - When a project is updated (entity: `project`)
- `project_deleted` - When a project is deleted (entity: `project`)

### `userAvailabilityService.ts`
Tracks user weekly hour availability for resource planning and workload management. Manages availability schedules, capacity planning, and resource allocation. Supports workforce planning and scheduling.

**Event Logging:**
- `availability_created` - When user availability is created (entity: `user_availability`)
- `availability_updated` - When user availability is updated (entity: `user_availability`)

## Utility & Support Services

### `deadlineService.ts`
Provides deadline calculation utilities including overdue detection and time remaining calculations. Offers pure utility functions for date arithmetic, deadline tracking, and schedule management without external dependencies.

**Event Logging:** None (pure utility functions, no side effects)

### `dependencyService.ts`
Analyzes task dependencies and manages impact notifications for workflow changes. Tracks dependency chains, identifies affected tasks, and provides impact analysis for schedule changes. Ensures workflow integrity and dependency management.

**Event Logging:**
- `dependency_change_processed` - When a dependency change is processed (entity: `task`)

### `komtVanService.ts`
Extracts distinct "komt_van" (source) values from tasks for autocomplete functionality. Provides source tracking and maintains data consistency for task origin tracking.

**Event Logging:** None (read-only service)

### `formbricksService.ts`
Integration with Formbricks Management API for survey management, response tracking, and webhook configuration. Provides full CRUD operations for surveys, responses, people, action classes, attribute classes, and webhooks. Uses API key authentication and follows Formbricks REST API patterns.

**Event Logging:** None (external API integration)

**API Endpoints:**
- Action Class API: Create, List, Delete action classes
- Attribute Class API: Create, List, Delete attribute classes
- Me API: Retrieve account information
- People API: List and Delete people
- Response API: List, List by Survey, Update, Delete responses
- Survey API: List, Create, Update, Generate IDs, Delete surveys
- Webhook API: List, Create, Delete webhooks

## Architecture Notes

- **Error Handling**: All services use the Result pattern (`Result<T, AppError>`) for consistent error handling
- **Validation**: Input validation using Zod schemas with the `validateSchema` utility
- **Data Access**: PostgREST integration through utility functions for type-safe database operations
- **Type Safety**: Comprehensive TypeScript types with branded types for IDs
- **Documentation**: JSDoc comments with usage examples for all public methods

## Usage Pattern

```typescript
import * as caseService from '$lib/services/caseService';

const result = await caseService.getCaseById(caseId);
if (result.success) {
  // Handle success
  console.log(result.value);
} else {
  // Handle error
  console.error(result.error);
}
```
