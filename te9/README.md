# te9.dev Installation Improvements

## Overview

This document describes improvements made to te9.dev installation to make it easier for LLMs (and humans) to install and initialize the system.

## Problems Solved

### 1. URL Confusion ❌→✅
**Before:** Multiple URL variations caused confusion:
- `https://github.com/creatuluw/te9.dev/te9/te9` (missing `raw.`)
- `https://raw.githubusercontent.com/.../refs/heads/main/te9/te9` (incorrect path)

**After:** Single canonical URL clearly documented:
```
https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9
```

### 2. Platform Detection ❌→✅
**Before:** AI tried Windows CMD commands in bash environment

**After:** Clear platform detection instructions with specific commands for each:
- Linux/macOS/Git Bash: `curl -fsSL [URL] | bash install`
- Windows CMD: `te9 install`
- Windows PowerShell: `iwr -useb [URL] | bash install`

### 3. Manual Initialization ❌→✅
**Before:** After installation, user had to manually run `skill('te9-init')` and AI had to manually create directories

**After:** `--llm` flag handles everything automatically:
- Auto-initializes git repository
- Auto-creates all directories
- Auto-initializes specs database
- **No manual skill step needed!**

### 4. Skill Execution Issues ❌→✅
**Before:** AI couldn't directly execute skills, had to read and manually follow steps

**After:** `--llm` mode completes initialization as part of installation

### 5. Structured Output ❌→✅
**Before:** Hard to verify installation success from output

**After:** Clear, parseable output with status indicators:
```
=== INSTALLATION SUMMARY ===
✅ Core files: 4/4 installed
✅ Skills: 6/6 installed
✅ Tools: 4/4 installed
✅ Directories: created
✅ Specs database: initialized

STATUS: READY_TO_USE
```

## New Installation Methods

### Method 1: LLM-Friendly Bash Script (Recommended)

Run with `--llm` flag for fully automated installation:

```bash
# Linux/macOS/Git Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm

# Windows CMD
te9 install --llm

# Windows PowerShell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

**Benefits:**
- Auto-initializes git (no prompts)
- Auto-creates all directories
- Auto-initializes specs database
- Structured output for easy verification
- No manual steps required

### Method 2: Standard Bash Script

For users who prefer interactive prompts:

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install
```

Then manually run:
```
skill('te9-init')
```

### Method 3: LLM-Native Installation

For LLMs with file system access but no shell execution:

1. Download files directly from GitHub
2. Create directory structure manually
3. Initialize specs database
4. Verify installation

See `INSTALL_LLM.md` for detailed step-by-step instructions.

## Documentation Files

### `llms.md` - Comprehensive LLM Guide
- Detailed installation instructions for AI assistants
- Platform detection guidance
- Troubleshooting tips
- Conversation examples
- Best practices for AI assistants

### `QUICKSTART.md` - Quick Reference
- One-command installation
- Expected output examples
- Troubleshooting
- Quick reference commands

### `INSTALL_LLM.md` - LLM-Native Installation
- Step-by-step file download instructions
- No shell commands required
- Complete URL list for all files
- Verification checklist

## What Gets Installed

### Core Files (4)
- `opencode.json` - Configuration
- `openmemory.md` - Memory system rules
- `README.md` - Project documentation
- `te9.md` - Workflow guide

### Skills (6)
- `te9-init/SKILL.md` - Initialization
- `spec-clarify/SKILL.md` - Clarification
- `spec-store/SKILL.md` - Spec storage
- `spec-execute/SKILL.md` - Execution
- `spec-commit/SKILL.md` - Commit workflow
- `spec-track/SKILL.md` - Progress tracking

### Tools (4)
- `daisyui.ts` - UI templates
- `knowledge_graph.ts` - Memory graph
- `melt.ts` - Svelte UI
- `uikit.ts` - UI generator

### Directories
- `.opencode/skill/` - Skills
- `.opencode/tool/` - Tools
- `te9.dev/specs/` - Spec storage
- `te9.dev/logs/` - Execution logs
- `te9.dev/history/` - Git history

## Installation Flags

### `--llm`
Enables LLM-friendly mode:
- Auto-confirm all prompts
- Auto-initialize git
- Auto-complete setup
- Structured output

### `--auto-init`
Automatically initialize project after install (no manual `skill('te9-init')` needed)

## Verification

After installation, verify with:

```bash
# Check status
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status

# Or on Windows
te9 status
```

Expected output should show:
- ✅ All core files present
- ✅ All 6 skills present
- ✅ Directory structure correct
- ✅ Git repository initialized

## For AI Assistants

### Installation Flow

1. **Detect environment** - Check if user is on bash or Windows
2. **Provide command** - Give appropriate one-line command
3. **Run with `--llm` flag** - Ensures automatic setup
4. **Verify output** - Check for `STATUS: READY_TO_USE`
5. **Confirm completion** - Tell user installation is ready

### Example Conversation

**User:** "Install te9.dev"

**AI:** "Great! Let me install te9.dev in your project.

Running installation in LLM mode:

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

[runs command]

✅ Installation complete!

te9.dev is now installed and ready to use. No manual steps needed!

You can start by describing what you want to build."

## Troubleshooting

### "command not found"
- **Windows**: Install Git for Windows from https://git-scm.com/download/win
- Use Git Bash terminal

### "Failed to download"
- Check internet connection
- Verify URL exactly: `https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9`

### "Permission denied"
- Run with elevated privileges
- Check write permissions

### Installation incomplete
- Run status check: `te9 status`
- Re-run install command
- Check for error messages

## Update te9.dev

```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update

# Windows CMD
te9 update
```

Update automatically creates backup at `.te9-backup-TIMESTAMP/` and preserves your specs and logs.

## Resources

- **Repository**: https://github.com/creatuluw/te9.dev
- **LLM Guide**: `te9/llms.md`
- **Quick Start**: `te9/QUICKSTART.md`
- **LLM-Native Install**: `te9/INSTALL_LLM.md`
- **Issues**: https://github.com/creatuluw/te9.dev/issues

## Summary

The improvements focus on making installation:

1. **Unambiguous** - Single canonical URL, clearly documented
2. **Automatic** - `--llm` flag handles all setup steps
3. **Verifiable** - Structured output with clear status indicators
4. **Flexible** - Three installation methods for different scenarios
5. **Documented** - Comprehensive guides for both LLMs and humans

**Result:** LLMs can now reliably install te9.dev with a single command and no manual intervention required.