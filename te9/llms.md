# te9.dev AI Installation Guide

This guide is specifically written for AI assistants to help users install te9.dev.

## Overview

te9.dev is a 6-step AI-driven development workflow that requires installation before use. As an AI, you can install it by:

1. **Downloading the installation script**
2. **Running the install command**
3. **Auto-initializing the project structure**

## Critical Information

### THE ONE CORRECT URL

Use ONLY this URL for the te9 installation script:
```
https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9
```

**Do NOT use:**
- ❌ `https://github.com/creatuluw/te9.dev/te9/te9` (missing raw.githubusercontent.com)
- ❌ `https://raw.githubusercontent.com/creatuluw/te9.dev/refs/heads/main/te9/te9` (refs/heads not needed)
- ❌ Any other variation

### Platform Detection

Before providing installation commands, detect the user's environment:

**Check if Windows CMD/PowerShell:**
- User is on Windows platform
- Default shell is likely cmd or powershell

**Check if Bash (Linux/macOS/Git Bash):**
- User is on Linux/macOS
- User on Windows with Git Bash installed
- Environment shows `/bin/bash` or similar

## Installation Procedure

### Step 1: Confirm Location

Ask user to navigate to their project directory:
```
Please navigate to your project directory where you want to install te9.dev.
```

### Step 2: Provide Installation Command

**For Bash environments (Linux, macOS, Git Bash):**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install
```

**For Windows CMD:**
```cmd
te9 install
```

**For Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install
```

### Step 3: The Script Does Everything

The install script will:
- ✅ Initialize git repository if needed
- ✅ Create all directory structures
- ✅ Download all required files
- ✅ Initialize the specs database
- ✅ Verify installation

**No manual steps required after running the install command!**

### Step 4: Verify Installation

The script outputs a verification showing:
- ✅ All core files installed
- ✅ All skills present
- ✅ Directory structure created

If verification passes, installation is complete and ready to use.

## What Gets Installed

### Core Configuration (4 files)
- `opencode.json` - Main configuration
- `openmemory.md` - Memory system rules
- `README.md` - Project documentation
- `te9.md` - Workflow guide

### Skills (6 skills)
- `te9-init/SKILL.md` - Project initialization
- `spec-clarify/SKILL.md` - Ask clarification questions
- `spec-store/SKILL.md` - Store spec files
- `spec-execute/SKILL.md` - Implement and log work
- `spec-commit/SKILL.md` - Commit and push changes
- `spec-track/SKILL.md` - Track progress

### Technical Tools (4 tools, optional)
- `daisyui.ts` - UI component templates
- `knowledge_graph.ts` - Memory graph exporter
- `melt.ts` - Svelte UI builder
- `uikit.ts` - UI component generator

### Prompts (1 file, required)
- `rules.md` - Mandatory spec process workflow rules and guidelines

### Directory Structure
- `.opencode/skill/` - All skill definitions
- `.opencode/tool/` - Technical tools
- `.opencode/prompts/` - System prompts and rules
- `te9.dev/specs/` - Spec file storage
- `te9.dev/logs/` - Execution logs
- `te9.dev/history/` - Git history

## Alternative: LLM Native Installation

If you have direct file system access, you can install te9.dev without shell commands:

### Download Each File Directly

Download these files from GitHub:
```
https://raw.githubusercontent.com/creatuluw/te9.dev/main/opencode.json
https://raw.githubusercontent.com/creatuluw/te9.dev/main/openmemory.md
https://raw.githubusercontent.com/creatuluw/te9.dev/main/README.md
https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9.md
```

### Create Directory Structure
```
.opencode/skill/te9-init/SKILL.md
.opencode/skill/spec-clarify/SKILL.md
.opencode/skill/spec-store/SKILL.md
.opencode/skill/spec-execute/SKILL.md
.opencode/skill/spec-commit/SKILL.md
.opencode/skill/spec-track/SKILL.md
.opencode/tool/daisyui.ts
.opencode/tool/knowledge_graph.ts
.opencode/tool/melt.ts
.opencode/tool/uikit.ts
.opencode/prompts/rules.md
te9.dev/specs/
te9.dev/logs/
te9.dev/specs.json
```

### Initialize Specs Database
Create an empty JSON file at `te9.dev/specs.json` with content:
```json
{}
```

## Updating te9.dev

### Check for Updates

User asks: "Update te9.dev" or "Check for updates"

**Bash:**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update
```

**Windows CMD:**
```cmd
te9 update
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update
```

### What Update Does
- Creates backup: `.te9-backup-TIMESTAMP/`
- Downloads latest files from GitHub
- Preserves user's specs and logs in `te9.dev/`
- Updates all skills and tools
- Verifies installation

## Checking Installation Status

User asks: "Check te9.dev status" or "Is te9.dev installed?"

**Bash:**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status
```

**Windows CMD:**
```cmd
te9 status
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status
```

Status shows:
- Which files are installed
- Which files are missing
- Number of specs and logs
- Git repository status
- Next steps

## Troubleshooting

### Installation Fails

**Error: "command not found" or similar**
- Curl not available on Windows
- Solution: Install Git for Windows from https://git-scm.com/download/win
- Then use Git Bash and run the bash command

**Error: "Not in a git repository"**
- Script will offer to initialize git
- Accept the prompt to run `git init`
- Installation will continue

**Error: "Failed to download"**
- Check internet connection
- Verify the URL is correct (use the exact URL from this guide)
- Try downloading directly from browser to test

### Update Fails

**Error: "Permission denied"**
- Check write permissions in project directory
- Run command with elevated privileges if needed

**Error: "Backup failed"**
- Manually create backup folder: `.te9-backup-manual/`
- Copy important files there
- Re-run update command

## Quick Reference

### Install (One Command)
```bash
# Bash (Linux/macOS/Git Bash)
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install

# Windows CMD
te9 install

# Windows PowerShell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install
```

### Update
```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update

# Windows CMD
te9 update
```

### Status
```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status

# Windows CMD
te9 status
```

### Help
```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash help

# Windows CMD
te9 help
```

## Conversation Examples

### Example 1: Fresh Installation

**User:** "I want to use te9.dev"

**AI:** "Great! Let's install te9.dev in your project.

First, please navigate to your project directory.

Then, I'll run the installation command for you.

Which environment are you using?
- Linux/macOS/Git Bash
- Windows Command Prompt
- Windows PowerShell"

**User:** "Git Bash on Windows"

**AI:** "Perfect! I'll install te9.dev now:

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install
```

This will:
✅ Initialize git repository if needed
✅ Create all necessary directories
✅ Download all required files
✅ Set up the specs database

Running installation now..."

[AI runs command]

**AI:** "✅ Installation complete!

te9.dev is now ready to use in your project. You can start by entering your request, and I'll help you through the 6-step workflow."

### Example 2: Update

**User:** "Update te9.dev to the latest version"

**AI:** "I'll update te9.dev to the latest version now:

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update
```

This will create a backup of your current files and download the latest updates. Your specs and logs will be preserved."

[AI runs command]

**AI:** "✅ Update complete!

Your te9.dev installation is now up to date. Backup created at `.te9-backup-TIMESTAMP/`. You can continue using te9.dev as normal."

### Example 3: Check Status

**User:** "Is te9.dev installed correctly?"

**AI:** "Let me check your te9.dev installation status:

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status
```"

[AI runs command]

**AI:** "Based on the status check:
- ✅ All core files are installed
- ✅ All 6 skills are present
- ✅ Directory structure is correct
- ✅ Git repository is initialized
- 📊 X spec(s) found
- 📊 X log(s) found

Your te9.dev installation is complete and ready to use!"

## Best Practices for AI Assistants

1. **Always detect platform first** - Don't assume bash or Windows
2. **Use the exact URL provided** - No variations, no assumptions
3. **Explain what will happen** - Tell user before running commands
4. **Wait for confirmation** - Don't auto-run without user consent
5. **Handle errors gracefully** - Provide clear solutions for common issues
6. **Offer alternatives** - If curl fails, suggest LLM native installation
7. **Verify after installation** - Run status check to confirm success

## Key Takeaways

- **One URL to rule them all:** `https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9`
- **One command to install:** `curl -fsSL [URL] | bash install`
- **No manual steps:** Script handles everything including git init
- **Cross-platform:** Works on Linux, macOS, and Windows (with Git Bash)
- **Safe updates:** Automatic backups preserve user data

## Additional Resources

- **Repository:** https://github.com/creatuluw/te9.dev
- **Issues:** https://github.com/creatuluw/te9.dev/issues
- **Documentation:** See te9.md in your project after installation