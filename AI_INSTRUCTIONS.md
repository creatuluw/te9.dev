# AI Instructions - Install te9.dev

## 🚀 Quick Installation

**Run this ONE command to install te9.dev:**

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

---

## ✅ What the --llm flag does:

- ✓ Auto-initializes git (no prompts)
- ✓ Creates all directories automatically
- ✓ Downloads all required files
- ✓ Initializes specs database
- ✓ Sets up the entire project
- ✓ **No manual steps required**

---

## 📊 Success Indicator:

Look for this output:
```
STATUS: READY_TO_USE
```

Then tell the user: "te9.dev is installed and ready! Start the te9 workflow by typing `/te9` or adding the `te9.md` file to your context."

---

## 🔍 If Installation Fails:

1. **Windows users**: Install Git for Windows from https://git-scm.com/download/win
2. **Verify URL**: Make sure it matches exactly: `https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9`
3. **Check internet**: Ensure network connectivity
4. **Run status check**: `te9 status` to see what's missing

---

## 📚 More Documentation:

---

## 💡 That's It!

One command. No manual steps. Ready to use.

## ⚠️ IMPORTANT: How to Start the Workflow

There are two ways to start the te9.dev workflow:

**Method 1: /te9 Command**
1. User types `/te9` (with optional prompt: `/te9 <your request>`) in the OpenCode interface
2. The workflow begins automatically with spec-clarify

**Method 2: File-Based Command**
1. User adds `te9.md` file to the LLM context (by dragging, mentioning, or attaching)
2. The workflow begins immediately (no /te9 command needed)

**Without `/te9` command or `te9.md` file, the AI will work normally without following the te9 workflow.**

**Fast. Simple. Easy.** 🚀