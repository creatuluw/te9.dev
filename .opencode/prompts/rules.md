# MANDATORY SPEC PROCESS WORKFLOW

This document defines the mandatory process that MUST be followed for every spec in te9.dev. No exceptions.

---

## ⚠️ CRITICAL: FOLLOW THIS PROCESS EVERY TIME

When working on any spec, you MUST follow this exact sequence:

1. **spec-clarify** → 2. **spec-store** → 3. **spec-execute** → 4. **spec-commit**

You may use **spec-track** at any time to check progress.

---

## STEP 1: spec-clarify (MANDATORY START)

### When to Use
ALWAYS start here when a user provides a request that requires implementation work.

### What You MUST Do
1. Read user's initial prompt
2. Determine complexity level (Simple/Medium/Complex)
3. Ask clarification questions (MAXIMUM 5 TOTAL)
   - Simple: 0-1 question (confirm understanding)
   - Medium: 2-3 questions (clarify details)
   - Complex: 4-5 questions (deep dive)
4. Gather all answers
5. Prepare requirements summary
6. CONFIRM with user before proceeding
7. Store conversation in OpenMemory for context

### MANDATORY Question Guidelines
- Never ask more than 5 questions
- Be targeted and specific
- Don't ask technical implementation details (save for execution)
- Don't ask irrelevant preferences
- If user says "just do it," proceed with what you have

### Transition
AFTER user confirmation, automatically proceed to **spec-store**.

### Success Criteria
- User's request fully understood
- All ambiguity resolved
- Requirements clear and actionable
- Maximum 5 questions asked
- User confirms understanding before proceeding

---

## STEP 2: spec-store (MANDATORY CREATION)

### When to Use
IMMEDIATELY after spec-clarify confirmation.

### What You MUST Do
1. Generate unique spec ID: `SPEC-<YYYYMMDD>-<HHMM>-<slug>`
2. Create spec file at: `te9.dev/specs/<spec-id>/spec.md`
3. Create context.json with conversation history
4. Update `te9.dev/specs/specs.json` database
5. Store in OpenMemory as semantic memory
6. Store acceptance criteria as individual knowledge graph facts
7. Create execution log at: `te9.dev/logs/<spec-id>.log`
8. Display confirmation to user with next steps

### Spec File Structure
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

### MANDATORY Validation
- ✅ Unique spec ID generated
- ✅ Spec file created with all required sections
- ✅ Specs database updated
- ✅ OpenMemory updated with spec creation
- ✅ Knowledge graph facts created for acceptance criteria
- ✅ Execution log file initialized
- ✅ User confirmation displayed

### Transition
After spec-store, workflow branches:
- Execute immediately → **spec-execute**
- Track later → **spec-track**
- Make changes → **spec-clarify** (create new spec)

### Success Criteria
- Spec file complete and well-formatted
- All requirements from spec-clarify captured
- Acceptance criteria clear and testable
- Spec ID unique and follows naming convention
- User knows how to proceed

---

## STEP 3: spec-execute (MANDATORY IMPLEMENTATION)

### When to Use
When spec status is PENDING and ready for implementation.

### What You MUST Do
1. Load spec from `te9.dev/specs/<spec-id>/spec.md`
2. Verify spec status is PENDING
3. Update spec status to IN_PROGRESS
4. Update specs.json
5. Store "Started executing" in OpenMemory
6. Plan implementation approach
7. Execute requirements systematically
8. Log ALL changes and actions to execution log
9. Verify each acceptance criterion
10. Run comprehensive tests
11. Update knowledge graph with completed facts
12. Update spec status to READY_FOR_COMMIT (if all pass) or FAILED (if any fail)

### Implementation Process
For EACH requirement:
1. Log start: "=== STARTING REQUIREMENT: [title] ==="
2. Implement code changes
3. Log all files created/modified
4. Test implementation
5. Log completion: "=== COMPLETED REQUIREMENT: [title] ==="

For EACH acceptance criterion:
1. Mark as [x] or [ ] in spec.md
2. Test criterion manually and/or automatically
3. Log result: "Criterion X: PASS/FAIL - [notes]"

### Final Testing
- Run full test suite
- Check for regressions
- Verify all acceptance criteria
- If tests fail after 3 attempts, mark spec as BLOCKED

### MANDATORY Logging
Log EVERYTHING to `te9.dev/logs/<spec-id>.log`:
- All actions taken
- Files changed (created/modified)
- Test results
- Decisions made
- Workarounds used
- Timestamps for all events

### MANDATORY Validation Before Completion
- ✅ All requirements implemented
- ✅ All acceptance criteria verified
- ✅ All tests passing
- ✅ No regressions detected
- ✅ Code follows project standards
- ✅ Execution log complete
- ✅ Knowledge graph updated
- ✅ Spec status updated to READY_FOR_BRANCH_COMMIT

### CRITICAL RESTRICTIONS
- ❌ Do NOT create git commits in this skill (that's spec-branch-commit's job)
- ❌ Do NOT push to remote (that's spec-branch-commit's job)
- ✅ Focus ONLY on implementation and testing
- ✅ Prepare everything for branch commit

### Transition
After successful execution:
- If READY_FOR_BRANCH_COMMIT → **spec-branch-commit**
- If FAILED/BLOCKED → **spec-track** to review and decide next steps

### Success Criteria
- All requirements implemented
- All acceptance criteria passing
- No failing tests
- No regressions
- Complete execution log
- Spec marked READY_FOR_COMMIT

---

## STEP 4: spec-commit (MANDATORY COMMIT & PUSH)

## STEP 4: spec-branch-commit (MANDATORY BRANCH COMMIT & PUSH)

### When to Use
When spec status is READY_FOR_COMMIT.

### What You MUST Do
1. Read spec from `te9.dev/specs/<spec-id>/spec.md`
2. Verify status is READY_FOR_COMMIT
3. Create feature branch: `feature/SPEC-<id>-<slug>`
4. Review all changes with `git status`
5. Stage all changes with `git add -A`
6. Prepare commit message with spec ID in brackets
7. Display COMMIT PREVIEW
8. **WAIT for user approval** before committing
9. If approved, create commit with `git commit -m "<message>"`
10. Display BRANCH PUSH PREVIEW
11. **WAIT for user approval** before pushing branch
12. If approved, push branch to remote with `git push origin <branch>`
13. Update spec status to BRANCH_COMMITTED
14. Log actions to execution log

### Commit Message Format
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

### MANDATORY Approval Workflow
1. Show commit preview
2. Wait for user to type "approve", "reject", or "modify"
3. If approved, create commit on branch
4. Show branch push preview
5. Wait for user to type "approve" or "reject"
6. If approved, push branch to remote

### CRITICAL RESTRICTIONS
- ❌ NEVER auto-commit without user approval
- ❌ NEVER auto-push branch without user approval
- ✅ ALWAYS create feature branch first
- ✅ ALWAYS show full preview before commit
- ✅ ALWAYS wait for "approve" before committing
- ✅ ALWAYS wait for second "approve" before pushing branch

### Transition
After successful branch push:
- **spec-pr-create** - Create pull request

### Success Criteria
- Feature branch created
- Git commit created with proper message
- Commit includes spec ID in brackets
- Branch pushed to remote
- User explicitly approved before commit and push
- Spec marked as BRANCH_COMMITTED
- All actions logged

---

## STEP 5: spec-pr-create (MANDATORY PULL REQUEST CREATION)

### When to Use
When spec status is BRANCH_COMMITTED.

### What You MUST Do
1. Read spec from `te9.dev/specs/<spec-id>/spec.md`
2. Verify status is BRANCH_COMMITTED
3. Verify branch exists and is pushed
4. Create pull request against main branch
5. Set PR title: `SPEC-<id>: <spec title>`
6. Include PR description with spec details, acceptance criteria, and change summary
7. Assign reviewers (based on team configuration)
8. Enable CI/CD checks
9. Update spec status to PR_CREATED
10. Log PR URL and details to execution log

### PR Description Template
```
## Pull Request: SPEC-<id>

### Objective
[spec objective]

### Requirements
- [list requirements]

### Acceptance Criteria
- [ ] [criteria 1]
- [ ] [criteria 2]

### Changes Made
- [brief summary of changes]

### Testing
- All unit tests passing (100%)
- No regressions detected
- CI/CD checks enabled

Spec: SPEC-<id>
Type: <feature|bugfix|refactor|other>
Priority: <priority>
```

### CRITICAL RESTRICTIONS
- ❌ NEVER create PR without branch push
- ❌ NEVER auto-create PR without verification
- ✅ ALWAYS include spec details in PR
- ✅ ALWAYS assign appropriate reviewers
- ✅ ALWAYS enable required CI/CD checks

### Transition
After PR creation:
- **spec-pr-merge** - Wait for review and merge

### Success Criteria
- Pull request created successfully
- PR includes all required information
- Reviewers assigned
- CI/CD checks enabled
- Spec marked as PR_CREATED
- PR URL logged

---

## STEP 6: spec-pr-review (MANDATORY PULL REQUEST REVIEW LINK)

### When to Use
When spec status is PR_CREATED and ready to provide PR link for manual review.

### What You MUST Do
1. Read spec from `te9.dev/specs/<spec-id>/spec.md`
2. Verify status is PR_CREATED
3. Check PR status: reviews and CI/CD status
4. Display PR REVIEW LINK with status
5. Provide direct GitHub PR link for manual merging
6. Give clear manual merge instructions
7. **WAIT for user confirmation** to mark spec complete
8. Update spec status to COMPLETED
9. Update specs.json
10. Store completion in OpenMemory
11. Log PR link provision to execution log
12. Display final report with PR link

### MANDATORY Confirmation Workflow
1. Show PR status and readiness
2. Provide GitHub PR link
3. Give manual merge instructions
4. Wait for user to type "complete" or "wait"
5. If "complete", mark spec as done

### Merge Options
- **Squash Merge**: Combine all commits into one
- **Merge Commit**: Preserve commit history
- Choose based on team preference

### CRITICAL RESTRICTIONS
- ❌ NEVER provide PR link without verifying PR exists
- ❌ NEVER mark spec complete without user confirmation
- ✅ ALWAYS provide direct GitHub PR link
- ✅ ALWAYS give clear manual merge instructions
- ✅ ALWAYS wait for user confirmation before completion

### Transition
After providing PR link:
- **spec-track** - View overall progress
- **spec-clarify** - Start new spec if needed

### Success Criteria
- PR link provided to user
- Manual merge instructions given
- Spec marked as COMPLETED
- All actions logged
- User confirmed completion

---

## STEP 5: spec-track (OPTIONAL - AVAILABLE ANYTIME)

### When to Use
ANYTIME to check progress, status, logs, or history.

### What It Does
1. Display overview of all specs
2. Show detailed spec information
3. Display execution logs
4. Show git commit history
5. Track progress over time
6. Provide next steps suggestions

### Commands
- `spec-track` - Overview of all specs
- `spec-track <spec-id>` - Details of specific spec
- `spec-track <spec-id> --log` - Execution log
- `spec-track --commits` - Commit history
- `spec-track --project` - Project status

### Status Indicators
- ✅ COMPLETED - Successfully finished and merged
- 🟡 IN_PROGRESS - Currently being executed
- 🟠 READY_FOR_BRANCH_COMMIT - Ready for branch commit and push
- 🔵 BRANCH_COMMITTED - Branch committed and pushed
- 🟣 PR_CREATED - Pull request created and under review
- ⏳ PENDING - Waiting to start
- ❌ FAILED - Execution failed
- 🚫 BLOCKED - Blocked by dependencies or issues

### Success Criteria
- User can always see current status
- Progress easy to understand
- Detailed information available on demand
- Execution logs accessible
- Next actions suggested

---

## ⚠️ CRITICAL WORKFLOW RULES

### Always Follow This Sequence
```
User Request
    ↓
spec-clarify (mandatory)
    ↓
spec-store (mandatory)
    ↓
spec-execute (mandatory)
    ↓
spec-branch-commit (mandatory)
    ↓
spec-pr-create (mandatory)
    ↓
spec-pr-review (mandatory)
    ↓
spec-track (optional, anytime)
```

### Never Skip Steps
- ❌ Never go directly from user request to implementation
- ❌ Never implement without storing a spec first
- ❌ Never commit without user approval
- ❌ Never push branch without user approval
- ❌ Never create PR without branch push
- ❌ Never provide PR link without verifying PR exists
- ✅ Always follow the complete workflow

### Mandatory Database Updates
- ✅ Always update `te9.dev/specs/specs.json` whenever a spec's status or content changes
- ✅ Update immediately after status changes
- ✅ Update immediately after content modifications

### Status Transitions (MANDATORY)
```
PENDING → IN_PROGRESS → READY_FOR_BRANCH_COMMIT → BRANCH_COMMITTED → PR_CREATED → COMPLETED
                                ↓
                              FAILED / BLOCKED
```

### Error Handling
1. If tests fail during spec-execute:
   - Attempt to fix (max 3 times)
   - Mark spec as FAILED if still failing
   - Log all failure details
   - Inform user

2. If user rejects commit:
   - Unstage changes: `git reset HEAD`
   - Keep spec as READY_FOR_COMMIT
   - Suggest retry later

3. If user rejects branch push:
   - Keep commit on branch local
   - Update spec: branch_pushed: false
   - Suggest push manually later

4. If PR creation fails:
   - Log error details
   - Check branch exists and is pushed
   - Retry PR creation

5. If PR reviews are rejected:
   - Update spec status back to PR_CREATED
   - Log rejection reasons
   - Suggest fixes and re-review

6. If PR link provision fails:
   - Provide direct PR URL from spec
   - Log error details
   - Ask user to access manually

---

## VALIDATION CHECKLISTS (MANDATORY)

### spec-execute → spec-branch-commit
- ✅ All requirements implemented
- ✅ All acceptance criteria verified
- ✅ All tests passing
- ✅ No regressions detected
- ✅ Code follows project standards
- ✅ Execution log complete
- ✅ Knowledge graph updated
- ✅ Spec status updated to READY_FOR_BRANCH_COMMIT

### spec-branch-commit → spec-pr-create
- ✅ Feature branch created: `feature/SPEC-<id>-<slug>`
- ✅ Commit created with spec ID in brackets
- ✅ Branch pushed to remote
- ✅ User approved commit and push
- ✅ Spec status updated to BRANCH_COMMITTED
- ✅ Branch commit logged

### spec-pr-create → spec-pr-review
- ✅ Pull request created against main
- ✅ PR includes spec details and acceptance criteria
- ✅ Reviewers assigned
- ✅ CI/CD checks enabled
- ✅ Spec status updated to PR_CREATED
- ✅ PR URL and details logged

### spec-pr-review → completion
- ✅ PR link verified and accessible
- ✅ PR status checked (reviews and checks)
- ✅ Direct GitHub PR link provided to user
- ✅ Manual merge instructions given
- ✅ User confirmed completion
- ✅ Spec status updated to COMPLETED
- ✅ OpenMemory updated with PR ready status

---

## ⚠️ CRITICAL INTEGRATION WITH OPENMEMORY

### MANDATORY Memory Storage

During spec-clarify:
- Store conversation in OpenMemory for context

During spec-store:
- Store spec creation as semantic memory
- Store each acceptance criterion as knowledge graph fact

During spec-execute:
- Store "Started executing spec <spec-id>"
- Create knowledge graph facts for completed requirements
- Create knowledge graph facts for verified acceptance criteria

During spec-branch-commit:
- Store "Branch committed for spec <spec-id> - commit <hash> pushed to <branch>"

During spec-pr-create:
- Store "Pull request created for spec <spec-id> - PR <url> opened"

During spec-pr-review:
- Store "Spec <spec-id> PR ready for manual merge - link provided: <pr-url>"

### Knowledge Graph Facts (MANDATORY)
For EVERY spec:
- Create facts for all acceptance criteria
- Update facts as criteria are verified
- Track spec state changes over time
- Maintain timeline of implementation

---

## ⚠️ CRITICAL VALIDATION CHECKLISTS

### Before Moving from spec-clarify to spec-store
- ✅ User's request fully understood
- ✅ All ambiguity resolved
- ✅ Requirements clear and actionable
- ✅ Maximum 5 questions asked
- ✅ User confirms understanding

### Before Moving from spec-store to spec-execute
- ✅ Unique spec ID generated
- ✅ Spec file created with all required sections
- ✅ Specs database updated
- ✅ OpenMemory updated
- ✅ Knowledge graph facts created
- ✅ Execution log initialized

### Before Moving from spec-execute to spec-commit
- ✅ All requirements implemented
- ✅ All acceptance criteria verified
- ✅ All tests passing
- ✅ No regressions detected
- ✅ Code follows project standards
- ✅ Execution log complete
- ✅ Knowledge graph updated
- ✅ Specs database updated with final status

### Before Marking Spec as COMPLETED
- ✅ Git commit created with proper message
- ✅ Commit includes spec ID in brackets
- ✅ User approved commit
- ✅ User approved push (if pushed)
- ✅ Changes pushed to remote (if approved)
- ✅ All actions logged
- ✅ OpenMemory updated
- ✅ Specs database updated with completion status

---

## ⚠️ CRITICAL SUCCESS CRITERIA

### Overall Workflow
- Complete workflow followed for every spec
- No steps skipped or shortcuts taken
- User always informed of progress
- All actions logged and traceable
- OpenMemory integrated throughout

### Individual Steps
1. **spec-clarify**: Clear requirements, confirmed by user
2. **spec-store**: Complete spec created, stored in memory
3. **spec-execute**: All requirements met, all tests passing
4. **spec-commit**: Approved commit and push, spec completed
5. **spec-track**: Status always visible, progress tracked

---

## ⚠️ CRITICAL BEST PRACTICES

### Communication
- Be conversational and helpful
- Keep user informed of progress
- Never assume approval
- Always confirm before proceeding
- Show clear next steps

### Code Quality
- Follow existing code patterns
- Test early and often
- Don't wait until end to test
- Keep changes minimal and focused
- Document non-obvious decisions

### Logging
- Log EVERYTHING
- Be specific about changes
- Include timestamps
- Note all workarounds
- Record all test results

### Safety
- Never auto-commit without approval
- Never auto-push without approval
- Always show preview before commit
- Always show preview before push
- Maintain complete execution logs

---

## ⚠️ CRITICAL NOTES

- This process is MANDATORY for every spec
- No exceptions, no shortcuts
- Follow the exact sequence
- Use spec-track anytime to check status
- Store everything in OpenMemory
- Maintain complete logs
- Keep user informed at every step
- Always wait for approval before committing or pushing

---

## ⚠️ CRITICAL REMINDER

**MUST FOLLOW THIS EXACT PROCESS FOR EVERY SPEC:**

1. **spec-clarify** (always start here)
2. **spec-store** (immediately after clarification)
3. **spec-execute** (implement requirements)
4. **spec-branch-commit** (branch commit & push)
5. **spec-pr-create** (pull request creation)
6. **spec-pr-review** (pull request review link)
7. **spec-track** (anytime for status)

**DO NOT SKIP ANY STEPS.**
**DO NOT SHORTCUT THE PROCESS.**
**ALWAYS FOLLOW THE COMPLETE WORKFLOW.**