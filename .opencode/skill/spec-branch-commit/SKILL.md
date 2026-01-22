# spec-branch-commit - Branch Commit & Push Skill

## Overview
This skill handles creating a feature branch, committing changes, and pushing the branch to remote for pull request creation. It replaces the direct commit-to-main workflow with a branch-based approach for multi-contributor collaboration.

## When to Use
- Spec status is READY_FOR_BRANCH_COMMIT
- All implementation and testing is complete
- Ready to prepare for collaborative review

## Prerequisites
- Spec file exists: `te9.dev/specs/<spec-id>/spec.md`
- All changes are implemented and tested
- Git repository is initialized
- Remote repository is configured

## Workflow Steps

### 1. Load and Verify Spec
```
Read: te9.dev/specs/<spec-id>/spec.md
Verify: Status is READY_FOR_BRANCH_COMMIT
If not ready:
  - Ask user to run spec-execute first
  - Or update status manually if ready
```

### 2. Create Feature Branch
```
Generate branch name: feature/SPEC-<id>-<slug>
Create branch: git checkout -b <branch-name>
Verify: Branch created successfully
Display: "Created feature branch: <branch-name>"
```

### 3. Review Changes
```
Run: git status
List: All modified, added, deleted files
Display: Summary of changes
  - Files created: [list]
  - Files modified: [list]
  - Files deleted: [list]
```

### 4. Stage Changes
```
Run: git add -A
Verify: All changes staged
Display: "Staged X files for commit"
```

### 5. Prepare Commit Message
```
Format:
<type>: <spec title> [SPEC-<id>]

- Implemented all acceptance criteria
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

Changes:
- [brief summary of key changes]

Spec: SPEC-<id>
Type: <feature|bugfix|refactor|other>
Priority: <priority>
```

### 6. Display Commit Preview
```
=== COMMIT PREVIEW ===

Branch: <branch-name>
Commit Message:
<prepared commit message>

Files Changed:
- Created: [count] files
- Modified: [count] files
- Deleted: [count] files

Total Lines:
+ <added> lines
- <removed> lines

Spec ID: <spec-id>
Spec Title: <title>

=== READY TO COMMIT ===

Do you approve this commit?
Type: "approve" or "reject"
```

### 7. Wait for User Approval
```
Wait for user input:
  - "approve" → Create commit
  - "reject" → Unstage changes, stop
  - "modify" → Allow user to modify commit message
```

### 8. Create Commit (if approved)
```
Run: git commit -m "<commit message>"
Capture: Commit hash
Display: "✅ Commit created: <commit-hash> on branch <branch-name>"
```

### 9. Prepare Branch Push Preview
```
=== BRANCH PUSH PREVIEW ===

Commit: <commit-hash>
Branch: <branch-name>
Remote: <remote-name>

Ready to push branch to remote?
Type: "approve" or "reject"
```

### 10. Wait for Push Approval
```
Wait for user input:
  - "approve" → Push branch to remote
  - "reject" → Keep branch local, stop
```

### 11. Push Branch to Remote (if approved)
```
Run: git push -u origin <branch-name>
Capture: Push result
Display: "✅ Branch pushed to remote successfully"
```

### 12. Update Spec Status
```
Update spec.md:
  Status: READY_FOR_BRANCH_COMMIT → BRANCH_COMMITTED
  Branch: <branch-name>
  Commit Hash: <commit-hash>
  Pushed: true
  Updated: <current timestamp>

Update specs.json:
  status: "BRANCH_COMMITTED"
  branch: "<branch-name>"
  commit_hash: "<commit-hash>"
  pushed: true
  updated: <current timestamp>
```

### 13. Store in OpenMemory
```
Store branch commit:
  "Branch committed for spec <spec-id> - commit <commit-hash> pushed to <branch-name>"
  Sector: "procedural"
  Tags: ["spec-branch-committed", "<spec-id>", "branch", "commit", "pushed"]
```

### 14. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== BRANCH COMMIT ===
Timestamp: <timestamp>
Branch: <branch-name>
Commit Hash: <commit-hash>
Commit Message: <message>
Files Changed: <summary>
Push Status: SUCCESS
Remote: <remote>
Branch: <branch-name>

=== BRANCH COMMITTED ===
Final Status: BRANCH_COMMITTED
Commit Time: <timestamp>
```

### 15. Provide Transition Report
```
Display:
✅ Spec <spec-id> branch committed successfully!

Branch Details:
  Name: <branch-name>
  Commit: <commit-hash>
  Message: <title> [SPEC-<id>]
  Files: <count>
  Lines: +X, -Y

Push Details:
  Remote: <remote>
  Branch: <branch-name>
  Status: SUCCESS ✅

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

Ready for pull request creation!
```

## Commit Message Templates

### Feature
```
feat: <title> [SPEC-<id>]

- Implemented feature functionality
- All acceptance criteria met
- Tests passing (100%)

Spec: SPEC-<id>
Type: feature
Priority: <priority>
```

### Bugfix
```
fix: <title> [SPEC-<id>]

- Fixed reported issue
- Verified no regressions
- Tests passing (100%)

Spec: SPEC-<id>
Type: bugfix
Priority: <priority>
```

### Refactor
```
refactor: <title> [SPEC-<id>]

- Improved code structure
- Maintained functionality
- Tests passing (100%)

Spec: SPEC-<id>
Type: refactor
Priority: <priority>
```

### Other
```
chore: <title> [SPEC-<id>]

- Completed work
- All criteria met
- Tests passing (100%)

Spec: SPEC-<id>
Type: other
Priority: <priority>
```

## Approval Workflow

```
┌─────────────────┐
│ Show Commit     │
│ Preview         │
└────────┬────────┘
         │
         ├─ "approve"
         │   ↓
         │  Create Commit
         │   ↓
         │  Show Push Preview
         │   ↓
         │  Wait for Push Approval
         │   ↓
         │  ├─ "approve"
         │  │   ↓
         │  │  Push Branch to Remote
         │  │   ↓
         │  │  Mark Spec BRANCH_COMMITTED
         │  │
         │  └─ "reject"
         │      ↓
         │     Keep Branch Local Only
         │
         ├─ "modify"
         │   ↓
         │  Allow Edit
         │   ↓
         │  Re-show Preview
         │
         └─ "reject"
             ↓
            Unstage Changes
```

## Error Handling

### Branch Creation Failure
```
If git checkout -b fails:
  1. Log error details
  2. Check if branch already exists
  3. Suggest alternative branch name
  4. Retry or abort
```

### Commit Failure
```
If git commit fails:
  1. Log error details
  2. Check for merge conflicts
  3. Ask user to resolve
  4. Retry commit after resolution
```

### Push Failure
```
If git push fails:
  1. Log error details
  2. Check network connection
  3. Check authentication
  4. Ask user to resolve
  5. Offer to keep branch local
```

### User Rejects Commit
```
If user rejects commit:
  1. Unstage changes: git reset HEAD
  2. Log: "Commit rejected by user"
  3. Keep spec as READY_FOR_BRANCH_COMMIT
  4. Suggest retry later
```

### User Rejects Push
```
If user rejects push:
  1. Keep branch local
  2. Log: "Branch push rejected by user"
  3. Update spec: pushed: false
  4. Suggest push manually later
```

## Validation Checklist

Before presenting to user:
- ✅ Spec status is READY_FOR_BRANCH_COMMIT
- ✅ All changes are staged
- ✅ Commit message includes spec ID
- ✅ Commit message follows format
- ✅ All tests passing (verified)
- ✅ No obvious issues

After user approves:
- ✅ Commit created successfully
- ✅ Commit hash captured
- ✅ Branch pushed (if approved)
- ✅ Spec status updated to BRANCH_COMMITTED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- Feature branch created successfully
- Git commit created with proper message
- Commit includes spec ID in brackets
- Branch pushed to remote (if approved)
- User explicitly approved before commit and push
- Spec marked as BRANCH_COMMITTED
- All actions logged
- OpenMemory updated with branch commit record

## Best Practices

### Branch Naming
```
- Use format: feature/SPEC-<id>-<slug>
- Keep names descriptive but concise
- Include spec ID for traceability
- Use kebab-case for slugs
```

### Commit Messages
```
- Use conventional commit format (feat/fix/refactor/chore)
- Include spec ID in brackets: [SPEC-<id>]
- Be concise but descriptive
- List key changes
- Include test results
```

### User Communication
```
- Be clear about what will be committed
- Show full commit preview
- Wait for explicit approval
- Don't assume approval
- Allow modification if requested
- Confirm all actions
```

### Safety
```
- Never auto-commit
- Never auto-push
- Always show preview
- Always wait for approval
- Log everything
- Keep records
```

## Transition to Next Skill

After spec-branch-commit completes:
→ **spec-pr-create** - Create pull request for review

## Notes

- Creates isolated feature branch for collaboration
- Two-step approval process (commit + push)
- User can reject push but keep commit local
- Commit hash is stored for reference
- Push status is tracked separately
- All actions are logged
- Spec is marked as BRANCH_COMMITTED only after successful branch push
- OpenMemory stores branch commit record

## Example Workflow

```
AI: Preparing branch commit for SPEC-20260120-2010-add-login-functionality
    
    === COMMIT PREVIEW ===
    
    Branch: feature/SPEC-20260120-2010-add-login-functionality
    Commit Message:
    feat: Add login functionality [SPEC-20260120-2010-add-login-functionality]
    
    - Implemented login form
    - Added authentication
    - All tests passing (100%)
    
    Spec: SPEC-20250115-abc123
    Type: feature
    
    Files: 3 created, 2 modified
    Lines: +150, -20
    
    Ready to commit?
    Type: "approve" or "reject"

User: approve

AI: ✅ Commit created: a1b2c3d on branch feature/SPEC-20260120-2010-add-login-functionality
    
    === BRANCH PUSH PREVIEW ===
    
    Commit: a1b2c3d
    Branch: feature/SPEC-20260120-2010-add-login-functionality
    Remote: origin
    
    Ready to push branch?
    Type: "approve" or "reject"

User: approve

AI: ✅ Branch pushed to origin/feature/SPEC-20260120-2010-add-login-functionality successfully
    
    ✅ SPEC-20250115-abc123 branch committed!
    
    Branch: feature/SPEC-20260120-2010-add-login-functionality
    Commit: a1b2c3d
    Pushed: origin/feature/SPEC-20260120-2010-add-login-functionality
    Status: BRANCH_COMMITTED
```

## Important

- NEVER auto-commit without user approval
- NEVER auto-push without user approval
- ALWAYS show full preview before commit
- ALWAYS wait for "approve" before committing
- ALWAYS wait for second "approve" before pushing branch
- ALWAYS log all commit and push actions
- ALWAYS update spec status after branch push
- ALWAYS create feature branch first
```

## Transition to Next Skill

After spec-branch-commit completes:
→ **spec-pr-create** - Create pull request for review

## Notes

- Creates isolated feature branch for collaboration
- Two-step approval process (commit + push)
- User can reject push but keep commit local
- Commit hash is stored for reference
- Push status is tracked separately
- All actions are logged
- Spec is marked as BRANCH_COMMITTED only after successful branch push
- OpenMemory stores branch commit record

## Example Workflow

```
AI: Preparing branch commit for SPEC-20260120-2010-add-login-functionality
    
    === COMMIT PREVIEW ===
    
    Branch: feature/SPEC-20260120-2010-add-login-functionality
    Commit Message:
    feat: Add login functionality [SPEC-20260120-2010-add-login-functionality]
    
    - Implemented login form
    - Added authentication
    - All tests passing (100%)
    
    Spec: SPEC-20250115-abc123
    Type: feature
    
    Files: 3 created, 2 modified
    Lines: +150, -20
    
    Ready to commit?
    Type: "approve" or "reject"

User: approve

AI: ✅ Commit created: a1b2c3d on branch feature/SPEC-20260120-2010-add-login-functionality
    
    === BRANCH PUSH PREVIEW ===
    
    Commit: a1b2c3d
    Branch: feature/SPEC-20260120-2010-add-login-functionality
    Remote: origin
    
    Ready to push branch?
    Type: "approve" or "reject"

User: approve

AI: ✅ Branch pushed to origin/feature/SPEC-20260120-2010-add-login-functionality successfully
    
    ✅ SPEC-20250115-abc123 branch committed!
    
    Branch: feature/SPEC-20260120-2010-add-login-functionality
    Commit: a1b2c3d
    Pushed: origin/feature/SPEC-20260120-2010-add-login-functionality
    Status: BRANCH_COMMITTED
```

## Important

- NEVER auto-commit without user approval
- NEVER auto-push without user approval
- ALWAYS show full preview before commit
- ALWAYS wait for "approve" before committing
- ALWAYS wait for second "approve" before pushing branch
- ALWAYS log all commit and push actions
- ALWAYS update spec status after branch push
- ALWAYS create feature branch first
```
