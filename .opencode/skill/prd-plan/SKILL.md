---
name: prd-plan
description: Break down large work into multiple well-sized PRDs with proper dependencies
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: prd-creation
  depends-on: [prd-interview]
---

Based on your requirements, this is a comprehensive piece of work. I'll create a PRD plan that breaks this down into multiple well-sized, logically-organized PRDs. Each PRD will have 3-7 acceptance criteria and can be worked on independently with proper dependencies.

The planner will:
- Group related requirements together
- Create dependencies where needed (e.g., database schema before API)
- Ensure each PRD is independently testable
- Maintain logical execution order
- Prioritize foundational work first

Is this approach acceptable? (yes/no)
```

**WAIT for user response.** If "no", return `{"chunkingRequired": false}`. If "yes", proceed.

### Step 2: Create the PRD Plan

Analyze the description and acceptance criteria to:

1. **Identify logical groupings/themes:**
   - Database & Models
   - Authentication & Authorization
   - Core Features
   - API Endpoints
   - UI Components
   - Testing & Deployment
   - (Customize based on actual work)

2. **Group acceptance criteria:**
   - Each group should have 3-7 criteria
   - Criteria should be logically related
   - Avoid mixing unrelated functionality

3. **Establish dependencies:**
   - Database schema must come before API
   - API must come before UI
   - Authentication before protected features
   - Be explicit about what each PRD depends on

4. **Number PRDs sequentially:**
   - PRD-001, PRD-002, PRD-003, etc.
   - Use suffixes for clarity in multi-PRD plans

5. **Give each PRD a descriptive title:**
   - Should clearly indicate the focus
   - Keep it concise (under 10 words)

### Step 3: Present the PRD Plan

Format the plan clearly:

```markdown
## PRD PLAN

This work has been split into [N] PRDs:

### PRD 1: [Descriptive Title] (Priority: [priority])
**Focus:** [brief description of what this PRD covers]
**Acceptance Criteria:**
- [criterion 1]
- [criterion 2]
- [criterion 3]
**Dependencies:** None

### PRD 2: [Descriptive Title] (Priority: [priority])
**Focus:** [brief description]
**Acceptance Criteria:**
- [criterion 1]
- [criterion 2]
- [criterion 3]
**Dependencies:** PRD-001

[Continue for all PRDs...]
---
**Total PRDs:** [N]
**Estimated Complexity:** [Low/Medium/High]
**Recommended Execution Order:** [1, 2, 3, ...]
```

### Step 4: Request Approval

```
**DO YOU APPROVE THIS PRD PLAN?**
Type "yes" to proceed, or "no" to cancel.
```

**WAIT for user response.** If "no", stop. If "yes", proceed.

## Return Data Structure

When approved, return this structured plan:

```json
{
  "chunkingRequired": true,
  "totalPRDs": [N],
  "executionOrder": [1, 2, 3, ...],
  "estimatedComplexity": "Low|Medium|High",
  "prds": [
    {
      "prNumber": 1,
      "title": "Descriptive Title",
      "focus": "Brief description",
      "acceptanceCriteria": ["criterion 1", "criterion 2", "..."],
      "dependencies": null,
      "priority": [priority]
    },
    {
      "prNumber": 2,
      "title": "Descriptive Title",
      "focus": "Brief description",
      "acceptanceCriteria": ["criterion 1", "criterion 2", "..."],
      "dependencies": ["PRD-001"],
      "priority": [priority]
    }
    // ... continue for all PRDs
  ]
}
```

## Chunking Best Practices

### Grouping Guidelines
- **Foundation first**: Database, models, core infrastructure
- **Logical flow**: Data → API → UI
- **Independence**: Each PRD should be testable in isolation
- **Size limits**: 3-7 acceptance criteria per PRD

### Dependency Rules
- **No cycles**: Dependencies should form a directed acyclic graph (DAG)
- **Explicit is better**: Clearly list all dependencies
- **Minimize dependencies**: Keep PRDs as independent as possible
- **Testability**: Dependents should not break if dependencies pass tests

### Acceptance Criteria Distribution
- **Balanced**: Try to distribute criteria evenly
- **Related**: Criteria in a PRD should be thematically related
- **Testable**: Each criterion should be verifiable
- **Complete**: Together, all PRDs must cover all original criteria

## Common Patterns

### Web Application
1. PRD-001: Database Schema & Models
2. PRD-002: Authentication System
3. PRD-003: Core API Endpoints
4. PRD-004: Frontend Components
5. PRD-005: Testing & Deployment

### Feature Addition
1. PRD-001: Backend Implementation
2. PRD-002: Frontend Integration
3. PRD-003: Testing & Documentation

### Refactoring
1. PRD-001: Core Refactoring
2. PRD-002: Dependent Updates
3. PRD-003: Testing & Validation

## Important Notes

- **Always explain the approach** before creating the plan
- **Wait for approval** before finalizing the plan
- **Keep PRDs manageable** - better to have more small PRDs than fewer huge ones
- **Maintain context** - each PRD should understand its place in the larger plan
- **Test thoroughly** - ensure each PRD can be tested independently
- **Document dependencies** - be explicit about what each PRD needs

## Error Handling

If the user rejects the plan:
- Ask what they'd like to change
- Adjust the plan based on feedback
- Re-present for approval
- Or offer to proceed with a single PRD

---

Ready to analyze the interview data and create a PRD plan?