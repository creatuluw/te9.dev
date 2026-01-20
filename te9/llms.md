# te9.dev AI Instructions

Guide for AI assistants to help users install and manage te9.dev in their projects.

## What is te9.dev?

te9.dev is a simplified, 6-step AI-driven development workflow:

1. **User enters prompt**
2. **spec-clarify** → Ask clarification questions (max 5)
3. **spec-store** → Store unique spec file
4. **spec-execute** → Implement spec and log work
5. **spec-commit** → Commit and push (with user approval)
6. **spec-track** → Track progress and status anytime

## Quick Installation Commands

### Linux / macOS / Windows (Git Bash)

```bash
# Install te9.dev
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install

# Update to latest version
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update

# Check installation status
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status

# Show version
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash version

# Show help
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash help
```

### Windows Command Prompt

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

## Installation Process

### Step 1: User requests te9.dev installation

When user says:
- "Install te9.dev"
- "Set up te9.dev"
- "I want to use te9.dev"
- "Add te9.dev to my project"

### Step 2: Check platform

Detect the user's platform:
- Linux/macOS: Use bash commands
- Windows: Check if using CMD/PowerShell or Git Bash

### Step 3: Provide installation command

**For Linux/macOS/Git Bash:**
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

**For Windows CMD:**
```cmd
te9 install
```

**For Windows PowerShell:**
```powershell
& .\te9.cmd install
```

### Step 4: Verify installation

After installation, user should have:
- `opencode.json`
- `openmemory.md`
- `.opencode/skill/` (6 skills)
- `.opencode/tool/` (4 technical tools)
- `te9.dev/specs/`
- `te9.dev/logs/`

### Step 5: Initialize te9.dev

Tell user to run:
```
skill('te9-init')
```

This creates the project structure for specs and logs.

## What Gets Installed

### Core Files (4)
- `opencode.json` - Configuration
- `openmemory.md` - Memory system rules
- `README.md` - Project documentation
- `te9.md` - Workflow guide

### Skills (6)
- `te9-init/SKILL.md` - Initialize te9.dev
- `spec-clarify/SKILL.md` - Clarify requirements
- `spec-store/SKILL.md` - Store spec files
- `spec-execute/SKILL.md` - Implement and log
- `spec-commit/SKILL.md` - Commit and push
- `spec-track/SKILL.md` - Track progress

### Technical Tools (4)
- `daisyui.ts` - UI component templates
- `knowledge_graph.ts` - Memory graph exporter
- `melt.ts` - Svelte UI builder
- `uikit.ts` - UI component generator

## Updating te9.dev

### When user requests update

User says:
- "Update te9.dev"
- "Check for updates"
- "Upgrade te9.dev"
- "Get latest version"

### Provide update command

**Linux/macOS/Git Bash:**
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update
```

**Windows CMD:**
```cmd
te9 update
```

**Windows PowerShell:**
```powershell
& .\te9.cmd update
```

### What update does

- Creates automatic backup (`.te9-backup-TIMESTAMP`)
- Downloads latest files from GitHub
- Preserves user's specs and logs
- Updates all skills and tools
- Verifies installation

## Checking Status

### When user asks to check status

User says:
- "Check te9.dev status"
- "Is te9.dev installed?"
- "Verify installation"
- "What's the status?"

### Provide status command

**Linux/macOS/Git Bash:**
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status
```

**Windows CMD:**
```cmd
te9 status
```

**Windows PowerShell:**
```powershell
& .\te9.cmd status
```

## Prerequisites

### Required
- **OpenCode or Zed editor** (with MCP support)
- **Git repository** (auto-initialized if missing)
- **curl** command (Linux/macOS/Git Bash)
- **Bash shell** (Linux/macOS/Git Bash)
- **PowerShell** (Windows CMD)

### For Windows Users
- **Git for Windows** (recommended): https://git-scm.com/download/win
- OR **WSL** (Windows Subsystem for Linux)

## Quick Start Example

### Complete conversation flow

**User:** "I want to use te9.dev"

**AI:** "Great! Here's how to install te9.dev in your project:

**Step 1:** Navigate to your project folder
```bash
cd your-project
```

**Step 2:** Run installation command

For Linux/macOS/Git Bash:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install
```

For Windows Command Prompt:
```cmd
te9 install
```

**Step 3:** Initialize te9.dev
In your OpenCode or Zed editor, run:
```
skill('te9-init')
```

This will create the `te9.dev/specs/` and `te9.dev/logs/` folders.

**Step 4:** Start using te9.dev
Enter your request, and I'll:
- Ask clarification questions (if needed)
- Create a spec file
- Implement your request
- Create a git commit
- Ask for approval to push

Ready to get started?"

---

**User:** "Yes"

**AI:** "Perfect! Run the installation command above, then let me know when it's complete. After that, you can start using te9.dev right away!"

## Common Scenarios

### Scenario 1: User wants to update

**User:** "Is there a newer version of te9.dev?"

**AI:** "To check for and install the latest version of te9.dev, run:

Linux/macOS/Git Bash:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update
```

Windows CMD:
```cmd
te9 update
```

This will backup your current files, download the latest version, and verify the update. Your specs and logs will be preserved."

### Scenario 2: User wants to check status

**User:** "Check if te9.dev is installed correctly"

**AI:** "To check your te9.dev installation status, run:

Linux/macOS/Git Bash:
```bash
curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status
```

Windows CMD:
```cmd
te9 status
```

This will show you which files are installed and if anything is missing."

### Scenario 3: User wants help

**User:** "Show te9.dev commands"

**AI:** "Here are the te9.dev commands:

**Install te9.dev:**
Linux/macOS/Git Bash: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install`
Windows CMD: `te9 install`

**Update to latest:**
Linux/macOS/Git Bash: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash update`
Windows CMD: `te9 update`

**Check status:**
Linux/macOS/Git Bash: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash status`
Windows CMD: `te9 status`

**Show version:**
Linux/macOS/Git Bash: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash version`
Windows CMD: `te9 version`

**Show help:**
Linux/macOS/Git Bash: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash help`
Windows CMD: `te9 help`"

## Important Notes

### For AI Assistants

- **Always detect platform** before providing commands
- **Provide both bash and Windows options** when platform unclear
- **Explain what each command does**
- **Wait for user confirmation** before proceeding
- **Offer help** if user seems stuck
- **Check for prerequisites** (git, curl, etc.)

### For Users

- **te9.dev is self-contained** - all files downloaded from GitHub
- **No installation needed** - just run the command
- **Updates preserve data** - specs and logs are safe
- **Cross-platform** - works on Linux, macOS, and Windows
- **Backups automatic** - update creates `.te9-backup-TIMESTAMP`

## Troubleshooting

### Installation fails

**Possible causes:**
- No internet connection
- Git not initialized
- No write permissions
- curl missing (Windows)

**Solutions:**
- Check internet: `curl -I https://github.com`
- Initialize git: `git init`
- Check permissions: `ls -la`
- Install curl or Git for Windows

### Update fails

**Possible causes:**
- Network issues
- Corrupted backup
- Permission errors

**Solutions:**
- Check `.te9-backup-*` folders
- Manually restore from backup
- Re-run update command
- Check internet connection

## Additional Resources

- **GitHub Repository:** https://github.com/creatuluw/te9.dev
- **Documentation:** https://github.com/creatuluw/te9.dev#readme
- **Issues:** https://github.com/creatuluw/te9.dev/issues

## Summary

te9.dev is fast, simple, and easy to install:

**One command to install:**
- Linux/macOS/Git Bash: `curl -fsSL https://github.com/creatuluw/te9.dev/te9/te9 | bash install`
- Windows CMD: `te9 install`

**After installation:**
- Run `skill('te9-init')` to initialize
- Start using the 6-step workflow

**One command to update:**
- Same command with `update` instead of `install`

**Always available:**
- `status` to check installation
- `version` to show version
- `help` to see all commands