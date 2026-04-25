# Case Creation from Process - Detailed Documentation

## Overview

This document explains in detail what happens when creating a case from a process template in the Business Process Management system. A case is an instance of a process template that represents a specific execution of a business process with its own timeline, tasks, and ownership.

## Entry Points

Cases can be created from multiple locations in the application:

1. **Cases List Page** (`/cases`): Click "Nieuwe case maken" button
2. **Processes Page** (`/processes`): Click "Nieuwe case" button with a process selected
3. **Direct URL**: Navigate to `/cases?drawer=case&processId={id}`

All entry points use the `CaseDrawer` component (`src/lib/components/CaseDrawer.svelte`) which provides a modal interface for case creation.

## User Interface Flow

### CaseDrawer Component

The `CaseDrawer` component handles the user interaction:

1. **Opens when**: URL parameter `drawer=case` is present
2. **Pre-selects process**: If `processId` URL parameter is provided
3. **Form fields**:
   - Process selector (dropdown of available processes)
   - Case name (text input, required)
   - Start date (date picker, defaults to today)
   - Owner selector (optional, defaults to current user)
   - File attachments (optional, uploaded to MinIO)

4. **Process details display**: Shows step count and task count for selected process
5. **Submission**: Validates inputs and calls `caseService.createCaseFromProcess()`

## Backend Process: `createCaseFromProcess()`

The core logic is in `src/lib/services/caseService.ts` in the `createCaseFromProcess()` function. Here's the detailed step-by-step process:

### Step 1: Input Validation

```typescript
// Validates:
// - Process ID exists and matches
// - Case name is provided
// - Start date is valid
// - Process has valid ID
```

**Validation Schema**: Uses `CreateCaseInputSchema` from `src/lib/schemas/case.ts`
- `name`: String, required, max 255 characters
- `start_date`: Date string in YYYY-MM-DD format
- `owner_id`: Optional string (user ID)
- `process_id`: Required positive integer
- `bijlagen`: Optional array of file URLs

### Step 2: Calculate Case Completion Deadline

```typescript
const startDate = new Date(data.start_date);
const completionDeadline = calculateDeadline(startDate, process.completion_days);
```

**Formula**: `start_date + process.completion_days`

The `calculateDeadline()` function (from `src/lib/services/deadlineService.ts`) uses `date-fns` to add days to the start date, handling date calculations properly.

### Step 3: Determine Case Owner

```typescript
const ownerId = data.owner_id || getCurrentUserId() || undefined;
```

**Priority**:
1. Provided `owner_id` in form
2. Current logged-in user ID
3. `undefined` if no user is logged in

### Step 4: Create Case Record

**Database Table**: `_bpm_cases`

**Fields Created**:
- `process_id`: Links to the process template
- `name`: User-provided case name
- `start_date`: User-selected start date
- `completion_deadline`: Calculated from `start_date + completion_days`
- `status`: Set to `'gepland'` (planned)
- `owner_id`: Determined owner (or null)
- `bijlagen`: Array of attachment URLs (from file uploads)
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

**Status Values**:
- `'gepland'`: Planned (initial status)
- `'mee_bezig'`: In progress
- `'afgerond'`: Completed
- `'overdue'`: Late/overdue

### Step 5: Create Case Steps

For each step in the process template (`process.steps`):

#### 5.1 Calculate Step Dates

```typescript
const stepStartDate = calculateDeadline(startDate, step.start_days_offset);
const stepDeadline = calculateDeadline(stepStartDate, step.completion_days);
```

**Formulas**:
- Step start: `case_start_date + step.start_days_offset`
- Step deadline: `step_start_date + step.completion_days`

#### 5.2 Create Case Step Record

**Database Table**: `_bpm_case_steps`

**Fields Created**:
- `case_id`: Links to the created case
- `step_id`: Links to the process step template
- `status`: Set to `'pending'` (initial status)
- `start_date`: Calculated step start date
- `completion_deadline`: Calculated step deadline
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

**Status Values**:
- `'pending'`: Not yet started
- `'active'`: Currently in progress
- `'completed'`: Finished
- `'overdue'`: Past deadline

**Error Handling**: If step creation fails, the entire case creation is rolled back (transaction-like behavior).

### Step 6: Create Case Tasks

For each task in each process step (`step.tasks`):

#### 6.1 Calculate Task Dates

```typescript
const taskStartDate = calculateDeadline(stepStartDate, task.start_offset_days || 0);
const taskDeadline = calculateDeadline(stepStartDate, task.deadline_days);
```

**Formulas**:
- Task start: `step_start_date + task.start_offset_days` (defaults to 0)
- Task deadline: `step_start_date + task.deadline_days`

**Note**: Task deadlines are calculated from the step start date, not the task start date.

#### 6.2 Create Task Record

**Database Table**: `_bpm_tasks` (unified task table)

**Fields Created**:
- `task_type`: Set to `'process'` (distinguishes from work items)
- `case_step_id`: Links to the created case step
- `task_id`: Links to the process task template
- `subject`: Copied from `task.name` (process task name)
- `uren`: Hours estimate from process task (if provided)
- `status`: Set to `'backlog'` (initial status)
- `kanban_status`: Set to `'backlog'` (must match status)
- `deadline`: Calculated task deadline (as ISO timestamp)
- `source`: URL where case was created from (or `'process_automation'`)
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

**Status Values**:
- `'backlog'`: Not yet started (initial)
- `'gepland'`: Planned/scheduled
- `'mee_bezig'`: In progress
- `'in_review'`: Under review
- `'afgerond'`: Completed
- `'overdue'`: Past deadline

**Error Handling**: Task creation failures are logged but don't stop the process (allows partial success).

### Step 7: Update `komt_van` Field

The `komt_van` (comes from) field tracks which case owner the task originated from.

#### 7.1 Fetch Owner Email

```typescript
if (ownerId) {
  const userResult = await pocketbaseService.getUserById(ownerId);
  const email = userResult.value.email || null;
}
```

#### 7.2 Update All Tasks

```typescript
await updateTasksKomtVan(newCase.id, email);
```

**Function**: `updateTasksKomtVan()` in `caseService.ts`

**Process**:
1. Gets all tasks for the case (via `case_step_id` relationships)
2. Updates all task records with the owner's email in `komt_van` field
3. If no owner, sets `komt_van` to `null`

**Error Handling**: Failures are logged but don't fail case creation (non-critical operation).

### Step 8: Log Case Creation Event

```typescript
await eventLogService.logCaseCreated(newCase.id, newCase, 'case_creation');
```

**Event Logging**: Records the case creation in the event log system for audit purposes.

**Error Handling**: Failures are caught and logged but don't fail case creation.

### Step 9: Return Created Case

Returns a `Result<Case, AppError>` containing the newly created case object.

## Data Relationships

### Hierarchical Structure

```
Process Template
├── Process Steps
│   └── Process Tasks
│
Case (instance)
├── Case Steps (linked to Process Steps)
│   └── Case Tasks (linked to Process Tasks)
│       └── Stored in _bpm_tasks table
```

### Database Relationships

1. **Case → Process**: `_bpm_cases.process_id` → `_bpm_processes.id`
2. **Case Step → Case**: `_bpm_case_steps.case_id` → `_bpm_cases.id`
3. **Case Step → Process Step**: `_bpm_case_steps.step_id` → `_bpm_process_steps.id`
4. **Task → Case Step**: `_bpm_tasks.case_step_id` → `_bpm_case_steps.id`
5. **Task → Process Task**: `_bpm_tasks.task_id` → `_bpm_process_tasks.id`

### Foreign Key Constraints

- **Cascade Deletes**: Deleting a case deletes all its steps and tasks
- **Restrict Deletes**: Cannot delete a process if cases reference it
- **Restrict Deletes**: Cannot delete a process step if case steps reference it

## Date Calculation Examples

### Example Process
- Process completion days: 30
- Step 1: start_offset = 0, completion_days = 10
- Step 2: start_offset = 10, completion_days = 10
- Step 3: start_offset = 20, completion_days = 10
- Task in Step 1: start_offset_days = 2, deadline_days = 5

### Case Created with Start Date: 2025-01-01

**Case**:
- Start: 2025-01-01
- Deadline: 2025-01-31 (start + 30 days)

**Step 1**:
- Start: 2025-01-01 (start + 0 days)
- Deadline: 2025-01-11 (step start + 10 days)

**Step 2**:
- Start: 2025-01-11 (start + 10 days)
- Deadline: 2025-01-21 (step start + 10 days)

**Step 3**:
- Start: 2025-01-21 (start + 20 days)
- Deadline: 2025-01-31 (step start + 10 days)

**Task in Step 1**:
- Start: 2025-01-03 (step start + 2 days)
- Deadline: 2025-01-06 (step start + 5 days)

## File Attachments

### Upload Process

1. **During Creation**: Files can be uploaded in the `CaseDrawer` component
2. **Storage**: Files are uploaded to MinIO object storage
3. **Path Structure**: `cases/{caseId}/{filename}`
4. **Database Storage**: URLs stored in `_bpm_cases.bijlagen` JSONB array

### File Management

- Files uploaded before case creation are stored temporarily
- After case creation, files are associated with the case ID
- File URLs are stored in the case record's `bijlagen` field

## Error Handling

### Validation Errors

- **Process ID mismatch**: Returns `ValidationError`
- **Invalid start date**: Returns `ValidationError`
- **Missing required fields**: Returns `ValidationError`

### Database Errors

- **Case creation failure**: Returns database error, stops process
- **Step creation failure**: Returns database error, stops process (case may be orphaned)
- **Task creation failure**: Logs error, continues with other tasks (partial success allowed)
- **komt_van update failure**: Logs error, doesn't fail case creation
- **Event logging failure**: Logs error, doesn't fail case creation

### Transaction Behavior

The system does not use database transactions, so:
- If step creation fails after case creation, the case may be left in an incomplete state
- Task creation failures don't roll back the case or steps
- The application relies on careful error handling to maintain data consistency

## Post-Creation Actions

### Navigation

After successful case creation:

1. **CaseDrawer** calls `oncreated` callback with the created case
2. **Parent component** (e.g., `+page.svelte`) navigates to `/cases/{caseId}`
3. **Case detail page** loads and displays the new case

### UI Updates

- Cases list is refreshed to show the new case
- Dashboard statistics are updated
- Navigation occurs automatically to the case detail page

## Status Flow

### Case Status Progression

```
gepland (planned)
    ↓
mee_bezig (in progress)
    ↓
afgerond (completed)
```

**Overdue Detection**: Cases automatically transition to `overdue` status when `completion_deadline` passes (handled by background jobs).

### Step Status Progression

```
pending
    ↓
active
    ↓
completed
```

### Task Status Progression

```
backlog
    ↓
gepland
    ↓
mee_bezig
    ↓
in_review (optional)
    ↓
afgerond
```

## Key Functions Reference

### `createCaseFromProcess()`
- **Location**: `src/lib/services/caseService.ts:186`
- **Purpose**: Main function that orchestrates case creation
- **Returns**: `Result<Case, AppError>`

### `calculateDeadline()`
- **Location**: `src/lib/services/deadlineService.ts:29`
- **Purpose**: Calculates deadline dates from start date and day offset
- **Returns**: `Date`

### `updateTasksKomtVan()`
- **Location**: `src/lib/services/caseService.ts:831`
- **Purpose**: Updates `komt_van` field for all tasks in a case
- **Returns**: `Result<void, AppError>`

### `getAllTasksForCase()`
- **Location**: `src/lib/services/caseService.ts:784`
- **Purpose**: Retrieves all tasks belonging to a case
- **Returns**: `Result<CaseTask[], AppError>`

## Testing

To test case creation:

1. **Manual Testing**: Use the UI to create cases from various processes
2. **Test Scripts**: See `tests/process/process-tester.ts` for automated tests
3. **Database Verification**: Check that all related records are created correctly

## Related Documentation

- **Process Templates**: See `src/routes/processes/README.md` (if exists)
- **Case Service**: See `src/lib/services/caseService.ts` for full API documentation
- **Database Schema**: See `schema-mgr/schema/` for table definitions
- **Deadline Service**: See `src/lib/services/deadlineService.ts` for date calculation utilities

## Common Issues and Solutions

### Issue: Case created but no steps/tasks

**Cause**: Step or task creation failed after case was created
**Solution**: Check error logs, manually delete incomplete case, retry creation

### Issue: Tasks have wrong deadlines

**Cause**: Incorrect `deadline_days` or `start_offset_days` in process template
**Solution**: Review and fix process template task configurations

### Issue: `komt_van` field not populated

**Cause**: Owner email lookup failed or update function failed
**Solution**: Check owner exists in PocketBase, verify email field is populated

### Issue: File attachments not saved

**Cause**: MinIO upload failed or case ID not available during upload
**Solution**: Check MinIO connection, ensure files are uploaded after case creation

## Summary

Creating a case from a process is a multi-step operation that:

1. ✅ Validates inputs
2. ✅ Creates the case record
3. ✅ Creates case steps (one per process step)
4. ✅ Creates case tasks (one per process task)
5. ✅ Calculates all dates based on offsets
6. ✅ Sets up ownership and tracking fields
7. ✅ Logs the creation event
8. ✅ Returns the created case

The entire process maintains referential integrity through foreign keys and ensures all related data is properly linked and dated.

