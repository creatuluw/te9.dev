Read: te9.dev/specs/<spec-id>/spec.md
Verify: Status is READY_FOR_COMMIT
If not ready:
  - Ask user to run spec-execute first
  - Or update status manually if ready
```

### 2. Review Changes
```
Run: git status
List: All modified, added, deleted files
Display: Summary of changes
  - Files created: [list]
  - Files modified: [list]
  - Files deleted: [list]
```

### 3. Stage Changes
```
Run: git add -A
Verify: All changes staged
Display: "Staged X files for commit"
```

### 4. Prepare Commit Message
```
Format:
<type>: <spec title> [<spec-id>]

- Implemented all acceptance criteria
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

Changes:
- [brief summary of key changes]

Spec: <spec-id>
Type: <feature|bugfix|refactor|other>
Priority: <priority>
```

### 5. Display Commit Preview
```
=== COMMIT PREVIEW ===

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

### 6. Wait for User Approval
```
Wait for user input:
  - "approve" → Create commit
  - "reject" → Unstage changes, stop
  - "modify" → Allow user to modify commit message
```

### 7. Create Commit (if approved)
```
Run: git commit -m "<commit message>"
Capture: Commit hash
Display: "✅ Commit created: <commit-hash>"
```

### 8. Prepare Push Preview
```
=== PUSH PREVIEW ===

Commit: <commit-hash>
Branch: <current-branch>
Remote: <remote-name>

Ready to push to remote?
Type: "approve" or "reject"
```

### 9. Wait for Push Approval
```
Wait for user input:
  - "approve" → Push to remote
  - "reject" → Keep commit local, stop
```

### 10. Push to Remote (if approved)
```
Run: git push <remote> <branch>
Capture: Push result
Display: "✅ Pushed to remote successfully"
```

### 11. Update Spec Status
```
Update spec.md:
  Status: READY_FOR_COMMIT → COMPLETED
  Updated: <current timestamp>
  Git Commit: <commit-hash>
  Pushed: true

Update specs.json:
  status: "COMPLETED"
  updated: <current timestamp>
  commit_hash: "<commit-hash>"
  pushed: true
```

### 12. Store in OpenMemory
```
Store completion:
  "Completed spec <spec-id> - commit <commit-hash> pushed to remote"
  Sector: "procedural"
  Tags: ["spec-completed", "<spec-id>", "commit", "pushed"]
```

### 13. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== COMMIT AND PUSH ===
Timestamp: <timestamp>
Commit Hash: <commit-hash>
Commit Message: <message>
Files Changed: <summary>
Push Status: SUCCESS
Remote: <remote>
Branch: <branch>

=== SPEC COMPLETED ===
Final Status: COMPLETED
Completion Time: <timestamp>
Total Duration: <time from start>
```

### 14. Provide Final Report
```
Display:
✅ Spec <spec-id> completed successfully!

Commit Details:
  Hash: <commit-hash>
  Message: <title> [<spec-id>]
  Files: <count>
  Lines: +X, -Y

Push Details:
  Remote: <remote>
  Branch: <branch>
  Status: SUCCESS ✅

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

Work complete! Ready for next spec.
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
         │  │  Push to Remote
         │  │   ↓
         │  │  Mark Spec Complete
         │  │
         │  └─ "reject"
         │      ↓
         │     Keep Local Only
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
  5. Offer to keep commit local
```

### User Rejects Commit
```
If user types "reject":
  1. Unstage changes: git reset HEAD
  2. Log: "Commit rejected by user"
  3. Keep spec status as READY_FOR_COMMIT
  4. Suggest: Try again later or modify changes
```

### User Rejects Push
```
If user types "reject" for push:
  1. Keep commit local
  2. Log: "Push rejected by user, commit local"
  3. Update spec: pushed: false
  4. Suggest: Push manually later
```

## Validation Checklist

Before presenting to user:
- ✅ Spec status is READY_FOR_COMMIT
- ✅ All changes are staged
- ✅ Commit message includes spec ID
- ✅ Commit message follows format
- ✅ All tests passing (verified)
- ✅ No obvious issues

After user approves:
- ✅ Commit created successfully
- ✅ Commit hash captured
- ✅ Push executed (if approved)
- ✅ Spec status updated to COMPLETED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- Git commit created with proper message
- Commit includes spec ID in brackets
- All related files committed
- User explicitly approved before commit
- User explicitly approved before push
- Changes pushed to remote (if approved)
- Spec marked as COMPLETED
- All actions logged
- OpenMemory updated with completion

## Best Practices

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

After spec-commit completes:
→ **spec-track** - View overall progress and status
→ **spec-clarify** - Start new spec if needed

## Notes

- Two-step approval process (commit + push)
- User can reject push but keep commit local
- Commit hash is stored for reference
- Push status is tracked separately
- All actions are logged
- Spec is marked as COMPLETED only after successful commit
- OpenMemory stores completion record

## Example Workflow

```
AI: Preparing commit for SPEC-20250115-abc123
    
    === COMMIT PREVIEW ===
    
    Commit Message:
    feat: Add login functionality [SPEC-20250115-abc123]
    
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

AI: ✅ Commit created: a1b2c3d
    
    === PUSH PREVIEW ===
    
    Commit: a1b2c3d
    Branch: main
    Remote: origin
    
    Ready to push?
    Type: "approve" or "reject"

User: approve

AI: ✅ Pushed to origin/main successfully
    
    ✅ SPEC-20250115-abc123 completed!
    
    Commit: a1b2c3d
    Pushed: origin/main
    Status: COMPLETED
```

## Important

- NEVER auto-commit without user approval
- NEVER auto-push without user approval
- ALWAYS show full preview before commit
- ALWAYS wait for "approve" before committing
- ALWAYS wait for second "approve" before pushing
- ALWAYS log all commit and push actions
- ALWAYS update spec status after commit