---
name: prd-execute
description: Execute work on a specific PRD by implementing code, testing criteria, and ensuring completion
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-execution
  depends-on: [prd-create]
---

# PRD Execution Skill

## What I Do

I implement the work described in a specific PRD by:
- Loading PRD data and requirements
- Understanding the existing codebase
- Implementing the required functionality
- Testing all acceptance criteria
- **CRITICAL: Ensuring unit tests pass successfully before completion**
- Ensuring code quality and completeness
- Leaving the codebase in a clean, working state

## When to Use Me

Use when you have a PRD ID and need to implement the work:
- After `prd-create` skill has generated PRD files
- When PRD status is "TODO" or "IN_PROGRESS"
- After dependencies have been completed (for multi-PRD plans)

## Prerequisites

Before calling this skill, ensure:
1. PRD files exist in `/dev/prd/runs/<prd-id>/`
2. Dependencies (if any) are completed and pass tests
3. The codebase is in a clean state (no uncommitted changes or errors)

## Input Parameters

**Required:**
- `prdId`: The PRD ID to execute (e.g., "PRD-20250115-143022")

**Optional:**
- `continueMode`: If true, resume from a previous execution attempt
- `focusArea`: Specific acceptance criteria to focus on (for partial execution)

## Step-by-Step Process

### Step 1: Load PRD Data

Read and parse `/dev/prd/runs/<prd-id>/<prd-id>.json`:
- Extract PRD ID, title, type, priority
- Get description and acceptance criteria
- Load dependencies and constraints
- Note technologies involved

### Step 2: Load Execution Prompt

Read `/dev/prd/runs/<prd-id>/<prd-id>-prompt.md`:
- Understand the specific instructions for this PRD
- Review acceptance criteria details
- Note any special considerations
- Understand testing requirements

### Step 3: Verify Dependencies (If Any)

Check if this PRD has dependencies:
- If dependencies exist, verify their status in `/dev/prd/prd.json`
- Ensure all dependencies have status "DONE"
- If dependencies are not complete, stop and report the issue
- Only proceed if all dependencies are satisfied

### Step 4: Understand the Codebase

Before implementing:
- Explore project structure
- Identify relevant files and directories
- Understand existing patterns and conventions
- Find similar features or implementations for reference
- Check for any configuration files that need updates

### Step 5: Implement the Work

Follow acceptance criteria as your guide:

#### Implementation Guidelines
- **Start with the foundation**: If creating new features, begin with data structures/models
- **Work incrementally**: Implement one acceptance criterion at a time
- **Test as you go**: Verify each piece before moving to the next
- **Follow existing patterns**: Match the code style and architecture
- **Handle errors gracefully**: Add appropriate error handling and validation
- **Update documentation**: Modify comments, README, or docs as needed

#### Scope Control
- **ONLY implement this PRD** - do not add extra features
- **Stay focused** on the acceptance criteria
- **Avoid refactoring** unrelated code
- **Don't optimize** unless specified in criteria

### Step 6: Testing Phase

After implementation, thoroughly test each acceptance criterion:

#### Testing Workflow
For each acceptance criterion:
1. **Verify implementation**: Confirm the criterion is addressed in code
2. **Run specific tests**: Create or run tests for this criterion
3. **Test edge cases**: Try boundary conditions, invalid inputs, error scenarios
4. **Test integration**: Ensure it works with existing functionality
5. **Document results**: Record what was tested and the outcome

#### Test Results Documentation
Track testing in a structured format:

```markdown
## Testing Results

### Criterion 1: [text of criterion]
**Status:** PASS/FAIL
**Test Method:** [how it was tested]
**Test Cases:**
- [test case 1]: [result]
- [test case 2]: [result]
**Notes:** [any observations]
```

### Step 7: Run Full Test Suite (MANDATORY)

After individual criterion testing:
1. Run `npm test` to execute full test suite
2. Check for any regressions in existing tests
3. Verify no new errors or warnings
4. Ensure code compiles/builds successfully
5. **CRITICAL: If ANY unit test fails, you MUST NOT mark the PRD as complete**
6. **CRITICAL: Fix all failing tests before proceeding to Step 9**
7. **CRITICAL: Re-run tests until ALL pass - no exceptions**

### Step 8: Code Quality Check

Before marking complete, verify:
- [ ] Code follows project style guidelines
- [ ] Appropriate error handling is in place
- [ ] Code is commented where complex logic exists
- [ ] No hardcoded values or magic numbers
- [ ] Security best practices are followed
- [ ] Performance is reasonable (unless optimization is a criterion)
- [ ] No console.log statements or debug code remains
- [ ] Files are properly formatted and linted

### Step 9: Update PRD Status (ONLY IF TESTS PASS)

**CRITICAL REQUIREMENT: You may ONLY update PRD status to "DONE" if:**
- All unit tests pass successfully
- Full test suite passes (npm test)
- No regressions detected
- Code builds/compiles without errors

**If tests fail:**
- DO NOT update status to "DONE"
- Keep status as "IN_PROGRESS" or mark as "FAILED" after 3 retry attempts
- Report which tests are failing
- Explain what needs to be fixed

When ALL tests pass, update `/dev/prd/prd.json` for this PRD:
- Change `status` from "TODO" or "IN_PROGRESS" to "DONE"
- Set `passes` to `true`
- Add completion timestamp

### Step 10: Update Log File

Append to `/dev/prd/logs/<prd-id>.md`:

```markdown
### Execution Completed
- **Timestamp:** <ISO timestamp>
- **Event:** PRD implementation completed successfully
- **Action:** All acceptance criteria implemented and tested
- **Test Results:** All criteria passed
- **Git Commit:** <commit_hash> - "feat: <title> [PRD-<id>]"
- **Status:** DONE
- **Note:** Awaiting user approval to push changes

## Achievements
- Implemented all [N] acceptance criteria
- Created [X] new files
- Modified [Y] existing files
- All tests passing (npm test)
- Code quality verified

## Status Changes
- Status: IN_PROGRESS: <timestamp> - Started execution
- DONE: <timestamp> - Completed successfully
- Git Commit: <commit_hash> - Committed with message "feat: <title> [PRD-<id>]"
```

### Step 11: Final Verification Before Clean Up

Before cleaning up, verify ONE MORE TIME:
- **[ ] All unit tests pass (npm test completed successfully)**
- **[ ] No test failures or errors**
- **[ ] No regressions in existing tests**
- **[ ] Code builds/compiles without errors**

If any test is still failing, GO BACK and fix it. DO NOT proceed to cleanup until all tests pass.

### Step 11: Git Commit with PRD Reference (MANDATORY)

After all tests pass and before cleanup, you MUST create a git commit for this PRD:

1. **Review Changes**: Check all modified/created files
2. **Stage Changes**: `git add` all relevant files for this PRD
3. **Create Commit Message** using this format:

```bash
git commit -m "feat: <PRD title> [PRD-<id>]

- Implemented all acceptance criteria
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

PRD: PRD-<id>
Type: <type>
Priority: <priority>"
```

4. **Commit Format Examples**:

**New Feature:**
```bash
git commit -m "feat: Implement user authentication system [PRD-20250115-143022]

- Implemented user registration, login, logout
- Added JWT token authentication
- All unit tests passing (15/15 tests)
- No regressions detected

PRD: PRD-20250115-143022
Type: Feature
Priority: 1"
```

**Bug Fix:**
```bash
git commit -m "fix: Resolve login form validation error [PRD-20250115-153045]

- Fixed email validation regex
- Added proper error messages
- All unit tests passing (8/8 tests)
- No regressions detected

PRD: PRD-20250115-153045
Type: Bugfix
Priority: 1"
```

**Refactor:**
```bash
git commit -m "refactor: Optimize database queries for performance [PRD-20250115-160030]

- Refactored query structure
- Added proper indexing
- All unit tests passing (12/12 tests)
- No regressions detected
- Performance improved by 40%

PRD: PRD-20250115-160030
Type: Refactor
Priority: 2"
```

5. **CRITICAL Requirements**:
   - Each PRD MUST have its own separate commit
   - Commit message MUST include PRD ID in brackets `[PRD-<id>]`
   - Commit message MUST include PRD title
   - Include test results in commit message
   - Follow conventional commit format (feat/fix/refactor/etc.)
   - Keep changes focused only on this PRD's work

6. **Verification**:
   - Confirm commit was created successfully
   - Verify commit hash is generated
   - Check that commit message follows format
   - Ensure all PRD-related files are included

**Do NOT push yet** - pushing happens after user approval in prd-track skill

### Step 12: Clean Up

Before finishing:
- Remove any temporary or debug files
- Ensure no uncommitted changes are left (except the PRD commit)
- Verify git status shows only the new PRD commit
- Close any open test servers or processes

## Return Data

Return execution summary:

```json
{
  "success": true,
  "prdId": "<prd-id>",
  "status": "DONE",
  "executionSummary": {
    "acceptanceCriteriaTotal": <N>,
    "acceptanceCriteriaPassed": <N>,
    "filesCreated": <count>,
    "filesModified": <count>,
    "filesDeleted": <count>,
    "testResults": "All tests passed"
  },
  "testingReport": {
    "criteria": [
      {
        "criterion": "criterion text",
        "status": "PASS",
        "testMethod": "how tested"
      }
    ],
    "fullTestSuite": "PASS",
    "regressions": "None"
  },
  "nextSteps": [
    "PRD marked as DONE",
    "Changes committed with PRD reference",
    "Awaiting user approval for push",
    "Use prd-track to log completion and push"
  ]
}
```

## Error Handling

### If Tests Fail (CRITICAL - DO NOT PROCEED)
- **STOP IMMEDIATELY** - Do not continue with next steps
- Analyze which tests are failing
- Fix the implementation to make tests pass
- Re-run tests until ALL pass (not just some)
- **CRITICAL: You CANNOT mark PRD as DONE while any test fails**
- Document what was fixed
- If tests cannot be made to pass after 3 attempts:
  - Mark PRD status as "FAILED"
  - Document blocking issues
  - Report to user
  - Do NOT proceed to cleanup

### If Dependencies Not Satisfied
- Stop execution immediately
- Report which dependencies are incomplete
- Suggest completing those PRDs first
- Do not proceed with implementation

### If Git Commit Fails
- Check if git is initialized (`git init` if needed)
- Verify git is installed and accessible
- Check for merge conflicts that need resolution
- Verify you have write permissions
- Resolve any git errors before proceeding
- **CRITICAL: Cannot complete PRD without creating commit**

### If Unit Tests Cannot Run
- Check if test framework is installed (npm install if needed)
- Verify test files exist and are not corrupted
- Ensure dependencies are installed
- **CRITICAL: Cannot complete PRD without running tests**
- Report specific error to user

### If Scope Creep Detected
- If you find yourself implementing features not in criteria:
  - Stop and reassess
  - Confirm if the feature is actually needed
  - If not needed, remove the extra code
  - Stay focused on the PRD criteria

### If Code Won't Build
- Check for syntax errors
- Verify all imports are correct
- Ensure dependencies are installed
- Fix compilation errors before proceeding
- **CRITICAL: Cannot complete PRD if code doesn't build**

### If Code Won't Build
- Check for syntax errors
- Verify all imports are correct
- Ensure dependencies are installed
- Fix compilation errors before proceeding

## Best Practices

### Implementation
- **Keep it simple**: Implement the simplest solution that meets criteria
- **DRY principle**: Don't repeat code, use functions/components
- **Follow conventions**: Match existing patterns in the codebase
- **Test early, test often**: Don't wait until the end to test
- **CRITICAL: Never skip unit tests** - All tests must pass before completion

### Communication
- **Document decisions**: Explain why you made certain technical choices
- **Highlight issues**: Note any problems encountered and how you resolved them
- **Suggest improvements**: If you see opportunities for future improvement, mention them

### Quality
- **Write clean code**: Your code should be readable and maintainable
- **Add comments**: Explain complex logic, but don't over-comment
- **Handle errors**: Never assume inputs are valid
- **Test thoroughly**: Test both happy paths and error cases

## Common Scenarios

### New Feature
1. Create data models if needed
2. Implement backend logic (API endpoints, business logic)
3. Implement frontend components (UI, forms, interactions)
4. Wire up frontend to backend
5. Test the complete feature
6. Update documentation

### Bugfix
1. Identify the root cause
2. Create a test that reproduces the bug
3. Fix the bug
4. Verify the test now passes
5. Ensure no regressions
6. Document the fix

### Refactor
1. Understand current implementation
2. Identify code to improve
3. Refactor while maintaining behavior
4. Run tests to ensure no functional changes
5. Document improvements made

## Important Reminders

- **ONE PRD AT A TIME** - Only work on the specified PRD
- **TEST EVERYTHING** - Don't assume code works without testing
- **CRITICAL: UNIT TESTS MUST PASS** - NO PRD can complete without passing unit tests
- **COMMIT WITH PRD REFERENCE** - Each PRD gets its own commit with PRD ID in message
- **LEAVE CLEAN STATE** - Code must build and ALL tests must pass
- **DOCUMENT PROGRESS** - Keep track of what you've done
- **ASK FOR CLARIFICATION** - If acceptance criteria are unclear, ask

---

Ready to execute a PRD? Provide the PRD ID and I'll implement the work!