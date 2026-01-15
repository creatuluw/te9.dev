# Git Commit and Push Workflow Documentation

## Overview

**CRITICAL: Every completed PRD must have its own git commit with the PRD ID and title in the commit message.**

This workflow ensures proper version control, traceability, and user control over when changes are pushed to the remote repository.

## The Workflow

### Step 1: Automatic Commit Creation (in `prd-execute`)

When a PRD is completed and all tests pass, the `prd-execute` skill automatically creates a git commit:

1. **All tests pass** (100% pass rate required)
2. **Code quality verified**
3. **Git commit created** with proper message format
4. **Commit remains local** (not pushed yet)
5. **PRD marked as DONE**

### Step 2: User Approval for Push (in `prd-track`)

When the `COMPLETED` event is tracked:

1. **Present commit details** to user
2. **Ask for approval** to push to remote
3. **Wait for user response** ("approve" or "reject")
4. **If approved**: Execute `git push` and log success
5. **If rejected**: Keep commit local, log declined push

## Commit Message Format

### Mandatory Format

```bash
git commit -m "<type>: <PRD title> [PRD-<id>]

- Implemented all acceptance criteria
- All unit tests passing (100% pass rate)
- No regressions detected
- Code quality verified

PRD: PRD-<id>
Type: <type>
Priority: <priority>"
```

### Format Requirements

- **Type prefix**: Must use conventional commit types (feat, fix, refactor, etc.)
- **PRD title**: The exact title from the PRD
- **PRD ID**: In brackets `[PRD-<id>]` - MANDATORY
- **Body**: Include implementation details and test results
- **Footer**: Include PRD metadata

### Commit Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: Add user authentication [PRD-20250115-143022]` |
| `fix` | Bug fix | `fix: Resolve login timeout issue [PRD-20250115-153045]` |
| `refactor` | Code improvement | `refactor: Optimize database queries [PRD-20250115-160030]` |
| `docs` | Documentation only | `docs: Update API documentation [PRD-20250115-170015]` |
| `test` | Test changes | `test: Add integration tests [PRD-20250115-180000]` |
| `chore` | Maintenance tasks | `chore: Update dependencies [PRD-20250115-190045]` |

## Commit Message Examples

### Example 1: New Feature

```bash
git commit -m "feat: Implement user authentication system [PRD-20250115-143022]

- Implemented user registration flow
- Added JWT token authentication
- Implemented login/logout functionality
- Added password hashing with bcrypt
- Created authentication middleware

Test Results:
- All unit tests passing (15/15 tests)
- Integration tests passing (5/5 tests)
- No regressions detected
- Code quality verified

PRD: PRD-20250115-143022
Type: Feature
Priority: 1
Acceptance Criteria: 5/5 completed"
```

### Example 2: Bug Fix

```bash
git commit -m "fix: Resolve login form validation error [PRD-20250115-153045]

- Fixed email validation regex
- Added proper error messages for invalid inputs
- Fixed password confirmation check
- Improved form validation UX

Test Results:
- All unit tests passing (8/8 tests)
- No regressions detected
- Code quality verified

PRD: PRD-20250115-153045
Type: Bugfix
Priority: 1
Acceptance Criteria: 3/3 completed"
```

### Example 3: Refactor

```bash
git commit -m "refactor: Optimize database queries for performance [PRD-20250115-160030]

- Refactored user query structure
- Added proper indexing on frequently accessed columns
- Optimized relationship loading
- Reduced query count by 40%

Test Results:
- All unit tests passing (12/12 tests)
- Performance tests show 40% improvement
- No regressions detected
- Code quality verified

PRD: PRD-20250115-160030
Type: Refactor
Priority: 2
Acceptance Criteria: 4/4 completed"
```

### Example 4: Documentation

```bash
git commit -m "docs: Update API documentation [PRD-20250115-170015]

- Added endpoint documentation for user API
- Updated authentication examples
- Added request/response examples
- Fixed typos in existing docs

Test Results:
- Documentation build successful
- All examples verified
- No regressions detected

PRD: PRD-20250115-170015
Type: Documentation
Priority: 3
Acceptance Criteria: 4/4 completed"
```

## Push Approval Process

### Step-by-Step Approval Flow

#### 1. Present Commit Details

When `prd-track` receives a `COMPLETED` event:

```markdown
### Ready to Push PRD Changes

**PRD ID:** PRD-20250115-143022
**PRD Title:** Implement user authentication system
**Status:** DONE
**Commit Hash:** a1b2c3d4e5f6...
**Commit Message:** "feat: Implement user authentication system [PRD-20250115-143022]"

**Files in this commit:**
- src/auth/UserService.ts
- src/auth/AuthController.ts
- src/auth/JwtService.ts
- src/middleware/AuthMiddleware.ts
- tests/auth/UserService.test.ts
- tests/auth/AuthController.test.ts
- package.json (added bcrypt, jsonwebtoken dependencies)

**Test Results:**
- All unit tests passing (15/15 tests)
- Integration tests passing (5/5 tests)
- No regressions detected
- Code quality verified

### User Approval Required

To push these changes to the remote repository, please confirm:

- [ ] Review the commit message
- [ ] Verify the changes included
- [ ] Confirm all tests pass
- [ ] Approve pushing to remote

**Type "approve" to push, or "reject" to cancel push.**
```

#### 2. User Approves

User response: `approve`

System action:
```bash
git push origin main
```

Result:
```markdown
### Changes Pushed to Remote
- **Timestamp:** 2025-01-15T14:30:22Z
- **Event:** PRD changes pushed to remote repository
- **Action:** Git push completed successfully
- **Commit Hash:** a1b2c3d4e5f6...
- **Remote Branch:** main
- **User:** User approved push
- **Push Result:** Success
```

#### 3. User Rejects

User response: `reject`

System action:
```markdown
### Push Not Completed
- **Timestamp:** 2025-01-15T14:30:22Z
- **Event:** User declined to push changes
- **Action:** Commit remains local, not pushed
- **Reason:** User rejected push approval
- **Note:** User may push manually using: git push

**Manual Push Instructions:**
```bash
git push origin main
```
```

## Error Handling

### If Git Commit Fails

**Symptoms:**
- `git commit` command fails
- No commit hash generated
- Error message about git configuration

**Actions:**
1. Check if git is initialized: `git init` if needed
2. Verify git is installed and accessible
3. Check for merge conflicts that need resolution
4. Verify you have write permissions
5. Resolve any git errors before proceeding

**Error Message:**
```markdown
### Git Commit Failed
- **Timestamp:** <ISO timestamp>
- **Event:** Git commit encountered errors
- **Error:** <error message>
- **Resolution:** Manual intervention required
- **Action:** 
  1. Check git configuration
  2. Resolve any conflicts
  3. Re-run prd-execute to retry commit
```

### If Git Push Fails

**Symptoms:**
- `git push` command fails after user approval
- Authentication errors
- Network errors
- Permission denied

**Actions:**
1. Check git remote configuration: `git remote -v`
2. Verify authentication credentials (SSH keys, tokens)
3. Check network connectivity
4. Verify you have push permissions to the repository
5. Resolve any merge conflicts with remote

**Error Message:**
```markdown
### Push Failed
- **Timestamp:** <ISO timestamp>
- **Event:** Git push encountered errors
- **Error:** <error message>
- **Resolution:** Manual intervention required
- **Action:** 
  1. Check git remote configuration
  2. Verify authentication credentials
  3. Resolve any conflicts with: git pull
  4. Retry push with: git push
```

### If User Rejects Push

**Actions:**
- Respect user decision
- Do not attempt to push
- Log that push was rejected
- Keep commit locally
- Provide manual push instructions

**Logged Entry:**
```markdown
### Push Not Completed
- **Timestamp:** <ISO timestamp>
- **Event:** User declined to push changes
- **Action:** Commit remains local, not pushed
- **Reason:** User rejected push approval
- **Note:** User may push manually when ready
```

## Best Practices

### During Development

1. **Commit Frequently**: Make incremental commits during development (optional)
2. **Test Before Commit**: Ensure all tests pass before final commit
3. **Clean Working Directory**: Only include PRD-related files in the final commit
4. **Review Changes**: Double-check what's being committed
5. **Follow Conventions**: Use proper commit types and format

### Before Creating PRD Commit

1. **Verify All Tests Pass**: Run `npm test` one final time
2. **Review Modified Files**: Check git status to see what will be committed
3. **Check Commit Message**: Ensure proper format with PRD ID
4. **Verify No Extraneous Files**: Remove debug files, logs, etc.
5. **Confirm PRD Completeness**: Ensure all acceptance criteria are met

### During Push Approval

1. **Review Commit Message**: Check accuracy and completeness
2. **Verify Files**: Ensure only PRD-related changes are included
3. **Check Test Results**: Confirm all tests passed
4. **Consider Impact**: Think about downstream effects
5. **Approve or Reject**: Make informed decision

### After Successful Push

1. **Verify Remote**: Check that commit appears in remote repository
2. **Update PRD Log**: Log successful push with commit hash
3. **Notify Team**: If working in a team, notify of changes
4. **Create PR**: If using pull requests, create PR now
5. **Monitor**: Watch for any issues in production

## Common Scenarios

### Scenario 1: Single PRD, Simple Push

```
1. Implement PRD
2. Run tests: All pass (15/15)
3. Create commit: "feat: Add user login [PRD-001]"
4. PRD marked as DONE
5. prd-track presents commit for approval
6. User types: approve
7. System executes: git push
8. Success logged
```

### Scenario 2: User Rejects Push

```
1. Implement PRD
2. Run tests: All pass
3. Create commit: "fix: Resolve bug [PRD-002]"
4. PRD marked as DONE
5. prd-track presents commit for approval
6. User types: reject
7. System logs: Push declined by user
8. User can push manually later: git push
```

### Scenario 3: Push Fails, User Fixes

```
1. Implement PRD
2. Run tests: All pass
3. Create commit
4. PRD marked as DONE
5. prd-track presents commit for approval
6. User types: approve
7. System attempts: git push
8. Error: "permission denied"
9. User fixes authentication
10. User manually pushes: git push
11. System logs: Manual push completed
```

### Scenario 4: Multiple PRDs in Plan

```
PRD-001:
- Implement
- Tests pass
- Create commit: "feat: Database schema [PRD-001]"
- User approves
- Push success

PRD-002 (depends on PRD-001):
- Implement
- Tests pass
- Create commit: "feat: Authentication API [PRD-002]"
- User approves
- Push success

Each PRD gets its own commit and push!
```

## Commit Message Template

### Template for New Features

```bash
git commit -m "feat: <feature description> [PRD-<id>]

- Implemented <feature 1>
- Implemented <feature 2>
- Added <component/functionality>
- Created <tests>

Test Results:
- All unit tests passing (<passed>/<total> tests)
- Integration tests passing (<passed>/<total> tests)
- No regressions detected
- Code quality verified

PRD: PRD-<id>
Type: Feature
Priority: <priority>
Acceptance Criteria: <completed>/<total> completed"
```

### Template for Bug Fixes

```bash
git commit -m "fix: <bug description> [PRD-<id>]

- Fixed <specific issue>
- Resolved <error/failure>
- Added error handling
- Improved <aspect>

Test Results:
- All unit tests passing (<passed>/<total> tests)
- Reproduced bug: Yes
- Verified fix: Yes
- No regressions detected

PRD: PRD-<id>
Type: Bugfix
Priority: <priority>
Acceptance Criteria: <completed>/<total> completed"
```

### Template for Refactoring

```bash
git commit -m "refactor: <refactoring description> [PRD-<id>]

- Refactored <component/module>
- Improved <aspect>
- Optimized <performance>
- Simplified <code>

Test Results:
- All unit tests passing (<passed>/<total> tests)
- Behavior unchanged: Yes
- Performance improved: <percentage>%
- No regressions detected

PRD: PRD-<id>
Type: Refactor
Priority: <priority>
Acceptance Criteria: <completed>/<total> completed"
```

## Tracking and Logging

### Log Format for Commits

```markdown
### Git Commit Created
- **Timestamp:** <ISO timestamp>
- **Event:** PRD changes committed to local repository
- **Commit Hash:** <commit_hash>
- **Commit Message:** "<message>"
- **Branch:** <branch_name>
- **Status:** Awaiting user approval to push
```

### Log Format for Pushes

```markdown
### Changes Pushed to Remote
- **Timestamp:** <ISO timestamp>
- **Event:** PRD changes pushed to remote repository
- **Action:** Git push completed successfully
- **Commit Hash:** <commit_hash>
- **Remote Branch:** <branch_name>
- **User:** <user who approved>
- **Push Result:** Success
```

### Log Format for Rejected Pushes

```markdown
### Push Not Completed
- **Timestamp:** <ISO timestamp>
- **Event:** User declined to push changes
- **Action:** Commit remains local, not pushed
- **Reason:** User rejected push approval
- **Note:** User may push manually using: git push
```

## FAQ

### Q: Can I push multiple PRDs in one commit?

**A:** NO. Each PRD must have its own separate commit. This ensures clear traceability and makes it easier to revert specific changes if needed.

### Q: What if I want to combine several small PRDs into one commit?

**A:** You should create separate PRDs from the start. If you have multiple small changes, consider creating a single PRD with multiple acceptance criteria instead of multiple PRDs.

### Q: Can I modify the commit after it's created but before pushing?

**A:** Yes, you can amend the commit with `git commit --amend`, but this should be done carefully and only if absolutely necessary. The commit must still follow the format requirements.

### Q: What if I accidentally commit with the wrong PRD ID?

**A:** You can amend the commit to correct the PRD ID, but you should be very careful. If the commit has already been pushed, you'll need to force push which can be problematic if others are working on the repository.

### Q: Can I skip the user approval and auto-push?

**A:** NO. User approval is mandatory. This prevents accidental pushes and gives users control over when changes go to the remote repository.

### Q: What if the user is not available to approve the push?

**A:** The commit remains local and can be pushed later. The PRD is marked as DONE, but the changes stay local until someone approves the push.

### Q: Can I push to a different branch than main?

**A:** Yes, you can push to any branch. The system will push to the current branch (or the branch specified in the push command). This is useful for feature branches.

### Q: What if there are merge conflicts when pushing?

**A:** The push will fail. You'll need to resolve the conflicts by pulling the latest changes (`git pull`), resolving any conflicts, and then retrying the push (`git push`).

### Q: Do I need to push immediately after approval?

**A:** No, you can approve the push and then do it manually later. The approval is just confirmation that the commit is ready to be pushed.

### Q: What if I want to review the commit before approving?

**A:** That's exactly what the approval step is for! You can review the commit details, check the files included, and verify the commit message before approving.

### Q: Can I push without going through the approval process?

**A:** Yes, you can always use standard git commands to push manually (`git push`). The approval process is specifically for the automated workflow, but you can bypass it if needed.

## Summary

### The Golden Rule

> **Every completed PRD gets its own git commit with the PRD ID in the commit message. Changes are only pushed after user approval.**

### Key Points

- ✅ **One commit per PRD** - Never combine PRDs in a single commit
- ✅ **PRD ID required** - Always include `[PRD-<id>]` in commit message
- ✅ **Proper format** - Follow conventional commit format
- ✅ **Include test results** - Document that all tests passed
- ✅ **User approval required** - Never auto-push
- ✅ **Track everything** - Log commits and pushes in PRD logs

### Workflow Summary

```
1. PRD Execution → Implement work
2. Run Tests → Verify 100% pass rate
3. Create Commit → Automatic, with PRD reference
4. PRD Testing → Verify all criteria pass
5. PRD Tracking → Present for user approval
6. User Approval → Type "approve" or "reject"
7. Push (if approved) → Execute git push
8. Log Results → Record commit and push details
```

### Remember

- **Quality First**: Only commit when all tests pass
- **Traceability**: PRD ID in every commit for easy tracking
- **Control**: User approval prevents accidental pushes
- **Clarity**: Detailed commit messages help with code reviews
- **Accountability**: Every push is logged and tracked

---

**Remember**: Good version control practices are essential for maintaining code quality and traceability. Each commit should tell a clear story of what was done and why.