# te9.dev LLM-Native Installation Guide

This guide enables AI assistants with file system access to install te9.dev **without using bash or curl**. Instead, the LLM uses its native file operations to download and create files directly.

## 🎯 Overview

The LLM will:
1. Download core configuration files from GitHub
2. Create directory structure
3. Download skill definitions
4. Download technical tools
5. Initialize specs database
6. Verify installation

## 📦 Files to Download

### Base URL for All Files
```
https://raw.githubusercontent.com/creatuluw/te9.dev/main
```

### Step 1: Download Core Files (4 files)

Download these to the project root:

| File | URL |
|------|-----|
| `opencode.json` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/opencode.json` |
| `openmemory.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/openmemory.md` |
| `README.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/README.md` |
| `te9.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9.md` |

### Step 2: Create Directory Structure

Create these directories:

```
.opencode/skill/te9-init/
.opencode/skill/spec-clarify/
.opencode/skill/spec-store/
.opencode/skill/spec-execute/
.opencode/skill/spec-commit/
.opencode/skill/spec-track/
.opencode/tool/
te9.dev/specs/
te9.dev/logs/
te9.dev/history/
```

### Step 3: Download Skills (6 files)

| Destination | URL |
|-------------|-----|
| `.opencode/skill/te9-init/SKILL.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/te9-init/SKILL.md` |
| `.opencode/skill/spec-clarify/SKILL.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/spec-clarify/SKILL.md` |
| `.opencode/skill/spec-store/SKILL.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/spec-store/SKILL.md` |
| `.opencode/skill/spec-execute/SKILL.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/spec-execute/SKILL.md` |
| `.opencode/skill/spec-commit/SKILL.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/spec-commit/SKILL.md` |
| `.opencode/skill/spec-track/SKILL.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/spec-track/SKILL.md` |

### Step 4: Download Skill README (1 file)

| Destination | URL |
|-------------|-----|
| `.opencode/skill/README.md` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/skill/README.md` |

### Step 5: Download Tools (4 files, optional but recommended)

| Destination | URL |
|-------------|-----|
| `.opencode/tool/daisyui.ts` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/tool/daisyui.ts` |
| `.opencode/tool/knowledge_graph.ts` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/tool/knowledge_graph.ts` |
| `.opencode/tool/melt.ts` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/tool/melt.ts` |
| `.opencode/tool/uikit.ts` | `https://raw.githubusercontent.com/creatuluw/te9.dev/main/.opencode/tool/uikit.ts` |

### Step 6: Initialize Specs Database

Create file `te9.dev/specs.json` with this content:

```json
{
  "specs": [],
  "current": null,
  "version": "1.0.0"
}
```

### Step 7: Initialize Project

Create file `te9.dev/.initialized` with this content:

```json
{
  "initialized_at": "[CURRENT_TIMESTAMP_UTC]",
  "project_name": "[PROJECT_NAME]",
  "project_path": "[FULL_PROJECT_PATH]",
  "version": "1.0.0",
  "method": "llm-native"
}
```

Replace placeholders:
- `[CURRENT_TIMESTAMP_UTC]`: Current time in ISO 8601 format (e.g., `2024-01-20T12:00:00Z`)
- `[PROJECT_NAME]`: Name of the project directory
- `[FULL_PROJECT_PATH]`: Full absolute path to project

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] `opencode.json` exists in project root
- [ ] `openmemory.md` exists in project root
- [ ] `README.md` exists in project root
- [ ] `te9.md` exists in project root
- [ ] `.opencode/skill/te9-init/SKILL.md` exists
- [ ] `.opencode/skill/spec-clarify/SKILL.md` exists
- [ ] `.opencode/skill/spec-store/SKILL.md` exists
- [ ] `.opencode/skill/spec-execute/SKILL.md` exists
- [ ] `.opencode/skill/spec-commit/SKILL.md` exists
- [ ] `.opencode/skill/spec-track/SKILL.md` exists
- [ ] `.opencode/tool/daisyui.ts` exists (optional)
- [ ] `.opencode/tool/knowledge_graph.ts` exists (optional)
- [ ] `.opencode/tool/melt.ts` exists (optional)
- [ ] `.opencode/tool/uikit.ts` exists (optional)
- [ ] `te9.dev/specs/` directory exists
- [ ] `te9.dev/logs/` directory exists
- [ ] `te9.dev/history/` directory exists
- [ ] `te9.dev/specs.json` exists with valid JSON
- [ ] `te9.dev/.initialized` exists with valid JSON

## 🚀 Installation Complete!

If all checks pass, te9.dev is installed and ready to use. The user can now:

1. Start by describing what they want to build
2. The LLM will use the 6-step te9.dev workflow:
   - Ask clarification questions (spec-clarify)
   - Create a unique spec file (spec-store)
   - Implement the feature (spec-execute)
   - Create git commit (spec-commit)
   - Track progress (spec-track)

## 🔄 Alternative: Hybrid Installation

If the LLM can execute shell commands, use the bash script instead (faster and more reliable):

```bash
curl -fsSL https://raw.githubusercontent.com/creatuluw/te9.dev/main/te9/te9 | bash install --llm
```

## 📚 File Purposes

### Core Files
- `opencode.json`: Main configuration for the te9.dev system
- `openmemory.md`: Rules and guidelines for the AI memory system
- `README.md`: Project documentation
- `te9.md`: Workflow guide explaining the 6-step process

### Skills
Each skill defines a step in the 6-step workflow:
- `te9-init`: Initialize project structure (done automatically in this guide)
- `spec-clarify`: Ask up to 5 clarification questions before starting
- `spec-store`: Create a unique spec file for each request
- `spec-execute`: Implement the spec and log all work
- `spec-commit`: Create git commits and ask for push approval
- `spec-track`: Show progress and status at any time

### Tools
Technical utilities for specific tasks:
- `daisyui.ts`: Generate DaisyUI component templates
- `knowledge_graph.ts`: Export memory system as a graph
- `melt.ts`: Build Svelte UI components
- `uikit.ts`: Generate UI components from descriptions

### Directories
- `te9.dev/specs/`: Stores spec files (one per request)
- `te9.dev/logs/`: Stores execution logs from spec-execute
- `te9.dev/history/`: Git history tracking

## 🆘 Troubleshooting

### Download Failed
- Try downloading files manually in a browser first to verify URLs
- Check network connectivity
- Verify the base URL is correct: `https://raw.githubusercontent.com/creatuluw/te9.dev/main`

### Directory Creation Failed
- Check write permissions in project directory
- Ensure parent directories exist before creating nested ones

### JSON Validation Failed
- Use a JSON validator to check the content of `.initialized` and `specs.json`
- Ensure all placeholders are replaced with actual values

## 📝 Installation Summary

- **Total files to download**: 15 (11 required + 4 optional tools)
- **Total directories to create**: 10
- **Total files to create manually**: 2 (specs.json, .initialized)
- **Estimated time**: 2-5 minutes depending on file sizes and network speed

## 🎯 Success Criteria

Installation is successful when:
1. All core files are present in project root
2. All 6 skill files are present in `.opencode/skill/`
3. All 3 te9.dev directories are created
4. `specs.json` contains valid JSON with "specs": []
5. `.initialized` contains valid JSON with project details
6. User can start using the 6-step workflow immediately

---

**For AI Assistants**: Follow this guide step-by-step. After each major step (core files, skills, tools, initialization), report progress to the user.

**For Users**: This installation method works entirely through the LLM's file operations. No shell commands or external tools required!