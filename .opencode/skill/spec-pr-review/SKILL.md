# spec-pr-review - Pull Request Review Link Skill

## Overview
This skill handles the final verification step by checking if the pull request is ready for merge and providing the user with a direct link to review and manually merge the PR on GitHub. It ensures all reviews are approved and CI/CD checks pass before directing the user to complete the merge manually.

## When to Use
- Spec status is PR_CREATED
- PR has been created and is under review
- Ready to check merge readiness and provide manual merge link

## Prerequisites
- Spec file exists: `te9.dev/specs/<spec-id>/spec.md`
- PR exists and is open
- GitHub repository configured

## Workflow Steps

### 1. Load and Verify Spec
```
Read: te9.dev/specs/<spec-id>/spec.md
Verify: Status is PR_CREATED
Verify: PR URL exists
If not ready:
  - Ask user to run spec-pr-create first
  - Check PR status
```

### 2. Check PR Status
```
Query PR status from GitHub API:
- Reviews: approved/rejected/pending
- CI/CD checks: passed/failed/pending
- Merge conflicts: none/exists
- Branch protection: satisfied

Display status summary
```

### 3. Verify Merge Readiness
```
Required conditions:
- ✅ All required reviews approved
- ✅ All CI/CD checks passed
- ✅ No merge conflicts
- ✅ Branch up to date (if required)
- ✅ No blocking issues

If ready:
  - Mark as ready for manual merge
  - Provide PR link and instructions

If not ready:
  - Show blocking issues
  - Suggest waiting for reviews/checks
  - Provide current PR link for monitoring
```

### 4. Display PR Review Link
```
=== PULL REQUEST READY FOR REVIEW ===

Pull Request: <PR-URL>
Title: <PR-title>
Status: ✅ Approved, ✅ Checks Passed

Reviews:
- ✅ <reviewer1>: Approved
- ✅ <reviewer2>: Approved

Checks:
- ✅ CI Pipeline: Passed
- ✅ Code Quality: Passed
- ✅ Security: Passed

Spec: SPEC-<id>
Branch: <branch-name>

=== MANUAL MERGE REQUIRED ===

Please review and merge this PR manually on GitHub:
🔗 <PR-URL>

Merge Instructions:
1. Visit the PR link above
2. Review the changes and discussions
3. Click "Merge pull request" when ready
4. Select merge method (Squash recommended)
5. Confirm merge
6. Delete the branch after merge

Do you want to mark this spec as completed? (PR link provided)
Type: "complete" or "wait"
```

### 5. Wait for User Confirmation
```
Wait for user input:
  - "complete" → Mark spec as completed (PR ready for manual merge)
  - "wait" → Keep spec as PR_CREATED for later check
```

### 6. Update Spec Status (if completed)
```
Update spec.md:
  Status: PR_CREATED → COMPLETED
  PR Ready: true
  PR URL: <pr-url>
  Ready For Manual Merge: <current timestamp>

Update specs.json:
  status: "COMPLETED"
  pr_ready: true
  pr_url: "<pr-url>"
  completed_at: <current timestamp>
```

### 7. Store in OpenMemory
```
Store completion:
  "Spec <spec-id> PR ready for manual merge - link provided: <pr-url>"
  Sector: "procedural"
  Tags: ["spec-pr-ready", "<spec-id>", "pr", "manual-merge"]
```

### 8. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== PULL REQUEST READY FOR MANUAL MERGE ===
Timestamp: <timestamp>
PR URL: <pr-url>
PR Number: <pr-number>
Status: Ready for manual merge

Reviews Approved: <count>
Checks Passed: <count>
Merge Conflicts: <none/exists>

=== SPEC READY FOR MANUAL COMPLETION ===
Status: COMPLETED (PR link provided)
Ready Time: <timestamp>
```

### 9. Provide Final Report
```
Display:
✅ Spec <spec-id> is ready for manual merge!

PR Details:
  URL: <pr-url>
  Number: <pr-number>
  Status: Ready for manual merge
  Reviews: <approved>/<total>
  Checks: All passed

Manual Merge Instructions:
1. Visit: <pr-url>
2. Review changes and discussions
3. Click "Merge pull request"
4. Choose merge method (Squash recommended)
5. Confirm and merge
6. Delete branch after merge

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

PR link provided for manual merge completion!
```

## Manual Merge Instructions

### For Users
```
1. Click the provided PR link
2. Review code changes and comments
3. Ensure all required checks are green
4. Click "Merge pull request" button
5. Select merge method:
   - Squash: Combines commits (recommended)
   - Merge: Preserves history
   - Rebase: Linear history
6. Add merge commit message if needed
7. Click "Confirm merge"
8. Optionally delete the branch
```

### Merge Methods
```
Squash Merge (Recommended):
- Combines all commits into one clean commit
- Simplifies git history
- Includes PR description in commit message

Merge Commit:
- Preserves all individual commits
- Shows development timeline
- Creates merge commit

Rebase Merge:
- Creates linear history
- No merge commits
- Requires force push (use carefully)
```

## Approval Requirements

### Review Approvals
```
- Required reviewers: all must approve
- Code owners: must approve changed files
- Minimum approvals: configured threshold
```

### CI/CD Checks
```
- All required status checks: passed
- Branch protection rules: satisfied
- Security scans: passed
- Performance benchmarks: met
```

## Error Handling

### PR Not Ready
```
If reviews/checks not complete:
  1. Display current status
  2. Provide PR link for monitoring
  3. Suggest waiting or following up
  4. Keep spec as PR_CREATED
```

### API Access Issues
```
If GitHub API unavailable:
  1. Log error
  2. Provide direct PR link
  3. Ask user to check manually
  4. Update spec with link provided
```

### User Chooses to Wait
```
If user types "wait":
  1. Keep spec status as PR_CREATED
  2. Log: "User chose to wait for manual merge"
  3. Provide PR link for reference
```

## Validation Checklist

Before providing link:
- ✅ Spec status is PR_CREATED
- ✅ PR exists and is open
- ✅ PR URL is valid
- ✅ Can access GitHub API (optional)

After providing link:
- ✅ PR link displayed to user
- ✅ Manual merge instructions provided
- ✅ Spec status updated to COMPLETED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- PR readiness verified
- Direct GitHub PR link provided to user
- Clear manual merge instructions given
- User confirmed completion
- Spec marked as COMPLETED
- All actions logged
- OpenMemory updated with PR ready status

## Best Practices

### PR Monitoring
```
- Check status regularly
- Follow up on pending reviews
- Ensure CI/CD stays green
- Communicate with reviewers
```

### Manual Merge Process
```
- Always review changes before merging
- Test critical functionality if possible
- Use squash for feature branches
- Delete branches after merge
```

### User Communication
```
- Provide clear PR link
- Explain merge process
- Give step-by-step instructions
- Confirm user understanding
```

## Transition to Next Skill

After spec-pr-review completes:
→ **spec-track** - View overall progress
→ **spec-clarify** - Start new spec if needed

## Notes

- Provides PR link for manual GitHub merging
- Verifies readiness without performing merge
- Gives users control over final merge
- All merge details logged
- Supports team collaboration workflow

## Example Workflow

```
AI: Checking PR readiness for SPEC-20260120-2010-add-login-functionality

=== PULL REQUEST READY FOR REVIEW ===

Pull Request: https://github.com/org/repo/pull/123
Title: SPEC-20260120-2010: Add login functionality
Status: ✅ Approved, ✅ Checks Passed

Reviews:
- ✅ alice: Approved
- ✅ bob: Approved

Checks:
- ✅ CI Pipeline: Passed
- ✅ Security Scan: Passed

=== MANUAL MERGE REQUIRED ===

Please review and merge this PR manually on GitHub:
🔗 https://github.com/org/repo/pull/123

Do you want to mark this spec as completed? (PR link provided)
Type: "complete" or "wait"

User: complete

AI: ✅ Spec SPEC-20260120-2010 is ready for manual merge!

PR: https://github.com/org/repo/pull/123
Status: Ready for manual merge
Reviews: 2/2 approved
Checks: All passed

Manual Merge Instructions:
1. Visit: https://github.com/org/repo/pull/123
2. Review changes and discussions
3. Click "Merge pull request"
4. Choose merge method (Squash recommended)
5. Confirm and merge
6. Delete branch after merge

✅ SPEC-20260120-2010 completed (PR link provided)!
```

## Important

- NEVER perform automatic merge
- ALWAYS verify PR readiness
- ALWAYS provide direct GitHub PR link
- ALWAYS give clear manual merge instructions
- ALWAYS wait for user confirmation
- ALWAYS log PR link provision
- ALWAYS update spec status after confirmation