---
name: prd-status
description: Display PRD status overview and guide user on starting work
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-status
  depends-on: []
---

# PRD Work Status Skill

## What I Do

I provide a comprehensive overview of PRD work status by:
- Checking the status of all PRDs in the system
- Displaying a simple list of active PRDs (non-DONE status)
- Showing PRD titles, IDs, status, and priority
- Providing a recap of current work still to do
- Offering guidance on how to start working on PRDs
- Considering the full workflow process for starting work

## When to Use Me

Use when you want to:
- Get an overview of all pending work
- See what PRDs need attention
- Understand current workload
- Decide which PRD to work on next
- Get guidance on starting PRD work

## Prerequisites

Before calling this skill, ensure:
1. PRD database exists at `/dev/prd/prd.json`
2. You have PRDs in the system (created via `prd-create`)

## Step-by-Step Process

### Step 1: Load PRD Database

Read `/dev/prd/prd.json`:
- Parse the JSON file
- Extract all PRD entries
- If file doesn't exist, report that no PRDs have been created yet

### Step 2: Filter Active PRDs

Filter PRDs to show only those with status other than "DONE":
- Include: TODO, IN_PROGRESS, FAILED, PAUSED, BLOCKED
- Exclude: DONE
- Sort by priority (1 = highest priority first)
- Then sort by status (IN_PROGRESS first, then TODO, then others)

### Step 3: Read and Analyze Log Files

**CRITICAL: For each active PRD, read its log file to understand context.**

For each PRD with status other than DONE:

1. **Read Log File**: `/dev/prd/logs/<prd-id>.md`
   - If log file doesn't exist, note that PRD has no history yet
   - Parse the log file structure

2. **Extract Key Information from Log**:

   **From Metadata Section:**
   - Created timestamp
   - Interview ID
   - Type (Feature, Bugfix, Refactor, etc.)
   - Priority
   - Dependencies

   **From Timeline Section:**
   - All chronological events
   - When work was started
   - Last activity timestamp
   - Progress milestones
   - Any pauses or resumes

   **From Achievements Section:**
   - What has been completed so far
   - Criteria that passed
   - Files created/modified
   - Tests that passed

   **From Issues Section:**
   - Problems encountered
   - Blockers identified
   - Error messages
   - Failed tests
   - Unresolved challenges

   **From Status Changes Section:**
   - Status history
   - When it moved to current status
   - Reason for status changes

   **From Notes Section:**
   - Important context
   - Technical decisions
   - Work remaining
   - Dependencies clarification

3. **Analyze Log Data for Work Starting Relevance**:

   **For IN_PROGRESS PRDs:**
   - Where did work stop?
   - What was the last achievement?
   - Are there unresolved issues?
   - Which criteria are completed vs remaining?
   - Any test failures to address?
   - How long since last activity?

   **For TODO PRDs:**
   - Has any preliminary work been done?
   - Are there planning notes?
   - Were dependencies verified?
   - Any constraints noted?

   **For FAILED PRDs:**
   - Why did it fail?
   - What was attempted?
   - Which tests failed?
   - What errors occurred?
   - Can it be recovered?
   - What needs fixing before retry?

   **For PAUSED PRDs:**
   - Why was it paused?
   - What was the state when paused?
   - What needs to happen to resume?
   - When is it expected to resume?
   - What blockers caused the pause?

   **For BLOCKED PRDs:**
   - What is blocking it?
   - Which dependencies are unmet?
   - What external issues exist?
   - When might blockers be resolved?

4. **Create Log Summary for Each PRD**:

   ```markdown
   **Log Analysis for PRD-<id>:**
   - **Last Activity:** <timestamp>
   - **Current State:** <description of where work is>
   - **Completed:** <what's done>
   - **Remaining:** <what's left to do>
   - **Issues:** <any problems>
   - **Blockers:** <anything preventing progress>
   - **Next Steps:** <what should be done next>
   ```

### Step 4: Build Status Report

Create a simple, readable list with:
- PRD Title
- PRD ID
- Status
- Priority

Format example:
```markdown
## Active PRDs

| Title | PRD ID | Status | Priority |
|-------|--------|--------|----------|
| User Authentication | PRD-20250115-143022 | IN_PROGRESS | 1 |
| Shopping Cart | PRD-20250115-150033 | TODO | 1 |
| Payment Integration | PRD-20250115-152045 | TODO | 2 |
| Email Notifications | PRD-20250115-155012 | BLOCKED | 2 |
```

### Step 5: Analyze Work Breakdown

Count and categorize:
- Total active PRDs
- PRDs by status (IN_PROGRESS: X, TODO: Y, BLOCKED: Z, etc.)
- PRDs by priority (Priority 1: X, Priority 2: Y, etc.)
- Any blocked PRDs and their blockers

### Step 6: Check Dependencies

For each active PRD:
- Check if it has dependencies
- Verify if dependencies are met (all dependent PRDs are DONE)
- Flag PRDs that cannot start due to unmet dependencies

### Step 7: Generate Work Recap with Log Insights

Provide a summary of current work including insights from log files:

```markdown
## Work Status Recap

**Total Active PRDs:** X
**Currently In Progress:** Y
**Ready to Start:** Z (TODO status with no blockers)
**Blocked:** N (waiting on dependencies or issues)

### Breakdown by Priority:
- **Priority 1 (High):** X PRDs (Y in progress, Z ready)
- **Priority 2 (Medium):** X PRDs (Y in progress, Z ready)
- **Priority 3 (Low):** X PRDs (Y in progress, Z ready)

### Immediate Attention Needed:
- PRDs in IN_PROGRESS status should be completed first
- PRDs with FAILED status need investigation
- PRDs with BLOCKED status need dependency resolution

### Log Insights:

**IN_PROGRESS PRDs:**
- **PRD-<id> (<title>):**
  - Last worked on: <timestamp>
  - Progress: <X> of <Y> criteria completed
  - Issues: <any unresolved issues>
  - Next: <what needs to be done>

**FAILED PRDs:**
- **PRD-<id> (<title>):**
  - Failed on: <timestamp>
  - Reason: <failure reason from log>
  - Tests failed: <which tests>
  - Fix needed: <what to address>

**BLOCKED PRDs:**
- **PRD-<id> (<title>):**
  - Blocked since: <timestamp>
  - Blocker: <what's blocking>
  - Resolution: <what needs to happen>

**PAUSED PRDs:**
- **PRD-<id> (<title>):**
  - Paused on: <timestamp>
  - Reason: <why paused>
  - State: <work completed so far>
  - Resume when: <condition for resuming>
```

### Step 8: Provide Starting Guidance with Log Context

Based on the current state and log file analysis, provide guidance on how to start working:

#### If there are IN_PROGRESS PRDs:
```markdown
## How to Start Working on PRDs

### ⚠️ Existing Work In Progress

You have PRD(s) currently in progress:

**PRD-[ID]: [Title]**
- **Status:** IN_PROGRESS
- **Last Activity:** <timestamp from log>
- **Progress:** <X> of <Y> acceptance criteria completed
- **Completed So Far:** 
  - <list achievements from log>
- **Remaining Work:**
  - <list what's left from log>
- **Issues to Address:**
  - <list any unresolved issues from log>
- **Test Status:** <X> tests passing, <Y> tests failing (from log)

**Context from Log:**
<Include relevant notes, decisions, or blockers from log that are important for continuing work>

**Recommended Action:**
1. Review the log file: `/dev/prd/logs/[PRD-ID].md`
2. Address any issues noted above
3. Continue execution: `skill("prd-execute", { prdId: "[PRD-ID]", continueMode: true })`
4. Focus on remaining criteria: <list specific criteria>
5. Once complete, verify: `skill("prd-test", { prdId: "[PRD-ID]" })`
6. Finally, complete: `skill("prd-track", { prdId: "[PRD-ID]", eventType: "COMPLETED" })`

**Or** if you want to work on a different PRD:
1. First pause the current PRD: `skill("prd-track", { prdId: "[PRD-ID]", eventType: "PAUSED", reason: "[your reason]" })`
2. Then start the new PRD (see "Starting a New PRD" below)
```

#### If there are only TODO PRDs (no IN_PROGRESS):
```markdown
## How to Start Working on PRDs

### Starting a New PRD

You have PRD(s) ready to start. Follow this workflow:

#### Step 1: Choose a PRD
Look at the Active PRDs list above and select one to work on.
**Recommendation:** Start with Priority 1 PRDs first.

#### Step 2: Verify Dependencies
Before starting, ensure all dependencies are met:
- Check the "Dependencies" section in the PRD list above
- If dependencies are not met, work on those PRDs first

#### Step 3: Start Execution
```
skill("prd-execute", { prdId: "[PRD-ID]" })
```

This will:
- Load the PRD requirements
- Mark status as IN_PROGRESS
- Implement all acceptance criteria
- Run unit tests (must pass 100%)
- Create git commit with PRD reference
- Leave code in clean state

#### Step 4: Verify Work
```
skill("prd-test", { prdId: "[PRD-ID]" })
```

This will:
- Run full test suite
- Verify all acceptance criteria
- Check for regressions
- Ensure 100% test pass rate

#### Step 5: Complete and Track
```
skill("prd-track", { prdId: "[PRD-ID]", eventType: "COMPLETED" })
```

This will:
- Mark PRD as DONE
- Update logs
- Request user approval for git push
- Push changes if approved

### Quick Start Command Chain

For a seamless workflow, you can chain the commands:

1. **Execute PRD:**
   ```
   skill("prd-execute", { prdId: "[PRD-ID]" })
   ```

2. **Test PRD:**
   ```
   skill("prd-test", { prdId: "[PRD-ID]" })
   ```

3. **Complete PRD:**
   ```
   skill("prd-track", { prdId: "[PRD-ID]", eventType: "COMPLETED" })
   ```

4. **Approve Push:**
   - Review the commit details presented
   - Type "approve" to push to remote
```

#### If there are BLOCKED PRDs:
```markdown
### ⚠️ Blocked PRDs Detected

The following PRDs are blocked and cannot proceed:

**PRD-[ID]: [Title]**
- **Status:** BLOCKED
- **Blocked Since:** <timestamp from log>
- **Blocker Type:** <dependency/external issue/technical constraint>
- **Blocker Details:** <specific blocker from log>
- **Impact:** <how this affects the work>
- **Work Done Before Block:** <what was completed from log>

**Log Context:**
<Include relevant details from log about what was attempted, what caused the block, and any notes about resolution>

**Resolution Steps:**
1. Review the detailed log: `/dev/prd/logs/[PRD-ID].md`
2. Understand the specific blocker: <explain from log>
3. Take action:
   - If dependency blocker: Complete dependent PRD [ID] first
   - If external blocker: <specific action needed>
   - If technical blocker: <technical solution needed>
4. Once resolved, PRD will move to TODO status
5. Then follow the "Starting a New PRD" workflow above

**Estimated Resolution:** <if mentioned in log>
```

#### If there are FAILED PRDs:
```markdown
### ⚠️ Failed PRDs Detected

The following PRDs have failed and need attention:

**PRD-[ID]: [Title]**
- **Status:** FAILED
- **Failed On:** <timestamp from log>
- **Failure Type:** <test failure/build error/implementation issue>
- **Failure Reason:** <specific reason from log>
- **Tests Failed:** <list of failed tests from log>
- **Error Messages:** <key errors from log>
- **Work Completed Before Failure:** <what was done from log>
- **Attempts Made:** <number of retry attempts from log>

**Log Context:**
<Include relevant error details, what was tried, and any notes about potential fixes>

**Detailed Failure Analysis from Log:**
- **Root Cause:** <analysis from log>
- **Affected Components:** <what's impacted>
- **Previous Attempts:** <what was already tried>

**Resolution Steps:**
1. **Review the detailed log:** `/dev/prd/logs/[PRD-ID].md`
2. **Understand the failure:** <specific issue from log>
3. **Fix the root cause:**
   - <specific fix needed based on log>
   - <address test failures mentioned>
   - <resolve error messages noted>
4. **Retry execution:** `skill("prd-execute", { prdId: "[PRD-ID]", continueMode: true })`
5. **Monitor tests:** Ensure all tests pass before completion

**Known Issues to Address (from log):**
- <list specific issues from log that need fixing>
```

#### If there are PAUSED PRDs:
```markdown
### ⏸️ Paused PRDs Detected

The following PRDs are paused:

**PRD-[ID]: [Title]**
- **Status:** PAUSED
- **Paused On:** <timestamp from log>
- **Pause Reason:** <reason from log>
- **Work Completed:** <achievements from log>
- **Work Remaining:** <what's left from log>
- **Expected Resume:** <condition or time from log>
- **State When Paused:** <detailed state from log>

**Log Context:**
<Include details about why it was paused, what state it was in, and what needs to happen to resume>

**Resume Steps:**
1. **Review pause context:** `/dev/prd/logs/[PRD-ID].md`
2. **Verify resume conditions:** <check if conditions from log are met>
3. **Resume execution:** `skill("prd-track", { prdId: "[PRD-ID]", eventType: "RESUMED" })`
4. **Continue work:** `skill("prd-execute", { prdId: "[PRD-ID]", continueMode: true })`
5. **Pick up from:** <specific point mentioned in log>
```

#### If NO active PRDs exist:
```markdown
## How to Start Working on PRDs

### No Active PRDs Found

You currently have no PRDs to work on. All PRDs are either completed or none have been created.

**To create new work:**

1. **Start with an interview** to gather requirements:
   ```
   skill("prd-interview")
   ```

2. **Choose work type** when prompted:
   - **New Project** - Creating new application from scratch
   - **New Feature** - Adding functionality to existing system
   - **Refactor** - Improving code structure
   - **Bugfix** - Fixing identified issues
   - **Other** - Infrastructure, docs, research
   - **Single Prompt** - Quick work without PRD

3. **Complete interview questions** (9 questions total)

4. **Review and approve** the interview recap

5. **PRD will be created** automatically via `prd-create`

6. **Start execution** using the workflow above

### Complete Workflow from Scratch:

```
interview → create → execute → test → track
```

For large projects:
```
interview → plan → create → (execute → test → track) × N
```
```

### Step 9: Consider Other Workflow Steps

Include notes about related workflow steps with log file context:

```markdown
## Related Workflow Steps

### Before Starting PRD Work:
- **Review Log File:** Always read `/dev/prd/logs/<prd-id>.md` first to understand context
- **Query Memory:** Check context before starting
  ```
  openmemory_query({ query: "[PRD topic]", user_id: "{{PROJECT_FOLDER_NAME}}" })
  ```
- **Understand History:** Review achievements, issues, and notes from previous work

### During PRD Work:
- **Unit Tests:** Must pass 100% before completion (MANDATORY)
- **Git Commits:** Each PRD gets its own commit with PRD ID
- **Code Quality:** Code must build and tests must pass
- **Progress Tracking:** Log important milestones as you work
- **Address Log Issues:** Fix any problems noted in log file
- **Update Log:** Add new achievements, issues, and progress

### After PRD Work:
- **User Approval:** Never auto-push, always wait for approval
- **Store Memory:** Save learnings and decisions
  ```
  openmemory_store({ 
    content: "[decision/learning]", 
    user_id: "{{PROJECT_FOLDER_NAME}}",
    tags: ["[PRD-ID]"]
  })
  ```
- **Log Completion:** Ensure log file reflects final state

### Critical Rules to Remember:
1. 📋 **Read Log Files First** - Understand context before starting work
2. 🧪 **100% Test Pass Rate Required** - No exceptions
3. ✍️ **One Commit Per PRD** - Must include PRD ID in message
4. 👤 **User Approval for Push** - Never auto-push
5. ✅ **Leave Clean State** - Code must build and tests pass
6. 📝 **Track Everything** - Log all progress and events
```

## Return Data

Return work status overview:

```json
{
  "success": true,
  "totalActivePRDs": <count>,
  "prdsByStatus": {
    "IN_PROGRESS": <count>,
    "TODO": <count>,
    "BLOCKED": <count>,
    "FAILED": <count>,
    "PAUSED": <count>
  },
  "prdsByPriority": {
    "1": <count>,
    "2": <count>,
    "3": <count>
  },
  "activePRDs": [
    {
      "id": "<prd-id>",
      "title": "<title>",
      "status": "<status>",
      "priority": <number>,
      "hasDependencies": <boolean>,
      "dependenciesMet": <boolean>,
      "logAnalysis": {
        "lastActivity": "<timestamp>",
        "currentState": "<description>",
        "completed": ["<achievements>"],
        "remaining": ["<work left>"],
        "issues": ["<problems>"],
        "blockers": ["<blockers>"],
        "nextSteps": ["<recommended actions>"]
      }
    }
  ],
  "recommendations": [
    "Complete in-progress PRDs first",
    "Start with Priority 1 PRDs",
    "Resolve blocked PRDs before starting new work"
  ],
  "nextSteps": [
    "skill(\"prd-execute\", { prdId: \"[PRD-ID]\" })",
    "skill(\"prd-test\", { prdId: \"[PRD-ID]\" })",
    "skill(\"prd-track\", { prdId: \"[PRD-ID]\", eventType: \"COMPLETED\" })"
  ]
}
```

## Error Handling

### If PRD Database Doesn't Exist
```markdown
## No PRD Database Found

The PRD database does not exist yet at `/dev/prd/prd.json`.

**This means no PRDs have been created in this project.**

### To Get Started:

1. **Create your first PRD** by starting with an interview:
   ```
   skill("prd-interview")
   ```

2. **The interview will:**
   - Ask you 9 questions about your work
   - Determine the work type
   - Gather all requirements
   - Create a PRD automatically

3. **Then you can start working** using the workflow above

### Need Help?

- See documentation: `.opencode/prompts/build.md`
- Review examples: `.opencode/skill/EXAMPLES.md`
- Quick reference: `.opencode/quick-reference/WORKFLOW_SUMMARY.md`
```

### If No Active PRDs Found
- Report that all PRDs are completed
- Congratulate on completion
- Offer to start new work via interview
- Show how to create new PRDs

### If PRD Database is Corrupted
- Report the error
- Suggest manual inspection of `/dev/prd/prd.json`
- Offer to help fix the database
- Recommend backup and recovery

## Best Practices

### Status Display
- **Keep it simple**: Don't overwhelm with too much detail
- **Prioritize**: Show most important PRDs first
- **Use colors/icons**: Help visually distinguish status (if supported)
- **Be concise**: Title and ID are enough for the list

### Guidance
- **Be specific**: Provide exact commands to run
- **Context-aware**: Adapt guidance to current state
- **Actionable**: Always tell user what to do next
- **Complete**: Cover the full workflow, not just one step

### Communication
- **Clear structure**: Use headers and sections
- **Visual hierarchy**: Most important info first
- **Examples**: Show actual commands with placeholders
- **Reminders**: Include critical rules (tests, commits, approval)

## Example Output

```markdown
# PRD Work Status Overview

## Active PRDs

| Title | PRD ID | Status | Priority |
|-------|--------|--------|----------|
| User Authentication System | PRD-20250115-143022 | IN_PROGRESS | 1 |
| Shopping Cart Feature | PRD-20250115-150033 | TODO | 1 |
| Payment Integration | PRD-20250115-152045 | TODO | 2 |
| Email Notifications | PRD-20250115-155012 | BLOCKED | 2 |

## Work Status Recap

**Total Active PRDs:** 4
**Currently In Progress:** 1
**Ready to Start:** 1 (TODO status with no blockers)
**Blocked:** 1 (waiting on dependencies)

### Breakdown by Priority:
- **Priority 1 (High):** 2 PRDs (1 in progress, 1 ready)
- **Priority 2 (Medium):** 2 PRDs (0 in progress, 1 ready, 1 blocked)

### Immediate Attention Needed:
- **PRD-20250115-143022** (User Authentication) is in progress - complete this first
- **PRD-20250115-155012** (Email Notifications) is blocked - depends on PRD-20250115-152045

### Log Insights:

**IN_PROGRESS PRDs:**

**PRD-20250115-143022 (User Authentication System):**
- Last worked on: 2025-01-15 16:30:22
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

**BLOCKED PRDs:**

**PRD-20250115-155012 (Email Notifications):**
- Blocked since: 2025-01-15 15:00:00
- Blocker: Depends on PRD-20250115-152045 (Payment Integration) - user payment events needed
- Work done before block: Email template system created, SMTP configured
- Resolution: Complete Payment Integration PRD first to get payment event hooks

## How to Start Working on PRDs

### ⚠️ Existing Work In Progress

You have a PRD currently in progress:

**PRD-20250115-143022: User Authentication System**
- **Status:** IN_PROGRESS
- **Last Activity:** 2025-01-15 16:30:22 (4 hours ago)
- **Progress:** 3 of 5 acceptance criteria completed
- **Completed So Far:**
  - User registration endpoint with validation
  - Login functionality with JWT token generation
  - Password hashing using bcrypt
  - Database schema for users table
- **Remaining Work:**
  - Email verification system (criterion 4)
  - Password reset functionality (criterion 5)
- **Issues to Address:**
  - SMTP timeout error when sending verification emails
  - Email service credentials need configuration
  - 3 tests failing related to email verification
- **Test Status:** 12 tests passing, 3 tests failing

**Context from Log:**
The email service integration is currently failing with "SMTP timeout after 5000ms". The developer noted that email provider credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) need to be configured in environment variables. Template system is ready, just needs working email connection.

**Recommended Action:**
1. Review the log file: `/dev/prd/logs/PRD-20250115-143022.md`
2. Address the email service configuration issue:
   - Configure SMTP credentials in .env file
   - Test email connection
   - Fix the 3 failing email verification tests
3. Continue execution: `skill("prd-execute", { prdId: "PRD-20250115-143022", continueMode: true })`
4. Focus on remaining criteria:
   - Implement email verification flow (criterion 4)
   - Implement password reset flow (criterion 5)
5. Once complete, verify: `skill("prd-test", { prdId: "PRD-20250115-143022" })`
6. Finally, complete: `skill("prd-track", { prdId: "PRD-20250115-143022", eventType: "COMPLETED" })`

**Or** if you want to work on a different PRD:
1. First pause the current PRD: `skill("prd-track", { prdId: "PRD-20250115-143022", eventType: "PAUSED", reason: "Need to configure email service first" })`
2. Then start a new PRD from the TODO list above

## Related Workflow Steps

### Critical Rules to Remember:
1. 📋 **Read Log Files First** - Understand context before starting work
2. 🧪 **100% Test Pass Rate Required** - No exceptions
3. ✍️ **One Commit Per PRD** - Must include PRD ID in message
4. 👤 **User Approval for Push** - Never auto-push
5. ✅ **Leave Clean State** - Code must build and tests pass
6. 📝 **Track Everything** - Log all progress and events

---

Ready to work on a PRD? Review the log insights above and follow the workflow!
```

## Important Reminders

- **ALWAYS READ LOG FILES** - Essential for understanding PRD context
- **ALWAYS show non-DONE PRDs** - Users need to see what's pending
- **ANALYZE LOG CONTENT** - Extract achievements, issues, blockers, and next steps
- **PROVIDE LOG INSIGHTS** - Include relevant context from logs in guidance
- **PRIORITIZE properly** - Sort by priority then status
- **BE SPECIFIC** - Give exact commands, not vague suggestions
- **CONSIDER CONTEXT** - Adapt guidance based on log file analysis
- **INCLUDE WORKFLOW** - Show full process, not just one step
- **REMIND CRITICAL RULES** - Tests, commits, approval are mandatory
- **SHOW BLOCKERS** - Make dependencies and issues from logs visible
- **HIGHLIGHT ISSUES** - Point out unresolved problems from logs
- **ENCOURAGE COMPLETION** - Guide users to finish in-progress work first
- **PROVIDE CONTINUITY** - Help users pick up where they left off using log data

---

Ready to check PRD work status? I'll show you what needs to be done and how to start!