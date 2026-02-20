🎉 Pull Request Created!

Spec ID: SPEC-<id>
Branch: feature/SPEC-<id>-<slug>

Pull Request:
🔗 https://github.com/<owner>/<repo>/pull/<pr-number>

Spec Details:
- Title: [spec title]
- Description: [spec description]
- Acceptance Criteria: [count] criteria defined
- Changes: [files changed] files, [+lines] additions, [-lines] deletions

Reviewers: [assigned reviewers]
CI/CD Status: [checks running/passed/failed]

Ready for review! Please:
1. Review the code changes
2. Verify acceptance criteria
3. Approve or request changes
4. Merge when ready

Use `@spec-track SPEC-<id>` to check status anytime.
```

**Access PR via GitHub CLI:**
```bash
# View PR
gh pr view <pr-number>

# View PR in browser
gh pr view <pr-number> --web

# Check PR status
gh pr view <pr-number> --json title,state,reviewDecision,mergeable,mergeStateStatus
```

### 2. Manual Merge Instructions

**Before Merging - Verification Checklist:**

```
Pre-Merge Requirements:

✅ CI/CD Status:
   [ ] All tests passing
   [ ] Linting checks passing
   [ ] Security scans passing
   [ ] Build successful

✅ Code Review:
   [ ] At least one reviewer approval received
   [ ] No outstanding change requests
   [ ] All comments addressed or justified

✅ Spec Compliance:
   [ ] All acceptance criteria met
   [ ] Implementation matches spec requirements
   [ ] No features added beyond spec scope
   [ ] No deviations from planned approach

✅ Branch Status:
   [ ] Branch is up-to-date with main
   [ ] No merge conflicts
   [ ] Branch is clean

✅ Documentation:
   [ ] Code comments added where necessary
   [ ] API documentation updated (if applicable)
   [ ] README updated (if applicable)
   [ ] Changelog updated (if applicable)
```

**Merge Methods (Choose Based on Project Standards):**

<Good>
```bash
# Method 1: Merge Commit (preserves complete history)
gh pr merge <pr-number> --merge

# Method 2: Squash and Merge (clean history, single commit)
gh pr merge <pr-number> --squash

# Method 3: Rebase and Merge (linear history)
gh pr merge <pr-number> --rebase
```
</Good>

**Merge via GitHub Web UI:**

1. Navigate to PR URL
2. Review all changes (Files Changed tab)
3. Check Conversation tab for:
   - Reviewer approvals
   - CI/CD status
   - Outstanding discussions
4. When ready:
   - Click "Merge pull request" button
   - Confirm merge
   - Delete branch (optional but recommended)

### 3. Monitoring CI/CD Status

**Check CI/CD Status:**

```bash
# Via GitHub CLI
gh pr checks <pr-number>

# View specific workflow runs
gh run list --pr <pr-number>

# Watch workflow run in real-time
gh run watch <run-id>

# View workflow logs
gh run view <run-id> --log
```

**Interpret CI/CD Results:**

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Passing | All checks completed successfully | Ready for merge |
| ⏳ Running | Checks in progress | Wait for completion |
| ❌ Failed | One or more checks failed | Fix and retry |
| ⚠️ Neutral | Optional check passed (e.g., code coverage) | Can proceed |
| 🚫 Action Required | Manual intervention needed | Follow instructions |

**Common CI/CD Checks:**

1. **Unit Tests**
   - Expected: All tests passing
   - Failure: Fix failing tests, push fix

2. **Integration Tests**
   - Expected: All integration tests passing
   - Failure: Check service dependencies, fix issues

3. **End-to-End Tests**
   - Expected: All E2E tests passing
   - Failure: Verify test environment, fix test or code

4. **Linting**
   - Expected: No linting errors
   - Failure: Fix linting issues, push fix

5. **Security Scans**
   - Expected: No critical/high vulnerabilities
   - Failure: Assess severity, fix or document exception

6. **Code Coverage**
   - Expected: Coverage meets minimum threshold (e.g., 90%)
   - Failure: Add tests or justify exception

7. **Build**
   - Expected: Successful build
   - Failure: Check build logs, fix build issues

**Handling CI/CD Failures:**

```bash
# 1. Identify failed check
gh pr checks <pr-number>
# Look for ❌ status

# 2. Get failure details
gh run view <run-id> --log-failed

# 3. Reproduce locally (if possible)
npm test
npm run lint

# 4. Fix the issue
# Edit code...

# 5. Commit and push fix
git add .
git commit -m "[SPEC-<id>] fix: resolve CI/CD failure"
git push

# 6. Monitor new CI/CD run
gh pr checks <pr-number>
```

### 4. Mark Spec as Completed

**After successful merge:**

1. **Update spec.md:**
```markdown
## Status

**COMPLETED**

### Completion Details
- Merged: [timestamp]
- Merged by: [username]
- Merge commit: [commit hash]
- Pull Request: [PR URL]
```

2. **Update execution log:**
```
[timestamp] Step 6: Spec PR Review completed
- PR link provided: [PR URL]
- Manual merge instructions provided
- CI/CD status monitored: [status]
- User confirmed merge
- Spec marked as COMPLETED
```

3. **Archive execution log:**
```bash
# Move log to completed directory
mkdir -p te9.dev/logs/completed
mv te9.dev/logs/<spec-id>.log te9.dev/logs/completed/
```

4. **Update specs.json:**
```json
{
  "id": "SPEC-20240115-1430-add-user-auth",
  "title": "Add User Authentication",
  "status": "COMPLETED",
  "completed_at": "2024-01-15T16:45:00Z",
  "merged_by": "username",
  "merge_commit": "abc123def456"
}
```

### 5. Post-Merge Actions

**Recommended actions after merge:**

<Good>
```bash
# 1. Delete feature branch (local and remote)
git branch -D feature/SPEC-<id>-<slug>
gh repo delete-branch feature/SPEC-<id>-<slug>

# 2. Pull latest changes from main
git checkout main
git pull origin main

# 3. Clean up local branches
git remote prune origin

# 4. Close related issues (if any)
gh issue close <issue-number> --comment "Closed by #[PR-number]"

# 5. Tag release (if applicable)
git tag -a v1.2.3 -m "Release v1.2.3 - Add user authentication"
git push origin v1.2.3
```
</Good>

## Review Process

### Code Review Guidelines

**What to Review:**

1. **Correctness**
   - Does code implement spec requirements?
   - Are acceptance criteria met?
   - Are edge cases handled?

2. **Quality**
   - Is code clean and readable?
   - Are names descriptive?
   - Is code well-organized?

3. **Testing**
   - Are tests comprehensive?
   - Do tests cover edge cases?
   - Is test coverage adequate?

4. **Documentation**
   - Is code documented where needed?
   - Are API docs updated?
   - Is README updated?

5. **Security**
   - Are inputs validated?
   - Are secrets properly handled?
   - Are permissions correct?

**Review Comments Format:**

```
## Review Comments

### ✅ Approvals
- [x] Acceptance criteria 1: PASSED
- [x] Acceptance criteria 2: PASSED
- [x] Tests are comprehensive

### ⚠️ Suggestions (Optional)
- Consider extracting [function] for reusability
- Variable name [name] could be more descriptive
- Add comment explaining [complex logic]

### ❌ Change Requests (Block Merge)
- [ ] Fix [issue description]
- [ ] Add test for [edge case]
- [ ] Update [documentation]

### 🔍 Questions
- Why was [approach] chosen over [alternative]?
- Is [feature] intentionally omitted?
```

### Approval Workflow

**Reviewer Actions:**

1. **Approve**
   ```bash
   # Approve PR
   gh pr review <pr-number> --approve --body "LGTM! Ready to merge."
   ```

2. **Request Changes**
   ```bash
   # Request changes with comments
   gh pr review <pr-number> --request-changes --body "Please address the following issues..."
   ```

3. **Comment**
   ```bash
   # Add general comment
   gh pr review <pr-number> --comment --body "Question about approach..."
   ```

**Review Decision Status:**

- `APPROVED` - Ready to merge (if CI/CD passes)
- `CHANGES_REQUESTED` - Must address before merge
- `REVIEW_REQUIRED` - Waiting for reviewers

## Common Patterns

### Standard Feature PR

**Workflow:**
1. PR created with spec details
2. Automated CI/CD checks run
3. Reviewer reviews code
4. Approvals received
5. CI/CD passes
6. Merge when ready

**Example:**
```
PR: #123 - SPEC-20240115-1430-add-user-auth
Files: 15 changed, 450 additions, 50 deletions
Tests: 25 passing
Coverage: 95%
Reviewers: @alice @bob

CI/CD: ✅ All checks passing
Reviews: ✅ 2 approvals
Status: Ready to merge

Action: User reviews and merges
```

### Bug Fix PR

**Workflow:**
1. PR created with bug fix
2. Automated CI/CD checks run
3. Reviewer tests fix
4. Verify bug is resolved
5. Approve and merge

**Example:**
```
PR: #124 - SPEC-20240120-0930-fix-payment-gateway
Files: 3 changed, 25 additions, 5 deletions
Tests: 28 passing (including new bug test)
Coverage: 93%
Reviewers: @alice

CI/CD: ✅ All checks passing
Reviews: ✅ 1 approval
Status: Ready to merge

Action: User reviews and merges
```

### Refactoring PR

**Workflow:**
1. PR created with refactoring
2. Automated CI/CD checks run
3. Reviewer verifies no behavior changes
4. Approvals received
5. Merge when ready

**Example:**
```
PR: #125 - SPEC-20240125-1645-refactor-auth-service
Files: 8 changed, 150 additions, 180 deletions
Tests: 30 passing (no new tests, refactoring only)
Coverage: 94% (maintained)
Reviewers: @alice @charlie

CI/CD: ✅ All checks passing
Reviews: ✅ 2 approvals
Status: Ready to merge

Action: User reviews and merges
```

## Error Handling

### CI/CD Failure

**Scenario:** CI/CD checks fail after merge attempt

**Solutions:**
1. **Check failure details:**
   ```bash
   gh run view <run-id> --log-failed
   ```

2. **Assess severity:**
   - **Critical failures** (security, breaking changes): Block merge immediately
   - **Non-critical failures** (minor linting): Fix or document exception

3. **Fix and retry:**
   ```bash
   # Fix issue
   # Edit code...
   
   # Commit and push fix
   git add .
   git commit -m "[SPEC-<id>] fix: resolve CI/CD failure"
   git push
   
   # Monitor new CI/CD run
   gh pr checks <pr-number>
   ```

4. **Document exception** (if applicable):
   ```markdown
   ## Exception Documentation
   
   CI/DC Check: Linting
   Status: Failed
   Reason: False positive - rule XXXX
   Exception Type: Documented exception
   Exception Reference: ISSUE-123
   ```

### Merge Conflicts

**Scenario:** Merge conflicts prevent merging

**Solutions:**
1. **Resolve locally:**
   ```bash
   # Checkout main
   git checkout main
   git pull origin main
   
   # Checkout feature branch
   git checkout feature/SPEC-<id>-<slug>
   
   # Rebase on main
   git rebase main
   
   # Resolve conflicts
   # Edit conflicted files...
   
   # Continue rebase
   git add .
   git rebase --continue
   
   # Push rebased branch
   git push --force-with-lease
   ```

2. **Request manual resolution:**
   ```
   ⚠️ Merge Conflicts Detected
   
   Spec ID: SPEC-<id>
   Branch: feature/SPEC-<id>-<slug>
   
   Conflicts in:
   - src/app.ts (3 conflicts)
   - tests/app.test.ts (1 conflict)
   
   Please resolve conflicts manually:
   1. Pull latest main: git pull origin main
   2. Rebase branch: git rebase main
   3. Resolve conflicts in editor
   4. Continue: git add . && git rebase --continue
   5. Push: git push --force-with-lease
   
   Then CI/CD will re-run.
   ```

### Reviewer Not Responding

**Scenario:** Reviewer assigned but not providing review

**Solutions:**
1. **Send reminder:**
   ```bash
   # Comment on PR to ping reviewer
   gh pr comment <pr-number> --body "@reviewer friendly reminder to review when available"
   ```

2. **Reassign reviewer:**
   ```bash
   # Remove non-responsive reviewer
   gh pr edit <pr-number> --remove-reviewer @inactive-user
   
   # Add new reviewer
   gh pr edit <pr-number> --add-reviewer @new-reviewer
   ```

3. **Proceed without review** (if allowed by project policy):
   ```
   Note: Proceeding without full review as reviewer has not responded after [X] days.
   ```

### CI/CD Timeout

**Scenario:** CI/CD checks take too long or hang

**Solutions:**
1. **Check CI/CD logs:**
   ```bash
   gh run view <run-id> --log
   ```

2. **Identify hanging step:**
   - E2E tests taking too long?
   - Deployment stuck?
   - Network issue?

3. **Retry CI/CD run:**
   ```bash
   # Cancel hanging run
   gh run cancel <run-id>
   
   # Trigger new run
   gh workflow run <workflow-name>
   ```

4. **Optimize if chronic:**
   - Reduce E2E test scope
   - Parallelize tests
   - Use caching

## Best Practices

### PR Review

**Do:**
- Review promptly after assignment
- Provide clear, actionable feedback
- Explain "why" for change requests
- Approve when satisfied
- Respond to reviewer questions

**Don't:**
- Delay reviews unnecessarily
- Provide vague feedback ("fix this")
- Request changes without explanation
- Nitpick style issues that linter catches
- Block merge for non-critical issues

### Merge Decisions

**Do:**
- Ensure CI/CD passes before merge
- Verify reviewer approvals
- Check merge conflicts
- Confirm spec requirements met
- Delete merged branches

**Don't:**
- Merge with failing CI/CD
- Merge without reviewer approval
- Merge unreviewed code
- Force merge without checking conflicts
- Leave stale branches

### Post-Merge

**Do:**
- Update documentation promptly
- Close related issues
- Tag releases appropriately
- Notify team of changes
- Archive completed specs

**Don't:**
- Forget documentation updates
- Leave branches in limbo
- Skip version tags (if using semantic versioning)
- Ignore post-merge issues
- Delete execution logs

## Verification Checklist

Before marking spec as COMPLETED:

- [ ] Pull request link provided to user
- [ ] Manual merge instructions provided
- [ ] User understands merge process
- [ ] CI/CD status monitored and passing
- [ ] All reviewers provided feedback
- [ ] Change requests addressed
- [ ] Approvals received (as required by project policy)
- [ ] Merge conflicts resolved
- [ ] User confirmed merge completion
- [ ] Spec status updated to COMPLETED
- [ ] Spec.md updated with completion details
- [ ] Execution log archived
- [ ] specs.json updated
- [ ] Feature branches deleted (local and remote)
- [ ] Documentation updated (README, API docs, etc.)
- [ ] Related issues closed
- [ ] Release tagged (if applicable)

## Completion Examples

### Example 1: Successful Feature Completion

```
=== SPEC-20240115-1430-add-user-auth Completion Summary ===

Status: COMPLETED
Completed: 2024-01-15 16:45:00

Pull Request:
- URL: https://github.com/example/repo/pull/123
- Merged by: @alice
- Merge commit: abc123def456

CI/CD Results:
- Unit Tests: ✅ 25/25 passing
- Integration Tests: ✅ 8/8 passing
- E2E Tests: ✅ 5/5 passing
- Linting: ✅ No errors
- Security Scan: ✅ No vulnerabilities
- Coverage: 95.2% (target: 90%)

Reviews:
- @alice: Approved (2024-01-15 15:30:00)
- @bob: Approved (2024-01-15 15:45:00)

Acceptance Criteria:
- [✅] POST /api/register creates user with hashed password
- [✅] POST /api/login returns valid session token
- [✅] Invalid credentials return 401 error
- [✅] Session tokens expire after 24 hours

Files Changed: 15 files, 450 additions, 50 deletions

Post-Merge Actions:
- [✅] Branch deleted locally
- [✅] Branch deleted remotely
- [✅] Documentation updated
- [✅] Related issue #456 closed
- [✅] Release v1.2.3 tagged

Next Steps: None - spec complete
```

### Example 2: Bug Fix Completion

```
=== SPEC-20240120-0930-fix-payment-gateway Completion Summary ===

Status: COMPLETED
Completed: 2024-01-20 11:30:00

Pull Request:
- URL: https://github.com/example/repo/pull/124
- Merged by: @alice
- Merge commit: def456ghi789

CI/CD Results:
- Unit Tests: ✅ 28/28 passing (3 new tests)
- Integration Tests: ✅ 8/8 passing
- E2E Tests: ✅ 5/5 passing
- Linting: ✅ No errors
- Security Scan: ✅ No vulnerabilities
- Coverage: 93.1% (increased from 92.5%)

Reviews:
- @alice: Approved (2024-01-20 10:15:00)

Acceptance Criteria:
- [✅] Payment gateway timeouts handled with retry logic
- [✅] Timeout errors logged appropriately
- [✅] User receives timeout error message
- [✅] No payments lost due to timeouts

Files Changed: 3 files, 25 additions, 5 deletions

Post-Merge Actions:
- [✅] Branch deleted
- [✅] Bug #789 verified and closed

Next Steps: Monitor production for timeout issues
```

## Communication Templates

### Initial PR Notification

```
📢 New Pull Request Ready for Review

PR: #[number] - SPEC-<id>: [title]
Author: @author
Branch: feature/SPEC-<id>-<slug> → main

Overview:
[spec description]

Changes:
- [X] files changed
- [+X] additions
- [-X] deletions

Spec Compliance:
✅ All acceptance criteria met
✅ Tests comprehensive
✅ Documentation updated

Reviewers: @reviewer1 @reviewer2

CI/CD Status: ⏳ Running
🔗 View PR: https://github.com/example/repo/pull/123

Please review when available. Use `@spec-track SPEC-<id>` for status updates.
```

### Ready to Merge Notification

```
✅ Pull Request Ready to Merge

PR: #[number] - SPEC-<id>: [title]
Branch: feature/SPEC-<id>-<slug>

All Requirements Met:
✅ CI/CD checks passing
✅ Code reviews approved
✅ Acceptance criteria verified
✅ Merge conflicts resolved

Approvals: [count]/[required] approved
- @reviewer1: Approved
- @reviewer2: Approved

Merge when ready: https://github.com/example/repo/pull/123

To merge:
1. Review changes: "Files Changed" tab
2. Click "Merge pull request"
3. Delete branch
4. Notify me when complete
```

### Merge Completed Notification

```
🎉 Pull Request Merged!

PR: #[number] - SPEC-<id>: [title]
Merged by: @merger
Merge commit: [hash]

Spec Status: COMPLETED
Completion Time: [timestamp]

Post-Merge Actions:
✅ Branch deleted
✅ Documentation updated
✅ Issues closed
✅ Release tagged

Workflow Complete! The feature is now in main.

Use `@spec-track SPEC-<id>` to view full execution log.
```

## Next Steps

After completing Step 6 (Spec PR Review):

1. **If starting new feature:**
   - Begin new spec with `@te9.md` or "start te9.dev workflow"
   - Follow Step 1: Spec Clarify

2. **If reviewing existing specs:**
   - Use `@spec-track <spec-id>` to check status
   - Review `te9.dev/specs/<id>/spec.md`
   - Review `te9.dev/logs/<id>.log`

3. **If managing multiple specs:**
   - View all specs: `cat te9.dev/specs/specs.json`
   - Track active specs: Check specs with status != COMPLETED

**Workflow Complete:** Congratulations! You've completed the full spec-driven development workflow from requirements gathering to deployment.

---

**References:**
- `@references/test-driven-development.md` - Testing methodology
- `@references/spec-clarify.md` - Requirements gathering
- `@references/spec-store.md` - Spec storage
- `@references/spec-execute.md` - Implementation guide
- `@references/spec-branch-commit.md` - Version control
- `@references/spec-pr-create.md` - PR creation