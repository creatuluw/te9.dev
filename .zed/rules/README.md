# Zed Rules for te9-method

This directory contains Zed-compatible rules that implement te9-method's PRD-driven development workflow.

## Architecture

**Canonical Source:** All process documentation and skill implementations are maintained in `.opencode/`.

**These Rules:** Provide lightweight references and Zed-specific adapters that point to the canonical source.

## Quick Start

Start each session by choosing your intent:

1. **@prd** - Create PRDs to define new work (references `.opencode/agent/prd.md`)
2. **@status** - Check PRD status & guide on starting work (references `.opencode/agent/status.md`)

Then proceed with the PRD workflow:

3. **@prd-interview** - Gather requirements (references `.opencode/skill/prd-interview/`)
4. **@prd-planning** - Plan large asks (references `.opencode/skill/prd-plan/`)
5. **@prd-create** - Generate PRD files (references `.opencode/skill/prd-create/`)
6. **@prd-execute** - Implement work (references `.opencode/skill/prd-execute/`)
7. **@prd-testing** - Verify criteria (references `.opencode/skill/prd-test/`)
8. **@prd-tracking** - Log progress (references `.opencode/skill/prd-track/`)

## How It Works

### Session Flow

1. **Session Start:** Query memory, then ask user: "Create PRDs" or "Execute PRDs"
2. **If Creating PRDs:** Use `@prd` agent (handles interview, plan, create)
3. **If Executing PRDs:** Use `@status` agent to see status, then execute with `@prd-execute`

### Architecture

These rules act as **Zed-compatible wrappers** around OpenCode skills and agents:

- **OpenCode Agent:** Uses `.opencode/skill/` and `.opencode/agent/` directly (canonical source)
- **Zed Agent:** Uses `.zed/rules/` which reference `.opencode`

Both agents execute **identical processes** from the same source.

## Documentation

- [OpenCode Skills README](../../.opencode/skill/README.md) - Full skill documentation
- [OpenCode Build Process](../../.opencode/prompts/build.md) - Complete mandatory workflows

## Project Structure

The rules expect this structure (automatically created by `prd-create`):
