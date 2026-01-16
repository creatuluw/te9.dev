---
name: prd-track
description: Update PRD logs, track progress, log achievements, issues, and maintain execution history
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-execution
  depends-on: [prd-execute, prd-test]
---

# PRD Tracking Skill

## What I Do

I track and log progress for PRDs by:
- Updating PRD log files with current status
- Recording achievements and milestones
- Documenting issues and challenges encountered
- Maintaining execution history
- Updating PRD database status
- Providing visibility into PRD progress

## When to Use Me

Use throughout the PRD lifecycle:
- When PRD execution starts (mark as IN_PROGRESS)
- When significant progress is made
- When issues or blockers arise
- When PRD is completed (mark as DONE)
- When PRD fails (mark as FAILED)
- To check current status of a PRD

## Prerequisites

Before calling this skill, ensure:
1. PRD exists in `/dev/prd/prd.json`
2. Log file exists at `/dev/prd/logs/<prd-id>.md`
3. You have an event/action to log

## Input Parameters

**Required:**
- `prdId`: The PRD ID to track (e.g., "PRD-20250115-143022")
- `eventType`: Type of event (see Event Types below)
- `eventData`: Object with event-specific data

**Event Types:**
- `STARTED`: PRD execution has begun
- `PROGRESS`: Significant progress made
- `ISSUE`: Issue or blocker encountered
- `COMPLETED`: PRD execution finished successfully
- `FAILED`: PRD execution failed
- `PAUSED`: PRD execution paused
- `RESUMED`: PRD execution resumed
- `TESTED`: Testing phase completed

## Step-by-Step Process

### Step 1: Load Current PRD Data

Read `/dev/prd/prd.json` and find the PRD:
- Extract current status
- Get existing metadata
- Note last known state
- Check for any existing log entries

### Step 2: Load Current Log File

Read `/dev/prd/logs/<prd-id>.md`:
- Parse existing sections
- Get current timeline entries
- Review existing achievements and issues
- Note last status change

### Step 3: Load PRD File and Verify Implementation

**CRITICAL: Always verify actual implementation before logging any event.**

Read `/dev/prd/runs/<prd-id>/<prd-id>.md` to get:
- **Title**: PRD title
- **Description**: What needs to be implemented
- **Acceptance Criteria**: List of all criteria (numbered)
- **Technical Requirements**: Technologies and patterns required
- **Dependencies**: Other PRDs or systems this depends on

#### Verification Checklist

For each event type, verify the following:

##### For STARTED Events:
1. **Check Dependencies**:
   - If PRD lists dependencies, verify they exist
   - Check if dependent PRDs are marked as DONE
   - Verify dependent files/modules are accessible
   - Document any missing dependencies as BLOCKERS

2. **Verify Starting State**:
   - Check that required directories exist
   - Verify project structure is ready
   - Confirm no conflicting work in progress
   - Document baseline state before starting

##### For PROGRESS Events:
1. **Verify Claimed Progress**:
   - Check which acceptance criteria are claimed as complete
   - For each claimed criterion, verify actual implementation:
     - **Read the files** mentioned in the criterion
     - **Confirm code exists** that implements the requirement
     - **Check for tests** if criterion requires testing
     - **Verify functionality** matches acceptance criteria description
   
2. **Count Actual Changes**:
   - Use `git diff` or file system checks to count:
     - Files created (new files that didn't exist before)
     - Files modified (existing files with changes)
     - Lines added/removed
   - Compare claimed changes with actual changes
   - Document any discrepancies

3. **Review Code Quality**:
   - Check if code follows project standards
   - Verify proper error handling exists
   - Confirm logging/debugging statements are appropriate
   - Note any code quality issues

4. **Validate Partial Completion**:
   - For each acceptance criterion:
     - ✅ COMPLETE: Implementation exists and matches requirement
     - 🔄 IN_PROGRESS: Partial implementation exists
     - ❌ NOT_STARTED: No implementation found
   - Calculate actual percentage: (COMPLETE criteria / Total criteria) × 100%

##### For ISSUE Events:
1. **Verify Issue Exists**:
   - Check if reported issue is reproducible
   - Review error messages or logs
   - Confirm the issue blocks progress
   - Assess actual severity based on impact

2. **Document Issue Context**:
   - Which acceptance criterion triggered the issue?
   - What files are affected?
   - What was attempted before issue occurred?
   - Are there related issues in other PRDs?

##### For COMPLETED Events:
1. **Verify ALL Acceptance Criteria**:
   - Go through EACH criterion one by one
   - For each criterion:
     - Read implementation files
     - Confirm requirement is fully met
     - Check edge cases are handled
     - Verify no shortcuts or TODOs left
   - If ANY criterion is incomplete, **DO NOT mark as COMPLETED**

2. **Verify Test Results**:
   - Check if test files exist for this PRD
   - Read test output or logs
   - Confirm 100% pass rate claim
   - Count actual tests: total, passed, failed
   - Verify no tests were skipped or disabled

3. **Check Git Commit**:
   - Verify git commit exists: `git log -1 --grep="[PRD-<id>]"`
   - Extract commit hash
   - Verify commit message includes PRD ID
   - Check files in commit: `git show --name-only <commit_hash>`
   - Confirm commit includes all implementation files

4. **Regression Check**:
   - Review if any existing functionality broke
   - Check if related tests still pass
   - Verify integration points still work
   - Document any regressions found

5. **Quality Gate Verification**:
   - All acceptance criteria: COMPLETE ✅
   - All unit tests: PASSING 100% 🧪
   - Git commit: EXISTS ✍️
   - Code quality: ACCEPTABLE
   - No blockers: CONFIRMED
   - If ANY gate fails, change to FAILED or IN_PROGRESS instead

##### For TESTED Events:
1. **Verify Test Execution**:
   - Check test runner was actually executed
   - Read test output files or logs
   - Count tests by category: unit, integration, e2e
   - Verify tests are relevant to this PRD

2. **Validate Test Coverage**:
   - Check which acceptance criteria have tests
   - Verify edge cases are tested
   - Confirm error paths are tested
   - Document coverage gaps

3. **Analyze Test Results**:
   - Count: total tests, passed, failed, skipped
   - For failed tests: extract error messages
   - For skipped tests: understand why
   - Calculate pass rate: (passed / total) × 100%

##### For FAILED Events:
1. **Document Failure Reason**:
   - What was the blocking issue?
   - At which acceptance criterion did it fail?
   - What was attempted to resolve it?
   - Why couldn't it be resolved?

2. **Identify Blockers**:
   - List all blocking issues preventing completion
   - Categorize: technical, dependency, resource, knowledge
   - Assess if blockers can be resolved or need escalation

#### Implementation Verification Output

After verification, create detailed findings:

```markdown
### Implementation Verification Report

**PRD ID:** <prd-id>
**Event Type:** <event-type>
**Verification Timestamp:** <ISO timestamp>

#### Acceptance Criteria Status
- Total Criteria: <N>
- Complete: <X> ✅
- In Progress: <Y> 🔄
- Not Started: <Z> ❌
- Actual Completion: <X/N × 100>%

#### Detailed Criteria Verification
1. [Criterion 1 text]
   - Status: COMPLETE/IN_PROGRESS/NOT_STARTED
   - Implementation: [file paths where implemented]
   - Evidence: [specific code/features that fulfill this]
   - Tests: [test files covering this criterion]

2. [Criterion 2 text]
   - Status: COMPLETE/IN_PROGRESS/NOT_STARTED
   - Implementation: [file paths where implemented]
   - Evidence: [specific code/features that fulfill this]
   - Tests: [test files covering this criterion]

[... for each criterion ...]

#### File Changes Verification
- Files Created: <count> files
  - [List actual files created]
- Files Modified: <count> files
  - [List actual files modified]
- Total Lines Changed: +<added> / -<removed>

#### Test Verification (if applicable)
- Test Execution: YES/NO
- Total Tests: <count>
- Passed: <count> ✅
- Failed: <count> ❌
- Skipped: <count> ⏭️
- Pass Rate: <percentage>%
- Test Files: [list of test files]

#### Git Commit Verification (if applicable)
- Commit Exists: YES/NO
- Commit Hash: <hash>
- Commit Message: "<message>"
- PRD ID in Message: YES/NO
- Files in Commit: <count> files
- Commit Matches Implementation: YES/NO

#### Quality Issues Found
[List any code quality, implementation, or other issues discovered]

#### Discrepancies
[List any differences between claimed work and actual implementation]

#### Blockers Identified
[List any blocking issues that prevent progress]

#### Recommendation
Based on verification:
- ✅ APPROVE: Log event as claimed
- ⚠️ ADJUST: Log event with corrections
- ❌ REJECT: Do not log event, issue found

[Explanation of recommendation]
```

**Store this verification report** in the timeline so there's a permanent record of what was actually verified.

### Step 4: Process Event Based on Type (With Verified Data)

#### Event Type: STARTED
Add to timeline:
```markdown
### Execution Started
- **Timestamp:** <ISO timestamp>
- **Event:** PRD execution has begun
- **Action:** Started implementing PRD
- **Status:** IN_PROGRESS
```

Update status changes:
```markdown
- IN_PROGRESS: <timestamp> - Execution started
```

#### Event Type: PROGRESS
Add to timeline:
```markdown
### Progress Update
- **Timestamp:** <ISO timestamp>
- **Event:** Progress milestone reached
- **Details:** [progress description]
- **Work Completed:** [what was accomplished]
```

Add to achievements:
```markdown
- [achievement description]
```

#### Event Type: ISSUE
Add to timeline:
```markdown
### Issue Encountered
- **Timestamp:** <ISO timestamp>
- **Event:** Issue or blocker identified
- **Issue:** [issue description]
- **Severity:** [Low/Medium/High/Critical]
- **Impact:** [how it affects progress]
- **Resolution:** [how it was resolved, or "Pending"]
```

Add to issues:
```markdown
- [issue description] (Severity: [severity])
```

#### Event Type: COMPLETED
Add to timeline:
```markdown
### Execution Completed
- **Timestamp:** <ISO timestamp>
- **Event:** PRD implementation completed successfully
- **Action:** All acceptance criteria implemented and tested
- **Test Results:** [summary of test results]
- **Status:** DONE
```

Update status changes:
```markdown
- DONE: <timestamp> - Completed successfully
```

Add to achievements:
```markdown
- PRD completed successfully
- All acceptance criteria implemented
- All tests passing
- Code quality verified
```

#### Event Type: FAILED
Add to timeline:
```markdown
### Execution Failed
- **Timestamp:** <ISO timestamp>
- **Event:** PRD execution could not be completed
- **Reason:** [failure reason]
- **Blockers:** [list of blocking issues]
- **Status:** FAILED
```

Update status changes:
```markdown
- FAILED: <timestamp> - Execution failed
```

Add to issues:
```markdown
- [failure reason] (Blocking)
```

#### Event Type: PAUSED
Add to timeline:
```markdown
### Execution Paused
- **Timestamp:** <ISO timestamp>
- **Event:** PRD execution paused
- **Reason:** [reason for pause]
- **Resume Date:** [expected resume date, if known]
- **Status:** PAUSED
```

Update status changes:
```markdown
- PAUSED: <timestamp> - Execution paused
```

#### Event Type: RESUMED
Add to timeline:
```markdown
### Execution Resumed
- **Timestamp:** <ISO timestamp>
- **Event:** PRD execution resumed after pause
- **Action:** Continuing implementation
- **Status:** IN_PROGRESS
```

Update status changes:
```markdown
- IN_PROGRESS: <timestamp> - Execution resumed
```

#### Event Type: TESTED
Add to timeline:
```markdown
### Testing Completed
- **Timestamp:** <ISO timestamp>
- **Event:** Testing phase completed
- **Test Results:** [summary]
- **Issues Found:** [count] issues
- **Status:** [current status]
```

### Step 5: Update PRD Database (Using Verified Data)

**Use actual verified data from Step 3, not claimed data.**

Update `/dev/prd/prd.json` entry for this PRD:

```json
{
  "id": "<prd-id>",
  "status": "<new status>",
  "lastUpdated": "<ISO timestamp>",
  "passes": [boolean based on current state]
}
```

**Status Transitions:**
- TODO → IN_PROGRESS (when started)
- IN_PROGRESS → PAUSED (when paused)
- PAUSED → IN_PROGRESS (when resumed)
- IN_PROGRESS → DONE (when completed successfully)
- IN_PROGRESS → FAILED (when failed)
- FAILED → IN_PROGRESS (when retrying)

### Step 6: Save Updated Log File (Including Verification Report)

Write updated content to `/dev/prd/logs/<prd-id>.md`:
- Preserve existing structure
- Add new timeline entry
- Update status changes section
- Update achievements or issues as needed
- Maintain markdown formatting
- Ensure proper indentation

### Step 7: Generate Status Report (Based on Verified Data)

Create a current status summary using **actual verified data**, not claimed data:

```markdown
## Current Status Report

**PRD ID:** <prd-id>
**Title:** <title>
**Status:** <current status>
**Last Updated:** <ISO timestamp>

### Progress Summary
- Acceptance Criteria Total: [N]
- Acceptance Criteria Completed: [X]
- Percentage Complete: [X/N * 100]%

### Recent Activity
[Most recent timeline entries]

### Blockers
[Current blocking issues, if any]

### Next Steps
[What should be done next]
```

### Step 8: Git Push with User Approval (For COMPLETED Events)

When the event type is `COMPLETED` and the PRD has a commit:

1. **Verify Commit Exists**: Check that a git commit was created for this PRD
2. **Ask for User Approval**: Present the commit details and request user approval to push

```markdown
### Ready to Push PRD Changes

**PRD ID:** <prd-id>
**PRD Title:** <title>
**Status:** DONE
**Commit Hash:** <commit_hash>
**Commit Message:** "<commit_message>"

**Files in this commit:**
- [List of files changed]

**Test Results:**
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

### User Approval Required

To push these changes to the remote repository, please confirm:

- [ ] Review the commit message
- [ ] Verify the changes included
- [ ] Confirm all tests pass
- [ ] Approve pushing to remote

**Type "approve" to push, or "reject" to cancel push.**
```

3. **If User Approves**:
   - Execute `git push` to push the commit to remote
   - Capture the push result (successful or failed)
   - Log the push in the timeline
   - Note the remote branch name and commit hash

4. **If User Rejects**:
   - Do not push the commit
   - Log that push was declined by user
   - Keep commit locally
   - Note that user may push manually later

5. **Update Timeline with Push Status**:

If pushed successfully:
```markdown
### Changes Pushed to Remote
- **Timestamp:** <ISO timestamp>
- **Event:** PRD changes pushed to remote repository
- **Action:** Git push completed successfully
- **Commit Hash:** <commit_hash>
- **Remote Branch:** <branch_name>
- **User:** <user who approved>
```

If push rejected:
```markdown
### Push Not Completed
- **Timestamp:** <ISO timestamp>
- **Event:** User declined to push changes
- **Action:** Commit remains local, not pushed
- **Reason:** User rejected push approval
- **Note:** User may push manually using: git push
```

6. **Handle Push Errors**:

If `git push` fails:
```markdown
### Push Failed
- **Timestamp:** <ISO timestamp>
- **Event:** Git push encountered errors
- **Error:** <error message>
- **Resolution:** Manual intervention required
- **Action:** Recommend checking git remote configuration and permissions
```

**CRITICAL: Only push after user approval. Do not auto-push.**

## Return Data

Return tracking summary:

```json
{
  "success": true,
  "prdId": "<prd-id>",
  "eventType": "<event type>",
  "timestamp": "<ISO timestamp>",
  "status": {
    "current": "<status>",
    "previous": "<status>",
    "changed": true
  },
  "logUpdated": true,
  "databaseUpdated": true,
  "gitPushed": true,
  "commitHash": "<commit_hash>",
  "pushStatus": "SUCCESSFUL|REJECTED|FAILED",
  "pushDetails": {
    "userApproved": true,
    "remoteBranch": "<branch_name>",
    "pushError": null
  },
  "verification": {
    "performed": true,
    "timestamp": "<ISO timestamp>",
    "criteriaVerified": <count>,
    "filesChecked": <count>,
    "testsVerified": true,
    "commitVerified": true,
    "discrepanciesFound": <count>,
    "recommendation": "APPROVE|ADJUST|REJECT"
  },
  "summary": {
    "totalCriteria": <N>,
    "completedCriteria": <X>,
    "claimedComplete": <claimed count>,
    "actualComplete": <verified count>,
    "percentageComplete": <actual percentage>,
    "achievements": <count>,
    "issues": <count>,
    "blockers": <count>
  },
  "nextSteps": [
    "Continue implementation",
    "Address identified issues",
    "Move to next PRD in plan"
  ]
}
```

## Event Data Structures

### STARTED Event
```json
{
  "startedBy": "AI Agent",
  "dependenciesChecked": true,
  "dependenciesMet": true
}
```

### PROGRESS Event
```json
{
  "achievement": "description of progress",
  "criteriaCompleted": [<list of criterion numbers>],
  "filesCreated": <count>,
  "filesModified": <count>
}
```

### ISSUE Event
```json
{
  "issue": "description of issue",
  "severity": "Low|Medium|High|Critical",
  "impact": "how it affects progress",
  "resolution": "how resolved or 'Pending'"
}
```

### COMPLETED Event
```json
{
  "testResults": {
    "totalTests": <count>,
    "passedTests": <count>,
    "failedTests": <count>
  },
  "filesCreated": <count>,
  "filesModified": <count>,
  "regressions": <count>,
  "commitHash": "<git_commit_hash>",
  "commitMessage": "<commit_message>",
  "requiresPushApproval": true
}
```

### FAILED Event
```json
{
  "reason": "why it failed",
  "blockers": ["blocking issue 1", "blocking issue 2"],
  "canRetry": true
}
```

### PAUSED Event
```json
{
  "reason": "why paused",
  "expectedResume": "<ISO timestamp or null>",
  "currentState": "description of work in progress"
}
```

## Error Handling

### If Log File Doesn't Exist
- Create the log file with initial structure
- Use PRD data from database to populate initial metadata
- Then proceed with logging the event

### If PRD Not Found in Database
- Report error to user
- Check if PRD ID is correct
- Suggest running `prd-create` skill first
- Do not create log file

### If Status Transition Invalid
- Report the invalid transition
- Explain why it's not allowed
- Do not update status
- Still log the event but note status issue

### If Git Push Fails
- Check git remote configuration
- Verify authentication credentials
- Check network connectivity
- Verify you have push permissions
- Report specific error to user
- Suggest manual push with: `git push`

### If User Rejects Push
- Respect user decision
- Do not attempt to push
- Log that push was rejected
- Keep commit locally
- Provide manual push instructions:
  ```bash
  # User can push manually when ready:
  git push
  ```

### If File Write Fails
- Report the specific error
- Check file permissions
- Ensure directory exists
- Try again or suggest manual fix

## Best Practices

### Logging
- **Be specific**: Include detailed information in each log entry
- **Use timestamps**: Always include ISO timestamps
- **Document context**: Explain why events happened
- **Track blockers**: Clearly identify what's blocking progress
- **Celebrate achievements**: Log successes and milestones

### Status Management
- **Follow lifecycle**: Only use valid status transitions
- **Update consistently**: Always update both log and database
- **Be accurate**: Reflect actual state, not desired state
- **Track time**: Note when status changes occur

### Communication
- **Be transparent**: Don't hide issues or problems
- **Provide context**: Explain the significance of events
- **Suggest actions**: Recommend next steps when logging issues
- **Summarize progress**: Give clear picture of overall state

## Log File Structure

The log file follows this structure:

```markdown
# PRD Log: <prd-id> - <title>

## Metadata
- **Created:** <ISO timestamp>
- **Interview ID:** <interview-id>
- **Type:** <type>
- **Status:** <current status>
- **Priority:** <priority>
- **Part of Plan:** <Yes/No>
- **Dependencies:** <list of dependencies>

## Timeline
[Chronological log entries]

### [Event Name]
- **Timestamp:** <ISO timestamp>
- **Event:** [description]
- **Action:** [what was done]
- **Status:** <status after event>

## Achievements
[Accomplishments and milestones]

## Issues
[Problems and challenges encountered]

## Status Changes
[Chronological list of status changes]
- <STATUS>: <timestamp> - [description]

## Execution History
[Summary of execution sessions]

## Notes
[Additional context and information]
```

## Querying PRD Status

To check current status of a PRD, you can also call this skill with:

```json
{
  "prdId": "<prd-id>",
  "eventType": "QUERY",
  "eventData": {}
}
```

This will return the current status without modifying the log.

## Important Reminders

- **VERIFY FIRST** - Always verify implementation before logging anything
- **BE ACCURATE** - Only log what actually happened, not what was claimed
- **CHECK THE CODE** - Read files, check git, run tests to confirm
- **LOG EVERYTHING** - Keep detailed records of all PRD activity
- **DOCUMENT VERIFICATION** - Include verification report in timeline
- **UPDATE BOTH** - Always update both log file and database
- **USE VERIFIED DATA** - Base all logs and status on verified findings
- **TRACK TIME** - Use timestamps to understand progress
- **DOCUMENT BLOCKERS** - Clearly identify what's blocking progress
- **CELEBRATE WINS** - Log achievements and milestones (when truly achieved)
- **REJECT WHEN NEEDED** - Don't log false progress; require proof

---

Ready to track PRD progress? Provide the PRD ID, event type, and event data!