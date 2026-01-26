# te9.dev LLM Installation Cheat Sheet

## 🔥 One Command to Rule Them All

### THE URL (memorize this)
```
https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9
```

### THE COMMAND (copy & paste)

**Bash (Linux/macOS/Git Bash):**
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

---

## ✅ What `--llm` Does

- [x] Auto-initializes git (no prompts)
- [x] Creates all directories
- [x] Downloads all files
- [x] Initializes specs database
- [x] Completes project setup
- [x] **No manual steps!**

---

## 📊 Expected Output

```
=== TE9.DEV INSTALLATION ===
Platform: [platform]
LLM Mode: enabled

✅ Created directory structure
✅ All files downloaded
✅ te9.dev/specs.json created

=== INSTALLATION SUMMARY ===
✅ Core files: 4/4 installed
✅ Skills: 10/10 installed
✅ Tools: 4/4 installed
✅ Prompts: 1/1 installed
✅ Directories: created
✅ Specs database: initialized

STATUS: READY_TO_USE

🎉 te9.dev installed successfully!
```

---

## 🔍 Verify Installation

```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status

# Windows
te9 status
```

Look for:
- ✅ All core files present
- ✅ All 6 skills present
- ✅ Directory structure correct

---

## 🔄 Other Commands

**Update:**
```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update

# Windows
te9 update
```

**Help:**
```bash
# Bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash help

# Windows
te9 help
```

---

## 🆘 Quick Fixes

| Error | Fix |
|-------|-----|
| `command not found` | Install Git for Windows: https://git-scm.com/download/win |
| `Failed to download` | Check internet, verify URL matches exactly |
| `Permission denied` | Run with elevated privileges |
| `Not in git repo` | Script will auto-initialize in --llm mode |

---

## 📦 What Gets Installed

**Core (4):** `opencode.json`, `openmemory.md`, `README.md`, `te9.md`

**Skills (10):** `daisyui`, `spec-branch-commit`, `spec-clarify`, `spec-commit`, `spec-execute`, `spec-pr-create`, `spec-pr-review`, `spec-store`, `spec-track`, `te9-init`

**Tools (4):** `daisyui.ts`, `knowledge_graph.ts`, `melt.ts`, `uikit.ts`

**Prompts (1):** `rules.md`

**Dirs:** `.opencode/skill/`, `.opencode/tool/`, `.opencode/prompts/`, `te9.dev/specs/`, `te9.dev/logs/`, `te9.dev/history/`

---

## 🤖 For LLMs

**Installation Flow:**
1. Detect platform (bash/Windows)
2. Run appropriate one-line command with `--llm`
3. Verify output shows `STATUS: READY_TO_USE`
4. Tell user: "te9.dev is ready! Start by describing what you want to build."

**No manual steps. No skill('te9-init'). Just one command.**

---

## 📚 Full Docs

- [LLM Guide](llms.md) - Comprehensive instructions
- [Quick Start](QUICKSTART.md) - Detailed quick start
- [LLM-Native Install](INSTALL_LLM.md) - File-by-file method
- [README](README.md) - Full documentation

---

**Remember:** One URL. One command. No manual steps. Done. 🚀