# 🚀 TE9.DEV WORKFLOW COMMAND

## ⚠️ CRITICAL: COMMAND TRIGGER

**This file is a COMMAND FILE.** When this file is added to the LLM context (by dragging, mentioning, or attaching), the te9.dev workflow MUST START immediately.

**Do NOT ask if the user wants to use te9.dev. This file IS the request to use te9.dev.**

---

## 📋 WHAT THIS COMMAND DOES

This command triggers the te9.dev spec-driven development workflow. It provides a structured, 6-step process for AI-driven development:

1. **spec-clarify** → Gather requirements with questions (max 5)
2. **spec-store** → Save spec to file system
3. **spec-execute** → Implement and test
4. **spec-branch-commit** → Create branch, commit and push (with approval)
5. **spec-pr-create** → Create pull request for collaborative review
6. **spec-pr-review** → Provide PR link for manual merge on GitHub

---

## 🎯 IMMEDIATE ACTION REQUIRED

**START NOW:** Begin the workflow by asking the user what they want to build.

**Example opening:**
```
You've triggered the te9.dev workflow! Let's get started.

What would you like to build?
```

If the user provided context along with this command (e.g., a specific task or request), use that context as the starting point and proceed to **spec-clarify**.

---

## 🔄 WORKFLOW STEPS

### Step 1: spec-clarify

**What You MUST Do:**
1. Read user's request (from context or ask if not provided)
2. Determine complexity level (Simple/Medium/Complex)
3. Ask clarification questions (MAXIMUM 5 TOTAL)
   - Simple: 0-1 question (confirm understanding)
   - Medium: 2-3 questions (clarify details)
   - Complex: 4-5 questions (deep dive)
4. Gather all answers
5. Prepare requirements summary
6. CONFIRM with user before proceeding to spec-store

**Question Guidelines:**
- Always ask questions ONE BY ONE
- Include question number: "Question X/Y"
- Be targeted and specific
- Don't ask technical implementation details (save for execution)
- Maximum 5 questions total

After user confirmation, automatically proceed to **spec-store**.

### Step 2: spec-store

- Generate unique spec ID: `SPEC-<YYYYMMDD>-<HHMM>-<slug>`
- Create `te9.dev/specs/<id>/spec.md`
- Update `te9.dev/specs/specs.json`
- Store in memory for context
- Initialize execution log: `te9.dev/logs/<id>.log`

### Step 3: spec-execute

- Load spec file
- Plan implementation approach
- Execute requirements systematically
- Log ALL changes to execution log
- Verify each acceptance criterion
- Run comprehensive tests
- Update spec status to READY_FOR_BRANCH_COMMIT

### Step 4: spec-branch-commit

- Create feature branch: `feature/SPEC-<id>-<slug>`
- Commit changes with spec ID in brackets
- Ask for user approval BEFORE pushing
- Push branch to remote after user approval
- Update spec status to BRANCH_COMMITTED

### Step 5: spec-pr-create

- Create pull request against main branch
- Include spec details and assign reviewers
- Enable CI/CD checks
- Update spec status to PR_CREATED

### Step 6: spec-pr-review

- Provide direct GitHub PR link for manual review
- Give manual merge instructions
- Mark spec as completed after user confirmation

---

## 📚 REFERENCE

- `AGENTS.md` - Complete workflow reference
- `.opencode/skill/spec-clarify/SKILL.md` - Requirements gathering details
- `.opencode/skill/spec-store/SKILL.md` - Spec file creation details
- `.opencode/skill/spec-execute/SKILL.md` - Implementation details
- `.opencode/skill/spec-branch-commit/SKILL.md` - Branch commit details
- `.opencode/skill/spec-pr-create/SKILL.md` - PR creation details
- `.opencode/skill/spec-pr-review/SKILL.md` - PR review details

---

## ⚠️ CRITICAL RULES

- NEVER skip steps in the workflow
- ALWAYS ask for user approval before committing or pushing
- Log ALL changes to execution log
- Store in memory at each step
- Create knowledge graph facts for acceptance criteria
- Update spec status after each step
- Track progress with `spec-track` command anytime

---

## ✅ START NOW

Begin the te9.dev workflow by asking the user what they want to build.

**Ready. What would you like to build?**