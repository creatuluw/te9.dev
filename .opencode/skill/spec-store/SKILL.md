Format: SPEC-<timestamp>-<short-hash>
Example: SPEC-20250115-abc123

Generate using:
- Current timestamp (YYYYMMDDHHMM)
- Short hash of requirements (first 6 chars)
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
# Spec: SPEC-<timestamp>-<hash>

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
  "spec_id": "SPEC-<timestamp>-<hash>",
  "created_at": "2025-01-15T10:30:00Z",
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

## Validation Checklist

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
- Spec ID is unique and follows naming convention
- User knows how to proceed to execution or tracking
- Spec is stored in both file system and OpenMemory

## Error Handling

### Duplicate Spec ID
```
If spec ID exists:
- Regenerate with different timestamp
- Or increment suffix (-01, -02, etc.)
```

### Missing Information
```
If spec-clarify didn't provide sufficient detail:
- Don't store incomplete spec
- Ask user to provide missing info
- Use spec-clarify again if needed
```

## Notes

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