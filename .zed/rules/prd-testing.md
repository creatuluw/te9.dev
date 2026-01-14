# PRD Testing Rule

This rule implements PRD Testing process documented at:
**[.opencode/skill/prd-test/SKILL.md](../../.opencode/skill/prd-test/SKILL.md)**

## What I Do

I verify that all acceptance criteria pass:
- Run tests for each criterion
- Run full test suite
- Check for regressions
- Verify code quality

## Usage

After **@prd-execute** completes:

**@prd-testing PRD-<id>**

This verifies all criteria defined in the PRD.

## Criteria Tested

- All acceptance criteria from PRD
- Full existing test suite
- Code quality standards
- No regressions

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-test/SKILL.md](../../.opencode/skill/prd-test/SKILL.md)

## Test Results

After testing completes, use **@prd-tracking** to log completion.
