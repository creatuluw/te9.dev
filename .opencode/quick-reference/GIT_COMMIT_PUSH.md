# Git Commit and Push Workflow - Quick Reference

## Workflow at a Glance

```
PRD Execution → Tests Pass → Auto-Commit (local) → User Approval → Push (remote)
```

## Commit Message Format

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

## Commit Types

| Type | Use When |
|------|----------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code improvement |
| `docs` | Documentation |
| `test` | Test changes |
| `chore` | Maintenance |

## Approval Process

### When PRD Completes

1. **System presents commit details**:
   - PRD ID and title
   - Commit hash and message
   - Files changed
   - Test results

2. **System asks for approval**:
   - Type `approve` to push
   - Type `reject` to cancel

3. **After response**:
   - **Approved**: Execute `git push`, log success
   - **Rejected**: Keep commit local, log declined

## Key Rules

✅ **One commit per PRD** - Never combine PRDs  
✅ **PRD ID required** - Must include `[PRD-<id>]`  
✅ **Proper format** - Follow conventional commit format  
✅ **User approval** - Never auto-push  
✅ **Test results** - Include in commit message  

## Quick Commands

### Check commit status
```bash
git status
git log -1 --oneline
```

### View commit details
```bash
git show HEAD
```

### Manual push (if needed)
```bash
git push origin <branch>
```

### Resolve push conflicts
```bash
git pull
# resolve conflicts
git push
```

## Common Scenarios

### Scenario 1: Normal Flow
```
✓ PRD completes
✓ Tests pass (100%)
✓ Auto-commit created
✓ User types: approve
✓ Push successful
```

### Scenario 2: User Rejects
```
✓ PRD completes
✓ Tests pass (100%)
✓ Auto-commit created
✗ User types: reject
→ Commit stays local
→ Can push later manually
```

### Scenario 3: Push Fails
```
✓ PRD completes
✓ Tests pass (100%)
✓ Auto-commit created
✓ User types: approve
✗ Push fails (auth/conflict)
→ Log error
→ User fixes manually
→ User runs: git push
```

## Commit Checklist

Before approving push, verify:
- [ ] Commit message includes PRD ID
- [ ] PRD title is correct
- [ ] Commit type is appropriate (feat/fix/etc.)
- [ ] All PRD-related files included
- [ ] Test results show 100% pass rate
- [ ] No debug or temporary files included

## Troubleshooting

### Commit not created?
- Check git is initialized: `git init`
- Verify write permissions
- Check for merge conflicts

### Push fails?
- Check remote config: `git remote -v`
- Verify authentication (SSH keys/tokens)
- Resolve conflicts: `git pull`
- Check network connection

### Wrong PRD ID in commit?
- Amend carefully: `git commit --amend`
- If already pushed: force push (risky!)
- Best to recreate commit correctly

## Quick Tips

💡 **Review before approving** - Always check commit details first  
💡 **Keep commits atomic** - One PRD = One commit  
💡 **Be descriptive** - Good commit messages help with reviews  
💡 **Test before committing** - Ensure all tests pass  
💡 **Don't rush approval** - Take time to verify everything  

## Remember

> Every PRD gets its own commit with PRD ID in the message.  
> User approval is mandatory before pushing to remote.

---

**Need more details?** See: `../documentation/GIT_COMMIT_AND_PUSH_WORKFLOW.md`
