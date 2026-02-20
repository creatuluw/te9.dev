# Spec Store - Specification Storage Reference

## Overview

The spec-store step captures and stores requirements in a structured format for traceability throughout the development workflow. This reference provides templates, structures, and best practices for storing specifications.

## Spec ID Format

Generate unique spec IDs using the format:

```
SPEC-<YYYYMMDD>-<HHMM>-<slug>
```

**Components:**
- `YYYYMMDD`: Date of spec creation
- `HHMM`: Time of spec creation (24-hour format)
- `slug`: URL-friendly kebab-case description of the feature

**Examples:**
- `SPEC-20240115-1430-add-user-authentication`
- `SPEC-20240115-1512-fix-login-timeout-error`
- `SPEC-20240116-0923-implement-data-export-feature`

## Directory Structure

Create the following structure:

```
te9.dev/
├── specs/
│   ├── SPEC-20240115-1430-add-user-auth/
│   │   └── spec.md
│   ├── SPEC-20240115-1512-fix-login-timeout/
│   │   └── spec.md
│   └── specs.json
└── logs/
    ├── SPEC-20240115-1430-add-user-auth.log
    ├── SPEC-20240115-1512-fix-login-timeout.log
    └── ...
```

## spec.md Template

```markdown
# Specification

## Meta Information

**Spec ID:** SPEC-20240115-1430-add-user-auth
**Created:** 2024-01-15 14:30:00
**Status:** REQUIREMENTS_GATHERED
**Priority:** High/Medium/Low
**Estimated Complexity:** Simple/Medium/Complex

## User Request

[Original user request text]

## Requirements Summary

[Consolidated requirements from clarification phase]

## Clarified Requirements

### Requirement 1: [Title]

**Description:** [Detailed description]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Requirement 2: [Title]

**Description:** [Detailed description]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Technical Considerations

### Dependencies
- [List any dependencies on other features, services, or systems]

### Constraints
- [List technical, time, or resource constraints]

### Non-Functional Requirements
- Performance: [Requirements]
- Security: [Requirements]
- Scalability: [Requirements]

## Implementation Plan

### Components to Modify
- [File 1]: [Description of changes]
- [File 2]: [Description of changes]

### Test Strategy
- Unit tests: [Areas to test]
- Integration tests: [Areas to test]
- End-to-end tests: [Scenarios to test]

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk description] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

## Success Metrics

- [Metric 1]: [Definition and target]
- [Metric 2]: [Definition and target]

## Status History

- 2024-01-15 14:30:00 - REQUIREMENTS_GATHERED
- [Timestamp] - [Status]

## Notes

[Any additional notes or considerations]
```

## specs.json Structure

```json
{
  "specs": [
    {
      "id": "SPEC-20240115-1430-add-user-auth",
      "title": "Add User Authentication",
      "slug": "add-user-authentication",
      "description": "Implement OAuth2 user authentication with JWT tokens",
      "created": "2024-01-15T14:30:00Z",
      "updated": "2024-01-15T14:30:00Z",
      "status": "REQUIREMENTS_GATHERED",
      "priority": "High",
      "complexity": "Medium",
      "assignee": null,
      "branch": null,
      "pr": null
    }
  ],
  "metadata": {
    "total_specs": 1,
    "last_updated": "2024-01-15T14:30:00Z"
  }
}
```

## specs.json Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | string | Unique spec identifier | Yes |
| `title` | string | Human-readable title | Yes |
| `slug` | string | URL-friendly identifier | Yes |
| `description` | string | Brief description | Yes |
| `created` | ISO 8601 | Creation timestamp | Yes |
| `updated` | ISO 8601 | Last update timestamp | Yes |
| `status` | string | Current status | Yes |
| `priority` | string | High/Medium/Low | Yes |
| `complexity` | string | Simple/Medium/Complex | Yes |
| `assignee` | string/null | Assigned developer | No |
| `branch` | string/null | Feature branch name | No |
| `pr` | string/null | Pull request URL | No |

## Status Values

Valid status transitions:

```
REQUIREMENTS_GATHERED (initial)
    ↓
SPEC_STORED (after storing)
    ↓
IN_PROGRESS (during implementation)
    ↓
READY_FOR_BRANCH_COMMIT (implementation complete)
    ↓
BRANCH_COMMITTED (git push complete)
    ↓
PR_CREATED (pull request created)
    ↓
REVIEWING (under review)
    ↓
COMPLETED (merged)
```

Alternative statuses for error cases:
- `ON_HOLD` - Temporarily paused
- `CANCELLED` - Abandoned
- `FAILED` - Irrecoverable error

## Execution Log Format

Initialize `te9.dev/logs/<spec-id>.log`:

```
=== Execution Log: SPEC-20240115-1430-add-user-auth ===
Started: 2024-01-15 14:30:00
Status: REQUIREMENTS_GATHERED

---

[2024-01-15 14:35:00] STEP 1: SPEC CLARIFY
- Complexity determined: Medium
- Questions asked: 3
- User confirmation received

[2024-01-15 14:38:00] STEP 2: SPEC STORE
- Spec ID generated: SPEC-20240115-1430-add-user-auth
- spec.md created at te9.dev/specs/SPEC-20240115-1430-add-user-auth/spec.md
- specs.json updated
- Execution log initialized
- Status updated to: SPEC_STORED

[2024-01-15 14:40:00] STEP 3: SPEC EXECUTE
- Planning implementation...
- [Detailed implementation log continues]
```

## Best Practices

### 1. Spec ID Generation

- Always use UTC timestamp for consistency
- Generate slug from feature title: convert to lowercase, replace spaces with hyphens, remove special characters
- Example: "Add User Authentication" → "add-user-authentication"

### 2. spec.md Content

- Keep requirements concise but complete
- Use bullet points for acceptance criteria
- Include non-functional requirements (performance, security, etc.)
- Document dependencies and constraints early

### 3. specs.json Maintenance

- Update `updated` timestamp on every status change
- Populate `branch` and `pr` fields as workflow progresses
- Keep specs sorted by `created` or `id` for easy scanning
- Use consistent date format (ISO 8601)

### 4. Execution Logging

- Log every workflow step with timestamp
- Include specific details (files modified, tests run, etc.)
- Note any errors or exceptions with full stack traces
- Update status in spec.md and logs atomically

### 5. Error Handling

If an error occurs during spec store:

1. Log the error with timestamp and details
2. Update spec status to `FAILED`
3. Notify user with context:
   ```
   Failed to store specification:
   Spec ID: SPEC-20240115-1430-add-user-auth
   Error: [error message]
   
   Options:
   - Retry storage
   - Generate new spec ID
   - Cancel and restart
   ```

### 6. Memory Storage

Store spec in memory after creation:

```
Memory Store:
{
  "current_spec": {
    "id": "SPEC-20240115-1430-add-user-auth",
    "path": "te9.dev/specs/SPEC-20240115-1430-add-user-auth/spec.md",
    "data": { ...spec content... }
  }
}
```

Access in subsequent steps using `@current_spec` reference.

## Examples

### Example 1: Simple Feature Spec

```markdown
# Specification

## Meta Information

**Spec ID:** SPEC-20240115-1432-add-cancel-button
**Created:** 2024-01-15 14:32:00
**Status:** REQUIREMENTS_GATHERED
**Priority:** Medium
**Estimated Complexity:** Simple

## User Request

Add a cancel button to the modal dialog that closes the modal without saving changes.

## Requirements Summary

Add cancel button to modal dialogs with click handler to close without saving.

## Clarified Requirements

### Requirement 1: Add Cancel Button

**Description:** Add a secondary button labeled "Cancel" to all modal dialogs.

**Acceptance Criteria:**
- [ ] Cancel button appears in all modal dialogs
- [ ] Button is positioned to the right of submit button
- [ ] Button has neutral styling (gray/outline)
- [ ] Clicking button closes modal
- [ ] No changes are saved
- [ ] No confirmation dialog appears

## Technical Considerations

### Dependencies
- Modal component: `src/components/Modal.tsx`

### Constraints
- Maintain existing modal API
- No breaking changes to existing modals

## Implementation Plan

### Components to Modify
- `src/components/Modal.tsx`: Add cancel button and handler
- `src/components/__tests__/Modal.test.tsx`: Add tests

### Test Strategy
- Unit tests: Test cancel button renders and closes modal
- Integration tests: Test cancel in dialog context

## Success Metrics

- All modals include cancel button
- Cancel button closes modal without saving
- No regressions in existing modal behavior

## Status History

- 2024-01-15 14:32:00 - REQUIREMENTS_GATHERED
```

### Example 2: Complex Feature Spec

```markdown
# Specification

## Meta Information

**Spec ID:** SPEC-20240116-0923-implement-data-export
**Created:** 2024-01-16 09:23:00
**Status:** REQUIREMENTS_GATHERED
**Priority:** High
**Estimated Complexity:** Complex

## User Request

Implement data export functionality allowing users to export reports in multiple formats (CSV, PDF, Excel) with filtering and scheduling capabilities.

## Requirements Summary

Build comprehensive data export system with multiple formats, filtering, and scheduling.

## Clarified Requirements

### Requirement 1: Multi-Format Export

**Description:** Support export to CSV, PDF, and Excel formats.

**Acceptance Criteria:**
- [ ] CSV export includes all visible columns
- [ ] PDF export includes headers and pagination
- [ ] Excel export preserves formatting and formulas
- [ ] Export handles 100,000+ rows without timeout
- [ ] Export progress indicator shows during generation

### Requirement 2: Data Filtering

**Description:** Allow users to filter data before export.

**Acceptance Criteria:**
- [ ] Filter by date range
- [ ] Filter by status
- [ ] Filter by custom fields
- [ ] Save filter presets
- [ ] Apply filter before export

### Requirement 3: Scheduled Exports

**Description:** Enable scheduled exports for recurring reports.

**Acceptance Criteria:**
- [ ] Create scheduled export with CRON-like syntax
- [ ] Schedule daily, weekly, monthly exports
- [ ] Email export to specified recipients
- [ ] View export history
- [ ] Cancel or modify scheduled exports

## Technical Considerations

### Dependencies
- CSV library: `papaparse`
- PDF library: `jspdf`
- Excel library: `exceljs`
- Job scheduler: `node-cron`
- Email service: `SendGrid API`

### Constraints
- Exports must complete within 5 minutes for up to 1M rows
- Memory usage must not exceed 2GB
- Exports must work offline (no external dependencies for core functionality)

### Non-Functional Requirements
- Performance: 1M rows in <5 minutes
- Security: Data encrypted at rest, access control
- Scalability: Handle concurrent exports

## Implementation Plan

### Components to Create
- `src/services/export/ExportService.ts`: Core export logic
- `src/services/export/CSVExporter.ts`: CSV export
- `src/services/export/PDFExporter.ts`: PDF export
- `src/services/export/ExcelExporter.ts`: Excel export
- `src/services/schedule/ScheduleService.ts`: Scheduled exports
- `src/components/export/ExportModal.tsx`: Export UI
- `src/components/export/FilterPanel.tsx`: Filter UI

### Test Strategy
- Unit tests: All export services
- Integration tests: Export with filters
- End-to-end tests: Full export workflow
- Performance tests: Large dataset export

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Memory overflow with large datasets | Medium | High | Stream processing, pagination |
| PDF rendering failures | Low | Medium | Error handling, fallback |
| Schedule conflicts | Low | Low | Queue system, deduplication |
| Performance degradation | Medium | High | Caching, indexing, optimization |

## Success Metrics

- Export success rate: >99%
- Average export time: <2 minutes for 100K rows
- Concurrent exports: Support 10 simultaneous exports
- User satisfaction: >4/5 rating

## Status History

- 2024-01-16 09:23:00 - REQUIREMENTS_GATHERED
```

## Troubleshooting

### Issue: Duplicate Spec ID

**Symptom:** Generated spec ID already exists in specs.json

**Resolution:**
1. Check if existing spec is for same feature
2. If yes, use existing spec instead
3. If no, regenerate with current timestamp (HHMM will differ)

### Issue: Failed to Create Directory

**Symptom:** Cannot create `te9.dev/specs/<id>/` directory

**Resolution:**
1. Check parent directory permissions
2. Verify `te9.dev/` directory exists
3. Create `te9.dev/specs/` if missing
4. Retry directory creation

### Issue: specs.json Parse Error

**Symptom:** Cannot read or write specs.json

**Resolution:**
1. Check JSON syntax (missing commas, trailing commas)
2. Verify file is valid UTF-8
3. Check file permissions
4. Use JSON linting tool to validate

### Issue: Memory Store Conflict

**Symptom:** Another spec already in memory

**Resolution:**
1. Complete or cancel current spec workflow
2. Clear memory store
3. Start new spec workflow