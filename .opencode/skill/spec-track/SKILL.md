# spec-track - Track Progress and Status

## Purpose
Track the progress and status of all specs at any time during the workflow.

## When to Use
Use anytime to check:
- Overall project status
- Status of specific specs
- Progress of ongoing work
- Execution logs
- Git commit history
- Completion status

## What It Does
1. Displays overall project status
2. Shows all specs and their statuses
3. Provides detailed spec information
4. Shows execution logs
5. Displays commit history
6. Tracks progress over time

## Commands

### Track All Specs
```
Command: spec-track
Action: Display overview of all specs

Output:
=== SPEC OVERVIEW ===

Total Specs: <number>
- PENDING: <count>
- IN_PROGRESS: <count>
- READY_FOR_COMMIT: <count>
- COMPLETED: <count>
- FAILED: <count>
- BLOCKED: <count>

Recent Activity:
- Most recent: <spec-id> - <status> - <time ago>
- Second recent: <spec-id> - <status> - <time ago>

Quick Actions:
- View spec details: spec-track <spec-id>
- View execution log: spec-track <spec-id> --log
- View commits: spec-track --commits
```

### Track Specific Spec
```
Command: spec-track <spec-id>
Action: Display detailed spec information

Output:
=== SPEC: <spec-id> ===

Status: <PENDING|IN_PROGRESS|READY_FOR_COMMIT|COMPLETED|FAILED|BLOCKED>
Created: <timestamp>
Updated: <timestamp>
Duration: <time elapsed>

Objective:
[Objective from spec.md]

Requirements:
- [x] Requirement 1
- [x] Requirement 2
- [ ] Requirement 3
Progress: 2/3 (67%)

Acceptance Criteria:
- [x] Criterion 1
- [x] Criterion 2
- [ ] Criterion 3
Progress: 2/3 (67%)

Git Status:
- Committed: <yes/no>
- Commit Hash: <hash or N/A>
- Pushed: <yes/no>
- Branch: <branch>

Next Steps:
- If IN_PROGRESS: Continue with spec-execute
- If READY_FOR_COMMIT: Use spec-commit
- If COMPLETED: No action needed
- If FAILED: Review log and restart or modify
- If BLOCKED: Resolve blockers first

View full log: spec-track <spec-id> --log
View spec file: te9.dev/specs/<spec-id>/spec.md
```

### Track Execution Log
```
Command: spec-track <spec-id> --log
Action: Display execution log

Output:
=== EXECUTION LOG: <spec-id> ===

[Full contents of te9.dev/logs/<spec-id>.log]

Recent Activity:
- Latest event: <timestamp>
- Status: <current status>

Log File: te9.dev/logs/<spec-id>.log
```

### Track Commit History
```
Command: spec-track --commits
Action: Display git commit history related to specs

Output:
=== COMMIT HISTORY ===

Recent Spec Commits:
1. <commit-hash> - <title> [SPEC-<id>]
   Author: <name>
   Date: <date>
   Branch: <branch>
   Files: <count>

2. <commit-hash> - <title> [SPEC-<id>]
   Author: <name>
   Date: <date>
   Branch: <branch>
   Files: <count>

Total Spec Commits: <count>
Unpushed Commits: <yes/no>

View full history: git log --oneline --grep="SPEC-"
```

### Track Project Status
```
Command: spec-track --project
Action: Display overall project status

Output:
=== PROJECT STATUS ===

Project: <project-name>
Initialized: <date>
Current Branch: <branch>
Remote: <remote>

Spec Summary:
- Total Specs: <number>
- Active: <count> (PENDING + IN_PROGRESS + READY_FOR_COMMIT)
- Completed: <count>
- Failed: <count>

Completion Rate: <percentage>

Recent Activity:
- Last spec created: <spec-id> - <time ago>
- Last spec completed: <spec-id> - <time ago>

Code Health:
- Total commits: <count>
- Total lines: +<added>, -<removed>
- Tests passing: <percentage>

Suggestions:
- [ ] Review pending specs
- [ ] Complete in-progress specs
- [ ] Resolve failed specs
```

## Spec States

```
PENDING
  ↓ (spec-execute)
IN_PROGRESS
  ↓ (completion + tests)
READY_FOR_COMMIT
  ↓ (spec-commit)
COMPLETED
```

```
IN_PROGRESS
  ↓ (tests fail or blockers)
FAILED / BLOCKED
  ↓ (resolution)
IN_PROGRESS
```

## Status Indicators

### Color Codes
```
✅ COMPLETED - Successfully finished
🟡 IN_PROGRESS - Currently being executed
🟠 READY_FOR_COMMIT - Ready for commit and push
⏳ PENDING - Waiting to start
❌ FAILED - Execution failed
🚫 BLOCKED - Blocked by dependencies or issues
```

### Progress Indicators
```
Requirements: 3/5 (60%)
Acceptance Criteria: 2/4 (50%)
Overall Progress: 5/9 (56%)
```

## Query Filters

### Filter by Status
```
Command: spec-track --status COMPLETED
Action: Show all completed specs

Command: spec-track --status PENDING
Action: Show all pending specs

Command: spec-track --status FAILED,BLOCKED
Action: Show problematic specs
```

### Filter by Date
```
Command: spec-track --since "2025-01-01"
Action: Show specs created since date

Command: spec-track --before "2025-01-15"
Action: Show specs created before date
```

### Filter by Type
```
Command: spec-track --type feature
Action: Show feature specs

Command: spec-track --type bugfix
Action: Show bugfix specs
```

## Quick Reference

### Common Commands
```
spec-track                    # Overview of all specs
spec-track <spec-id>         # Details of specific spec
spec-track <spec-id> --log   # Execution log
spec-track --commits          # Commit history
spec-track --project          # Project status
```

### Status Flow
```
Create → PENDING → IN_PROGRESS → READY_FOR_COMMIT → COMPLETED
                                ↓
                              FAILED/BLOCKED
```

### What to Check
- Overall health: spec-track --project
- What to work on: spec-track --status PENDING,IN_PROGRESS
- What's completed: spec-track --status COMPLETED
- What's broken: spec-track --status FAILED,BLOCKED
- Recent activity: spec-track (shows recent specs)

## Use Cases

### Check Progress During Work
```
User: How's my project going?

AI: Here's your project status:
    [spec-track --project output]
    
    You have 2 specs in progress and 1 ready for commit.
    Would you like details on any spec?
```

### Review Before Starting Work
```
User: What should I work on next?

AI: Here are your pending specs:
    [spec-track --status PENDING output]
    
    Or continue in-progress specs:
    [spec-track --status IN_PROGRESS output]
    
    Which one would you like to work on?
```

### After Completing Work
```
User: I just finished implementing something. What's the status?

AI: Let me check:
    [spec-track --status READY_FOR_COMMIT output]
    
    You have 1 spec ready to commit. 
    Use spec-commit to create a commit and push.
```

### Troubleshooting Issues
```
User: Something's not working right.

AI: Let me check your specs:
    [spec-track --status FAILED,BLOCKED output]
    
    You have 1 failed spec. Let me check the log:
    [spec-track <spec-id> --log output]
    
    The issue is: [problem from log]
    Here's how to fix it: [solution]
```

## Integration with Other Skills

### After spec-clarify
```
→ spec-track
  Shows new PENDING spec created
```

### During spec-execute
```
→ spec-track <spec-id>
  Shows IN_PROGRESS status and progress
  Updates as requirements are completed
```

### After spec-execute
```
→ spec-track
  Shows spec moved to READY_FOR_COMMIT
  Suggests using spec-commit
```

### After spec-commit
```
→ spec-track
  Shows spec moved to COMPLETED
  Updates commit history
```

### Anytime
```
→ spec-track
  Always available to check status
  No prerequisites
```

## Error Handling

### Spec Not Found
```
If spec-id doesn't exist:
  - Display: "Spec <spec-id> not found"
  - List available specs
  - Suggest: spec-track to see all specs
```

### Log Not Found
```
If execution log doesn't exist:
  - Display: "No execution log found for <spec-id>"
  - Spec may not have been executed yet
  - Suggest: Check spec status with spec-track <spec-id>
```

### Git History Issues
```
If git commands fail:
  - Display: "Unable to retrieve git history"
  - Check if in git repository
  - Suggest: git log command manually
```

## Validation Checklist

- ✅ All specs displayed with correct status
- ✅ Progress calculations accurate
- ✅ Execution logs readable
- ✅ Commit history up-to-date
- ✅ Filters work correctly
- ✅ Next steps provided
- ✅ Helpful suggestions given
- ✅ Error messages clear

## Success Criteria

- User can always see current status
- Progress is easy to understand
- Detailed information available on demand
- Execution logs accessible
- Commit history trackable
- Next actions suggested
- Issues highlighted
- Navigation between views smooth

## Best Practices

### Display
```
- Use clear indicators (✅, 🟡, ❌)
- Show percentages for progress
- Use consistent formatting
- Provide timestamps
- Group related information
```

### Navigation
```
- Suggest related commands
- Link between views
- Provide context
- Always offer next steps
```

### Helpfulness
```
- Anticipate user needs
- Suggest actions
- Highlight issues
- Provide solutions
- Be proactive
```

## Notes

- spec-track is always available, no prerequisites
- Use it frequently to stay informed
- Great for understanding project health
- Helps prioritize work
- Essential for team coordination
- Useful for retrospectives
- Tracks completion over time

## Example Workflows

### Daily Check-in
```
User: What's the status today?

AI: === DAILY STATUS CHECK ===
    
    [spec-track --project output]
    
    Summary:
    - 3 specs completed this week
    - 2 in progress
    - 1 ready to commit
    
    Suggestion:
    Commit the ready spec to clear the queue.
```

### Mid-Development Check
```
User: How's the login feature going?

AI: Let me check the login spec:
    
    [spec-track SPEC-20250115-abc123 output]
    
    Status: IN_PROGRESS
    Requirements: 4/6 (67%)
    Acceptance Criteria: 2/5 (40%)
    
    Working on: "Add password reset functionality"
    
    Estimated completion: ~2 hours
```

### Pre-Meeting Prep
```
User: What do we have to show?

AI: Here's what's completed recently:
    
    [spec-track --status COMPLETED --since "2025-01-10" output]
    
    Completed specs:
    - Login feature (SPEC-20250115-abc123)
    - User dashboard (SPEC-20250112-def456)
    
    Ready to demo!
```

### Blocker Identification
```
User: Why is nothing getting done?

AI: Let me check for issues:
    
    [spec-track --status FAILED,BLOCKED output]
    
    Found 2 blocked specs:
    1. SPEC-20250114-xyz789 - Blocked by missing API
    2. SPEC-20250113-uvw012 - Failed tests
    
    These need attention before continuing other work.
```

## Important

- spec-track is read-only - it doesn't modify anything
- Use it as often as needed - it's fast and safe
- Great for understanding current state
- Helps identify what to work on next
- Essential for project management
- Always shows up-to-date information
- Integrates with all other skills