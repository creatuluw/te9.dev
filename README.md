te9-init
```

### Create Work
```
[Your request]
→ spec-clarify → spec-store → spec-execute → spec-commit
```

### Check Status
```
spec-track                    # Overview
spec-track <spec-id>          # Details
spec-track <spec-id> --log    # Execution log
spec-track --commits          # Commit history
```

## Installation

### One-Line Install

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

This works on Linux, macOS, and Windows (Git Bash).

### Windows CMD

For Windows Command Prompt (without Git Bash), use the CMD wrapper:

```cmd
REM Install te9.dev
te9 install

REM Update to latest version
te9 update

REM Check installation status
te9 status

REM Show version
te9 version

REM Show help
te9 help
```

**Note:** The `te9` command for Windows CMD automatically:
- Downloads the bash script from GitHub
- Uses Git Bash (if installed) or WSL
- Requires Git for Windows or WSL to be installed

**Install Git for Windows:** https://git-scm.com/download/win

### Update

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update
```

### Check Status

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status
```

### Show Help

```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash help
```

### Initialize in Project

After installation, run in your project folder with your AI assistant:

```
skill('te9-init')
```

This creates:
- `te9.dev/specs/` - Spec file storage
- `te9.dev/logs/` - Execution logs

## Available Commands

The `te9` script supports these commands:

| Command | Purpose |
|---------|---------|
| `install` | Install te9.dev in current directory |
| `update` | Update te9.dev to latest version |
| `status` | Check installation status |
| `version` | Show version information |
| `help` | Show help message |

## Skills

| Skill | Purpose |
|-------|---------|
| `te9-init` | Initialize te9.dev in project |
| `spec-clarify` | Gather requirements |
| `spec-store` | Save spec file |
| `spec-execute` | Implement and log |
| `spec-commit` | Commit and push |
| `spec-track` | Track progress |

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

---

**Fast. Simple. Easy.**