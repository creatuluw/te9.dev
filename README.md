# 🤖 AI Instructions

**To install te9.dev, run this ONE command:**

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash -s install --llm
```

**Windows CMD:**
```cmd
te9 install --llm
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash -s install --llm
```

The `--llm` flag handles everything automatically:
- ✅ Initializes git repository (no prompts)
- ✅ Creates all directories
- ✅ Downloads all required files
- ✅ Initializes specs database
- ✅ **No manual steps required!**

**Success indicator:** Look for `STATUS: READY_TO_USE` in output

---

# te9.dev

Fast, simple, and easy AI-driven development workflow.

## 🚀 Quick Install

**For LLMs:** Run this one command to install te9.dev in the current project directory:

```bash
# Linux/macOS/Git Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash -s install --llm

# Windows CMD
te9 install --llm

# Windows PowerShell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash -s install --llm
```

**The `--llm` flag handles everything automatically:**
- ✅ Initializes git repository
- ✅ Creates all directories
- ✅ Downloads all files
- ✅ Sets up the project
- ✅ No manual steps required!

**After installation:** te9.dev is ready to use immediately. There are two ways to start the te9.dev workflow:
1. Type `/te9` (with optional prompt) in your OpenCode interface
2. Add `te9.md` file to your LLM context (drag/drop or mention)

---



## Workflow

**⚠️ IMPORTANT:** The te9.dev workflow starts in two ways:

**Method 1: /te9 Command**
```
1. User types /te9 command (with optional prompt: /te9 <your request>)
2. spec-clarify → AI asks clarification questions (max 5)
```

**Method 2: File-Based Command**
```
1. User adds te9.md file to LLM context
2. Workflow starts automatically (no /te9 command needed)
```
3. spec-store → AI saves a unique spec file
4. spec-execute → AI implements the feature
5. spec-branch-commit → AI creates feature branch, commits, and pushes
6. spec-pr-create → AI creates a pull request for review
7. spec-pr-review → AI provides PR link for manual merge on GitHub
8. spec-track → Track progress anytime
```

**Note:** Without the `/te9` command, the AI will work normally without following the te9 workflow.

## What Gets Installed

- **Core files**: opencode.json, openmemory.md, README.md, te9.md
- **Invocation methods**: `/te9` command OR `te9.md` file-based command
- **7 workflow skills**: Clarify, Store, Execute, Branch-Commit, PR-Create, PR-Review, Track, Init
- **4 technical tools**: UI templates, memory graph, Svelte UI, UI generator
- **Directories**: specs/, logs/, history/, commands/

## Other Commands

**Update:**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash -s update
# Windows: te9 update
```

**Check Status:**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash -s status
# Windows: te9 status
```

## Documentation

- `te9.md` - Detailed workflow
- `openmemory.md` - Memory system
- `te9/llms.md` - AI assistant guide
- `te9/QUICKSTART.md` - Quick reference
- `te9/INSTALL_LLM.md` - LLM-native installation
- `te9/CHEATSHEET.md` - Cheat sheet

---

**Fast. Simple. Easy.** 🚀