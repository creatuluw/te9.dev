Format: SPEC-<YYYYMMDD>-<HHMM>-<slug>
Example: SPEC-20260120-2010-match-brutalist-design

Generate using:
- Current date (YYYYMMDD)
- Current time (HHMM)
- Slugified spec title (lowercase, hyphen-separated, max 50 chars)
```

### 2. Create Spec File
```
Location: te9.dev/specs/<spec-id>/spec.md

Structure:
```markdown
# Spec: <spec-id>

## Status
State: PENDING
Created: <timestamp>
Updated: <timestamp>

## Objective
[Clear objective statement from spec-clarify]

## Requirements
[bullet list of requirements]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion N

## Context
- Original prompt: [user's initial prompt]
- Clarification questions asked: [number]
- Key decisions made: [list]

## Technical Notes
[Any technical considerations, preferences, constraints]
```

### 3. Update Spec Database
```
Location: te9.dev/specs/specs.json

Add entry:
{
  "id": "<spec-id>",
  "title": "<short title>",
  "status": "PENDING",
  "created": "<timestamp>",
  "updated": "<timestamp>",
  "requirements_count": <number>,
  "acceptance_criteria_count": <number>
}
```

### 4. Store in OpenMemory
```
Store as semantic memory:
{
  "content": "Created spec <spec-id>: [summary of objective]",
  "sector": "procedural",
  "tags": ["spec-created", "<spec-id>", "requirements"]
}

Store acceptance criteria as individual facts:
- Each criterion as a knowledge graph fact
- State: PENDING
- Valid from: current timestamp
```

### 5. Create Execution Log File
```
Location: te9.dev/logs/<spec-id>.log

Initial content:
```
=== SPEC CREATED ===
Timestamp: <timestamp>
Spec ID: <spec-id>
Status: PENDING
Requirements: <number>
Acceptance Criteria: <number>
```
```

### 6. Provide Confirmation
```
Display to user:
✅ Spec created successfully!

Spec ID: <spec-id>
Status: PENDING
Requirements: <number>
Acceptance Criteria: <number>
Location: te9.dev/specs/<spec-id>/spec.md

Ready to execute? Use: spec-execute <spec-id>
Or track progress anytime with: spec-track
```

## File Structure

### Spec Directory
```
te9.dev/specs/<spec-id>/
├── spec.md              # Main spec file
├── context.json         # Conversation context
└── evidence/            # Screenshots, logs, etc. (created during execution)
```

### Spec Database
```
te9.dev/specs/specs.json
- Index of all specs
- Quick lookup by ID, status, date
- Used by spec-track for reporting
```

## Spec File Template

```markdown
# Spec: SPEC-20260120-2010-match-brutalist-design

## Status
State: PENDING
Created: 2025-01-15T10:30:00Z
Updated: 2025-01-15T10:30:00Z

## Objective
[One-sentence summary of what this spec accomplishes]

## Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## Acceptance Criteria
- [ ] Criterion 1: [description]
- [ ] Criterion 2: [description]
- [ ] Criterion 3: [description]

## Context
**Original Prompt:**
> [user's initial request]

**Clarification Summary:**
- Questions asked: <number>
- Key decisions: [list]

**Assumptions:**
- [List of assumptions made]

## Constraints
- [Any technical, time, or resource constraints]

## Success Metrics
- [How to verify the spec was completed successfully]
```

## Context JSON Template

```json
{
  "spec_id": "SPEC-20260120-2010-match-brutalist-design",
  "created_at": "2026-01-20T20:10:00Z",
  "original_prompt": "user's original prompt",
  "clarification_questions": [
    {
      "question": "question text",
      "answer": "user's answer"
    }
  ],
  "decisions": [
    "decision 1",
    "decision 2"
  ],
  "assumptions": [
    "assumption 1",
    "assumption 2"
  ]
}
```

## Transitions

### After Spec Created
```
User options:
1. Execute now → spec-execute <spec-id>
2. Execute later → spec-track to check status anytime
3. Modify → Delete spec and restart spec-clarify
```

### Spec States
```
PENDING → IN_PROGRESS → COMPLETED
                    ↓
                  FAILED
                    ↓
                  BLOCKED
```

## Spec ID Format Validation (MANDATORY)

The spec ID format is **strictly enforced**. All spec IDs MUST follow: `SPEC-<YYYYMMDD>-<HHMM>-<slug>`

### Format Breakdown:
- **SPEC**: Literal prefix (required)
- **<YYYYMMDD>**: 8-digit date (e.g., 20260120)
- **<HHMM>**: 4-digit time in 24h format (e.g., 2010)
- **<slug>**: Lowercase, hyphen-separated title slug (max 50 chars)

### Slug Generation Rules:
- Convert title to lowercase
- Replace spaces with hyphens
- Remove special characters (keep only a-z, 0-9, hyphens)
- Max length: 50 characters
- No consecutive hyphens
- No leading/trailing hyphens

### Valid Examples:
- SPEC-20260120-2010-match-brutalist-design
- SPEC-20260120-2010-fix-api-authentication
- SPEC-20260120-2010-add-user-profile-page

### Invalid Examples (REJECTED):
- SPEC-1737400800-0875b1c7 ❌ (uses old timestamp-hash format)
- SPEC-1768932478-TASKGRID ❌ (uses old format)
- SPEC-20260120-2010 ❌ (missing slug)
- SPEC-20260120-2010- ❌ (trailing hyphen)
- SPEC-20260120-2010--test ❌ (consecutive hyphens)
- spec-20260120-2010-test ❌ (lowercase prefix)

### Validation Steps:
1. Check prefix is "SPEC" (case-sensitive)
2. Validate date format (YYYYMMDD, must be valid date)
3. Validate time format (HHMM, 00-23 hours, 00-59 minutes)
4. Validate slug (lowercase, hyphen-separated, no special chars, max 50 chars)
5. Ensure uniqueness in specs database

### Error Messages:
- Invalid prefix: "❌ Spec ID must start with 'SPEC'"
- Invalid date: "❌ Invalid date format. Use YYYYMMDD"
- Invalid time: "❌ Invalid time format. Use HHMM (24h format)"
- Invalid slug: "❌ Slug must be lowercase, hyphen-separated, max 50 chars"
- Duplicate ID: "❌ Spec ID already exists. Please try again in one minute."

## Validation Checklist

- ✅ Spec ID follows mandatory format SPEC-<YYYYMMDD>-<HHMM>-<slug>
- ✅ Unique spec ID generated
- ✅ Spec file created with all required sections
- ✅ Specs database updated
- ✅ OpenMemory updated with spec creation
- ✅ Knowledge graph facts created for acceptance criteria
- ✅ Execution log file initialized
- ✅ User confirmation displayed with next steps

## Success Criteria

- Spec file is complete and well-formatted
- All requirements from spec-clarify are captured
- Acceptance criteria are clear and testable
- Spec ID strictly follows mandatory format SPEC-<YYYYMMDD>-<HHMM>-<slug>
- Spec ID is unique in the specs database
- Spec ID validation passed (prefix, date, time, and slug all valid)
- User knows how to proceed to execution or tracking
- Spec is stored in both file system and OpenMemory

## Error Handling

### Duplicate Spec ID
```
If spec ID exists:
- User must wait 1 minute and regenerate (different time)
- DO NOT use suffixes or modifications
- The format SPEC-<YYYYMMDD>-<HHMM>-<slug> is MANDATORY
```

### Missing Information
```
If spec-clarify didn't provide sufficient detail:
- Don't store incomplete spec
- Ask user to provide missing info
- Use spec-clarify again if needed
```

## Notes

- **Spec ID format SPEC-<YYYYMMDD>-<HHMM>-<slug> is MANDATORY** - no exceptions
- Always store spec immediately after clarification
- Don't wait for execution to create spec
- Specs are immutable - if changes needed, create new spec
- Keep specs focused and actionable
- Use clear, measurable acceptance criteria
- Link related specs in context if applicable

## Next Skill

After spec-store completes, the workflow branches:
- Execute immediately → **spec-execute**
- Track later → **spec-track**
- Make changes → **spec-clarify** (new spec)
