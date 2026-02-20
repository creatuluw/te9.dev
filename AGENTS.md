## CRITICAL RULES (REFERENCES)

### OpenMemory Integration
**File**: `openmemory.md`

- **Mandatory Memory Workflow**: `openmemory.md#L56-L112`
  - Query first, analyze, incorporate, store last, maintain knowledge graph
- **CRITICAL**: Knowledge graph is MANDATORY: `openmemory.md#L5-L24`
- **User ID Rule**: Must use project folder name: `openmemory.md#L43-L55`
- **Session Variables**: Initialize first: `openmemory.md#L26-L42`
- **CREATE operations**: `openmemory.md#L141-L181`
- **READ operations**: `openmemory.md#L183-L231`
- **UPDATE operations**: `openmemory.md#L233-L260`
- **Knowledge Graph CREATE**: `openmemory.md#L314-L372`
- **Knowledge Graph READ**: `openmemory.md#L377-L451`
- **Knowledge Graph UPDATE**: `openmemory.md#L454-L471`
- **Knowledge Graph DELETE**: `openmemory.md#L473-L506`

### Workflow Rules
**File**: `.opencode/prompts/rules.md`

- **Critical Workflow Rules**: `rules.md#L372-L392`
- **Status Transitions**: `rules.md#L459-L469`
- **Error Handling**: `rules.md#L471-L495`
- **Validation Checklists**: `rules.md#L497-L545`

---

## SKILLS (REFERENCES)

### Core Skills
**Location**: `.opencode/skill/`

- `te9-init/SKILL.md` - Project initialization
- `spec-clarify/SKILL.md` - Requirements gathering
- `spec-store/SKILL.md` - Spec file creation
- `spec-execute/SKILL.md` - Implementation
- `spec-branch-commit/SKILL.md` - Branch commit & push
- `spec-pr-create/SKILL.md` - Pull request creation
- `spec-pr-review/SKILL.md` - Pull request review link
- `spec-track/SKILL.md` - Progress tracking
- `te9-update/SKILL.md` - Update checking and application

### Technical Tools
**Location**: `.opencode/tool/`

- `daisyui.ts` - UI component templates
- `knowledge_graph.ts` - Memory graph exporter
- `melt.ts` - Svelte UI builder
- `uikit.ts` - UI component generator
- `te9-update.ts` - Update management functions

---

## STATUS TRANSITIONS (REFERENCE)

```
PENDING → IN_PROGRESS → READY_FOR_COMMIT → COMPLETED
                                ↓
                              FAILED / BLOCKED
```

**Reference**: `.opencode/prompts/rules.md#L394-L404`

---

## VALIDATION CHECKLISTS (REFERENCES)

### spec-clarify → spec-store
`rules.md#L455-L463`
- Requirements understood
- Ambiguity resolved
- Max 5 questions
- User confirmed

### spec-store → spec-execute
`rules.md#L465-L475`
- Spec ID generated
- Spec file created
- Database updated
- OpenMemory updated
- Knowledge graph facts created
- Execution log initialized

### spec-execute → spec-commit
`rules.md#L477-L487`
- All requirements implemented
- Acceptance criteria verified
- Tests passing
- No regressions
- Execution log complete
- Knowledge graph updated

### Before completion
`rules.md#L489-L500`
- Commit created with spec ID
- User approved commit
- User approved push
- Changes pushed
- All logged
- OpenMemory updated

---

## MEMORY STORAGE MANDATES (REFERENCES)

### During spec-clarify
- Store conversation: `openmemory.md#L141-L181` (CREATE)

### During spec-store
- Store spec creation: `openmemory.md#L141-L181` (CREATE)
- Create knowledge graph facts: `openmemory.md#L314-L372` (KG CREATE)

### During spec-execute
- Store "started executing": `openmemory.md#L141-L181` (CREATE)
- Create facts for completed requirements: `openmemory.md#L314-L372` (KG CREATE)
- Create facts for verified criteria: `openmemory.md#L314-L372` (KG CREATE)

### During spec-commit
- Store "completed spec": `openmemory.md#L141-L181` (CREATE)

---

## CRITICAL RESTRICTIONS (REFERENCE)

**File**: `.opencode/prompts/rules.md`

- No auto-commit without approval: `rules.md#L306-L310`
- No auto-push without approval: `rules.md#L312-L316`
- Max 5 clarification questions: `rules.md#L47-L53`
- Always show previews: `rules.md#L302-L304`
- Never skip workflow steps: `rules.md#L378-L390`

---

## DOCUMENTATION INDEX (REFERENCES)

### Core Documentation
- `README.md` - Project overview
- `te9.md` - Workflow guide
- `openmemory.md` - Memory system rules
- `AI_INSTRUCTIONS.md` - Installation guide
- `AGENTS.md` - This file (workflow reference)

### AI-Specific Guides
- `.opencode/prompts/rules.md` - Mandatory workflow rules

### Configuration
- `opencode.json` - Main configuration
- `openmemory.md#L26-L42` - Session variables setup

---

## BEST PRACTICES (REFERENCES)

**Communication**: `.opencode/prompts/rules.md#L515-L522`
- Be conversational and helpful
- Keep user informed
- Never assume approval
- Always confirm before proceeding

**Code Quality**: `.opencode/prompts/rules.md#L524-L531`
- Follow existing patterns
- Test early and often
- Keep changes minimal
- Document decisions

**Logging**: `.opencode/prompts/rules.md#L533-L540`
- Log EVERYTHING
- Be specific
- Include timestamps
- Note workarounds
- Record test results

**Safety**: `.opencode/prompts/rules.md#L542-L549`
- Never auto-commit/push
- Always show previews
- Maintain complete logs

---

## SPEC FILE TEMPLATE (REFERENCE)

**File**: `.opencode/prompts/rules.md#L102-L120`

```markdown
# Spec: SPEC-<YYYYMMDD>-<HHMM>-<title-slug>

## Status
State: PENDING
Created: <timestamp>
Updated: <timestamp>

## Objective
[Clear objective statement]

## Requirements
- Requirement 1
- Requirement 2

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Context
**Original Prompt:** [user's request]
**Clarification Questions Asked:** [number]
**Key Decisions:** [list]

## Technical Notes
[Any considerations, constraints]
```

---

## COMMIT MESSAGE TEMPLATE (REFERENCE)

**File**: `.opencode/prompts/rules.md#L276-L291`

```
<type>: <spec title> [SPEC-<id>]

- Implemented all acceptance criteria
- All unit tests passing (100%)
- No regressions detected
- Code quality verified

Changes:
- [brief summary]

Spec: SPEC-<id>
Type: <feature|bugfix|refactor|other>
Priority: <priority>
```

---

## QUICK COMMANDS

### Installation
- Install: `te9 install` or `AI_INSTRUCTIONS.md#L1-L30`
- Update: `te9 update`
- Status: `te9 status`

### Workflow
- Clarify: `.opencode/skill/spec-clarify/SKILL.md`
- Store: `.opencode/skill/spec-store/SKILL.md`
- Execute: `.opencode/skill/spec-execute/SKILL.md`
- Branch Commit: `.opencode/skill/spec-branch-commit/SKILL.md`
- PR Create: `.opencode/skill/spec-pr-create/SKILL.md`
- PR Review: `.opencode/skill/spec-pr-review/SKILL.md`
- Track: `.opencode/skill/spec-track/SKILL.md`

---

## CRITICAL REMINDERS

1. **ALWAYS follow the exact 6-step sequence**: `.opencode/prompts/rules.md#L372-L392`
2. **NEVER skip steps**: `.opencode/prompts/rules.md#L378-L390`
3. **Knowledge graph is MANDATORY**: `openmemory.md#L5-L24`
4. **User ID must be project folder name**: `openmemory.md#L43-L55`
5. **Max 5 clarification questions**: `.opencode/prompts/rules.md#L47-L53`
6. **NEVER auto-commit/push**: `.opencode/prompts/rules.md#L306-L316`
7. **Log EVERYTHING**: `.opencode/prompts/rules.md#L214-L220`
8. **Store in OpenMemory**: `openmemory.md#L56-L112`

---

**Fast. Simple. Easy. Multi-Contributor Ready.**
**Fast. Simple. Easy.**
