# 🚀 Install te9.dev

## One Command to Install

**Linux / macOS / Git Bash:**
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

## What Happens

The `--llm` flag does EVERYTHING automatically:

- ✅ Initializes git repository (no prompts)
- ✅ Creates all directories
- ✅ Downloads all required files
- ✅ Initializes specs database
- ✅ Completes project setup

**No manual steps required.**

---

## Success Indicator

Look for this in the output:

```
STATUS: READY_TO_USE
```

When you see this, tell the user:

> "te9.dev is installed and ready! Start by describing what you want to build."

---

## If It Fails

| Error | Solution |
|-------|----------|
| `command not found` | Install Git for Windows: https://git-scm.com/download/win |
| `Failed to download` | Check internet, verify URL matches exactly |
| `Permission denied` | Run with elevated privileges |

---

## That's It

One command. No setup. Ready to use.

**Fast. Simple. Easy.** 🚀