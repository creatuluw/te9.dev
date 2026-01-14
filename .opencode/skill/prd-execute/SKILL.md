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

### Step 7: Run Full Test Suite

After individual criterion testing:
1. Run `npm test` to execute full test suite
2. Check for any regressions in existing tests
3. Verify no new errors or warnings
4. Ensure code compiles/builds successfully
5. If tests fail, fix the issues before proceeding

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

### Step 9: Update PRD Status

Update `/dev/prd/prd.json` for this PRD:
- Change `status` from "TODO" to "DONE"
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
- **Status:** DONE

## Achievements
- Implemented all [N] acceptance criteria
- Created [X] new files
- Modified [Y] existing files
- All tests passing (npm test)
- Code quality verified

## Status Changes
- IN_PROGRESS: <timestamp> - Started execution
- DONE: <timestamp> - Completed successfully
```

### Step 11: Clean Up

Before finishing:
- Remove any temporary or debug files
- Ensure no uncommitted changes are left
- Verify git status is clean (optional)
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
    "Ready for next PRD in plan",
    "Review implementation"
  ]
}
```

## Error Handling

### If Tests Fail
- Analyze which tests are failing
- Fix the implementation to make tests pass
- Re-run tests until all pass
- Document what was fixed

### If Dependencies Not Satisfied
- Stop execution immediately
- Report which dependencies are incomplete
- Suggest completing those PRDs first
- Do not proceed with implementation

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

## Best Practices

### Implementation
- **Keep it simple**: Implement the simplest solution that meets criteria
- **DRY principle**: Don't repeat code, use functions/components
- **Follow conventions**: Match existing patterns in the codebase
- **Test early, test often**: Don't wait until the end to test

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
- **LEAVE CLEAN STATE** - Code must build and tests must pass
- **DOCUMENT PROGRESS** - Keep track of what you've done
- **ASK FOR CLARIFICATION** - If acceptance criteria are unclear, ask

---

Ready to execute a PRD? Provide the PRD ID and I'll implement the work!