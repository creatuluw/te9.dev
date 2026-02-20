---
name: te9-dev
description: Spec-driven development workflow for AI agents. Orchestrate requirements gathering, implementation, testing, and deployment in a structured 6-step process. Use when building software, implementing features, or managing development workflows.
license: Complete terms in LICENSE.txt
---

# TE9.DEV - Spec-Driven Development Workflow

## Goals

Enable AI agents to execute a complete spec-driven development workflow that:
- Gathers requirements systematically through targeted questioning
- Stores specifications in a structured format for traceability
- Implements features using test-driven development
- Manages version control through branching and pull requests
- Facilitates collaborative review and approval processes
- Provides clear audit trails and execution logging

## Permissions

**Required:**
- File system read/write access to project directory
- Git command execution for branch/commit/PR operations
- Network access for remote Git operations
- Terminal/shell access for command execution

**Scope:**
- Can create/modify files in `te9.dev/specs/`, `te9.dev/logs/`, and project code
- Can create git branches and commits
- Cannot modify sensitive configuration files without approval
- Cannot push to main branch directly
- Cannot merge pull requests without human approval

## Tool Usage

**Required Tools:**
- `terminal` - for executing shell commands (git, npm, etc.)
- `read_file` / `write_file` - for spec and log file operations
- `edit_file` - for code modifications
- `list_directory` - for exploring project structure

**Command Patterns:**
```bash
git checkout -b feature/SPEC-<id>-<slug>
git add .
git commit -m "[SPEC-<id>] commit message"
git push -u origin feature/SPEC-<id>-<slug>
gh pr create --title "SPEC-<id>: title" --body "description"
```

**Tool Call Sequence:**
1. Use spec-clarify reference to gather requirements
2. Use spec-store reference to save spec
3. Use spec-execute reference with test-driven-development
4. Use spec-branch-commit reference for version control
5. Use spec-pr-create reference for pull request
6. Use spec-pr-review reference for final review

## Triggers

**Trigger Description**: "Execute spec-driven development workflow from requirements to deployment"

Use this skill when the user:
- Says "start te9.dev workflow" or provides @te9.md command file
- Requests to "build a feature" or "implement a spec"
- Asks to "create a pull request" or "manage development workflow"
- Mentions "spec-driven development" or "te9 workflow"
- Needs to implement features with proper testing and review process
- Requests structured development process from requirements to deployment

## Acceptance Criteria

1. **Requirements Gathered**: All requirements are clarified and documented with user confirmation before proceeding to implementation
2. **Spec Stored**: Specification is saved to `te9.dev/specs/<id>/spec.md` with unique ID and updated in `specs.json`
3. **Test-Driven Implementation**: All code is implemented using TDD with failing tests written before production code
4. **Branch Created**: Feature branch is created with proper naming convention and changes are committed with spec ID
5. **Pull Request Created**: Pull request is created with spec details, CI/CD enabled, and reviewers assigned
6. **Documentation Complete**: Execution log is maintained at `te9.dev/logs/<id>.log` with all changes tracked

## Core Workflow

### Step 1: Spec Clarify (Requirements Gathering)

1. **Read user request** from context or ask if not provided
2. **Determine complexity level** (Simple/Medium/Complex)
3. **Ask clarification questions** (MAXIMUM 5 TOTAL)
   - Simple: 0-1 question (confirm understanding)
   - Medium: 2-3 questions (clarify details)
   - Complex: 4-5 questions (deep dive)
4. **Gather all answers** one by one
5. **Prepare requirements summary** consolidating all information
6. **CONFIRM with user** before proceeding to spec-store

**Reference**: `@references/spec-clarify.md` for detailed question guidelines and patterns

**Verification Checklist:**
```
[ ] User request understood
[ ] Complexity level determined
[ ] Questions asked one by one with numbering
[ ] All answers gathered
[ ] Requirements summary prepared
[ ] User confirmation received
```

### Step 2: Spec Store (Save Specification)

1. **Generate unique spec ID**: `SPEC-<YYYYMMDD>-<HHMM>-<slug>`
   - Example: `SPEC-20240115-1430-add-user-auth`
2. **Create spec directory**: `te9.dev/specs/<id>/`
3. **Write spec.md** with:
   - Spec ID and timestamp
   - User request summary
   - Clarified requirements
   - Acceptance criteria
   - Status: `REQUIREMENTS_GATHERED`
4. **Update specs.json**:
   - Add entry with spec ID, title, timestamp, status
   - Maintain alphabetical or chronological order
5. **Initialize execution log**: `te9.dev/logs/<id>.log`
6. **Store spec in memory** for context across workflow steps

**Reference**: `@references/spec-store.md` for spec template and JSON structure

**Verification Checklist:**
```
[ ] Unique spec ID generated
[ ] Spec directory created
[ ] spec.md written with all sections
[ ] specs.json updated
[ ] Execution log initialized
[ ] Spec stored in memory
```

### Step 3: Spec Execute (Implementation)

1. **Load spec file** from memory or filesystem
2. **Plan implementation approach**:
   - Identify components/modules to modify
   - Design test strategy
   - Determine order of implementation
3. **Execute using test-driven development**:
   - Read `@references/test-driven-development.md`
   - Follow RED-GREEN-REFACTOR cycle
   - Write failing test first
   - Write minimal production code to pass
   - Refactor while keeping tests green
4. **Log ALL changes** to execution log:
   - Files created/modified
   - Tests written
   - Acceptance criteria verification status
5. **Verify each acceptance criterion**:
   - Mark as PASSED/FAILED in spec
   - Document evidence
6. **Run comprehensive tests**:
   - Unit tests
   - Integration tests
   - End-to-end tests
7. **Update spec status** to `READY_FOR_BRANCH_COMMIT`

**Reference**: `@references/spec-execute.md` for implementation patterns and `@references/test-driven-development.md` for TDD methodology

**Verification Checklist:**
```
[ ] Spec loaded and reviewed
[ ] Implementation approach planned
[ ] TDD cycle followed for all code
[ ] All changes logged
[ ] Each acceptance criterion verified
[ ] Comprehensive tests run and passing
[ ] Spec status updated
```

### Step 4: Spec Branch Commit (Version Control)

1. **Create feature branch**: `feature/SPEC-<id>-<slug>`
2. **Commit changes** with spec ID in brackets:
   - Format: `[SPEC-<id>] commit message`
   - Use conventional commits (feat:, fix:, refactor:, etc.)
3. **Ask for user approval BEFORE pushing**
4. **Push branch to remote** after approval:
   - `git push -u origin feature/SPEC-<id>-<slug>`
5. **Update spec status** to `BRANCH_COMMITTED`
6. **Log branch creation** in execution log

**Reference**: `@references/spec-branch-commit.md` for git commands and commit conventions

**Verification Checklist:**
```
[ ] Feature branch created with proper name
[ ] Changes committed with spec ID
[ ] User approval received
[ ] Branch pushed to remote
[ ] Spec status updated
[ ] Branch creation logged
```

### Step 5: Spec PR Create (Pull Request)

1. **Create pull request** against main branch:
   - Title: `SPEC-<id>: <feature title>`
   - Body: Include spec details, changes summary, acceptance criteria status
2. **Assign reviewers** from spec requirements
3. **Enable CI/CD checks**:
   - Verify tests run automatically
   - Check for linting errors
   - Ensure security scans pass
4. **Update spec status** to `PR_CREATED`
5. **Log PR creation** with URL in execution log

**Reference**: `@references/spec-pr-create.md` for PR template and CI/CD configuration

**Verification Checklist:**
```
[ ] Pull request created against main
[ ] PR includes spec details
[ ] Reviewers assigned
[ ] CI/CD checks enabled and passing
[ ] Spec status updated
[ ] PR creation logged
```

### Step 6: Spec PR Review (Final Review)

1. **Provide direct GitHub PR link** for manual review
2. **Give manual merge instructions**:
   - Review checklist
   - Merge requirements (all checks passing, approvals received)
   - Post-merge actions (delete branch, tag release if applicable)
3. **Monitor CI/CD status** and report failures
4. **Mark spec as completed** after user confirmation of merge
5. **Archive execution log** or move to completed logs

**Reference**: `@references/spec-pr-review.md` for review checklist and merge procedures

**Verification Checklist:**
```
[ ] PR link provided to user
[ ] Manual merge instructions given
[ ] CI/CD status monitored
[ ] User confirmation of merge received
[ ] Spec marked as completed
[ ] Execution log archived
```

## Decision Management

### When to Retry vs. Abort

- **Retry 3x**: Network timeouts, temporary Git server errors, CI/CD flaky tests
- **Abort immediately**: Invalid spec ID, permission errors, conflicting git state, user cancellation
- **Fallback**: If feature branch exists with same name, suggest deleting or using different name

### Choosing Clarification Question Strategy

1. **Simple requests** (1-2 sentences): 0-1 questions to confirm understanding
2. **Medium requests** (3-5 sentences, multiple concepts): 2-3 questions to clarify details
3. **Complex requests** (feature implementation, multiple integrations): 4-5 questions for deep dive

If user provides detailed requirements upfront, skip questions and proceed to confirmation.

### Handling Test Failures

- **Test fails for expected reason**: Proceed to GREEN step
- **Test passes immediately**: Delete test - it's testing existing behavior
- **Test errors (syntax, etc.)**: Fix error and re-run RED step
- **Test fails for wrong reason**: Analyze and fix test, re-run RED step

### Managing Git Conflicts

- **Conflict during branch creation**: Delete existing branch or use alternative branch name
- **Conflict during merge**: Notify user immediately, do not attempt automatic resolution
- **Conflict during push**: Fetch latest changes, rebase, notify user if conflicts persist

### CI/CD Failure Handling

1. **Linting errors**: Fix immediately, push fix
2. **Test failures**: Investigate, fix, re-run
3. **Security scan warnings**: Assess severity, fix or document exception
4. **Build failures**: Check dependencies, logs, infrastructure

## Human Interaction

### When to Request Human Approval

**Required before proceeding:**
- Committing and pushing code changes (Step 4)
- Creating pull requests that affect critical systems
- Merging changes to main branch (always manual)
- Running destructive commands (drop database, etc.)
- Making changes to security configurations

**Request format:**
```
I'm about to [action] which will [consequence].
Spec ID: SPEC-<id>
Changes: [summary of changes]

Please confirm: [yes/no]
```

### When to Request Human Advice

**Recommended for:**
- Ambiguous requirements or unclear acceptance criteria
- Multiple valid implementation approaches with trade-offs
- Unexpected test failures or unusual behavior
- Decisions affecting project architecture or standards
- Security considerations or sensitive data handling

**Request format:**
```
I encountered [situation] with options:
- Option A: [description, pros/cons]
- Option B: [description, pros/cons]

Spec ID: SPEC-<id>

Which approach should I take?
```

### When to Request Human Feedback

**Required after:**
- Completing Step 1 (requirements confirmation)
- Completing Step 3 (implementation review)
- Handling errors or unexpected outcomes
- CI/CD failures requiring investigation
- When results don't match expected behavior

**Request format:**
```
I completed [step] with the following results:
Spec ID: SPEC-<id>
- [result 1]
- [result 2]

Does this meet your expectations? [yes/no/adjust]
```

## Progress Tracking

### Spec Track Command

Use `@spec-track` anytime to:
- Check current spec status
- View execution log
- Review acceptance criteria progress
- Identify next steps
- Generate summary report

**Example:**
```
@spec-track SPEC-20240115-1430-add-user-auth
```

### Status Transitions

```
REQUIREMENTS_GATHERED (Step 1)
    ↓
SPEC_STORED (Step 2)
    ↓
IN_PROGRESS (Step 3)
    ↓
READY_FOR_BRANCH_COMMIT (Step 3 complete)
    ↓
BRANCH_COMMITTED (Step 4)
    ↓
PR_CREATED (Step 5)
    ↓
REVIEWING (Step 6)
    ↓
COMPLETED (Final)
```

### Recovery from Failures

If workflow fails at any step:
1. Log error to execution log
2. Update spec status with failure reason
3. Notify human with context and recovery options
4. Wait for human direction
5. Resume from appropriate step based on decision

## Limits

### What This Skill Doesn't Cover
- Manual testing procedures (use test-driven-development for automated testing)
- Deployment to production beyond PR creation
- Project management beyond spec tracking
- Team coordination beyond pull request review
- Continuous monitoring or incident response

### When to Deviate
- Never skip TDD cycle without explicit human approval
- Never bypass human approval for git operations
- Never modify security rules without consulting human
- Contact maintainers for workflow customization

## Verification Checklist

Before marking workflow complete:

- [ ] Spec clarify completed with user confirmation
- [ ] Spec stored with unique ID and JSON updated
- [ ] Implementation follows TDD methodology
- [ ] All acceptance criteria verified
- [ ] Branch created and committed with spec ID
- [ ] User approval received for push
- [ ] Pull request created with all details
- [ ] CI/CD checks passing
- [ ] Execution log maintained throughout
- [ ] Spec status updated at each step
- [ ] Human provided all required approvals
- [ ] All verification checklists passed for each step