# Spec Branch Commit - Version Control Integration

## Overview

The spec-branch-commit step manages the version control operations for a specification's implementation. This includes creating feature branches, committing changes with proper formatting, requesting user approval, pushing to remote, and updating spec status.

**Core principle**: Every implementation change must be associated with a specification ID for traceability and auditability.

## When to Use

This reference is used during **Step 4** of the te9.dev workflow, after implementation (Step 3) is complete and all acceptance criteria have been verified.

**Prerequisites:**
- Spec status is `READY_FOR_BRANCH_COMMIT`
- All code changes are complete
- All tests are passing
- User has approved the implementation (from Step 3 review)

## Core Procedures

### 1. Branch Creation

**Generate branch name using spec ID:**
```
feature/SPEC-<id>-<slug>
```

**Components:**
- `feature/` - Prefix for feature branches
- `SPEC-<id>` - Full specification identifier
- `<slug>` - URL-friendly version of spec title or brief description

**Examples:**
- `feature/SPEC-20240115-1430-add-user-auth`
- `feature/SPEC-20240120-0930-fix-payment-gateway`
- `feature/SPEC-20240125-1645-implement-api-caching`

**Commands:**
```bash
# Create and checkout new branch
git checkout -b feature/SPEC-<id>-<slug>

# Alternatively, create then checkout
git branch feature/SPEC-<id>-<slug>
git checkout feature/SPEC-<id>-<slug>
```

### 2. Git Configuration (One-time Setup)

**Ensure git is properly configured:**
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
git config push.default current
```

**Verify configuration:**
```bash
git config --list | grep user
```

### 3. Staging Changes

**Review all changes before staging:**
```bash
# Check working directory status
git status

# See diff of unstaged changes
git diff

# See diff of staged changes
git diff --cached

# See detailed changes in commit format
git diff HEAD
```

**Stage changes:**
```bash
# Stage all changes
git add .

# Stage specific files
git add src/app.ts tests/app.test.ts

# Stage by pattern
git add "*.ts"
git add "src/**/*.ts"

# Stage interactively (review each hunk)
git add -i
```

**Common patterns:**
```bash
# Stage all TypeScript files
git add "*.ts" "*.tsx"

# Stage documentation only
git add "*.md" "docs/**"

# Stage configuration changes
git add "*.json" "*.yaml" "*.yml"

# Exclude test files (stage separately)
git add . ":!**/*.test.ts" ":!**/*.spec.ts"
```

### 4. Commit Message Format

**Standard commit format with spec ID:**
```
[SPEC-<id>] <type>(<scope>): <subject>

<body>

<footer>
```

**Components:**
- `[SPEC-<id>]` - Mandatory spec ID in brackets
- `<type>` - Commit type (feat, fix, docs, style, refactor, test, chore)
- `<scope>` - Affected module/component (optional but recommended)
- `<subject>` - Concise description (imperative mood, 50 char limit)
- `<body>` - Detailed explanation (multiple paragraphs, 72 char line limit)
- `<footer>` - References, breaking changes, etc.

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks (dependencies, config, etc.)

**Examples:**

<Good>
```bash
git commit -m "[SPEC-20240115-1430] feat(auth): add user authentication

Implement JWT-based authentication with login/logout endpoints.

Changes:
- Add auth service with token generation
- Create login/logout API endpoints
- Add authentication middleware
- Implement refresh token mechanism

Closes SPEC-20240115-1430"
```
</Good>

<Good>
```bash
git commit -m "[SPEC-20240120-0930] fix(payment): handle gateway timeout errors

Add retry logic and proper error handling for payment gateway timeouts.
Previously, transient errors would cause permanent failure.

Closes SPEC-20240120-0930"
```
</Good>

<Good>
```bash
git commit -m "[SPEC-20240125-1645] test(users): add coverage for user service

Add unit tests for user CRUD operations achieving 95% coverage.

Closes SPEC-20240125-1645"
```
</Good>

<Bad>
```bash
# Missing spec ID
git commit -m "feat(auth): add user authentication"

# Missing type
git commit -m "[SPEC-20240115-1430] Add user authentication"

# Vague subject
git commit -m "[SPEC-20240115-1430] fix: stuff"
```
</Bad>

**Multiple commits:**
For large changes, break into logical commits:
```bash
# First commit: Tests
git commit -m "[SPEC-<id>] test(auth): add authentication tests"

# Second commit: Implementation
git commit -m "[SPEC-<id>] feat(auth): implement authentication"

# Third commit: Documentation
git commit -m "[SPEC-<id>] docs(auth): add API documentation"
```

### 5. Pre-Push Verification

**Before requesting approval, verify:**
```bash
# Check staged changes
git diff --cached

# Check last commit
git show HEAD

# Verify commit message
git log -1 --format=fuller

# Run tests one final time
npm test

# Check for linting errors
npm run lint
```

**Verification checklist:**
```
[ ] All changes are staged
[ ] Commit message includes spec ID
[ ] Commit follows conventional commit format
[ ] All tests pass
[ ] No linting errors
[ ] No sensitive data committed (API keys, passwords)
[ ] No temporary or debug files
[ ] Commit message is clear and descriptive
```

### 6. Request User Approval

**Present changes to user for review:**

```
I'm ready to push the changes to remote.

Spec ID: SPEC-<id>
Branch: feature/SPEC-<id>-<slug>
Commit: [commit hash]
Message: [commit subject]

Files changed:
[M/M lines] [filename]
[M/M lines] [filename]
...

Tests: [X/X] passing
Linting: [passed/failed]

Please confirm: [yes/no]
```

**Include detailed diff if requested:**
```bash
git diff origin/main...HEAD
```

### 7. Push to Remote

**After user approval:**
```bash
# Push to remote with upstream tracking
git push -u origin feature/SPEC-<id>-<slug>

# Or just push (if upstream already set)
git push
```

**Handle push errors:**

<Good>
```bash
# Authentication error
# Fix: Configure credentials
git config credential.helper store
git push  # Will prompt for credentials

# Remote doesn't exist
# Fix: Add remote
git remote add origin <url>
git push -u origin feature/SPEC-<id>-<slug>

# Branch already exists on remote
# Fix: Force push (use with caution)
git push --force-with-lease origin feature/SPEC-<id>-<slug>

# Or create different branch
git checkout -b feature/SPEC-<id>-<slug>-v2
git push -u origin feature/SPEC-<id>-<slug>-v2
```
</Good>

### 8. Update Spec Status

**After successful push, update spec status:**
```markdown
## Status

**BRANCH_COMMITTED**

### Git Information
- Branch: `feature/SPEC-<id>-<slug>`
- Commit: `[commit hash]`
- Pushed: `[timestamp]`
```

**Update in spec.md file:**
```markdown
## Status
BRANCH_COMMITTED

## Execution Log
[timestamp] Step 4: Branch commit completed
- Branch created: feature/SPEC-<id>-<slug>
- Commit: [commit hash]
- Pushed to remote
- Status updated to BRANCH_COMMITTED
```

## Common Patterns

### Multiple Feature Implementation

**If implementing multiple features in one spec:**
```bash
# Create branch for spec
git checkout -b feature/SPEC-<id>-<slug>

# Make changes for feature 1
git add .
git commit -m "[SPEC-<id>] feat: implement feature 1"

# Make changes for feature 2
git add .
git commit -m "[SPEC-<id>] feat: implement feature 2"

# Push all commits together
git push -u origin feature/SPEC-<id>-<slug>
```

### Fixing Issues After Commit

**If issues found after commit but before push:**
```bash
# Make the fix
# Edit file...

# Amend the commit (replaces last commit)
git add .
git commit --amend --no-edit  # Keep same message
# Or edit message: git commit --amend

# Push (may need force if already pushed)
git push --force-with-lease
```

**For proper audit trail, prefer new commit:**
```bash
# Make the fix
git add .
git commit -m "[SPEC-<id>] fix: correct issue with feature 1"
git push
```

### Squashing Commits

**For cleaner history (before push):**
```bash
# View commit history
git log --oneline

# Interactive rebase (squash last N commits)
git rebase -i HEAD~N

# Push
git push --force-with-lease
```

**Rebase instructions:**
- Change `pick` to `squash` or `s` for commits to squash
- Reorder if needed
- Write combined commit message
- Save and exit

## Error Handling

### Branch Already Exists

**Scenario**: Branch `feature/SPEC-<id>-<slug>` already exists locally or remotely

**Solutions:**
1. **Delete and recreate:**
   ```bash
   # Delete local branch
   git branch -D feature/SPEC-<id>-<slug>
   
   # Delete remote branch
   git push origin --delete feature/SPEC-<id>-<slug>
   
   # Recreate
   git checkout -b feature/SPEC-<id>-<slug>
   ```

2. **Use alternative name:**
   ```bash
   # Add suffix
   git checkout -b feature/SPEC-<id>-<slug>-v2
   
   # Or add timestamp
   git checkout -b feature/SPEC-<id>-<slug>-$(date +%s)
   ```

3. **Check out existing branch:**
   ```bash
   # If it's your branch from before
   git checkout feature/SPEC-<id>-<slug>
   
   # Pull latest changes
   git pull origin feature/SPEC-<id>-<slug>
   ```

### Conflicts During Push

**Scenario**: Remote branch has diverged from local

**Solutions:**
1. **Rebase on remote:**
   ```bash
   # Fetch latest changes
   git fetch origin
   
   # Rebase local changes on top of remote
   git rebase origin/feature/SPEC-<id>-<slug>
   
   # Resolve conflicts (edit files)
   git add <resolved files>
   git rebase --continue
   
   # Push
   git push
   ```

2. **Merge instead:**
   ```bash
   # Fetch latest changes
   git fetch origin
   
   # Merge remote changes
   git merge origin/feature/SPEC-<id>-<slug>
   
   # Resolve conflicts
   git add <resolved files>
   git commit
   
   # Push
   git push
   ```

**If conflicts cannot be resolved:**
```bash
# Abort and restart
git rebase --abort
# Or
git merge --abort

# Notify human to resolve manually
```

### Permission Errors

**Scenario**: Cannot push due to permissions

**Solutions:**
1. **Check authentication:**
   ```bash
   # Verify git config
   git config --list | grep user
   
   # Configure credentials
   git config credential.helper store
   ```

2. **Check branch permissions:**
   ```bash
   # Verify you have push access
   git remote -v
   
   # Try explicit push
   git push origin feature/SPEC-<id>-<slug>
   ```

3. **Request human assistance:**
   ```
   Permission denied when pushing branch.

   Spec ID: SPEC-<id>
   Branch: feature/SPEC-<id>-<slug>
   Error: [error message]

   Please check permissions or provide alternative access.
   ```

## Best Practices

### Commit Hygiene

**Do:**
- Keep commits focused on single logical change
- Write clear, descriptive commit messages
- Include spec ID in every commit
- Use conventional commit format
- Review changes before committing

**Don't:**
- Commit unrelated changes together
- Use vague commit messages ("fix", "update")
- Commit temporary or debug code
- Commit sensitive data
- Skip spec ID in commit messages

### Branch Management

**Do:**
- Use descriptive branch names with spec ID
- Keep branch lifetime short
- Delete merged branches
- Use feature branches, not direct main

**Don't:**
- Create long-lived branches
- Branch off other feature branches (branch off main)
- Push to main directly
- Leave stale branches

### Pre-Push Checklist

**Always verify before pushing:**
```
[ ] Commit message includes spec ID
[ ] Commit follows conventional format
[ ] All changes are staged correctly
[ ] No unwanted files included
[ ] All tests pass
[ ] No linting errors
[ ] No sensitive data
[ ] Branch name is correct
[ ] User approval received
```

## Integration with CI/CD

### Expected CI/CD Checks

**After push, these checks should automatically run:**
1. **Unit tests** - Pass all unit tests
2. **Integration tests** - Pass all integration tests
3. **Linting** - No linting errors
4. **Security scans** - No security vulnerabilities
5. **Build** - Successful build
6. **Code coverage** - Meets minimum coverage threshold

**If CI/CD fails:**
1. Check failure details in CI/CD logs
2. Reproduce locally if possible
3. Fix the issue
4. Commit and push fix
5. Wait for CI/CD to pass

### Monitoring CI/CD

**Commands to check CI/CD status:**
```bash
# GitHub CLI
gh pr checks  # If PR exists
gh run list   # List recent workflow runs

# GitLab CLI
glab ci list
glab ci view <pipeline-id>
```

## Troubleshooting

### Cannot Find Spec ID

**Problem**: Don't know which spec ID to use

**Solution:**
```bash
# Check execution log
cat te9.dev/logs/<id>.log

# Check spec file
cat te9.dev/specs/<id>/spec.md

# Check specs.json
cat te9.dev/specs/specs.json
```

### Wrong Commit Message

**Problem**: Committed with wrong message

**Solution:**
```bash
# If not yet pushed
git commit --amend
# Edit message and save

# If already pushed (use caution)
git commit --amend
git push --force-with-lease
```

### Need to Add Files After Commit

**Problem**: Forgot to include some files

**Solution:**
```bash
# Stage the forgotten files
git add <forgotten files>

# Create new commit
git commit -m "[SPEC-<id>] chore: add missing files"

# Push
git push
```

## Verification Checklist

Before proceeding to Step 5 (spec-pr-create):

- [ ] Feature branch created with correct name
- [ ] All changes committed with spec ID in brackets
- [ ] Commit messages follow conventional commit format
- [ ] User approval received before push
- [ ] Branch successfully pushed to remote
- [ ] Spec status updated to BRANCH_COMMITTED
- [ ] Execution log updated with branch information
- [ ] CI/CD checks are running (verify if applicable)
- [ ] No conflicts or errors encountered
- [ ] Branch is clean (no uncommitted changes)

## Next Steps

After successful branch commit, proceed to **Step 5: spec-pr-create** to create the pull request.

**Reference**: `@references/spec-pr-create.md` for pull request creation procedures.