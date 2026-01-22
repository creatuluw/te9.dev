# spec-execute - Implement Spec and Log Work

## Purpose
Execute a spec by implementing requirements, logging all work, and preparing for commit.

## When to Use
Use when a spec has been created and is ready for implementation.

## What It Does
1. Loads spec from te9.dev/specs/
2. Implements requirements systematically
3. Works through acceptance criteria
4. Logs all changes and actions
5. Tests implementation
6. Prepares for commit
7. Updates spec status
8. MANDATORY: Updates specs.json immediately after any change to spec.md status or content

## Steps

### 1. Load Spec
```
Read: te9.dev/specs/<spec-id>/spec.md
Verify: Spec status is PENDING
Extract: All requirements and acceptance criteria
Load: Context from context.json
```

### 2. Update Spec Status
```
Update spec.md:
  Status: PENDING → IN_PROGRESS
  Updated: <current timestamp>

Update specs.json:
  status: "IN_PROGRESS"
  updated: <current timestamp>

Store in OpenMemory:
  "Started executing spec <spec-id>"
```

### 3. Plan Implementation
```
For each requirement:
  - Determine implementation approach
  - Identify files to modify/create
  - Estimate complexity
  - Check for dependencies

Create execution plan:
  - Order of implementation
  - Testing strategy
  - Risk mitigation
```

### 4. Execute Requirements
```
For each requirement in order:
  
  1. Log start:
     "=== STARTING REQUIREMENT: [title] ==="
     "Time: <timestamp>"
  
  2. Implement:
     - Read/analyze existing code
     - Write or modify code
     - Follow best practices
  
  3. Log changes:
     - Files created: [list]
     - Files modified: [list]
     - Lines added/removed: [numbers]
  
  4. Test implementation:
     - Run unit tests if available
     - Manual testing
     - Verify no regressions
  
  5. Log completion:
     "=== COMPLETED REQUIREMENT: [title] ==="
     "Time: <timestamp>"
```

### 5. Verify Acceptance Criteria
```
For each acceptance criterion:
  
  1. Update spec.md:
     - Mark as [x] if passing
     - Mark as [ ] if failing
     - Add notes if needed
  
  2. Test criterion:
     - Manual verification
     - Automated tests
     - Edge cases
  
  3. Log in execution log:
     "Criterion X: PASS/FAIL - [notes]"
```

### 6. Comprehensive Testing
```
Run full test suite:
  - All unit tests
  - Integration tests
  - Manual verification

If tests fail:
  - Log failure details
  - Attempt to fix
  - Re-test
  - If still failing, mark spec as BLOCKED
```

### 7. Update Knowledge Graph
```
For each completed requirement:
  Create fact: "Implemented [requirement] for spec <spec-id>"
  State: COMPLETED
  Valid from: <timestamp>

For each passed acceptance criterion:
  Create fact: "Criterion [name] satisfied for spec <spec-id>"
  State: VERIFIED
  Valid from: <timestamp>
```

### 8. Final Status Update
```
If all criteria pass:
  Update spec.md: Status → READY_FOR_COMMIT
  Update specs.json: status → "READY_FOR_COMMIT"
  Log: "All acceptance criteria met, ready for commit"

If any criteria fail:
  Update spec.md: Status → FAILED
  Update specs.json: status → "FAILED"
  Log: "Failed criteria: [list]"
```

### 9. Prepare for Commit
```
Create commit summary:
  - Spec ID and title
  - Requirements implemented
  - Acceptance criteria met
  - Files changed
  - Test results

Log to execution log:
  "=== EXECUTION COMPLETE ==="
  "Spec: <spec-id>"
  "Status: READY_FOR_COMMIT"
  "Total changes: [summary]"
```

### 10. Provide Status Report
```
Display to user:
✅ Spec execution complete!

Spec ID: <spec-id>
Status: READY_FOR_COMMIT

Requirements: N/N implemented
Acceptance Criteria: N/N passed

Files Changed:
  - Created: [count] files
  - Modified: [count] files
  - Total lines: +X, -Y

Test Results:
  - All tests: PASSING ✅
  
Next Steps:
  1. Review changes
  2. Use spec-commit to create commit and push
  
View full log: te9.dev/logs/<spec-id>.log
View spec: te9.dev/specs/<spec-id>/spec.md
```

## Execution Log Format

```
=== SPEC EXECUTION LOG: <spec-id> ===
Started: <timestamp>
Spec: <spec-id>
Status: IN_PROGRESS

--- REQUIREMENT 1: [title] ---
Started: <timestamp>
Implementation:
  - [Action 1]
  - [Action 2]
Files Changed:
  - Created: [file1], [file2]
  - Modified: [file3]
Testing: PASS ✅
Completed: <timestamp>

--- ACCEPTANCE CRITERIA VERIFICATION ---
Criterion 1: [name] - PASS ✅
Criterion 2: [name] - PASS ✅

--- FINAL TESTS ---
Unit Tests: PASS (X/X)
Integration Tests: PASS (Y/Y)
Manual Verification: PASS ✅

=== EXECUTION COMPLETE ===
Ended: <timestamp>
Duration: <time elapsed>
Status: READY_FOR_COMMIT
```

## Error Handling

### Test Failures
```
If tests fail during implementation:
  1. Log specific failure
  2. Attempt to fix immediately
  3. Re-run tests
  4. If still failing after 3 attempts:
     - Mark spec as FAILED
     - Log all failure details
     - Update OpenMemory
     - Inform user of blockage
```

### Missing Dependencies
```
If implementation requires external dependencies:
  1. Log missing dependency
  2. Check if can work around
  3. If critical:
     - Mark spec as BLOCKED
     - Document what's needed
     - Suggest next steps
```

### Code Conflicts
```
If conflicts arise:
  1. Attempt automatic resolution
  2. If manual resolution needed:
     - Log conflict details
     - Mark as blocked
     - Provide guidance for resolution
```

## Best Practices

### Implementation Approach
```
- Start with simplest requirements first
- Build incrementally
- Test after each requirement
- Keep changes focused
- Follow existing code patterns
- Document non-obvious decisions
```

### Logging
```
- Log everything: successes, failures, decisions
- Be specific about changes
- Include timestamps for all actions
- Note any workarounds or hacks
- Record test results
```

### Testing
```
- Test early and often
- Don't wait until end
- Cover edge cases
- Check for regressions
- Verify against acceptance criteria
```

## Validation Checklist

Before marking as READY_FOR_COMMIT:
- ✅ All requirements implemented
- ✅ All acceptance criteria verified
- ✅ All tests passing
- ✅ No regressions detected
- ✅ Code follows project standards
- ✅ Changes are minimal and focused
- ✅ Execution log complete
- ✅ Knowledge graph updated
- ✅ Spec status updated

## Success Criteria

- All requirements from spec are implemented
- All acceptance criteria are verified as PASS
- No failing tests
- No regressions in existing functionality
- Complete execution log maintained
- User provided clear status report
- Spec marked as READY_FOR_COMMIT
- Knowledge graph updated with completion facts

## Transition to Next Skill

After spec-execute completes successfully:
→ **spec-commit** - Create git commit and push

If execution failed or blocked:
→ **spec-track** - Review status and decide next steps

## Notes

- Always execute in PENDING → IN_PROGRESS → READY_FOR_COMMIT flow
- Never skip testing
- Never proceed with failing tests
- Log every action taken
- Keep user informed of progress
- Be honest about blockers or issues
- Store learning in OpenMemory
- Update knowledge graph with implementation facts

## Example Workflow

```
AI: Starting execution of SPEC-20250115-abc123

    === REQUIREMENT 1: Add login button ===
    ✓ Created login component
    ✓ Added to homepage
    ✓ Styled with daisyUI
    ✓ Links to /login
    Tests: PASS ✅

    === REQUIREMENT 2: Add logout functionality ===
    ✓ Created logout action
    ✓ Added to navbar
    ✓ Clears session
    Tests: PASS ✅

    === ACCEPTANCE CRITERIA VERIFICATION ===
    ✓ Login button visible on homepage
    ✓ Clicking navigates to /login
    ✓ Logout button clears session
    
    === FINAL TESTS ===
    Unit Tests: 12/12 PASS
    Integration Tests: 3/3 PASS
    
✅ Execution complete! Ready to commit.
```

## Important

- Do NOT create git commits in this skill (that's spec-commit's job)
- Do NOT push to remote (that's spec-commit's job)
- Focus only on implementation and testing
- Prepare everything for commit
- Wait for user to approve before committing