# te9.dev Workflow

Simple, structured development with AI.

## Setup

Initialize te9.dev in your project:

```
te9-init
```

This creates:
- `te9.dev/specs/` - Spec storage
- `te9.dev/logs/` - Execution logs
- `opencode.json` - Configuration
- `openmemory.md` - Memory rules

## Workflow

```
1. Enter your request
2. spec-clarify → Ask questions (max 5)
3. spec-store → Save spec file
4. spec-execute → Implement and log
5. spec-commit → Commit + push (with approval)
6. spec-track → Check status anytime
```

## Skills

| Skill | What It Does |
|-------|--------------|
| `te9-init` | Initialize te9.dev in project |
| `spec-clarify` | Gather requirements with questions |
| `spec-store` | Save spec to file system |
| `spec-execute` | Implement and test |
| `spec-commit` | Commit and push with approval |
| `spec-track` | View progress and status |

## Example

**User:** Add a login button

**AI:** Got it! Should it link to /login or open a modal?

**User:** Link to /login

**AI:** ✓ Spec created: SPEC-20250115-abc123
        Ready to execute?

**User:** Yes

**AI:** ✓ Implemented login button
        ✓ Linked to /login
        ✓ Tests passing
        Ready to commit?

**User:** approve

**AI:** ✓ Commit created
        ✓ Pushed to remote
        ✓ Work complete!

## Track Progress

```
spec-track                    # All specs
spec-track <spec-id>          # Details
spec-track <spec-id> --log    # Execution log
spec-track --commits          # Commit history
```

## Spec Status

- **PENDING** - Waiting to start
- **IN_PROGRESS** - Being executed
- **READY_FOR_COMMIT** - Ready to commit
- **COMPLETED** - Finished and pushed
- **FAILED** - Execution failed
- **BLOCKED** - Has blockers

## Files

```
te9.dev/
├── specs/
│   ├── SPEC-<id>/
│   │   └── spec.md
│   └── specs.json
└── logs/
    └── SPEC-<id>.log
```

## Memory System

OpenMemory automatically stores:
- Spec creation
- Implementation decisions
- Completion records

Context is maintained across sessions.

## Next Steps

1. Run `te9-init` in your project
2. Enter your first request
3. Follow the workflow

**Fast. Simple. Easy.**