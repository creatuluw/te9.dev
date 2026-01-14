# PRD Tracking Rule

This rule implements PRD Tracking process documented at:
**[.opencode/skill/prd-track/SKILL.md](../../.opencode/skill/prd-track/SKILL.md)**

## What I Do

I log events throughout PRD lifecycle:
- Start execution
- Progress updates
- Issues encountered
- Completion status

## Usage

Track events at any point during PRD lifecycle:

**@prd-tracking [event-type] for PRD-<id>**

## Event Types

- **STARTED** - PRD execution begins
- **PROGRESS** - Mid-execution updates
- **ISSUE** - Problems encountered
- **COMPLETED** - Work finished successfully
- **FAILED** - Execution failed
- **PAUSED** - Temporarily stopped
- **RESUMED** - Restarted after pause
- **TESTED** - Testing completed
- **QUERY** - Status query

## Log Location

Updates are written to: `/dev/prd/logs/<prd-id>.md`

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-track/SKILL.md](../../.opencode/skill/prd-track/SKILL.md)

## Final Step

After COMPLETED event, PRD status is set to DONE.
