# Spec Track - Progress Tracking and Reporting

## Overview

The spec-track functionality provides real-time visibility into the progress of specifications throughout the te9.dev workflow. It enables tracking status changes, reviewing execution logs, monitoring acceptance criteria, and identifying next steps.

## When to Use

Use spec-track anytime during the workflow to:
- Check the current status of an active specification
- Review detailed execution logs
- Verify acceptance criteria progress
- Identify next steps in the workflow
- Generate summary reports for stakeholders
- Debug issues or understand workflow history
- Resume an interrupted workflow

## Tracking Commands

### Check Spec Status

**Basic status check:**
```bash
# View current status of spec
@spec-track SPEC-20240115-1430-add-user-auth
```

**Output format:**
```
=== Specification Status ===

Spec ID: SPEC-20240115-1430-add-user-auth
Title: Add User Authentication
Created: 2024-01-15 14:30:00
Updated: 2024-01-15 16:45:00

Current Status: READY_FOR_BRANCH_COMMIT
Priority: High
Complexity: Medium

Workflow Progress:
[✓] Step 1: Spec Clarify (14:30-14:38)
[✓] Step 2: Spec Store (14:38-14:40)
[✓] Step 3: Spec Execute (14:40-16:45)
[ ] Step 4: Spec Branch Commit (pending)
[ ] Step 5: Spec PR Create (pending)
[ ] Step 6: Spec PR Review (pending)

Acceptance Criteria Progress:
[✓] AC1: POST /api/register creates user with hashed password
[✓] AC2: POST /api/login returns valid session token
[✓] AC3: Invalid credentials return 401 error
[✓] AC4: Session tokens expire after 24 hours

Next Step: Step 4 - Spec Branch Commit
```

### View Execution Log

**Full log view:**
```bash
# View complete execution log
cat te9.dev/logs/SPEC-20240115-1430-add-user-auth.log
```

**Filtered log view:**
```bash
# View only errors
grep ERROR te9.dev/logs/SPEC-20240115-1430-add-user-auth.log

# View only completed steps
grep COMPLETED te9.dev/logs/SPEC-20240115-1430-add-user-auth.log

# View by step
grep "Step 1" te9.dev/logs/SPEC-20240115-1430-add-user-auth.log
```

### List All Specs

**All specs:**
```bash
# List all specifications with status
cat te9.dev/specs/specs.json
```

**Active specs only:**
```bash
# Filter for non-completed specs
jq '.specs[] | select(.status != "COMPLETED")' te9.dev/specs/specs.json
```

**By status:**
```bash
# List specs in specific status
jq '.specs[] | select(.status == "IN_PROGRESS")' te9.dev/specs/specs.json
```

### Generate Summary Report

**Generate report:**
```bash
# Full summary report
@spec-report SPEC-20240115-1430-add-user-auth
```

**Report format:**
```
=== Specification Summary Report ===

Spec ID: SPEC-20240115-1430-add-user-auth
Title: Add User Authentication
Author: [User Name]
Created: 2024-01-15 14:30:00
Last Updated: 2024-01-15 16:45:00
Status: READY_FOR_BRANCH_COMMIT
Priority: High
Complexity: Medium
Estimated Duration: 2h 15m
Actual Duration: 2h 15m

---

## Description
Implement OAuth2 user authentication with JWT tokens, including user registration, login, and session management.

---

## Requirements Summary

### Functional Requirements
1. Users can register with email and password
2. Passwords must be hashed before storage
3. Login validates credentials and returns JWT token
4. JWT tokens expire after 24 hours
5. Invalid credentials return 401 error

### Non-Functional Requirements
1. Password hashing uses bcrypt with salt rounds of 10
2. JWT tokens signed with HS256 algorithm
3. API response time < 200ms for authentication operations
4. All authentication endpoints properly rate-limited

### Constraints & Assumptions
1. User email must be unique
2. Passwords must be at least 8 characters
3. No password reset flow in this iteration
4. Session tokens stored in HTTP-only cookies

### Out of Scope
1. Password reset functionality (deferred to v2)
2. Two-factor authentication (deferred to v2)
3. OAuth2 with external providers (deferred to v2)

---

## Acceptance Criteria Status

[✓] AC1: POST /api/register creates user with hashed password
   Status: PASSED
   Tests: src/api/register.spec.ts
   Evidence: Test output shows password is hashed using bcrypt

[✓] AC2: POST /api/login returns valid session token
   Status: PASSED
   Tests: src/api/login.spec.ts
   Evidence: JWT token returned and validated

[✓] AC3: Invalid credentials return 401 error
   Status: PASSED
   Tests: src/api/login.spec.ts
   Evidence: 401 status returned for invalid email and password

[✓] AC4: Session tokens expire after 24 hours
   Status: PASSED
   Tests: src/middleware/auth.spec.ts
   Evidence: Token validation fails after expiration

Overall Acceptance Criteria: 4/4 PASSED (100%)

---

## Workflow Timeline

Step 1: Spec Clarify (14:30-14:38)
- Duration: 8 minutes
- Complexity: Medium
- Questions asked: 3
- User confirmation: Received
- Status: COMPLETED

Step 2: Spec Store (14:38-14:40)
- Duration: 2 minutes
- Spec ID generated: SPEC-20240115-1430-add-user-auth
- Spec file created: te9.dev/specs/SPEC-20240115-1430-add-user-auth/spec.md
- specs.json updated: Yes
- Execution log initialized: Yes
- Status: COMPLETED

Step 3: Spec Execute (14:40-16:45)
- Duration: 2 hours 5 minutes
- Tests written: 25
- Tests passed: 25
- Code coverage: 95.42%
- Files modified: 8
- Status: COMPLETED

Step 4: Spec Branch Commit (pending)
- Status: NOT_STARTED
- Next action: Create feature branch

Step 5: Spec PR Create (pending)
- Status: NOT_STARTED
- Next action: Create pull request

Step 6: Spec PR Review (pending)
- Status: NOT_STARTED
- Next action: Provide PR for review

Total Time Spent: 2h 15m
Estimated Time: 2h
Status: Slightly over estimate (+15 minutes)

---

## Changes Summary

### Files Created
- src/models/User.ts (new user model with password hashing)
- src/api/register.ts (registration endpoint)
- src/api/login.ts (login endpoint)
- src/middleware/auth.ts (JWT authentication middleware)
- src/services/token.ts (JWT token service)
- tests/api/register.spec.ts (registration tests)
- tests/api/login.spec.ts (login tests)
- tests/middleware/auth.spec.ts (auth middleware tests)

### Files Modified
- src/app.ts (added auth routes)
- src/config/database.ts (added User model registration)
- package.json (added dependencies: bcrypt, jsonwebtoken)

### Code Metrics
- Lines of code added: 423
- Lines of tests added: 567
- Test coverage: 95.42%
- Code duplication: 2.1%

---

## Issues and Challenges

### Issues Encountered
1. Issue: Initial bcrypt async implementation caused test timeout
   Resolution: Reduced salt rounds from 12 to 10 for performance
   Impact: Minor - security still acceptable

2. Issue: JWT token expiration validation flaky in tests
   Resolution: Added test clock fixture for deterministic time
   Impact: Test reliability improved

### Challenges
1. Challenge: Ensuring password never returned in API responses
   Solution: Created userWithoutPassword helper utility
   Status: Resolved

2. Challenge: Rate limiting for auth endpoints
   Solution: Used express-rate-limit with specific config
   Status: Resolved

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Password hash too weak | Low | High | Used bcrypt with 10 salt rounds |
| JWT token compromise | Medium | High | HTTP-only cookies, short expiration |
| SQL injection on user inputs | Low | High | Parameterized queries, input validation |
| Rate limiting bypass | Low | Medium | IP-based rate limiting |

All risks mitigated.

---

## Test Results

### Unit Tests
- Total: 20 tests
- Passed: 20 tests
- Failed: 0 tests
- Skipped: 0 tests
- Coverage: 95.42%

### Integration Tests
- Total: 5 tests
- Passed: 5 tests
- Failed: 0 tests
- Skipped: 0 tests

### End-to-End Tests
- Total: 2 tests
- Passed: 2 tests
- Failed: 0 tests
- Skipped: 0 tests

### Overall Test Results
- Total: 27 tests
- Passed: 27 tests (100%)
- Failed: 0 tests (0%)
- Skipped: 0 tests (0%)

---

## Next Steps

1. Create feature branch: `feature/SPEC-20240115-1430-add-user-auth`
2. Commit changes with spec ID in commit message
3. Request user approval
4. Push branch to remote
5. Create pull request
6. Assign reviewers
7. Monitor CI/CD checks
8. Provide PR for manual review

---

## Notes

- User provided clear requirements, minimal clarification needed
- Implementation went smoothly with few issues
- All acceptance criteria met
- Code quality high with good test coverage
- Ready for code review

---

Report Generated: 2024-01-15 17:00:00
Generated by: @spec-track
```

## Status Transitions

### Valid Status Values

```
REQUIREMENTS_GATHERED (initial)
    ↓
SPEC_STORED (after Step 2)
    ↓
IN_PROGRESS (during Step 3)
    ↓
READY_FOR_BRANCH_COMMIT (Step 3 complete)
    ↓
BRANCH_COMMITTED (Step 4 complete)
    ↓
PR_CREATED (Step 5 complete)
    ↓
REVIEWING (under review)
    ↓
COMPLETED (merged and deployed)
```

### Error States

```
ON_HOLD (temporarily paused)
    ↓
[can return to previous status]

CANCELLED (abandoned)
    ↓
[terminal state]

FAILED (irrecoverable error)
    ↓
[terminal state]
```

### Status Change Logging

Every status change must be logged:

```
[timestamp] Status changed: OLD_STATUS -> NEW_STATUS
[timestamp] Reason: [explanation of why status changed]
[timestamp] Updated by: [agent or user]
```

## Execution Log Structure

### Log Format

```
=== Execution Log: SPEC-<id> ===
Started: [timestamp]
Status: [initial status]

---

[timestamp] STEP 1: SPEC CLARIFY
[timestamp] - Complexity determined: [Simple/Medium/Complex]
[timestamp] - Questions asked: [number]
[timestamp] - User confirmation received
[timestamp] STEP 1 COMPLETED

[timestamp] STEP 2: SPEC STORE
[timestamp] - Spec ID generated: SPEC-<id>
[timestamp] - spec.md created at [path]
[timestamp] - specs.json updated
[timestamp] - Execution log initialized
[timestamp] - Status updated to: SPEC_STORED
[timestamp] STEP 2 COMPLETED

[timestamp] STEP 3: SPEC EXECUTE
[timestamp] - Planning implementation...
[timestamp] - Test: [test name] - FAILED (as expected)
[timestamp] - Implementation: [description]
[timestamp] - Test: [test name] - PASSED
[timestamp] - Acceptance Criteria [N]: [criterion] - PASSED
[timestamp] - Comprehensive test suite run - PASSED ([N/N] tests)
[timestamp] - STEP 3 COMPLETED

[timestamp] STEP 4: SPEC BRANCH COMMIT
[timestamp] - Branch created: feature/SPEC-<id>-<slug>
[timestamp] - Commit: [commit hash]
[timestamp] - User approval requested
[timestamp] - User approval received
[timestamp] - Branch pushed to remote
[timestamp] - Status updated to: BRANCH_COMMITTED
[timestamp] STEP 4 COMPLETED

[timestamp] STEP 5: SPEC PR CREATE
[timestamp] - Pull request created: [PR URL]
[timestamp] - Reviewers assigned: [list]
[timestamp] - CI/CD checks enabled
[timestamp] - Status updated to: PR_CREATED
[timestamp] STEP 5 COMPLETED

[timestamp] STEP 6: SPEC PR REVIEW
[timestamp] - PR link provided to user
[timestamp] - Manual merge instructions provided
[timestamp] - User confirmed merge
[timestamp] - Status updated to: COMPLETED
[timestamp] STEP 6 COMPLETED

[timestamp] WORKFLOW COMPLETED
```

### Log Levels

```
INFO: Normal workflow progress
SUCCESS: Step or criterion completed
WARNING: Minor issue that doesn't block progress
ERROR: Blocking issue that needs resolution
CRITICAL: Severe error that may require workflow restart
```

## Acceptance Criteria Tracking

### Individual Criterion Status

Each acceptance criterion has its own status:

```markdown
### Acceptance Criterion 1: [Title]

**Status:** PASSED/FAILED/PENDING/BLOCKED

**Description:** [Detailed description]

**Test Coverage:**
- [Test 1 name]
- [Test 2 name]
- ...

**Test Results:**
- Total: N tests
- Passed: N tests
- Failed: N tests
- Date: [timestamp]

**Evidence:**
[Test output or screenshots]

**Issues:**
[Any issues encountered during verification]

**Notes:**
[Any additional notes]
```

### Overall Acceptance Criteria Summary

```
Overall Acceptance Criteria Status: [X/Y] PASSED ([Z]%)

[✓/✗] AC1: [title] - [status]
[✓/✗] AC2: [title] - [status]
[✓/✗] AC3: [title] - [status]
...
```

## Advanced Tracking Queries

### Filter by Multiple Criteria

```bash
# High priority specs in progress
jq '.specs[] | select(.priority == "High" and .status == "IN_PROGRESS")' te9.dev/specs/specs.json

# Complex specs completed this week
jq '.specs[] | select(.complexity == "Complex" and .status == "COMPLETED" and (.updated | fromdateiso8601) > (now - 7*24*3600))' te9.dev/specs/specs.json

# Specs with PR created but not merged
jq '.specs[] | select(.status == "PR_CREATED") | {id, title, pr}' te9.dev/specs/specs.json
```

### Calculate Metrics

```bash
# Count specs by status
jq '.specs | group_by(.status) | map({status: .[0].status, count: length})' te9.dev/specs/specs.json

# Average completion time
jq '[.specs[] | select(.status == "COMPLETED") | .duration] | add / length' te9.dev/specs/specs.json

# Specs over estimated time
jq '[.specs[] | select(.status == "COMPLETED" and .duration > .estimated_duration)] | length' te9.dev/specs/specs.json
```

### Generate Dashboard

```bash
# Create summary dashboard
echo "=== TE9.DEV Dashboard ==="
echo ""
echo "Total Specs: $(jq '.specs | length' te9.dev/specs/specs.json)"
echo "Completed: $(jq '[.specs[] | select(.status == "COMPLETED")] | length' te9.dev/specs/specs.json)"
echo "In Progress: $(jq '[.specs[] | select(.status == "IN_PROGRESS")] | length' te9.dev/specs/specs.json)"
echo "Pending Review: $(jq '[.specs[] | select(.status == "PR_CREATED" or .status == "REVIEWING")] | length' te9.dev/specs/specs.json)"
echo ""
echo "High Priority: $(jq '[.specs[] | select(.priority == "High")] | length' te9.dev/specs/specs.json)"
echo "Medium Priority: $(jq '[.specs[] | select(.priority == "Medium")] | length' te9.dev/specs/specs.json)"
echo "Low Priority: $(jq '[.specs[] | select(.priority == "Low")] | length' te9.dev/specs/specs.json)"
```

## Recovery and Resume

### Resuming Interrupted Workflow

**Scenario:** Workflow was interrupted during Step 3

**Steps to resume:**
1. Check current status:
   ```bash
   @spec-track SPEC-20240115-1430-add-user-auth
   ```

2. Review last log entry:
   ```bash
   tail -20 te9.dev/logs/SPEC-20240115-1430-add-user-auth.log
   ```

3. Determine where to resume:
   - If in middle of test: Complete current RED-GREEN-REFACTOR cycle
   - If between tests: Continue with next acceptance criterion
   - If step complete: Proceed to next step

4. Update execution log with resume action:
   ```
   [timestamp] Workflow resumed at Step 3
   [timestamp] Last completed: [last completed action]
   [timestamp] Resuming: [next action]
   ```

5. Continue workflow from appropriate point

### Handling Incomplete States

**Scenario:** Spec status is inconsistent with actual progress

**Steps to resolve:**

1. **Verify spec state:**
   ```bash
   @spec-track SPEC-20240115-1430-add-user-auth
   ```

2. **Compare with file system:**
   - Check if branch exists: `git branch -a | grep SPEC-20240115-1430`
   - Check if PR exists: `gh pr view --jq '.number' | grep SPEC-20240115-1430`
   - Check if tests pass: `npm test`

3. **Identify discrepancies:**
   - Status says BRANCH_COMMITTED but branch doesn't exist
   - Status says PR_CREATED but PR doesn't exist
   - Status says READY_FOR_BRANCH_COMMIT but tests failing

4. **Update spec status:**
   ```markdown
   ## Status
   
   [Correct status based on actual state]
   
   ## Recovery Note
   [timestamp] Status corrected from [old] to [new]
   [timestamp] Reason: [explanation]
   ```

5. **Log recovery:**
   ```
   [timestamp] RECOVERY: Status corrected from [old] to [new]
   [timestamp] Reason: [explanation]
   ```

## Integration with Other Workflow Steps

### Spec Clarify

**Use spec-track during Step 1 to:**
- Check if similar specs already exist
- Review complexity of similar past specs
- Estimate time based on historical data

**Commands:**
```bash
# Search for similar specs
jq '.specs[] | select(.title | test("auth", "i"))' te9.dev/specs/specs.json

# Check complexity of similar specs
jq '.specs[] | select(.title | test("auth", "i")) | {title, complexity, duration}' te9.dev/specs/specs.json
```

### Spec Execute

**Use spec-track during Step 3 to:**
- Monitor test progress in real-time
- Check acceptance criteria status as you go
- Log each completed criterion
- Track time spent on implementation

**Commands:**
```bash
# Update acceptance criterion status
echo "[timestamp] Acceptance Criteria 1: POST /api/register creates user with hashed password - PASSED" >> te9.dev/logs/SPEC-<id>.log
```

### Spec Branch Commit

**Use spec-track during Step 4 to:**
- Verify all acceptance criteria are PASSED before branching
- Generate summary of changes for commit message
- Track branch creation and push status

**Commands:**
```bash
# Generate changes summary
git diff --stat main > changes-summary.txt
```

### Spec PR Create

**Use spec-track during Step 5 to:**
- Provide spec details for PR description
- Track PR creation status
- Monitor CI/CD check status

**Commands:**
```bash
# Get spec details for PR
jq '.specs[] | select(.id == "SPEC-20240115-1430-add-user-auth")' te9.dev/specs/specs.json
```

### Spec PR Review

**Use spec-track during Step 6 to:**
- Provide PR link and status to user
- Track review progress
- Mark spec as completed after merge

**Commands:**
```bash
# Check PR status
gh pr view --json state,mergeable,reviewDecision
```

## Troubleshooting

### Spec Not Found

**Problem:** @spec-track cannot find the spec

**Solution:**
```bash
# Check if spec file exists
ls te9.dev/specs/SPEC-<id>/spec.md

# Check if spec in specs.json
jq '.specs[] | select(.id == "SPEC-<id>")' te9.dev/specs/specs.json

# If in specs.json but not file system:
# 1. Restore from backup or recreate
# 2. Update specs.json to reflect actual state
```

### Log File Missing

**Problem:** Execution log doesn't exist

**Solution:**
```bash
# Check if logs directory exists
ls te9.dev/logs/

# If missing, create it and initialize log
mkdir -p te9.dev/logs
echo "=== Execution Log: SPEC-<id> ===" > te9.dev/logs/SPEC-<id>.log
echo "Started: $(date -u +%Y-%m-%d\ %H:%M:%S)" >> te9.dev/logs/SPEC-<id>.log
```

### Status Inconsistency

**Problem:** Status in spec.md doesn't match status in specs.json

**Solution:**
```bash
# Check both sources
cat te9.dev/specs/SPEC-<id>/spec.md | grep "## Status"
jq '.specs[] | select(.id == "SPEC-<id>") | .status' te9.dev/specs/specs.json

# Update to match actual state
# Edit spec.md or specs.json as needed

# Log the correction
echo "[timestamp] RECOVERY: Status corrected from [old] to [new]" >> te9.dev/logs/SPEC-<id>.log
```

### Corrupted specs.json

**Problem:** specs.json is not valid JSON

**Solution:**
```bash
# Validate JSON
jq empty te9.dev/specs/specs.json

# If error, check syntax
python -m json.tool te9.dev/specs/specs.json

# If corrupted, restore from backup or recreate:
# 1. Restore from versioning/ if available
# 2. Rebuild from individual spec files
```

## Best Practices

### Regular Status Checks

**Check spec status at the start of each workflow step:**
```bash
@spec-track SPEC-<id>
```

**Review execution log before resuming workflow:**
```bash
cat te9.dev/logs/SPEC-<id>.log
```

### Consistent Logging

**Log every significant action with timestamp:**
```bash
echo "[$(date -u +%Y-%m-%d\ %H:%M:%S)] Action description" >> te9.dev/logs/SPEC-<id>.log
```

**Log status changes with explanation:**
```bash
echo "[timestamp] Status changed: OLD -> NEW" >> te9.dev/logs/SPEC-<id>.log
echo "[timestamp] Reason: [explanation]" >> te9.dev/logs/SPEC-<id>.log
```

### Accurate Status Updates

**Update status in both spec.md and specs.json:**
```markdown
# spec.md
## Status
NEW_STATUS
```

```bash
# specs.json
jq '.specs |= map(if .id == "SPEC-<id>" then .status = "NEW_STATUS" else . end)' te9.dev/specs/specs.json > specs.json.tmp
mv specs.json.tmp te9.dev/specs/specs.json
```

### Detailed Evidence

**Include test output as evidence for acceptance criteria:**
```
[timestamp] Acceptance Criteria 1: [title] - PASSED
[timestamp] Evidence:
PASS src/api/register.spec.ts
  ✓ registers new user with hashed password (15ms)
  ✓ rejects duplicate email registration (8ms)
  ✓ validates email format (5ms)
```

## Summary

Spec-track provides comprehensive visibility into the te9.dev workflow by:
- Checking spec status and progress
- Viewing detailed execution logs
- Tracking acceptance criteria completion
- Generating summary reports
- Resuming interrupted workflows
- Identifying next steps

Always use spec-track when:
- Starting or resuming work on a spec
- Before and after each workflow step
- When debugging issues
- When preparing for review or deployment
- When generating reports for stakeholders