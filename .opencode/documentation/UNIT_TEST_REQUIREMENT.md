# Mandatory Unit Test Requirement

## Overview

**CRITICAL: All development tasks MUST pass unit tests successfully before they can be marked as complete.**

This is a non-negotiable requirement in the te9.dev development process. No PRD or task can be marked as "DONE" unless ALL unit tests pass with 100% success rate.

## The Requirement

### What It Means

- **Zero Tolerance**: No task can complete if ANY unit test fails
- **100% Pass Rate Required**: Every unit test must pass before marking work as done
- **Full Test Suite**: Must run `npm test` and ensure all tests pass
- **No Regressions**: New work cannot break existing tests
- **Block Completion**: Failing tests block the entire development workflow

## When This Applies

This requirement applies to ALL development work:

- ✅ New Features
- ✅ Bug Fixes
- ✅ Refactoring
- ✅ Code Updates
- ✅ Configuration Changes
- ✅ Any code modifications that affect testable behavior

**Note:** This test requirement is closely integrated with the Git Commit and Push Workflow. All tests must pass before a git commit is created for a PRD. For details on the git workflow, see `[GIT_COMMIT_AND_PUSH_WORKFLOW.md](./GIT_COMMIT_AND_PUSH_WORKFLOW.md)`.

## Workflow Integration

### PRD-Driven Development Process

The unit test requirement is enforced at multiple stages:

```
1. Interview → Determine requirements
2. Plan (if needed) → Break into PRDs
3. Create → Generate PRD files with test requirements
4. Execute → Implement work + run unit tests
   └─ CRITICAL: Cannot proceed to step 5 until ALL tests pass
5. Test → Verify criteria + verify ALL unit tests pass
   └─ CRITICAL: Cannot mark DONE unless 100% test pass rate
6. Track → Log completion (only if tests pass)
```

### Key Enforcement Points

#### During Execution (`prd-execute`)

1. **Implementation Phase**: Write code following acceptance criteria
2. **Testing Phase**: Test each acceptance criterion
3. **Unit Test Phase** (CRITICAL):
   - Run `npm test` to execute full test suite
   - Analyze results
   - **If ANY test fails**: STOP immediately, fix issues, re-run tests
   - **Continue until ALL tests pass** - no exceptions
   - Only then proceed to code quality check

4. **Final Verification** (CRITICAL):
   - Before cleanup, verify ONE MORE TIME that all tests pass
   - If any test fails: GO BACK and fix it
   - DO NOT proceed to cleanup until all tests pass

#### During Testing (`prd-test`)

1. **Acceptance Criteria Testing**: Verify each criterion passes
2. **Unit Test Suite** (CRITICAL):
   - Run `npm test` - full test suite must execute
   - **100% pass rate required** - every test must pass
   - **If ANY test fails**: STOP immediately
   - DO NOT mark PRD as DONE under any circumstances
   - Document all failing tests
   - Fix and re-run until all pass

3. **Regression Check**:
   - Verify no existing tests are broken
   - Identify any regressions
   - All regressions must be fixed before completion

4. **Completion Decision** (CRITICAL):
   - **ONLY mark PRD as DONE if**: ALL tests pass + all criteria pass
   - **If tests fail**: Keep status as "IN_PROGRESS" or mark "FAILED"
   - **After 3 failed attempts**: Mark as "FAILED" and report to user

## What Happens When Tests Fail

### Immediate Action Required

1. **STOP WORKFLOW** - Do not proceed to next steps
2. **Identify Failing Tests** - Document which tests fail and why
3. **Analyze Root Cause** - Determine why tests are failing
4. **Fix Implementation** - Adjust code to make tests pass
5. **Re-run Tests** - Verify all tests now pass
6. **Only Then Proceed** - Continue with completion process

### Retry Policy

- **Attempt 1**: Fix and re-run tests
- **Attempt 2**: If still failing, review approach, fix again, re-run
- **Attempt 3**: Final attempt to fix and re-run
- **After 3 failures**: Mark PRD as "FAILED", document blocking issues, report to user

### Status Updates

**When Tests Fail During Execution:**
- Keep PRD status as "IN_PROGRESS"
- Log test failures in progress tracking
- Continue fixing until tests pass

**When Tests Fail During Testing:**
- Keep PRD status as "IN_PROGRESS" or mark as "FAILED"
- Document specific test failures in test report
- Report blocking issues to user
- Do not mark as DONE

## Code Quality Standards

In Addition to Passing Tests

Before completion, verify:

- [ ] **ALL unit tests pass** (100% pass rate)
- [ ] Code builds/compiles without errors
- [ ] No regressions in existing tests
- [ ] No linting warnings
- [ ] Appropriate error handling in place
- [ ] Code follows project style guidelines
- [ ] No debug code or console.log statements
- [ ] Files properly formatted

## Best Practices for Ensuring Tests Pass

### During Development

1. **Write Tests First**: Consider test-driven development approach
2. **Test Incrementally**: Run tests frequently while implementing
3. **Test Each Criterion**: Verify acceptance criteria with tests
4. **Edge Cases**: Include edge case testing in your test suite
5. **Error Handling**: Test error conditions and invalid inputs

### Before Completion

1. **Run Full Suite**: Always run `npm test` before marking done
2. **Check All Results**: Review every test result, not just summary
3. **Verify No Skips**: Ensure no tests are being skipped
4. **Test Locally**: Verify tests pass in your environment
5. **Clean State**: Ensure no environment-specific issues

### Common Issues

**Tests Timing Out:**
- Check for infinite loops
- Adjust test timeouts if needed
- Ensure async operations complete properly

**Tests Failing Intermittently:**
- Check for race conditions
- Ensure proper cleanup between tests
- Avoid external dependencies in tests

**Tests Passing Locally but Failing in CI:**
- Check environment differences
- Verify all dependencies are installed
- Check for platform-specific behavior

## Error Handling

### If Tests Cannot Run

**Symptoms:**
- `npm test` command fails to execute
- Test framework not installed
- Missing dependencies

**Actions:**
1. Check if test framework is installed
2. Run `npm install` if needed
3. Verify test files exist
4. **CRITICAL: Cannot complete PRD without running tests**
5. Report specific error to user
6. Do not mark PRD as DONE

### If Implementation Is Missing

**Symptoms:**
- Required files don't exist
- Code is placeholder/incomplete
- Tests cannot run because code missing

**Actions:**
1. Stop testing immediately
2. Report what's missing
3. Suggest re-running `prd-execute` skill
4. Do not continue with testing

### If Regressions Detected

**Symptoms:**
- Previously passing tests now fail
- Existing functionality broken

**Actions:**
1. **STOP IMMEDIATELY** - Do not mark PRD as DONE
2. List all regressions found with details
3. **CRITICAL: Regressions are NOT acceptable**
4. Do not mark PRD as DONE unless user explicitly accepts
5. Update PRD status to "FAILED" if regressions cannot be fixed

## Monitoring and Reporting

### Progress Tracking

When tests fail, log:

```markdown
### Unit Test Failures Detected
- **Timestamp:** <ISO timestamp>
- **Event:** Unit tests failing - blocking completion
- **Failed Tests:**
  - [Test Name]: [Error message]
  - [Test Name]: [Error message]
- **Total Failed:** [count]
- **Pass Rate:** [X]%
- **Status:** BLOCKED - Tests must pass before completion
```

### Test Report Structure

Include in test results:

```markdown
## Unit Test Results
- **Command:** `npm test`
- **Total Tests:** [count]
- **Passed:** [count]
- **Failed:** [count]
- **Skipped:** [count]
- **Duration:** [time]
- **Pass Rate:** [percentage]%

### Failed Tests
[Detailed list of failing tests with error messages]

### Blocking Issues
- Cannot mark PRD as DONE until all tests pass
- Must fix [X] failing unit tests
- Must resolve any regressions
```

## Examples

### ✅ Correct Workflow

```
1. Implement acceptance criteria
2. Test each criterion manually ✓
3. Run unit tests: npm test
   Result: 15/15 tests passed (100%)
4. Verify no regressions ✓
5. Check code quality ✓
6. Mark PRD as DONE ✓
```

### ❌ Incorrect Workflow

```
1. Implement acceptance criteria
2. Test each criterion manually ✓
3. Run unit tests: npm test
   Result: 14/15 tests passed (93%)
   Error: User login test failing
4. ❌ INCORRECT: Mark PRD as DONE anyway
   ❌ INCORRECT: Skip the failing test
   ❌ INCORRECT: Document as "known issue"

CORRECT ACTION:
   ✓ Fix the failing test
   ✓ Re-run npm test
   ✓ Verify all 15/15 tests pass
   ✓ Then mark PRD as DONE
```

## FAQ

### Q: Can I mark a PRD as DONE if tests pass but there are warnings?

**A:** No. Warnings often indicate potential issues. You should investigate and resolve warnings before marking work as complete. Only if you've verified warnings are non-critical and unrelated to your changes should you proceed - but this is discouraged.

### Q: What if the test was already failing before I started?

**A:** This is a critical situation. You should:
1. Document the pre-existing test failure
2. Fix the failing test as part of your PRD (or create a separate PRD to fix it)
3. Do NOT mark your PRD as DONE until that test passes
4. Consider this a regression that must be resolved

### Q: Can I skip running tests if I didn't change any test files?

**A:** Absolutely NOT. You must run the full test suite every time, even if you didn't modify test files directly. Your changes could affect code that's tested elsewhere. Running `npm test` is mandatory.

### Q: What if tests take a very long time to run?

**A:** Long-running tests are a problem, but they still must pass. If tests are taking too long:
1. Run them anyway and wait for completion
2. Consider this a performance issue that should be addressed
3. You could create a separate PRD to optimize test performance
4. But you still cannot skip running them

### Q: Can I mark a PRD as DONE with the plan to fix tests later?

**A:** NO. This is explicitly forbidden. The "fix later" approach leads to technical debt and broken code. Tests must pass BEFORE marking work as complete, not after.

### Q: What if the test failure is unrelated to my changes?

**A:** Investigate thoroughly first. If you're certain it's unrelated:
1. Document why you believe it's unrelated
2. Mark the PRD as "FAILED" (not "DONE")
3. Report the issue to the user
4. Suggest creating a separate PRD to fix the test
5. Do NOT proceed with marking as DONE

## Summary

**The Golden Rule:**

> **ALL unit tests must pass with 100% success rate before any development work can be marked as complete.**

**Key Points:**
- ✅ Zero tolerance for test failures
- ✅ 100% pass rate required
- ✅ Run `npm test` every time
- ✅ Fix all failures before marking DONE
- ✅ No exceptions, no shortcuts

**When Tests Fail:**
- 🛑 STOP immediately
- 🔍 Identify failing tests
- 🔧 Fix the implementation
- 🔄 Re-run until all pass
- ❌ Never mark DONE with failing tests

---

**Remember:** Quality is not negotiable. Passing tests are the minimum requirement for claiming any development work is complete.

## Related Workflows

### Git Commit and Push Workflow

The unit test requirement is tightly integrated with the Git Commit and Push Workflow:

1. **Tests Pass → Commit Created**: A git commit is only created AFTER all unit tests pass with 100% success rate
2. **Commit Message Includes Test Results**: The git commit message explicitly documents that all tests passed
3. **Push Requires Approval**: Even after tests pass and commit is created, user must approve before pushing to remote
4. **Complete Traceability**: Each commit is linked to a PRD ID, and the commit message confirms test success

**Key Points:**
- No git commit is created if tests fail
- Commit message format: `feat: <title> [PRD-<id>]` with test results included
- User approval for push happens after commit is created
- This ensures only tested, verified code is committed and pushed

**For Complete Git Workflow Documentation:**
See `[GIT_COMMIT_AND_PUSH_WORKFLOW.md](./GIT_COMMIT_AND_PUSH_WORKFLOW.md)`