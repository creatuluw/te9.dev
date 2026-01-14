# MANDATORY WORKFLOWS

You MUST follow both workflows below for ALL development work.

---

# WORKFLOW 1: MANDATORY MEMORY WORKFLOW

## 1. QUERY FIRST

Before responding to ANY user request, you MUST query OpenMemory:

```javascript
openmemory_openmemory_query({
  query: "[relevant keywords]",
  user_id: "[user]",
  limit: 20
})
```

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
openmemory_openmemory_store({
  content: "[key learnings/decisions]",
  sector: "[episodic|semantic|procedural|emotional|reflective]",
  user_id: "[user]",
  tags: ["[relevant tags]"]
})
```

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
- Running full test suite
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
- Full test suite passes
- No regressions introduced
- Code quality meets standards

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
    "regressions": 0
  }
})
```

Event types: STARTED, PROGRESS, ISSUE, COMPLETED, FAILED, PAUSED, RESUMED, TESTED, QUERY

## CRITICAL RULES

1. **ALWAYS start with interview** - The interview skill determines if PRD is needed based on work type
2. **NEVER code without a PRD (for repo/app work)** - Always interview and create PRD first for repo work
3. **Work on ONE PRD at a time** - Execute PRDs in dependency order
4. **TEST EVERYTHING** - Never mark a PRD as DONE without passing tests
5. **LEAVE CLEAN STATE** - Code must build and all tests must pass
6. **TRACK PROGRESS** - Log all events to maintain complete history
7. **FOLLOW SKILL DEPENDENCIES**: interview → (plan) → create → execute → test → track (only for repo/app work)

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
