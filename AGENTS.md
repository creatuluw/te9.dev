# te9.dev Development Standards

This repository uses **te9-method** - PRD-driven development with memory-powered context.

## ⚠️ FIRST STEP

**READ THIS FILE FIRST:** **[.opencode/prompts/build.md](.opencode/prompts/build.md)**

This is the authoritative source for all workflows. Below is a quick reference.

---

## 🚀 Quick Start Commands

### OpenCode Agents
```
@prd                  → Create PRDs to define new work
@work                 → Check PRD status & guide on starting work
@prd-interview        → Gather requirements
@prd-plan             → Plan large projects (optional)
@prd-create           → Create PRD files
@prd-execute          → Implement work + create git commit ✍️
@prd-test             → Verify criteria (100% test pass required) 🧪
@prd-track            → Log progress + user approval for push 👤
openmemory_openmemory_query()   → Get context (user_id = {{PROJECT_FOLDER_NAME}})
openmemory_openmemory_store()   → Save context (user_id = {{PROJECT_FOLDER_NAME}})
```

### Zed Agents
```
@prd                  → Create PRDs to define new work
@work                 → Check PRD status & guide on starting work
@prd-interview        → Gather requirements
@prd-planning         → Plan large projects (optional)
@prd-create           → Create PRD files
@prd-execute          → Implement work + create git commit ✍️
@prd-testing          → Verify criteria (100% test pass required) 🧪
@prd-tracking         → Log progress + user approval for push 👤
```

---

## 📋 When to Use What

| Situation | Command Sequence |
|-----------|-----------------|
| Start BUILD agent | Query memory → Ask orientation (Create/Execute PRDs) → Proceed based on choice |
| Define new work | @prd → Interview → (plan) → create PRDs |
| Work on existing PRDs | @work → See status → @prd-execute → @prd-test → @prd-track |
| New feature/bugfix/refactor | @prd → interview → create → execute → test → track (includes commit & push approval) |
| Large/complex project | @prd → interview → plan → create → (execute → test → track) × N (each PRD gets own commit) |
| Single prompt work | @prd → interview (select "Single Prompt") → execute directly → store memory |
| Any response | **ALWAYS**: query memory → respond → store memory |

---

## 📁 Directory Structure

### `.opencode/` - Canonical Source
- **`prompts/build.md`** - Mandatory workflows (READ THIS)
- **`agent/`** - Agent definitions (@prd, @work, and others)
- **`skill/`** - All skill implementations (interview, plan, create, execute, test, track)
- **`tool/`** - Tools (daisyui, knowledge_graph, melt, uikit)
- **`documentation/`** - Detailed guides:
  - `UNIT_TEST_REQUIREMENT.md` - 100% test pass requirement
  - `GIT_COMMIT_AND_PUSH_WORKFLOW.md` - Git workflow with user approval
- **`quick-reference/`** - Quick reference cards and cheat sheets

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
6. **🧪 CRITICAL: UNIT TESTS MUST PASS** - 100% pass rate required, ZERO tolerance for failures
7. **✍️ CRITICAL: EACH PRD GETS ITS OWN COMMIT** - Must create git commit with PRD ID in message before completion
8. **👤 CRITICAL: USER APPROVAL REQUIRED FOR PUSH** - Never auto-push, always wait for user approval
9. **LEAVE CLEAN STATE** - Code must build and ALL tests must pass
10. **TRACK ALL PROGRESS** - Log every event (only for PRD work types)

---

## 🧪 Unit Test Requirements

### What This Means
- **100% Pass Rate** - All unit tests must pass before any PRD can be marked as DONE
- **Zero Tolerance** - No exceptions, no skipping, no "fix later"
- **Blocking** - Failing tests block entire development workflow
- **Before Commit** - Tests must pass before git commit is created

### Test Flow
```
Implementation → Unit Tests →
┌─ PASS ✅ (100%) → Create git commit → User approval → Push
└─ FAIL ❌ → Fix → Retry tests → Repeat until PASS
```

**Complete documentation:** `[.opencode/documentation/UNIT_TEST_REQUIREMENT.md](.opencode/documentation/UNIT_TEST_REQUIREMENT.md)`

---

## ✍️ Git Commit & Push Workflow

### What This Means
- **One Commit Per PRD** - Each completed PRD gets its own separate git commit
- **PRD ID Required** - Commit message MUST include `[PRD-<id>]` in brackets
- **Proper Format** - Follow conventional commit format (feat/fix/refactor/etc.)
- **Test Results** - Include "All unit tests passing (100%)" in commit message
- **User Approval** - Never auto-push - always wait for user to approve

### Commit Message Format
```bash
git commit -m "feat: <PRD title> [PRD-<id>]

- Implemented all acceptance criteria
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

PRD: PRD-<id>
Type: <type>
Priority: <priority>"
```

### Push Approval Process
1. **After PRD completes**, system presents commit details to user
2. **User reviews** commit message, files changed, test results
3. **User types** `approve` or `reject`:
   - `approve` → Execute `git push` → Log success
   - `reject` → Commit stays local → Log declined

**Complete documentation:** `[.opencode/documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md](.opencode/documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md)`

---

## 🏗 Project Structure (Auto-Created)

```
dev/
├── prd/
│   ├── prd.json          # PRD database
│   ├── runs/<prd-id>/    # PRD execution folders
│   └── logs/<prd-id>.md  # Progress logs (includes git commit/push info)
└── interviews/           # Interview transcripts
```

**PRD Status:** TODO → IN_PROGRESS → DONE / FAILED / PAUSED / BLOCKED

---

## 📚 Key References

### Core Documentation
- **[.opencode/prompts/build.md](.opencode/prompts/build.md)** - Complete workflows (READ THIS FIRST)
- **[.opencode/skill/README.md](.opencode/skill/README.md)** - Skill documentation
- **[.opencode/documentation/UNIT_TEST_REQUIREMENT.md](.opencode/documentation/UNIT_TEST_REQUIREMENT.md)** - Test requirements guide
- **[.opencode/documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md](.opencode/documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md)** - Git workflow guide

### Quick References
- **[.opencode/quick-reference/README.md](.opencode/quick-reference/README.md)** - Quick reference index
- **[.opencode/quick-reference/WORKFLOW_SUMMARY.md](.opencode/quick-reference/WORKFLOW_SUMMARY.md)** - Complete workflow card
- **[.opencode/quick-reference/GIT_COMMIT_PUSH.md](.opencode/quick-reference/GIT_COMMIT_PUSH.md)** - Git quick reference

### Memory System
- **[.opencode/skill/OPENMEMORY.md](.opencode/skill/OPENMEMORY.md)** - Memory system
- **[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)** - Session variable setup ({{PROJECT_FOLDER_NAME}}, MCP configuration)
- **[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)** - API endpoint mappings and tool function specifications
- **MCP Configuration**: OpenMemory accessed via `https://openmemory-production-f483.up.railway.app/mcp` (configured in [opencode.json](opencode.json))

### Zed Integration
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

1. **Session Start** - BUILD agent starts by:
   - Querying memory (Mandatory Workflow 1)
   - Asking orientation: "Create PRDs" or "Execute PRDs"
   - Directing to appropriate agent based on choice

2. **If "Create PRDs"** → Invoke @prd agent:
   - Interview - Start with work type question:
     - **New Project** → Creating entirely new application or system from scratch
     - **New Feature** → Adding new functionality to existing system
     - **Refactor** → Improving existing code structure or performance
     - **Bugfix** → Fixing identified issues or defects
     - **Other** → Infrastructure, documentation, research, or other work
     - **Single Prompt** → Skip PRD, execute immediately

3. **If "Execute PRDs"** → Invoke @work agent:
   - Display PRD status overview
   - Guide user on starting work
   - Recommend which PRD to work on next

4. **For PRD Creation** (via @prd):
   - If work type = Single Prompt → Execute directly (skip all PRD steps)
   - If work type = other options → Continue with PRD workflow:
     - Complete remaining 8 questions (title, description, criteria, priority, dependencies, tech, constraints, notes)
   - Plan - Split into 3-7 criteria per PRD if >10 criteria or >500 words
   - Create - Generate PRD files in `/dev/prd/runs/`

5. **For PRD Execution** (via @prd-execute):
   - Implement per acceptance criteria
   - Test each criterion
   - Run unit tests → Must pass 100% 🧪
   - Create git commit with PRD ID ✍️

6. **Test** - Verify all criteria, check regressions, confirm 100% test pass rate 🧪

7. **Track** - Log: STARTED, PROGRESS, ISSUE, COMPLETED
   - Present commit for user approval 👤
   - Execute git push if approved
   - Log push result

---

## 🎯 Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRD-DRIVEN DEVELOPMENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                               │
│  1. SESSION START                                             │
│      ├─ Query memory (always)                               │
│      └─ Ask orientation: Create PRDs or Execute PRDs?        │
│                                                               │
│  2. IF CREATE PRDs → @prd agent:                             │
│      ├─ INTERVIEW → Gather requirements                      │
│      ├─ PLAN       → Break into PRDs if needed               │
│      └─ CREATE     → Generate PRD files                     │
│                                                               │
│  3. IF EXECUTE PRDs → @work agent:                          │
│      ├─ Display PRD status                                  │
│      ├─ Guide user on starting work                         │
│      └─ Recommend which PRD to work on                       │
│                                                               │
│  4. EXECUTE   → Implement work (via @prd-execute)           │
│                  ├─ Implement acceptance criteria            │
│                  ├─ Test each criterion                     │
│                  ├─ Run unit tests (100% required) 🧪        │
│                  ├─ Create git commit ✍️                    │
│                  └─ Include PRD ID in message            │
│                                                               │
│  5. TEST      → Verify all criteria (via @prd-test)        │
│                                                               │
│  6. TRACK     → Log completion (via @prd-track)           │
│                  ├─ Present commit details                 │
│                  ├─ Ask for user approval 👤              │
│                  └─ Wait for "approve" or "reject"     │
│                                                               │
│  7. PUSH      → Execute git push if approved ✅        │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Remember:**
- 🧪 **Tests MUST pass** (100%) before any commit is created
- ✍️ **Each PRD gets its own commit** with PRD ID in message
- 👤 **User approval is mandatory** before pushing to remote
- ✅ **Quality and control are non-negotiable**

---

**Remember: Always reference [build.md](.opencode/prompts/build.md) for complete details.**