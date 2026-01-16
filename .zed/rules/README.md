# Zed Rules for te9-method

This directory contains Zed-compatible rules that implement te9-method's PRD-driven development workflow.

## Architecture

**Canonical Source:** All process documentation and skill implementations are maintained in `.opencode/`.

**These Rules:** Provide lightweight references and Zed-specific adapters that point to the canonical source.

## Quick Start

For any development work, follow this workflow:

1. **@prd-interview** - Gather requirements (references `.opencode/skill/prd-interview/`)
2. **@prd-planning** - Plan large asks (references `.opencode/skill/prd-plan/`)
3. **@prd-create** - Generate PRD files (references `.opencode/skill/prd-create/`)
4. **@prd-work** - Check PRD status & guide on starting work (references `.opencode/skill/prd-work/`)
5. **@prd-execute** - Implement work (references `.opencode/skill/prd-execute/`)
6. **@prd-testing** - Verify criteria (references `.opencode/skill/prd-test/`)
7. **@prd-tracking** - Log progress (references `.opencode/skill/prd-track/`)

## How It Works

These rules act as **Zed-compatible wrappers** around OpenCode skills:

- **OpenCode Agent:** Uses `.opencode/skill/` directly (canonical source)
- **Zed Agent:** Uses `.zed/rules/` which reference `.opencode`

Both agents execute **identical processes** from the same source.

## Documentation

- [OpenCode Skills README](../../.opencode/skill/README.md) - Full skill documentation
- [OpenCode Build Process](../../.opencode/prompts/build.md) - Complete mandatory workflows

## Project Structure

The rules expect this structure (automatically created by `prd-create`):
