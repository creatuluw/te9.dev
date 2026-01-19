# PRD Work Status Rule

This rule implements PRD Work Status process documented at:
**[.opencode/skill/prd-status/SKILL.md](../../.opencode/skill/prd-status/SKILL.md)**

## What I Do

I provide a comprehensive overview of PRD work status:
- Display all active PRDs (non-DONE status)
- Show PRD titles, IDs, status, and priority
- **Read and analyze log files** for each active PRD
- Extract important context from logs (achievements, issues, blockers)
- Provide recap of current work still to do
- Offer guidance on starting PRD work based on log insights
- Consider the full workflow process

## Usage

When you want to see PRD status and get started:

**@prd-status**

This will show all pending work and guide you on next steps.

## Information Shown

I display:
- **Active PRDs Table**: Title, PRD ID, Status, Priority
- **Log Analysis**: Context from each PRD's log file including:
  - Last activity timestamp
  - Work completed so far (achievements)
  - Work remaining
  - Unresolved issues and blockers
  - Failed tests or errors
  - Important notes and decisions
- **Work Recap**: Total count, breakdown by status and priority
- **Blockers**: PRDs waiting on dependencies (from logs)
- **Recommendations**: Which PRDs to work on first (based on log context)
- **How to Start**: Step-by-step guidance based on current state and log insights

## Workflow Guidance

Based on current PRD state, I provide:

### If PRDs are IN_PROGRESS:
- Show progress from log (X of Y criteria completed)
- Display what's been achieved so far
- Highlight remaining work and issues
- Show test status from log
- Recommend completing in-progress work first
- Show how to continue execution with context
- Explain pause/resume if switching PRDs

### If PRDs are TODO:
- Show any preliminary work or notes from log
- Check if dependencies are verified
- Guide through the execute → test → track workflow
- Provide exact commands to run
- Explain dependency requirements

### If PRDs are BLOCKED:
- Display when blocked and why (from log)
- Show what's blocking them (dependencies/issues)
- Show work completed before block
- Suggest resolution steps based on log context
- Guide on working around blockers

### If PRDs are FAILED:
- Display failure reason and timestamp from log
- Show which tests failed
- Include error messages from log
- Show what was attempted before failure
- Explain how to investigate
- Provide specific fixes needed
- Show how to retry execution
- Point to detailed log file analysis

### If PRDs are PAUSED:
- Display when paused and reason (from log)
- Show work state when paused
- Show what's completed and remaining
- Explain resume conditions
- Guide on how to resume work

### If NO PRDs exist:
- Guide on creating first PRD via interview
- Explain work types available
- Show complete workflow from scratch

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-status/SKILL.md](../../.opencode/skill/prd-status/SKILL.md)

## When to Use This

Use **@prd-status** when:
- Starting your work session
- Deciding which PRD to work on next
- Understanding current workload
- Getting workflow guidance
- Checking what's blocked or failed

## Typical Workflow Integration

```
@prd-status                          → See what needs doing
@prd-execute PRD-<id>              → Implement work + create commit
@prd-testing PRD-<id>              → Verify all criteria + tests pass
@prd-tracking PRD-<id> COMPLETED   → Mark done + request push approval
```

## Critical Rules Reminder

The status overview includes reminders about:
1. 📋 **Read Log Files First** - Understand context before starting work
2. 🧪 **100% Test Pass Rate Required** - No exceptions
3. ✍️ **One Commit Per PRD** - Must include PRD ID in message
4. 👤 **User Approval for Push** - Never auto-push
5. ✅ **Leave Clean State** - Code must build and tests pass
6. 📝 **Track Everything** - Log all progress and events

## Next Steps

After reviewing status with **@prd-status**:
1. Choose a PRD to work on (prioritize IN_PROGRESS first)
2. Use **@prd-execute** to implement
3. Use **@prd-testing** to verify
4. Use **@prd-tracking** to complete and push