# PRD Testing Rule

This rule implements PRD Testing process documented at:
**[.opencode/skill/prd-test/SKILL.md](../../.opencode/skill/prd-test/SKILL.md)**

## What I Do

I verify that all acceptance criteria pass:
- Run tests for each criterion
- **CRITICAL: Running unit tests and ensuring ALL pass successfully**
- Run full test suite
- **CRITICAL: Task CANNOT complete until ALL unit tests pass successfully**
- Check for regressions
- Verify code quality

## Usage

After **@prd-execute** completes:

**@prd-testing PRD-<id>**

This verifies all criteria defined in the PRD.

## Criteria Tested

- All acceptance criteria from PRD
- **CRITICAL: ALL unit tests pass (100% pass rate required)**
- Full existing test suite
- **CRITICAL: Task CANNOT be marked as DONE if ANY test fails**
- Code quality standards
- No regressions

**NOTE:** This skill ONLY performs verification. Commits and pushes are handled separately:
- Commits are created in `prd-execute` skill (with PRD reference in commit message)
- Pushes are handled in `prd-track` skill (after user approval)

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-test/SKILL.md](../../.opencode/skill/prd-test/SKILL.md)

## CRITICAL REQUIREMENT

**A PRD can ONLY be marked as "DONE" if:**
- ALL acceptance criteria pass
- ALL unit tests pass (100% pass rate required)
- Full test suite passes (npm test)
- NO regressions detected
- Code builds/compiles without errors

**If ANY test fails:**
- DO NOT mark PRD as DONE under any circumstances
- Keep status as "IN_PROGRESS" or mark as "FAILED"
- Report which tests are failing
- Fix all failing tests before attempting to mark as DONE

## Test Results

After testing completes and ALL tests pass, use **@prd-tracking** to log completion.
