# te9.dev LLM Quick-Start Guide

## 🎯 One-Command Installation

### For Bash (Linux, macOS, Git Bash)

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

### For Windows CMD

```cmd
te9 install --llm
```

### For Windows PowerShell

```powershell
iwr -useb https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

---

## ✅ What `--llm` Flag Does

- **Auto-initializes** git repository if needed (no prompts)
- **Auto-creates** all directory structures
- **Auto-downloads** all required files
- **Auto-initializes** specs database
- **Auto-completes** project setup (no manual skill step!)
- **Structured output** for easy parsing by LLMs

---

## 📋 Expected Output

The script will output:

```
=== TE9.DEV INSTALLATION ===
Platform: [your platform]
LLM Mode: enabled

ℹ Installing te9.dev...

✅ Created directory structure
✅ All files downloaded
✅ te9.dev/specs.json created

✅ Installation verified!

=== INSTALLATION SUMMARY ===
✅ Core files: 4/4 installed
✅ Skills: 10/10 installed
✅ Tools: 4/4 installed
✅ Prompts: 1/1 installed
✅ Directories: created
✅ Specs database: initialized
✅ Project initialized

STATUS: READY_TO_USE

🎉 te9.dev installed successfully!

te9.dev is now ready to use! No further initialization needed.

=== READY ===
You can start using the 6-step workflow immediately.

For help: https://github.com/creatuluw/te9.dev
```

---

## 🚀 What Gets Installed

### Core Files (4)
- `opencode.json` - Configuration
- `openmemory.md` - Memory system rules
- `README.md` - Project documentation
- `te9.md` - Workflow guide

### Skills (10)
- `daisyui/SKILL.md` - DAISY UI components
- `spec-branch-commit/SKILL.md` - Branch and commit workflow
- `spec-clarify/SKILL.md` - Clarification
- `spec-commit/SKILL.md` - Commit workflow
- `spec-execute/SKILL.md` - Execution
- `spec-pr-create/SKILL.md` - Pull request creation
- `spec-pr-review/SKILL.md` - Pull request review
- `spec-store/SKILL.md` - Spec storage
- `spec-track/SKILL.md` - Progress tracking
- `te9-init/SKILL.md` - Initialization

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

---

## 🔄 Update

Same command, replace `install` with `update`:

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash update
```

Update automatically backs up your files at `.te9-backup-TIMESTAMP/`.

---

## 📊 Check Status

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash status
```

---

## 🤖 LLM Instructions

### When User Requests Installation

1. **Detect user's environment** (bash or Windows)
2. **Provide the appropriate one-line command** above
3. **Run the command** with `--llm` flag
4. **Verify output** contains `STATUS: READY_TO_USE`
5. **Confirm installation** is complete

### After Installation

Tell user: "te9.dev is now installed and ready to use! You can start by describing what you want to build."

**No manual steps required!** The `--llm` flag handles everything automatically.

---

## 🆘 Troubleshooting

### "command not found"
- **Windows**: Install Git for Windows from https://git-scm.com/download/win
- Then use Git Bash terminal

### "Failed to download"
- Check internet connection
- Verify the URL matches exactly: `https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9`

### "Permission denied"
- Run with elevated privileges
- Check write permissions in project directory

---

## 📚 More Resources

- **Full Documentation**: https://github.com/creatuluw/te9.dev
- **LLM Instructions**: https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/llms.md
- **Issues**: https://github.com/creatuluw/te9.dev/issues

---

## 🎯 Key Points

1. **One URL to remember**: `https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9`
2. **One command to install**: `curl -fsSL [URL] | bash install --llm`
3. **No manual steps**: `--llm` flag handles everything
4. **Structured output**: Easy to verify installation success
5. **Cross-platform**: Works on Linux, macOS, and Windows

---

**Ready to install? Run the command above and start building! 🚀**