---
name: prd-create
description: Generate PRD files, update database, create run folders with templates, and initialize logs
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-creation
  depends-on: [prd-interview, prd-plan]
---

# PRD Creation Skill

## What I Do

I create all necessary files for PRD execution:
- Update the PRD database (`/prd/prd.json`)
- Create PRD-specific run folders with generated scripts
- Save interview transcripts
- Initialize log files
- Generate configuration files from templates

## When to Use Me

Use after `prd-interview` skill completes and (optionally) `prd-plan` skill has created a multi-PRD plan.

## Prerequisites

You must have:
1. Interview data from `prd-interview` skill
2. Optionally, a PRD plan from `prd-plan` skill (for multi-PRD scenarios)

## Input Data Structure

### Single PRD Input
```json
{
  "type": "work type",
  "title": "PRD title",
  "description": "detailed description",
  "acceptanceCriteria": ["criterion 1", "criterion 2"],
  "priority": 1,
  "dependencies": "dependencies or null",
  "technologies": "tech or null",
  "constraints": "constraints or null",
  "notes": "notes or null",
  "interviewData": {
    "transcript": "full Q&A transcript",
    "recap": "formatted recap from interview"
  }
}
```

### Multi-PRD Input
```json
{
  "interviewData": {
    "transcript": "full Q&A transcript",
    "recap": "formatted recap"
  },
  "prdPlan": {
    "totalPRDs": 3,
    "executionOrder": [1, 2, 3],
    "prds": [...]
  }
}
```

## Step-by-Step Process

### Step 1: Generate Unique IDs

Generate timestamp-based IDs:
- **Interview ID**: `INT-{YYYYMMDD-HHMMSS}`
- **PRD ID** (single): `PRD-{YYYYMMDD-HHMMSS}`
- **PRD IDs** (multiple): `PRD-{YYYYMMDD-HHMMSS}-001`, `PRD-{YYYYMMDD-HHMMSS}-002`, etc.

Example: `INT-20250115-143022`, `PRD-20250115-143022-001`

### Step 2: Create Interview Transcript

Save to `/dev/interviews/<interview-id>.md`:

```markdown
# Interview: <interview-id>

**Date:** <ISO timestamp>
**PRD ID:** <prd-id or "Multiple">
**Type:** <work type>

## Transcript

[Full Q&A transcript from interview]

## Summary

[Formatted recap from interview skill]

## PRD Plan
[If multi-PRD, include the plan from prd-plan skill]
```

### Step 3: Update PRD Database

Read `/dev/prd/prd.json`, parse it, and append PRD entries.

#### Single PRD Entry
```json
{
  "id": "<prd-id>",
  "type": "<work type>",
  "title": "<title>",
  "description": "<description>",
  "acceptanceCriteria": ["<criterion 1>", "<criterion 2>"],
  "priority": <priority number>,
  "dependencies": "<dependencies or null>",
  "technologies": "<technologies or null>",
  "constraints": "<constraints or null>",
  "notes": "<notes or null>",
  "passes": false,
  "interviewId": "<interview-id>",
  "createdAt": "<ISO timestamp>",
  "status": "TODO"
}
```

#### Multi-PRD Entries
For each PRD in the plan:
```json
{
  "id": "<prd-id>",
  "type": "<work type>",
  "title": "<title from plan>",
  "description": "<description relevant to this PRD>",
  "acceptanceCriteria": ["<criterion 1>", "<criterion 2>"],
  "priority": <priority>,
  "dependencies": ["<list of PRD IDs this depends on>" or null],
  "technologies": "<technologies or null>",
  "constraints": "<constraints or null>",
  "notes": "<notes or null>",
  "passes": false,
  "interviewId": "<interview-id>",
  "createdAt": "<ISO timestamp>",
  "status": "TODO",
  "parentId": null,
  "isPartOfPlan": true,
  "planTotalCount": <N>
}
```

**Important:** Append to array, never overwrite existing entries.

### Step 4: Create PRD Run Folders

For each PRD, create `/dev/prd/runs/<prd-id>/` folder and generate files:

#### Required Files

1. **`<prd-id>-prompt.md`** - PRD-specific execution prompt
2. **`<prd-id>-config.json`** - Configuration file
3. **`<prd-id>.json`** - PRD data (copy of database entry)

### Step 5: Generate Prompt File

Create `/dev/prd/runs/<prd-id>/<prd-id>-prompt.md`:

```markdown
# PRD Execution: <prd-id>

## PRD Information

**PRD ID**: <prd-id>
**Title**: <title>
**Type**: <type>
**Priority**: <priority>
**Interview ID**: <interview-id>
**Created**: <ISO timestamp>

## Description

<description>

## Acceptance Criteria

You MUST test each of these criteria before marking the work as complete:

- <criterion 1>
- <criterion 2>
- <criterion 3>

## Technologies Involved

<technologies or "None specified">

## Dependencies

<dependencies or "None">

## Constraints & Considerations

<constraints or "None">

## Additional Notes

<notes or "None">

---

## Important Instructions

### 1. Work Scope
- **WORK ON THIS PRD ONLY** - Do not implement other features
- **Stay focused** - All work must align with acceptance criteria
- **Avoid scope creep** - Don't add features not in requirements

### 2. Testing Requirements
- **TEST EVERY CRITERION** - Each acceptance criterion must be verified
- **Document your testing** - Explain how you tested each criterion
- **Be thorough** - Test happy paths AND error cases
- **Don't assume** - Actually verify each condition

### 3. Quality Standards
- **LEAVE CLEAN STATE** - Code must compile/build successfully
- **RUN EXISTING TESTS** - Ensure no regressions
- **FOLLOW PATTERNS** - Match existing code style and architecture
- **ADD ERROR HANDLING** - Handle edge cases and errors gracefully

### 4. Implementation Workflow

1. **Understand the Codebase**
   - Read existing code to understand project structure
   - Identify patterns and conventions used
   - Find similar features for reference

2. **Implement the Work**
   - Follow acceptance criteria as your guide
   - Implement incrementally - test as you go
   - Handle errors and edge cases

3. **Test Thoroughly**
   - Test each acceptance criterion individually
   - Test error conditions and edge cases
   - Run existing test suite to ensure no regressions

4. **Verify Completion**
   - Confirm all acceptance criteria pass
   - Ensure code builds/compiles
   - Check that error handling works

### 5. Before You Finish

- All acceptance criteria are tested and pass
- Code builds/compiles without errors
- Existing tests still pass
- Code is documented where needed
- Progress is logged with what was done

---

**Start now. Remember: ONE PRD, TEST THOROUGHLY, LEAVE CLEAN STATE.**
```

### Step 6: Generate Config File

Create `/dev/prd/runs/<prd-id>/<prd-id>-config.json`:

```json
{
  "prdId": "<prd-id>",
  "title": "<title>",
  "type": "<type>",
  "priority": <priority>,
  "interviewId": "<interview-id>",
  "createdAt": "<ISO timestamp>",
  "testing": {
    "command": "npm test",
    "frameworks": ["Playwright", "Vitest"]
  },
  "logging": {
    "logFile": "/dev/prd/logs/<prd-id>.md"
  }
}
```

### Step 7: Save PRD Data

Save `/dev/prd/runs/<prd-id>/<prd-id>.json` with the same JSON content that was added to the PRD database.

### Step 8: Create Initial Log Files

Create `/dev/prd/logs/<prd-id>.md` for each PRD:

#### Single PRD Log Format
```markdown
# PRD Log: <prd-id> - <title>

## Metadata
- **Created:** <ISO timestamp>
- **Interview ID:** <interview-id>
- **Type:** <type>
- **Status:** TODO
- **Priority:** <priority>

## Timeline

### Created
- **Timestamp:** <ISO timestamp>
- **Event:** PRD created from interview
- **Action:** Scripts generated in `/dev/prd/runs/<prd-id>/`
- **Status:** Ready to execute

## Achievements
*None yet*

## Issues
*None yet*

## Status Changes
- TODO: <timestamp> - PRD created

## Execution History
*None yet*

## Notes
- Interview completed and saved
- All scripts generated from templates
- Ready for execution
```

#### Multi-PRD Log Format
```markdown
# PRD Log: <prd-id> - <title>

## Metadata
- **Created:** <ISO timestamp>
- **Interview ID:** <interview-id>
- **Type:** <type>
- **Status:** TODO
- **Priority:** <priority>
- **Part of Plan:** Yes
- **Plan Total:** <N> PRDs
- **Dependencies:** <list of PRD IDs this depends on>

## Timeline

### Created
- **Timestamp:** <ISO timestamp>
- **Event:** PRD created as part of PRD plan
- **Action:** Scripts generated in `/dev/prd/runs/<prd-id>/`
- **Status:** Ready to execute (dependencies must be completed first)

## Achievements
*None yet*

## Issues
*None yet*

## Status Changes
- TODO: <timestamp> - PRD created as part of plan

## Execution History
*None yet*

## Notes
- Part of multi-PRD plan from interview <interview-id>
- Complete dependencies before executing this PRD
- All scripts generated from templates
- Ready for execution
```

## Return Data

Return confirmation with file locations:

```json
{
  "success": true,
  "interviewId": "<interview-id>",
  "prdIds": ["<prd-id-1>", "<prd-id-2>", "..."],
  "files": {
    "interview": "/dev/interviews/<interview-id>.md",
    "database": "/dev/prd/prd.json (updated)",
    "runFolders": [
      "/dev/prd/runs/<prd-id-1>/",
      "/dev/prd/runs/<prd-id-2>/"
    ],
    "logs": [
      "/dev/prd/logs/<prd-id-1>.md",
      "/dev/prd/logs/<prd-id-2>.md"
    ]
  },
  "nextStep": "Execute PRDs in dependency order"
}
```

## Error Handling

### If `/dev/prd/prd.json` doesn't exist
- Create it with an empty array: `[]`
- Then append PRD entries

### If directory creation fails
- Check write permissions
- Ensure parent directories exist
- Create directories recursively if needed

### If JSON parsing fails
- Validate JSON structure
- Check for syntax errors
- Report specific parsing error to user

## Important Notes

- **Always append** to prd.json, never overwrite
- **Generate unique IDs** using timestamps
- **Create all directories** before writing files
- **Validate file creation** - confirm each file was created successfully
- **Maintain data consistency** - ensure all files reference correct IDs
- **Handle both single and multi-PRD** scenarios gracefully
- **Use ISO timestamps** for all datetime fields

## Best Practices

- **Validate input** before creating files
- **Use relative paths** that work across projects
- **Generate clean JSON** with proper formatting
- **Include helpful comments** in generated files
- **Create backup** before modifying prd.json (optional)
- **Log all actions** for audit trail

---

Ready to generate PRD files? Provide the interview data (and PRD plan if applicable).