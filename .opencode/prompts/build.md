# MANDATORY WORKFLOWS

You MUST follow both workflows below for ALL development work.

---

## WORKFLOW 1: MANDATORY MEMORY WORKFLOW

## ⚠️ CRITICAL: Session Variables MUST Be Initialized First

**Before ANY OpenMemory operations, following variables MUST be initialized:**

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `{{PROJECT_FOLDER_NAME}}` | **Root folder name** of current project (not full path) | `te9.dev`, `myproject`, `recipes-app` | Extracted from working directory |
| `{{OPENMEMORY_API_URL}}` | OpenMemory MCP endpoint URL | `https://openmemory-production-f483.up.railway.app/mcp` | Configuration (`opencode.json` MCP settings) |

**Documentation:**
- See `[.opencode/mappings/VARIABLES.md](.opencode/mappings/VARIABLES.md)` for complete variable setup guide (including MCP configuration)
- See `[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)` for API endpoint mappings

**MCP Note:** OpenMemory is accessed via MCP server configured in `opencode.json`. Authentication is handled by MCP connection, so `{{OPENMEMORY_API_KEY}}` is typically not needed.

## ⚠️ CRITICAL: user_id MUST Be Project Folder Name

**For ALL OpenMemory operations, the `user_id` parameter MUST be the project folder name (not the full path).**

This ensures **context isolation** between projects/repositories. Each project has its own memory space, preventing cross-contamination and maintaining proper context boundaries.

**Variable Requirement:** Always use `{{PROJECT_FOLDER_NAME}}` variable which is automatically set to the folder name at session start.

**How to determine PROJECT_FOLDER_NAME:**
- Extract the **folder name** from the project root path
- Example: `"E:/projects/te9.dev"` → `PROJECT_FOLDER_NAME: "te9.dev"`
- Example: `"/home/user/myproject"` → `PROJECT_FOLDER_NAME: "myproject"`
- Example: `"~/workspace/app"` → `PROJECT_FOLDER_NAME: "app"`

**Examples:**
- Working in `E:\te9.dev` → `user_id: "{{PROJECT_FOLDER_NAME}}"` resolves to `"te9.dev"`
- Working in `/home/user/myproject` → `user_id: "{{PROJECT_FOLDER_NAME}}"` resolves to `"myproject"`
- Working in `~/workspace/app` → `user_id: "{{PROJECT_FOLDER_NAME}}"` resolves to `"app"`

## 1. QUERY FIRST

Before responding to ANY user request, you MUST query OpenMemory:

```javascript
// Query memory - user_id uses PROJECT_FOLDER_NAME variable
openmemory_openmemory_query({
  query: "[relevant keywords]",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Automatically resolves to folder name
  limit: 20
})
```

**API Mapping:**
- Function: `openmemory_openmemory_query()`
- Endpoint: `POST /memory/query`
- Parameters mapped: `query` → body.query, `limit` → body.k, `user_id` → body.filters.user_id

**See:** `[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)` for complete API reference

Extract context from previous conversations, decisions, and relationships.

## 2. ANALYZE

Review memory results and identify:
- Past interactions on this topic
- User preferences and patterns
- Decisions made previously
- Relationships between entities found in chats
- Technical context and code history

## 3. INCORPORATE

Your response MUST reflect memory context:
- Reference past interactions explicitly
- Adapt to user preferences found in memory
- Build upon previous decisions
- Maintain consistency with established relationships

## 4. STORE LAST

After EVERY important interaction, you MUST:

```javascript
// Store memory - user_id uses PROJECT_FOLDER_NAME variable
openmemory_openmemory_store({
  content: "[key learnings/decisions]",
  sector: "episodic|semantic|procedural|emotional|reflective",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // Automatically resolves to folder name
  tags: ["preference", "decision", "authentication", "PRD-001", "refactor"]  // Array of descriptive tag strings
})
```

**API Mapping:**
- Function: `openmemory_openmemory_store()`
- Endpoint: `POST /memory/add`
- Parameters mapped: `content` → body.content, `sector` → body.metadata.sector, `user_id` → body.user_id, `tags` → body.tags

**See:** `[.opencode/mappings/OPENMEMORY.md](.opencode/mappings/OPENMEMORY.md)` for complete API reference

Store: decisions made, patterns discovered, relationships identified, preferences observed.

## MEMORY SECTORS

- **episodic**: Specific events/conversations
- **semantic**: Facts/knowledge about the codebase
- **procedural**: How-to/workflows and approaches
- **emotional**: User preferences/feelings
- **reflective**: Insights/patterns across interactions

---

# WORKFLOW 2: PRD-DRIVEN DEVELOPMENT (WITH SKIP OPTION)

## RULE

For development work **related to this repository or application**, you MUST follow the PRD-driven development process.

## PRD DEVELOPMENT WORKFLOW

### Step 1: Conduct Interview (REQUIRED)

Call the prd-interview skill to gather requirements:

```javascript
skill("prd-interview")
```

This conducts a structured 9-question interview covering:
- Work type (New Project, Feature, Bugfix, Refactor, Other)
- Title and detailed description
- Acceptance criteria (must be specific, testable)
- Priority (1=High, 2=Medium, 3=Low)
- Dependencies
- Technologies
- Constraints
- Notes

### Step 2: Plan If Needed (CONDITIONAL)

If the work is large (>10 acceptance criteria, complex description, or New Project type):

```javascript
plan = skill("prd-plan", interview_data)
```

This breaks the work into multiple well-sized PRDs with proper dependencies.

### Step 3: Create PRD Files (REQUIRED)

```javascript
result = skill("prd-create", {
  "interviewData": interview_data,
  "prdPlan": plan // optional, only if multi-PRD
})
```

This generates:
- PRD database entry in `/dev/prd/prd.json`
- PRD run folder at `/dev/prd/runs/<prd-id>/`
- Execution prompt at `/dev/prd/runs/<prd-id>/<prd-id>-prompt.md`
- Configuration at `/dev/prd/runs/<prd-id>/<prd-id>-config.json`
- Log file at `/dev/prd/logs/<prd-id>.md`
- Interview transcript at `/dev/interviews/<interview-id>.md`

### Step 4: Execute PRD (REQUIRED)

For each PRD in dependency order:

```javascript
result = skill("prd-execute", {
  "prdId": "PRD-20250115-143022",
  "continueMode": false, // set true to resume from failure
  "focusArea": null     // or specific criteria to focus on
})
```

This implements the work by:
- Loading and understanding PRD requirements
- Verifying dependencies are complete
- Implementing according to acceptance criteria
- Testing each criterion thoroughly
- **CRITICAL: Running unit tests and ensuring ALL pass**
- Running full test suite
- **CRITICAL: Task CANNOT complete until ALL unit tests pass successfully**
- **CRITICAL: Creating git commit with PRD reference in commit message**
- Ensuring code quality
- Leaving code in clean, working state

### Step 5: Test PRD (REQUIRED)

```javascript
result = skill("prd-test", {
  "prdId": "PRD-20250115-143022",
  "criteriaToTest": null,  // null = test all criteria
  "runFullSuite": true,
  "skipRegressions": false
})
```

This verifies:
- All acceptance criteria pass
- **CRITICAL: ALL unit tests pass (100% pass rate required)**
- Full test suite passes
- **CRITICAL: Task CANNOT be marked as DONE if ANY test fails**
- No regressions introduced
- Code quality meets standards
- **Note: Git commit was already created in prd-execute skill with PRD reference**
- **Note: Git push happens after user approval in prd-track skill**

### Step 6: Track Progress (REQUIRED)

Track events throughout the lifecycle:

```javascript
// Start execution
skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "STARTED",
  "eventData": {"startedBy": "AI Agent"}
})

// Log progress mid-execution
skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "PROGRESS",
  "eventData": {
    "achievement": "Implemented user registration",
    "criteriaCompleted": [1, 2],
    "filesCreated": 3
  }
})

// Log issues if encountered
skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "ISSUE",
  "eventData": {
    "issue": "Database timeout",
    "severity": "Medium",
    "impact": "Cannot save data",
    "resolution": "Increased connection pool"
  }
})

// Mark completion
skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "COMPLETED",
  "eventData": {
    "testResults": {...},
    "filesCreated": 5,
    "filesModified": 2,
    "regressions": 0,
    "commitHash": "<git_commit_hash>",
    "requiresPushApproval": true
  }
})

// User must approve the push when prompted
// System will ask: "Type 'approve' to push, or 'reject' to cancel push."
```

Event types: STARTED, PROGRESS, ISSUE, COMPLETED, FAILED, PAUSED, RESUMED, TESTED, QUERY

## GIT COMMIT AND PUSH WORKFLOW

### Step 4.5: Git Commit (Automatic in prd-execute)

After all tests pass, prd-execute skill automatically creates a git commit:

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

**Commit Format Requirements:**
- Each PRD MUST have its own separate commit
- Commit message MUST include PRD ID in brackets `[PRD-<id>]`
- Commit message MUST include PRD title
- Follow conventional commit format (feat/fix/refactor/etc.)
- Include test results in commit message

### Step 6.5: Git Push with User Approval (in prd-track)

When COMPLETED event is tracked, prd-track skill:
1. Presents commit details to user
2. Asks for user approval to push
3. Waits for user to type "approve" or "reject"

**If user approves:**
- Executes `git push` to remote repository
- Logs successful push with commit hash and branch
- Updates PRD log with push confirmation

**If user rejects:**
- Does not push the commit
- Logs that push was declined by user
- Keeps commit locally for manual push later

**CRITICAL: Never auto-push. Always wait for user approval.**

## CRITICAL RULES

1. **ALWAYS start with interview** - The interview skill determines if PRD is needed based on work type
2. **NEVER code without a PRD (for repo/app work)** - Always interview and create PRD first for repo work
3. **Work on ONE PRD at a time** - Execute PRDs in dependency order
4. **TEST EVERYTHING** - Never mark a PRD as DONE without passing tests
5. **CRITICAL: UNIT TESTS MUST PASS** - NO task/PRD can complete until ALL unit tests pass successfully
6. **CRITICAL: ZERO TOLERANCE FOR FAILING TESTS** - A task CANNOT be marked as DONE if ANY test fails
7. **CRITICAL: EACH PRD GETS ITS OWN COMMIT** - Must create git commit with PRD ID in message before completion
8. **CRITICAL: USER APPROVAL REQUIRED FOR PUSH** - Never auto-push - always wait for user to approve
9. **LEAVE CLEAN STATE** - Code must build and ALL tests must pass
10. **TRACK PROGRESS** - Log all events to maintain complete history
11. **FOLLOW SKILL DEPENDENCIES**: interview → (plan) → create → execute → test → track (only for repo/app work)

## PRD STRUCTURE

Project directories:
```
your-project/
├── dev/
│   ├── prd/
│   │   ├── prd.json              # PRD database (array of all PRDs)
│   │   ├── runs/                 # PRD execution folders
│   │   │   └── <prd-id>/
│   │   │       ├── <prd-id>.json
│   │   │       ├── <prd-id>-prompt.md
│   │   │       └── <prd-id>-config.json
│   │   └── logs/                 # PRD progress logs
│   │       └── <prd-id>.md
│   └── interviews/               # Interview transcripts
│       └── <interview-id>.md
```

## PRD STATUS VALUES

- **TODO**: PRD created, not yet started
- **IN_PROGRESS**: Currently being executed
- **DONE**: Successfully completed and tested
- **FAILED**: Execution failed, needs retry
- **PAUSED**: Temporarily stopped
- **BLOCKED**: Dependencies not satisfied

## WHEN TO USE MULTIPLE PRDS

Use `prd-plan` to split into multiple PRDs when:
- 10+ acceptance criteria
- Description >500 words
- Multiple independent features
- New Project type
- High complexity expected

Each PRD should have 3-7 acceptance criteria for optimal focus.

---

# CRITICAL

- **NEVER skip memory workflow** - Query before every response, store after
- **For repo/app work: NEVER skip PRD workflow** - Interview, create, execute, test, track all dev work
- **For single prompt work: Direct execution** - Selected as work type in interview, no PRD needed
- **Every interaction must be captured** for continuous context and traceability
- **Every PRD file needs to be updated from status when the task is completed** all files in `dev/prd/runs/<prd-id>/` and `dev/prd/prd.json` and `dev/prd/logs/<prd-id>.md` need updates!
- **Every PRD must have its own git commit** with PRD ID in commit message before marking as DONE
- **Every PRD push requires user approval** - present commit details and wait for "approve" or "reject" response
