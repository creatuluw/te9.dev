# PRD Execution Rule

This rule implements PRD Execution process documented at:
**[.opencode/skill/prd-execute/SKILL.md](../../.opencode/skill/prd-execute/SKILL.md)**

## What I Do

I implement work according to PRD requirements:
- Load and understand PRD
- Verifying dependencies are complete
- Implementing according to acceptance criteria
- Testing each criterion thoroughly
- **CRITICAL: Running unit tests and ensuring ALL pass successfully**
- Running full test suite
- **CRITICAL: Task CANNOT complete until ALL unit tests pass successfully**
- **CRITICAL: Creating git commit with PRD reference in commit message**
- Ensuring code quality
- Leaving code in clean, working state

## Usage

After PRD files are created:

**@prd-execute PRD-<id>**

This will implement all work defined in that PRD.

## Criteria

Before marking complete, I ensure:
- All acceptance criteria are implemented and tested
- **CRITICAL: ALL unit tests pass (100% pass rate required)**
- Code builds/compiles successfully
- No regressions introduced
- **CRITICAL: Task CANNOT be marked as DONE if ANY test fails**
- **CRITICAL: Git commit created with PRD ID in commit message**
- Code quality meets standards

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-execute/SKILL.md](../../.opencode/skill/prd-execute/SKILL.md)

## Testing Requirements

- Test each acceptance criterion individually
- Test error conditions and edge cases
- Run existing test suite to ensure no regressions
- **CRITICAL: Run unit tests - ALL must pass before completion**
- Don't assume - Actually verify each condition
- **CRITICAL: ZERO TOLERANCE for failing tests - cannot mark DONE**

## Git Commit Requirements

- **MANDATORY**: Each PRD must have its own git commit before completion
- Commit message format: `feat: <PRD title> [PRD-<id>]`
- Must include PRD ID in brackets `[PRD-<id>]`
- Must include PRD title
- Follow conventional commit format (feat/fix/refactor/etc.)
- Include test results in commit message
- Example: `git commit -m "feat: Implement user auth [PRD-20250115-143022]"`
- **NOTE**: Do NOT push - pushing happens after user approval in prd-track skill

## Next Step

After implementation completes, use **@prd-testing** to verify all criteria pass AND all unit tests pass successfully.

**Note:** Git commit is automatically created during prd-execute, but push only happens after user approval in prd-track skill.
