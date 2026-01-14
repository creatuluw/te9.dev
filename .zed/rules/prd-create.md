# PRD Creation Rule

This rule implements PRD Creation process documented at:
**[.opencode/skill/prd-create/SKILL.md](../../.opencode/skill/prd-create/SKILL.md)**

## What I Do

I generate all necessary PRD files:
- Update PRD database (`/dev/prd/prd.json`)
- Create PRD run folders with generated scripts
- Save interview transcripts
- Initialize log files
- Generate configuration files

## Usage

After **@prd-interview** completes successfully:

**@prd-create Create PRD files for the interview data**

## Output

Creates PRD structure in `/dev/prd/`:
- `prd.json` - Updated database
- `runs/<prd-id>/` - Execution folder with:
  - `<prd-id>-prompt.md` - Execution prompt
  - `<prd-id>-config.json` - Configuration
  - `<prd-id>.json` - PRD data copy
- `logs/<prd-id>.md` - Initial log file
- `interviews/<interview-id>.md` - Transcript

## Reference

For complete implementation details, see:
- [.opencode/skill/prd-create/SKILL.md](../../.opencode/skill/prd-create/SKILL.md)

## Next Step

After PRD files are created, use **@prd-execute** to begin implementation.
