# Zed Development Workflow

This file references the canonical build process from `.opencode`.

## Mandatory Workflows

All development work MUST follow these workflows. For complete documentation, see:
**[.opencode/prompts/build.md](../.opencode/prompts/build.md)**

## Workflow 1: Memory Workflow

1. **Query First** - Before any response, query memory using OpenMemory MCP
2. **Analyze** - Review memory results for context, patterns, preferences
3. **Incorporate** - Adapt your response based on memory context
4. **Store Last** - After important interactions, store decisions to memory

## Workflow 1.5: Session Orientation (REQUIRED)

After memory workflow, ask user what they want to accomplish:

```
Welcome! I can help you in two ways:

1. **Create PRDs** - Define new work by creating Product Requirement Documents
   - Use @prd agent to conduct interviews and create PRDs
   - Good for: New features, bug fixes, refactors, new projects

2. **Execute PRDs** - Work on existing PRDs and implement features
   - Use @status agent to see status, then @prd-execute to implement
   - Good for: Continuing work on existing PRDs

What would you like to do today? (Create PRDs / Execute PRDs)
```

### Based on User's Choice:

**If Create PRDs:**
- Invoke `@prd` agent
- Agent handles full interview and creation process
- Do NOT proceed to Workflow 2

**If Execute PRDs:**
- Invoke `@status` agent
- Agent displays PRD status and guides on starting work
- User can then execute specific PRDs

### Exception:
If user's intent is clear (e.g., "Add login feature"), skip orientation and proceed to appropriate workflow.

## Workflow 2: PRD-Driven Development

For executing PRDs (after @status agent shows status):

1. **Execute** - Use `@prd-execute` to implement work (includes automatic git commit with PRD reference)
2. **Test** - Use `@prd-testing` to verify all criteria and ensure ALL unit tests pass
3. **Track** - Use `@prd-tracking` to log progress (includes user approval for git push)

Note: For creating PRDs, use `@prd` agent directly instead of following this workflow.

## Available Agents

- **@prd** - Create PRDs to define new work
- **@status** - Check PRD status & guide on starting work
- **@prd-interview** - Gather requirements
- **@prd-planning** - Plan large projects (optional)
- **@prd-create** - Create PRD files
- **@prd-execute** - Implement work + create git commit ✍️
- **@prd-testing** - Verify criteria (100% test pass required) 🧪
- **@prd-tracking** - Log progress + user approval for push 👤

## Git Commit and Push Workflow

### Step 4.5: Git Commit (Automatic in prd-execute)

After all tests pass, prd-execute automatically creates a git commit:
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

**Commit Requirements:**
- Each PRD MUST have its own separate commit
- Commit message MUST include PRD ID in brackets `[PRD-<id>]`
- Commit message MUST include PRD title
- Follow conventional commit format (feat/fix/refactor/etc.)

### Step 6.5: Git Push with User Approval (in prd-track)

When COMPLETED event is tracked, prd-track skill:
1. Presents commit details to user
2. Asks for user approval to push
3. Waits for user to type "approve" or "reject"

**If user approves:**
- Executes `git push` to remote repository
- Logs successful push with commit hash and branch

**If user rejects:**
- Does not push the commit
- Logs that push was declined by user
- Keeps commit locally for manual push later

**CRITICAL: Never auto-push. Always wait for user approval.**

**Note:** The interview skill includes "Single Prompt" as a work type option. If selected, PRD process is skipped and execution proceeds directly.

## Critical Rules

- **ALWAYS start with interview** - The interview determines work type and if PRD is needed
- **NEVER code without a PRD (for New Project, Feature, Refactor, Bugfix, Other work types)** - Always interview first
- **Work on ONE PRD at a time** - Follow dependency order
- **TEST EVERYTHING** - Never mark DONE without passing tests
- **CRITICAL: UNIT TESTS MUST PASS** - NO task/PRD can complete until ALL unit tests pass successfully
- **CRITICAL: ZERO TOLERANCE FOR FAILING TESTS** - A task CANNOT be marked as DONE if ANY test fails
- **CRITICAL: EACH PRD GETS ITS OWN COMMIT** - Must create git commit with PRD ID in message before completion
- **CRITICAL: USER APPROVAL REQUIRED FOR PUSH** - Never auto-push - always wait for user to approve
- **LEAVE CLEAN STATE** - Code must build and ALL tests must pass
- **TRACK PROGRESS** - Log all events (only for PRD work types)

## Project Structure

PRD files are created in:
