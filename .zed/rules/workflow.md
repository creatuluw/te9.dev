# Zed Development Workflow

This file references the canonical build process from `.opencode`.

## Mandatory Workflows

All development work MUST follow these workflows. For complete documentation, see:
**[.opencode/prompts/build.md](../.opencode/prompts/build.md)**

## Workflow 1: Memory Workflow

1. **Query First** - Before any response, query memory using OpenMemory MCP
2. **Analyze** - Review memory results for context, patterns, preferences
3. **Incorporate** - Adapt your response based on memory context
4. **Store Last** - After important interactions, store decisions to memory

## Workflow 2: PRD-Driven Development

Start the interview process which determines the work type and whether PRD is needed:

1. **Interview** - Use `@prd-interview` to gather requirements and determine work type
2. **Plan** (if large ask) - Use `@prd-planning` to break into multiple PRDs
3. **Create** - Use `@prd-create` to generate PRD files
4. **Execute** - Use `@prd-execute` to implement work
5. **Test** - Use `@prd-testing` to verify all criteria
6. **Track** - Use `@prd-tracking` to log progress

**Note:** The interview skill includes "Single Prompt" as a work type option. If selected, PRD process is skipped and execution proceeds directly.

## Critical Rules

- **ALWAYS start with interview** - The interview determines work type and if PRD is needed
- **NEVER code without a PRD (for New Project, Feature, Refactor, Bugfix, Other work types)** - Always interview first
- **Work on ONE PRD at a time** - Follow dependency order
- **TEST EVERYTHING** - Never mark DONE without passing tests
- **LEAVE CLEAN STATE** - Code must build, all tests pass
- **TRACK PROGRESS** - Log all events (only for PRD work types)

## Project Structure

PRD files are created in:
