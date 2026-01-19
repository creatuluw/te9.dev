# PRD Work Skill - Log Analysis Feature

## Overview

The `prd-status` skill has been enhanced to read and analyze PRD log files, providing deep contextual information about active PRDs to help users understand exactly where work stands and what needs to be done next.

## What This Feature Does

For every PRD with a status other than DONE, the skill now:

1. **Reads the log file** at `/dev/prd/logs/<prd-id>.md`
2. **Extracts key information** from all log sections
3. **Analyzes the context** relevant to starting or continuing work
4. **Presents insights** alongside the PRD status overview
5. **Provides specific guidance** based on actual work state

## Log Sections Analyzed

### Metadata Section
- When the PRD was created
- Interview ID and type
- Current priority
- Dependencies

### Timeline Section
- All chronological events
- When work started
- Last activity timestamp
- Progress milestones
- Pauses and resumes

### Achievements Section
- Completed work
- Criteria that passed
- Files created/modified
- Tests that passed

### Issues Section
- Problems encountered
- Blockers identified
- Error messages
- Failed tests
- Unresolved challenges

### Status Changes Section
- Status history
- When it moved to current status
- Reasons for changes

### Notes Section
- Important context
- Technical decisions
- Work remaining
- Dependencies clarification

## Analysis Per PRD Status

### IN_PROGRESS PRDs
The skill extracts:
- **Where work stopped**: Last achievement and activity timestamp
- **What's completed**: List of finished acceptance criteria and achievements
- **What's remaining**: Uncompleted criteria and next steps
- **Unresolved issues**: Problems that need attention
- **Test status**: Passing vs failing tests
- **Time context**: How long since last activity

**Example Output:**
```markdown
**PRD-20250115-143022 (User Authentication System):**
- Last worked on: 2025-01-15 16:30:22 (4 hours ago)
- Progress: 3 of 5 criteria completed
- Completed:
  - User registration endpoint implemented
  - Login functionality with JWT tokens
  - Password hashing with bcrypt
- Remaining:
  - Email verification system
  - Password reset functionality
- Issues:
  - Email service integration failing with SMTP timeout
  - Need to configure email provider credentials
- Tests: 12 passing, 3 failing (email verification tests)
- Next: Fix email service configuration and implement remaining criteria
```

### TODO PRDs
The skill checks:
- **Preliminary work**: Any planning or setup done
- **Dependencies**: Whether they've been verified
- **Constraints**: Any noted limitations
- **Planning notes**: Context for implementation

### FAILED PRDs
The skill identifies:
- **Failure reason**: Why it failed
- **Failed tests**: Which tests didn't pass
- **Error messages**: Specific errors encountered
- **Attempts made**: What was tried before failure
- **Root cause**: Analysis from the log
- **Recovery path**: What needs fixing

**Example Output:**
```markdown
**PRD-20250115-160045 (API Integration):**
- Failed on: 2025-01-15 18:45:00
- Reason: Unit tests failed - API timeout errors
- Tests failed: 5 of 15 tests (API endpoint tests)
- Error: "Connection timeout after 30s - API endpoint unreachable"
- Attempts: 3 retries made
- Fix needed: Verify API endpoint URL and network connectivity
```

### PAUSED PRDs
The skill shows:
- **Pause reason**: Why work was paused
- **Paused state**: What was completed before pause
- **Resume conditions**: What needs to happen to continue
- **Expected resume**: When or under what conditions
- **Context**: Notes about the pause decision

### BLOCKED PRDs
The skill reveals:
- **Blocker type**: Dependency, external issue, or technical constraint
- **Blocker details**: Specific blocking factor
- **Work completed**: What was done before the block
- **Resolution path**: How to unblock
- **Impact**: How the block affects the work

## Enhanced Guidance

### Context-Aware Recommendations

Based on log analysis, the skill provides:

1. **Specific Actions**: Not just "continue work" but "fix SMTP configuration, then implement email verification"
2. **Issue Resolution**: Highlights problems from logs that need addressing
3. **Continuity**: Helps pick up exactly where work left off
4. **Test Guidance**: Points to failing tests that need fixes
5. **Dependency Clarity**: Shows which dependencies are blocking what

### Example Enhanced Guidance

**Without Log Analysis:**
```markdown
You have PRD-123 in progress. Continue with:
skill("prd-execute", { prdId: "PRD-123" })
```

**With Log Analysis:**
```markdown
You have PRD-123 in progress.

**Context from Log:**
- 3 of 5 criteria completed
- Last issue: SMTP timeout (email service)
- 3 tests failing (email verification)

**Recommended Action:**
1. Review log: /dev/prd/logs/PRD-123.md
2. Fix SMTP configuration in .env
3. Address failing tests
4. Continue: skill("prd-execute", { prdId: "PRD-123", continueMode: true })
5. Focus on: Email verification (criterion 4), Password reset (criterion 5)
```

## Benefits

### For Developers
- **Quick Catch-Up**: Understand work state without diving into code
- **Issue Visibility**: See problems immediately
- **Clear Next Steps**: Know exactly what to do
- **Progress Tracking**: Understand how much is done vs remaining
- **Context Preservation**: Don't lose track of decisions and blockers

### For Project Management
- **Status Transparency**: Real understanding of PRD progress
- **Blocker Identification**: See what's holding up work
- **Resource Planning**: Know which PRDs need attention
- **Timeline Estimation**: Better understand remaining work

### For Team Collaboration
- **Knowledge Transfer**: New team members understand work state
- **Handoff Support**: Clear state when switching developers
- **Issue Communication**: Problems are documented and visible
- **Decision History**: Technical choices are preserved

## Integration with Workflow

The log analysis integrates seamlessly with the te9-method workflow:

```
prd-status (read logs)
    ↓ (understand context)
prd-execute (continue with context)
    ↓ (update logs with progress)
prd-test (verify work)
    ↓ (log test results)
prd-track (log completion)
    ↓ (final log update)
```

## Data Structure

Each PRD in the return data now includes a `logAnalysis` object:

```json
{
  "id": "PRD-123",
  "title": "User Auth",
  "status": "IN_PROGRESS",
  "priority": 1,
  "logAnalysis": {
    "lastActivity": "2025-01-15T16:30:22Z",
    "currentState": "3 of 5 criteria completed, email service blocked",
    "completed": [
      "User registration endpoint",
      "Login with JWT",
      "Password hashing"
    ],
    "remaining": [
      "Email verification",
      "Password reset"
    ],
    "issues": [
      "SMTP timeout error",
      "Email credentials not configured"
    ],
    "blockers": [],
    "nextSteps": [
      "Configure SMTP credentials",
      "Fix failing email tests",
      "Implement email verification"
    ]
  }
}
```

## Error Handling

### Log File Not Found
- Gracefully notes that PRD has no history yet
- Suggests this is a newly created PRD
- Provides standard starting guidance

### Corrupted Log File
- Reports parsing issues
- Suggests manual inspection
- Falls back to basic PRD info from database

### Incomplete Log Data
- Works with whatever sections are available
- Notes missing information
- Provides best guidance possible with available data

## Best Practices

### When Using prd-status

1. **Start Every Session**: Run `prd-status` to understand current state
2. **Before Continuing Work**: Check log insights for context
3. **After Breaks**: Use log analysis to quickly catch up
4. **When Troubleshooting**: Review issues section in log insights
5. **For Planning**: Use log data to estimate remaining work

### For Log Quality

1. **Update Frequently**: Keep logs current during execution
2. **Be Specific**: Document exact issues and errors
3. **Note Decisions**: Record why choices were made
4. **Track Progress**: Log each criterion completion
5. **Document Blockers**: Clearly state what's blocking work

## Examples

### Scenario 1: Returning After a Break

**Command:**
```
skill("prd-status")
```

**Output Shows:**
- You were working on User Auth (PRD-123)
- Last activity was 2 days ago
- 3 of 5 criteria completed
- Email service issue was the last problem
- 3 tests were failing

**Action:**
- Review the log file for full context
- Address the email service issue
- Continue with remaining 2 criteria

### Scenario 2: Multiple PRDs

**Command:**
```
skill("prd-status")
```

**Output Shows:**
- PRD-123: IN_PROGRESS, 60% complete, has issues
- PRD-124: TODO, dependencies met, ready to start
- PRD-125: BLOCKED, waiting on PRD-126
- PRD-126: FAILED, tests failing, needs fix

**Action:**
- Priority: Fix PRD-126 (unblocks PRD-125)
- Then: Complete PRD-123 (already in progress)
- Finally: Start PRD-124

### Scenario 3: Failed PRD Investigation

**Command:**
```
skill("prd-status")
```

**Output Shows:**
- PRD-130: FAILED on 2025-01-15
- Reason: API timeout errors
- 5 tests failed (API endpoint tests)
- Error: "Connection timeout after 30s"
- 3 retry attempts already made

**Action:**
- Check API endpoint configuration
- Verify network connectivity
- Update timeout settings if needed
- Retry with fixed configuration

## Critical Rule Addition

The skill now includes a new critical rule:

**📋 Read Log Files First** - Understand context before starting work

This ensures developers always have full context before beginning or continuing work on any PRD.

## Future Enhancements

Potential additions:
- **Time tracking**: Calculate actual time spent per PRD
- **Pattern detection**: Identify recurring issues across PRDs
- **Dependency graphs**: Visualize PRD dependencies
- **Progress metrics**: Calculate completion velocity
- **Risk assessment**: Flag PRDs likely to have issues

## Summary

The log analysis feature transforms `prd-status` from a simple status display into a comprehensive work context tool. It provides:

✅ **Deep Context** - Not just status, but full work history
✅ **Issue Visibility** - Problems are immediately apparent
✅ **Actionable Guidance** - Specific next steps based on actual state
✅ **Continuity** - Pick up work seamlessly after breaks
✅ **Decision History** - Understand why choices were made
✅ **Progress Tracking** - Know exactly what's done and what's left

This enhancement makes the te9-method workflow more efficient, transparent, and developer-friendly.