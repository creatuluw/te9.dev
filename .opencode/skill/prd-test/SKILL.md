---
name: prd-test
description: Verify acceptance criteria by running tests, checking functionality, and ensuring all criteria pass
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-execution
  depends-on: [prd-execute]
---

# PRD Testing Skill

## What I Do

I verify that a PRD's work is complete by:
- Testing each acceptance criterion individually
- Running the full test suite (`npm test`)
- Checking for regressions
- Documenting test results
- Verifying code quality
- Ensuring the PRD meets all requirements

## When to Use Me

Use after `prd-execute` skill has completed implementation:
- Before marking a PRD as DONE
- To verify that implementation meets all criteria
- After making changes to ensure nothing broke
- When user requests verification of PRD completion

## Prerequisites

Before calling this skill, ensure:
1. PRD has been implemented (status is "IN_PROGRESS" or "DONE")
2. Implementation code is complete
3. All necessary files have been created/modified
4. Dependencies are installed

## Input Parameters

**Required:**
- `prdId`: The PRD ID to test (e.g., "PRD-20250115-143022")

**Optional:**
- `criteriaToTest`: Array of specific criteria to test (if not all)
- `runFullSuite`: Boolean to control whether to run full test suite (default: true)
- `skipRegressions`: Boolean to skip regression checks (default: false)

## Step-by-Step Process

### Step 1: Load PRD Data

Read `/dev/prd/runs/<prd-id>/<prd-id>.json`:
- Extract PRD ID, title, type
- Get all acceptance criteria
- Load description and requirements
- Note technologies involved

### Step 2: Load Execution Prompt

Read `/dev/prd/runs/<prd-id>/<prd-id>-prompt.md`:
- Review what was supposed to be implemented
- Understand expected behavior
- Note any special testing requirements

### Step 3: Verify Implementation Exists

Before testing:
- Check that all code from implementation exists
- Verify files are not empty or placeholder
- Ensure no syntax errors in code
- Confirm imports/dependencies are correct

If implementation is incomplete:
- Stop testing
- Report what's missing
- Suggest re-running `prd-execute` skill

### Step 4: Test Each Acceptance Criterion

For each acceptance criterion in the PRD:

#### Criterion Testing Process

1. **Analyze the criterion**: Understand what needs to be verified
2. **Identify test approach**: Determine how to test this criterion
3. **Create or find tests**: 
   - If test exists: Run it
   - If no test exists: Create appropriate test (unit, integration, or E2E)
4. **Run the test**: Execute and capture results
5. **Test edge cases**: Try boundary conditions, invalid inputs
6. **Verify functionality**: Manual check if needed (for UI features)
7. **Document results**: Record pass/fail and how it was tested

#### Testing Methods

**For Code/Logic:**
- Write unit tests
- Use test frameworks (Vitest for this project)
- Test with various inputs
- Check error handling

**For API Endpoints:**
- Send requests with valid data
- Test invalid data and error handling
- Verify response codes and formats
- Test authentication/authorization if applicable

**For UI Components:**
- Use Playwright for E2E tests
- Test user interactions
- Verify visual appearance
- Check responsive design
- Test accessibility

**For Database Changes:**
- Verify schema changes
- Test data migrations
- Check data integrity
- Verify queries work correctly

#### Test Documentation Format

For each criterion, document:

```markdown
### Criterion [N]: [criterion text]

**Status:** PASS/FAIL/SKIPPED

**Test Method:** 
- [description of how it was tested]
- [tools/frameworks used]

**Test Cases:**
- Case 1: [description] → [PASS/FAIL]
- Case 2: [description] → [PASS/FAIL]
- Case 3: [description] → [PASS/FAIL]

**Edge Cases Tested:**
- [edge case 1]: [result]
- [edge case 2]: [result]

**Manual Verification:** [if applicable]
- [what was manually checked and result]

**Issues Found:** [any problems discovered]
```

### Step 5: Run Full Test Suite

After testing individual criteria:

1. **Execute**: Run `npm test` command
2. **Wait for completion**: Let all tests run
3. **Analyze results**: Check for failures or errors
4. **Identify regressions**: See if any previously passing tests now fail

#### Handle Test Results

**If all tests pass:**
- Note this in the test report
- Proceed to next step

**If tests fail:**
- Identify which tests failed
- Determine if they're related to this PRD
  - If yes: Fix the issues in implementation
  - If no: Report as regression
- Re-run tests until all pass

**Regressions Check:**
- Compare with baseline test results (if available)
- Identify tests that previously passed but now fail
- Document all regressions found
- Do NOT proceed if regressions exist (unless explicitly allowed)

### Step 6: Verify Code Quality

After tests pass, verify quality standards:

#### Build/Compile Check
- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] No console errors in browser

#### Code Review Checklist
- [ ] Code follows project style guidelines
- [ ] Appropriate error handling in place
- [ ] No hardcoded values or magic numbers
- [ ] Proper error messages and validation
- [ ] Security best practices followed
- [ ] Performance is acceptable
- [ ] No debug code or console.log statements
- [ ] Files properly formatted

#### Documentation Check
- [ ] Complex code has comments
- [ ] README updated if needed
- [ ] API documentation updated (if applicable)
- [ ] New features are documented
- [ ] Breaking changes are noted

### Step 7: Compile Test Report

Create comprehensive test report:

```markdown
# Test Report: <prd-id>

## Test Summary
- **PRD ID:** <prd-id>
- **PRD Title:** <title>
- **Test Date:** <ISO timestamp>
- **Tested By:** AI Agent

## Acceptance Criteria Results

### Total Criteria: [N]
- **Passed:** [X]
- **Failed:** [Y]
- **Skipped:** [Z]

### Detailed Results

[Criterion test sections from Step 4]

## Full Test Suite Results
- **Command:** `npm test`
- **Total Tests:** [count]
- **Passed:** [count]
- **Failed:** [count]
- **Skipped:** [count]
- **Duration:** [time]

## Regressions Found
[If any regressions, list them]
- [test name]: [description of failure]

## Code Quality Verification
- **Build Status:** PASS/FAIL
- **Linting:** PASS/FAIL
- **TypeScript:** PASS/FAIL
- **Code Style:** PASS/FAIL
- **Documentation:** PASS/FAIL

## Overall Result
**STATUS:** PASS/FAIL

## Issues Requiring Attention
[list any issues that need to be fixed]

## Recommendations
[list any suggestions for improvement]
```

### Step 8: Update PRD Status

Based on test results:

#### If All Criteria Pass
Update `/dev/prd/prd.json`:
- Set `status` to "DONE"
- Set `passes` to `true`
- Add completion timestamp

Update `/dev/prd/logs/<prd-id>.md`:
```markdown
### Testing Completed
- **Timestamp:** <ISO timestamp>
- **Event:** PRD testing completed successfully
- **Result:** All acceptance criteria passed
- **Test Results:** Full test suite passed, no regressions

## Achievements
- All [N] acceptance criteria verified and passed
- Full test suite passed
- No regressions detected
- Code quality verified
```

#### If Any Criteria Fail
Update `/dev/prd/prd.json`:
- Set `status` to "FAILED" or keep "IN_PROGRESS"
- Set `passes` to `false`
- Add failure timestamp

Update `/dev/prd/logs/<prd-id>.md`:
```markdown
### Testing Failed
- **Timestamp:** <ISO timestamp>
- **Event:** PRD testing revealed issues
- **Result:** [X] criteria failed, see details below

## Issues
- [Criterion 1]: [issue description]
- [Criterion 2]: [issue description]

## Next Steps
- Fix failed criteria
- Re-run tests
- Verify all pass
```

## Return Data

Return test results:

```json
{
  "success": true,
  "prdId": "<prd-id>",
  "testResults": {
    "totalCriteria": <N>,
    "criteriaPassed": <X>,
    "criteriaFailed": <Y>,
    "criteriaSkipped": <Z>,
    "fullTestSuite": {
      "total": <count>,
      "passed": <count>,
      "failed": <count>,
      "skipped": <count>
    }
  },
  "regressions": [],
  "codeQuality": {
    "build": "PASS",
    "linting": "PASS",
    "typescript": "PASS",
    "documentation": "PASS"
  },
  "overallStatus": "PASS",
  "prdStatusUpdated": true,
  "newStatus": "DONE",
  "nextSteps": [
    "PRD marked as DONE",
    "Ready for production deployment",
    "Consider creating next PRD in plan"
  ]
}
```

## Error Handling

### If Tests Cannot Run
- Check if test framework is installed
- Verify test files exist
- Ensure dependencies are installed
- Report specific error to user

### If Implementation Missing
- Stop testing immediately
- Report what's missing from implementation
- Suggest re-running `prd-execute` skill
- Do not continue with testing

### If Regressions Detected
- List all regressions found
- Determine if regressions are acceptable
- If not acceptable, do not mark PRD as DONE
- Suggest fixing regressions before proceeding

### If Code Won't Build
- Report build errors
- Identify syntax or compilation issues
- Suggest fixing implementation issues
- Do not mark PRD as DONE until build succeeds

## Best Practices

### Testing
- **Be thorough**: Test every criterion, don't skip
- **Test edge cases**: Try boundary conditions, invalid inputs
- **Test integration**: Ensure code works with existing system
- **Use proper test types**: Unit tests for logic, E2E for user flows
- **Document everything**: Keep clear records of what was tested and how

### Quality
- **Don't pass failing tests**: Only mark PRD as DONE if all tests pass
- **Check regressions**: Ensure new code doesn't break existing functionality
- **Verify quality**: Code should follow project standards
- **Report issues**: Be clear about what needs to be fixed

### Communication
- **Be specific**: Detail exactly what was tested and the results
- **Provide context**: Explain why something passed or failed
- **Suggest fixes**: If tests fail, suggest what needs to be fixed
- **Document edge cases**: Note any special scenarios tested

## Common Testing Scenarios

### New Feature Testing
1. Unit tests for business logic
2. Integration tests for API endpoints
3. E2E tests for user flows
4. Test with valid and invalid data
5. Verify error handling
6. Check performance (if applicable)

### Bugfix Testing
1. Create test that reproduces the bug (should fail before fix)
2. Apply fix
3. Verify test now passes
4. Test related functionality
5. Ensure no regressions

### Refactor Testing
1. Run all existing tests
2. Verify behavior is unchanged
3. Check performance improvements (if applicable)
4. Test with edge cases
5. Ensure code quality improved

## Important Reminders

- **TEST EVERYTHING** - Don't assume implementation is correct
- **DOCUMENT RESULTS** - Keep clear records of testing
- **NO REGRESSIONS** - Don't break existing functionality
- **BE THOROUGH** - Test edge cases and error conditions
- **BE HONEST** - Report all failures, don't hide issues
- **FIX ISSUES** - Ensure all tests pass before marking DONE

---

Ready to test a PRD? Provide the PRD ID and I'll verify all acceptance criteria!