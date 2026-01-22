# 🤖 AI Instructions

**To install te9.dev, run this ONE command:**

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

**Windows CMD:**
```cmd
te9 install --llm
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
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
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm

# Windows CMD
te9 install --llm

# Windows PowerShell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

**The `--llm` flag handles everything automatically:**
- ✅ Initializes git repository
- ✅ Creates all directories
- ✅ Downloads all files
- ✅ Sets up the project
- ✅ No manual steps required!

**After installation:** te9.dev is ready to use immediately. Start by describing what you want to build.

---

**For Humans:** See [te9/llms.md](te9/llms.md) for detailed AI assistant instructions.

## Workflow

```
1. User describes what they want
2. AI asks clarification questions (max 5)
3. AI saves a unique spec file
4. AI implements the feature
5. AI creates feature branch, commits, and pushes
6. AI creates a pull request for review
7. AI provides PR link for manual merge on GitHub
8. Track progress anytime
```

## What Gets Installed

- **Core files**: opencode.json, openmemory.md, README.md, te9.md
- **7 workflow skills**: Clarify, Store, Execute, Branch-Commit, PR-Create, PR-Review, Track, Init
- **4 technical tools**: UI templates, memory graph, Svelte UI, UI generator
- **Directories**: specs/, logs/, history/

## Other Commands

**Update:**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update
# Windows: te9 update
```

**Check Status:**
```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status
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