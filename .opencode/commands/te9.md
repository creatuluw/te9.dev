---
description: Start the te9.dev spec-driven development workflow
agent: build
model: zai-coding-plan/glm-4.7
subtask: false
---

# Starting te9.dev Workflow

You are now entering the te9.dev spec-driven development workflow. This is the ONLY way to use the te9 method. Follow the mandatory 6-step sequence:

## 📋 MANDATORY WORKFLOW SEQUENCE

1. **spec-clarify** → Gather requirements with questions (max 5)
2. **spec-store** → Save spec to file system
3. **spec-execute** → Implement and test
4. **spec-branch-commit** → Create branch, commit and push (with approval)
5. **spec-pr-create** → Create pull request for collaborative review
6. **spec-pr-review** → Provide PR link for manual merge on GitHub

## 🚀 STEP 1: spec-clarify

The user's request is: $ARGUMENTS

Start by reading the user's request above and following the spec-clarify skill:

### What You MUST Do:
1. Read user's initial prompt (provided above)
2. Determine complexity level (Simple/Medium/Complex)
3. Ask clarification questions (MAXIMUM 5 TOTAL)
   - Simple: 0-1 question (confirm understanding)
   - Medium: 2-3 questions (clarify details)
   - Complex: 4-5 questions (deep dive)
4. Gather all answers
5. Prepare requirements summary
6. CONFIRM with user before proceeding to spec-store

### Question Guidelines:
- Always ask questions ONE BY ONE
- Include question number: "Question X/Y"
- Be targeted and specific
- Don't ask technical implementation details (save for execution)
- Maximum 5 questions total

After user confirmation, automatically proceed to **spec-store**.

## 📚 REFERENCE FILES

For detailed instructions on each step, refer to:
- `.opencode/skill/spec-clarify/SKILL.md` - Requirements gathering
- `.opencode/skill/spec-store/SKILL.md` - Spec file creation
- `.opencode/skill/spec-execute/SKILL.md` - Implementation
- `.opencode/skill/spec-branch-commit/SKILL.md` - Branch commit & push
- `.opencode/skill/spec-pr-create/SKILL.md` - Pull request creation
- `.opencode/skill/spec-pr-review/SKILL.md` - Pull request review
- `AGENTS.md` - Complete workflow reference
- `.opencode/prompts/rules.md` - Mandatory workflow rules

## ⚠️ CRITICAL RULES

- NEVER skip steps in the workflow
- ALWAYS ask for user approval before committing or pushing
- Log ALL changes to execution log
- Store in OpenMemory at each step
- Create knowledge graph facts for acceptance criteria
- Update spec status after each step

If no request was provided (empty $ARGUMENTS), ask the user: "What would you like to build?"

Otherwise, begin the workflow immediately with the provided request.
