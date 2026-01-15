# te9.dev Development Standards

This repository uses the **te9-method** - PRD-driven development with memory-powered context.

## ⚠️ FIRST STEP

**READ THIS FILE FIRST:** **[.opencode/prompts/build.md](.opencode/prompts/build.md)**

This is the authoritative source for all workflows. Below is a quick reference.

---

## 🚀 Quick Start Commands

### OpenCode Agents
```
skill("prd-interview")      → Gather requirements
skill("prd-plan")           → Plan large projects (optional)
skill("prd-create")         → Create PRD files
skill("prd-execute")        → Implement work
skill("prd-test")           → Verify criteria
skill("prd-track")          → Log progress
openmemory_openmemory_query()   → Get context (user_id = {{PROJECT_FOLDER_NAME}})
openmemory_openmemory_store()   → Save context (user_id = {{PROJECT_FOLDER_NAME}})
```

### Zed Agents
```
@prd-interview    → Gather requirements
@prd-planning     → Plan large projects (optional)
@prd-create       → Create PRD files
@prd-execute      → Implement work
@prd-testing      → Verify criteria
@prd-tracking     → Log progress
```

---

## 📋 When to Use What

| Situation | Command Sequence |
|-----------|-----------------|
| New feature/bugfix/refactor | interview → create → execute → test → track |
| Large/complex project | interview → plan → create → (execute → test → track) × N |
| Single prompt work | interview (select "Single Prompt") → execute directly → store memory |
| Any response | **ALWAYS**: query memory → respond → store memory |

---

## 📁 Directory Structure

### `.opencode/` - Canonical Source
- **`prompts/build.md`** - Mandatory workflows (READ THIS)
- **`skill/`** - All skill implementations (interview, plan, create, execute, test, track)
- **`tool/`** - Tools (daisyui, knowledge_graph, melt, uikit)

### `.zed/` - Zed- Compatible Rules
- **`rules/`** - Lightweight wrappers referencing `.opencode`

Both platforms execute identical processes from the same source.

---

## ✅ Mandatory Rules

1. **Query memory before every response**
2. **Store memory after important interactions**
3. **ALWAYS start with interview** - The interview determines work type and if PRD is needed
4. **NEVER code without a PRD (for New Project, Feature, Refactor, Bugfix, Other work types)**
5. **Work on ONE PRD at a time**
6. **TEST EVERYTHING** - no PRD is DONE without passing tests
7. **LEAVE CLEAN STATE** - code builds, tests pass
8. **TRACK ALL PROGRESS** - log every event (only for PRD work types)

---

## 🏗 Project Structure (Auto-Created)

```
dev/
├── prd/
│   ├── prd.json          # PRD database
│   ├── runs/<prd-id>/    # PRD execution folders
│   └── logs/<prd-id>.md  # Progress logs
└── interviews/           # Interview transcripts
```

**PRD Status:** TODO → IN_PROGRESS → DONE / FAILED / PAUSED / BLOCKED

---

## 📚 Key References

- **[.opencode/prompts/build.md](.opencode/prompts/build.md)** - Complete workflows
- **[.opencode/skill/README.md](.opencode/skill/README.md)** - Skill documentation
- **[.opencode/skill/OPENMEMORY.md](.opencode/skill/OPENMEMORY.md)** - Memory system
- **[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)** - Session variable setup ({{PROJECT_FOLDER_NAME}}, MCP configuration)
- **[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)** - API endpoint mappings and tool function specifications
- **MCP Configuration**: OpenMemory accessed via `https://openmemory-production-f483.up.railway.app/mcp` (configured in [opencode.json](opencode.json))
- **[.zed/rules/README.md](.zed/rules/README.md)** - Zed integration

---

## 💡 Memory Workflow (Step-by-Step)

**IMPORTANT:** The `user_id` parameter MUST always be set to `{{PROJECT_FOLDER_NAME}}` variable (which contains project folder name, not full path) for proper context isolation between projects.

**Session Setup:** Before any OpenMemory operations, following variable MUST be initialized: `{{PROJECT_FOLDER_NAME}}` = folder name extracted from working directory (e.g., "te9.dev", "myproject", "recipes-app"). See [.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md) for complete setup guide including MCP configuration.

**Before responding:**
```javascript
openmemory_openmemory_query({
  query: "[relevant keywords]",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Variable auto-resolves to folder name, e.g., "te9.dev"
  limit: 20
})
```

**After important interaction:**
```javascript
openmemory_openmemory_store({
  content: "[decision/learning]",
  sector: "episodic|semantic|procedural|emotional|reflective",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Variable auto-resolves to folder name, e.g., "te9.dev"
  tags: ["[tags]"] // PRD-ID: PRD-001, etc. OR feature name, user story, etc. OR work type
})
```

---

## 💡 PRD Workflow (Step-by-Step)

1. **Interview** - Start with work type question:
   - **New Project** → Creating entirely new application or system from scratch
   - **New Feature** → Adding new functionality to existing system
   - **Refactor** → Improving existing code structure or performance
   - **Bugfix** → Fixing identified issues or defects
   - **Other** → Infrastructure, documentation, research, or other work
   - **Single Prompt** → Skip PRD, execute immediately

2. **If work type = Single Prompt** → Execute directly (skip all PRD steps)

3. **If work type = other options** → Continue with PRD workflow:
   - Complete remaining 8 questions (title, description, criteria, priority, dependencies, tech, constraints, notes)
2. **Plan** - Split into 3-7 criteria per PRD if >10 criteria or >500 words
3. **Create** - Generate PRD files in `/dev/prd/runs/`
4. **Execute** - Implement per acceptance criteria
5. **Test** - Verify all criteria, check regressions
6. **Track** - Log: STARTED, PROGRESS, ISSUE, COMPLETED, FAILED

---

**Remember: Always reference [build.md](.opencode/prompts/build.md) for complete details.**
