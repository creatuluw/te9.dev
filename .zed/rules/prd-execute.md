# PRD Execution Rule

This rule implements PRD Execution process documented at:
**[.opencode/skill/prd-execute/SKILL.md](../../.opencode/skill/prd-execute/SKILL.md)**

## What I Do

I implement work according to PRD requirements:
- Load and understand PRD
- Verify dependencies are complete
- Implement according to acceptance criteria
- Test each criterion thoroughly
- Run full test suite
- Ensure code quality
- Leave code in clean, working state

## Usage

After PRD files are created:

**@prd-execute PRD-<id>**

This will implement all work defined in that PRD.

## Criteria

Before marking complete, I ensure:
- All acceptance criteria are implemented and tested
- Code builds/compiles successfully
- No regressions introduced
- Code quality meets standards

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-execute/SKILL.md](../../.opencode/skill/prd-execute/SKILL.md)

## Testing Requirements

- Test each acceptance criterion individually
- Test error conditions and edge cases
- Run existing test suite to ensure no regressions
- Don't assume - Actually verify each condition

## Next Step

After implementation completes, use **@prd-testing** to verify all criteria pass.
