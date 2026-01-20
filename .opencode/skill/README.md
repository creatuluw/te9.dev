# te9.dev Skills

Simplified workflow for software development with AI.

## Skills

| Skill | Purpose |
|-------|---------|
| **te9-init** | Initialize te9.dev in your project |
| **spec-clarify** | Ask clarification questions (max 5) |
| **spec-store** | Store unique spec file |
| **spec-execute** | Implement spec and log work |
| **spec-commit** | Commit and push after approval |
| **spec-track** | Track progress and status anytime |

## Workflow

```
1. User enters prompt
2. spec-clarify → Ask questions (max 5)
3. spec-store → Save spec file
4. spec-execute → Implement and log
5. spec-commit → Commit + push (with approval)
6. spec-track → Check status anytime
```

## Quick Start

### First Time Setup
```
te9-init
```

### Create Work
```
spec-clarify → spec-store → spec-execute → spec-commit
```

### Check Status
```
spec-track                    # Overview
spec-track <spec-id>          # Details
spec-track <spec-id> --log    # Execution log
spec-track --commits          # Commit history
```

## Spec Status

- **PENDING** - Waiting to start
- **IN_PROGRESS** - Being executed
- **READY_FOR_COMMIT** - Ready for commit
- **COMPLETED** - Finished and pushed
- **FAILED** - Execution failed
- **BLOCKED** - Has blockers

## File Structure

```
te9.dev/
├── specs/
│   ├── spec-id-1/
│   │   └── spec.md
│   └── specs.json
└── logs/
    └── spec-id-1.log
```

## Technical Skills

Tools in `.opencode/tool/`:
- `daisyui.ts` - UI component templates
- `knowledge_graph.ts` - Memory graph export
- `melt.ts` - Code processing
- `uikit.ts` - UI helpers

## Memory System

OpenMemory is configured in `opencode.json` and documented in `openmemory.md`.

All spec-related work is automatically stored in OpenMemory for context.