**AI Guide:** See [llms.md](te9/llms.md) for instructions on helping users install te9.dev

---

# te9.dev

Fast, simple, and easy AI-driven development workflow.

## Quick Start

### 1. Install te9.dev

**Linux/macOS/Git Bash:**
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

**Windows CMD:**
```cmd
te9 install
```

**Commands:** install, update, status, version, help

### 2. Initialize in Project

After installing, run in your editor:
```
skill('te9-init')
```

This creates:
- `te9.dev/specs/` - Spec file storage
- `te9.dev/logs/` - Execution logs

## Workflow

```
User request
  ↓
spec-clarify → Ask questions (max 5)
  ↓
spec-store → Save spec file
  ↓
spec-execute → Implement and log
  ↓
spec-commit → Commit + push (with approval)
  ↓
spec-track → Track progress anytime
```

## Skills

| Skill | Purpose |
|-------|---------|
| `te9-init` | Initialize te9.dev in project |
| `spec-clarify` | Gather requirements |
| `spec-store` | Save spec file |
| `spec-execute` | Implement and log |
| `spec-commit` | Commit and push |
| `spec-track` | Track progress |

## Commands

### Update
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update
```

```cmd
te9 update
```

### Check Status
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status
```

```cmd
te9 status
```

### Show Help
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash help
```

```cmd
te9 help
```

## Files

```
te9.dev/
├── specs/          # Spec files
├── logs/           # Execution logs
├── openmemory.md   # Memory rules
└── opencode.json   # Configuration
```

## Requirements

- OpenCode or Zed editor
- Git repository
- Project folder

## Documentation

- `te9.md` - Detailed workflow
- `openmemory.md` - Memory system
- `llms.md` - AI assistant guide

---

**Fast. Simple. Easy.**