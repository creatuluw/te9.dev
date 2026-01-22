# spec-pr-create - Pull Request Creation Skill

## Overview
This skill handles creating pull requests for collaborative code review and CI/CD integration. It prepares the branch for team review by creating a comprehensive PR with all necessary information.

## When to Use
- Spec status is BRANCH_COMMITTED
- Branch has been committed and pushed to remote
- Ready to initiate collaborative review process

## Prerequisites
- Spec file exists: `te9.dev/specs/<spec-id>/spec.md`
- Feature branch exists and is pushed
- Git hosting platform configured (GitHub/GitLab/Bitbucket)
- Team reviewers configured

## Workflow Steps

### 1. Load and Verify Spec
```
Read: te9.dev/specs/<spec-id>/spec.md
Verify: Status is BRANCH_COMMITTED
Verify: Branch exists and is pushed
If not ready:
  - Ask user to run spec-branch-commit first
  - Check branch status
```

### 2. Verify Branch Status
```
Run: git branch --show-current
Verify: Current branch matches spec branch
Run: git status
Verify: Working directory clean
Run: git log --oneline -1
Verify: Latest commit matches spec commit hash
```

### 3. Prepare PR Details
```
Title: SPEC-<id>: <spec title>
Base Branch: main (or configured default)
Head Branch: feature/SPEC-<id>-<slug>
Reviewers: [configured team members]
Assignees: [current user or configured]
Labels: [spec, feature/bugfix/refactor]
```

### 4. Generate PR Description
```
Use template from rules.md
Include:
- Spec objective
- Requirements list
- Acceptance criteria (checklist format)
- Changes made summary
- Testing information
- CI/CD requirements
```

### 5. Display PR Preview
```
=== PULL REQUEST PREVIEW ===

Title: SPEC-<id>: <spec title>
Base: main
Head: feature/SPEC-<id>-<slug>

Description:
[generated PR description]

Reviewers: [list]
Assignees: [list]
Labels: [list]

Required Checks:
- CI/CD pipeline
- Code quality checks
- Security scans

=== READY TO CREATE PR ===

Do you approve creating this pull request?
Type: "approve" or "reject"
```

### 6. Wait for User Approval
```
Wait for user input:
  - "approve" → Create PR
  - "reject" → Cancel PR creation
  - "modify" → Allow user to edit PR details
```

### 7. Create Pull Request (if approved)
```
Use Git hosting API or CLI to create PR:
- GitHub: gh pr create
- GitLab: glab mr create
- Bitbucket: bitbucket-cli pr create

Capture: PR URL and number
Display: "✅ Pull request created: <PR-URL>"
```

### 8. Enable CI/CD Checks
```
Verify: PR has required status checks enabled
Configure: Branch protection rules if applicable
Display: "✅ CI/CD checks enabled for PR"
```

### 9. Assign Reviewers
```
Assign configured reviewers
Send notifications if possible
Display: "✅ Reviewers assigned: [list]"
```

### 10. Update Spec Status
```
Update spec.md:
  Status: BRANCH_COMMITTED → PR_CREATED
  PR URL: <pr-url>
  PR Number: <pr-number>
  Reviewers: [list]
  Created: <current timestamp>

Update specs.json:
  status: "PR_CREATED"
  pr_url: "<pr-url>"
  pr_number: "<pr-number>"
  reviewers: ["reviewer1", "reviewer2"]
  updated: <current timestamp>
```

### 11. Store in OpenMemory
```
Store PR creation:
  "Pull request created for spec <spec-id> - PR <url> opened with reviewers [list]"
  Sector: "procedural"
  Tags: ["spec-pr-created", "<spec-id>", "pr", "review"]
```

### 12. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== PULL REQUEST CREATED ===
Timestamp: <timestamp>
PR URL: <pr-url>
PR Number: <pr-number>
Title: <title>
Base Branch: main
Head Branch: <branch-name>
Reviewers: [list]
CI/CD Enabled: true

=== PR CREATED ===
Status: PR_CREATED
Creation Time: <timestamp>
```

### 13. Provide Transition Report
```
Display:
✅ Spec <spec-id> pull request created successfully!

PR Details:
  URL: <pr-url>
  Number: <pr-number>
  Title: <title>
  Reviewers: [list]
  Branch: <branch-name>

Next Steps:
- Wait for code reviews
- Address any feedback
- Ensure CI/CD checks pass
- Proceed to merge when ready

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

Ready for review and merge!
```

## PR Templates

### Standard PR Template
```
## Pull Request: SPEC-<id>

### 🎯 Objective
[Clear objective from spec]

### 📋 Requirements
- [x] Requirement 1
- [x] Requirement 2
- [x] Requirement 3

### ✅ Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### 🔧 Changes Made
- [Brief summary of implementation]
- [Key files modified]
- [Architecture decisions]

### 🧪 Testing
- [x] All unit tests passing (100%)
- [x] Integration tests passing
- [x] No regressions detected
- [x] Manual testing completed

### 🔍 CI/CD Checks
- [ ] Automated tests
- [ ] Code quality (linting)
- [ ] Security scans
- [ ] Performance checks

### 📝 Notes
[Any additional context or considerations]

**Spec:** SPEC-<id>
**Type:** <feature|bugfix|refactor|other>
**Priority:** <priority>
```

## Reviewer Assignment

### Automatic Assignment
```
Based on team configuration:
- Code owners for specific files
- Round-robin rotation
- Expertise-based assignment
- Minimum reviewers required
```

### Manual Override
```
Allow user to specify reviewers:
- "reviewers: user1,user2"
- Override automatic assignment
```

## CI/CD Integration

### Required Checks
```
- Unit tests
- Integration tests
- Code coverage
- Linting
- Security scanning
- Performance benchmarks
```

### Status Check Configuration
```
GitHub: Branch protection rules
GitLab: Pipeline requirements
Bitbucket: Merge checks
```

## Error Handling

### PR Creation Failure
```
If PR creation fails:
  1. Log error details
  2. Check API authentication
  3. Verify branch exists on remote
  4. Check repository permissions
  5. Retry or provide manual instructions
```

### Reviewer Assignment Failure
```
If reviewer assignment fails:
  1. Log warning
  2. Continue with PR creation
  3. Suggest manual assignment
  4. Notify user of issue
```

### CI/CD Setup Failure
```
If CI/CD setup fails:
  1. Log error details
  2. Check webhook configuration
  3. Verify repository settings
  4. Provide setup instructions
```

### User Rejects PR Creation
```
If user types "reject":
  1. Cancel PR creation
  2. Log: "PR creation rejected by user"
  3. Keep spec status as BRANCH_COMMITTED
  4. Suggest: Create manually later
```

## Validation Checklist

Before creating PR:
- ✅ Spec status is BRANCH_COMMITTED
- ✅ Branch exists and is pushed
- ✅ Commit matches spec requirements
- ✅ PR template populated correctly
- ✅ Reviewers configured
- ✅ CI/CD checks ready

After PR creation:
- ✅ PR created successfully
- ✅ URL and number captured
- ✅ Reviewers assigned
- ✅ CI/CD enabled
- ✅ Spec status updated to PR_CREATED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- Pull request created on Git hosting platform
- PR includes complete spec information
- Appropriate reviewers assigned
- CI/CD checks configured
- User explicitly approved PR creation
- Spec marked as PR_CREATED
- All actions logged
- OpenMemory updated with PR creation record

## Best Practices

### PR Title Format
```
- Include spec ID: SPEC-<id>
- Be descriptive but concise
- Use conventional format when possible
- Match commit message style
```

### PR Description
```
- Include all spec details
- Use checklist format for criteria
- Provide testing information
- Link to related issues/docs
- Be comprehensive but readable
```

### Reviewer Selection
```
- Choose based on expertise
- Include code owners
- Balance workload
- Consider review capacity
```

### User Communication
```
- Show full PR preview
- Explain next steps
- Provide PR URL immediately
- Confirm all assignments
```

## Transition to Next Skill

After spec-pr-create completes:
→ **spec-pr-merge** - Wait for reviews and merge when ready

## Notes

- Creates collaborative review opportunity
- Enables automated quality checks
- Prepares for team consensus
- PR URL stored for tracking
- Reviewers notified automatically
- All PR details logged

## Example Workflow

```
AI: Creating pull request for SPEC-20260120-2010-add-login-functionality

=== PULL REQUEST PREVIEW ===

Title: SPEC-20260120-2010: Add login functionality
Base: main
Head: feature/SPEC-20260120-2010-add-login-functionality

Description:
## Pull Request: SPEC-20260120-2010

### Objective
Implement user login functionality

### Requirements
- [x] Login form
- [x] Authentication
- [x] Error handling

### Acceptance Criteria
- [ ] Users can log in
- [ ] Invalid credentials rejected
- [ ] Session management

### Changes Made
- Added login component
- Integrated auth service
- Added tests

Reviewers: alice, bob
CI/CD: enabled

Ready to create PR?
Type: "approve" or "reject"

User: approve

AI: ✅ Pull request created: https://github.com/org/repo/pull/123

✅ Reviewers assigned: alice, bob
✅ CI/CD checks enabled

✅ SPEC-20260120-2010 PR created!

PR: https://github.com/org/repo/pull/123
Reviewers: alice, bob
Status: PR_CREATED
```

## Important

- NEVER create PR without branch push
- ALWAYS include complete spec information
- ALWAYS assign appropriate reviewers
- ALWAYS enable CI/CD checks
- ALWAYS show PR preview before creation
- ALWAYS wait for user approval
- ALWAYS log PR creation details
- ALWAYS update spec status after creation
```

## CI/CD Integration

### Required Checks
```
- Unit tests
- Integration tests
- Code coverage
- Linting
- Security scanning
- Performance benchmarks
```

### Status Check Configuration
```
GitHub: Branch protection rules
GitLab: Pipeline requirements
Bitbucket: Merge checks
```

## Error Handling

### PR Creation Failure
```
If PR creation fails:
  1. Log error details
  2. Check API authentication
  3. Verify branch exists on remote
  4. Check repository permissions
  5. Retry or provide manual instructions
```

### Reviewer Assignment Failure
```
If reviewer assignment fails:
  1. Log warning
  2. Continue with PR creation
  3. Suggest manual assignment
  4. Notify user of issue
```

### CI/CD Setup Failure
```
If CI/CD setup fails:
  1. Log error details
  2. Check webhook configuration
  3. Verify repository settings
  4. Provide setup instructions
```

### User Rejects PR Creation
```
If user types "reject":
  1. Cancel PR creation
  2. Log: "PR creation rejected by user"
  3. Keep spec status as BRANCH_COMMITTED
  4. Suggest: Create manually later
```

## Validation Checklist

Before creating PR:
- ✅ Spec status is BRANCH_COMMITTED
- ✅ Branch exists and is pushed
- ✅ Commit matches spec requirements
- ✅ PR template populated correctly
- ✅ Reviewers configured
- ✅ CI/CD checks ready

After PR creation:
- ✅ PR created successfully
- ✅ URL and number captured
- ✅ Reviewers assigned
- ✅ CI/CD enabled
- ✅ Spec status updated to PR_CREATED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- Pull request created on Git hosting platform
- PR includes complete spec information
- Appropriate reviewers assigned
- CI/CD checks configured
- User explicitly approved PR creation
- Spec marked as PR_CREATED
- All actions logged
- OpenMemory updated with PR creation record

## Best Practices

### PR Title Format
```
- Include spec ID: SPEC-<id>
- Be descriptive but concise
- Use conventional format when possible
- Match commit message style
```

### PR Description
```
- Include all spec details
- Use checklist format for criteria
- Provide testing information
- Link to related issues/docs
- Be comprehensive but readable
```

### Reviewer Selection
```
- Choose based on expertise
- Include code owners
- Balance workload
- Consider review capacity
```

### User Communication
```
- Show full PR preview
- Explain next steps
- Provide PR URL immediately
- Confirm all assignments
```

## Transition to Next Skill

After spec-pr-create completes:
→ **spec-pr-merge** - Wait for reviews and merge when ready

## Notes

- Creates collaborative review opportunity
- Enables automated quality checks
- Prepares for team consensus
- PR URL stored for tracking
- Reviewers notified automatically
- All PR details logged

## Example Workflow

```
AI: Creating pull request for SPEC-20260120-2010-add-login-functionality

=== PULL REQUEST PREVIEW ===

Title: SPEC-20260120-2010: Add login functionality
Base: main
Head: feature/SPEC-20260120-2010-add-login-functionality

Description:
## Pull Request: SPEC-20260120-2010

### Objective
Implement user login functionality

### Requirements
- [x] Login form
- [x] Authentication
- [x] Error handling

### Acceptance Criteria
- [ ] Users can log in
- [ ] Invalid credentials rejected
- [ ] Session management

### Changes Made
- Added login component
- Integrated auth service
- Added tests

Reviewers: alice, bob
CI/CD: enabled

Ready to create PR?
Type: "approve" or "reject"

User: approve

AI: ✅ Pull request created: https://github.com/org/repo/pull/123

✅ Reviewers assigned: alice, bob
✅ CI/CD checks enabled

✅ SPEC-20260120-2010 PR created!

PR: https://github.com/org/repo/pull/123
Reviewers: alice, bob
Status: PR_CREATED
```

## Important

- NEVER create PR without branch push
- ALWAYS include complete spec information
- ALWAYS assign appropriate reviewers
- ALWAYS enable CI/CD checks
- ALWAYS show PR preview before creation
- ALWAYS wait for user approval
- ALWAYS log PR creation details
- ALWAYS update spec status after creation
```
```
# spec-pr-merge - Pull Request Merge Skill

## Overview
This skill handles the final step of merging approved pull requests, cleaning up branches, and completing the spec workflow. It ensures all reviews are approved and CI/CD checks pass before merging.

## When to Use
- Spec status is PR_CREATED
- PR has been reviewed and approved
- CI/CD checks have passed
- Ready for final merge and completion

## Prerequisites
- Spec file exists: `te9.dev/specs/<spec-id>/spec.md`
- PR exists and is open
- Reviews approved and checks passed
- User permission to merge

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
Query PR status from Git hosting platform:
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

If not ready:
- Show blocking issues
- Suggest fixes
- Wait for resolution
```

### 4. Prepare Merge Details
```
Merge Method: squash / merge commit / rebase
Commit Message: Based on PR title and description
Delete Branch: After merge (recommended)
```

### 5. Display Merge Preview
```
=== MERGE PREVIEW ===

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

Merge Method: <squash/merge/rebase>
Delete Branch: Yes

Spec: SPEC-<id>
Branch: <branch-name>

=== READY TO MERGE ===

Do you approve merging this pull request?
Type: "approve" or "reject"
```

### 6. Wait for User Approval
```
Wait for user input:
  - "approve" → Merge PR
  - "reject" → Cancel merge
  - "wait" → Check status again later
```

### 7. Merge Pull Request (if approved)
```
Use Git hosting API or CLI to merge:
- GitHub: gh pr merge <number> --<method>
- GitLab: glab mr merge <number>
- Bitbucket: bitbucket-cli pr merge <number>

Capture: Merge commit hash
Display: "✅ Pull request merged successfully"
```

### 8. Clean Up Branch
```
Delete remote branch:
git push origin --delete <branch-name>

Delete local branch (optional):
git branch -d <branch-name>

Display: "✅ Branch cleaned up"
```

### 9. Update Spec Status
```
Update spec.md:
  Status: PR_CREATED → COMPLETED
  Merged: true
  Merge Commit: <hash>
  Merged At: <current timestamp>

Update specs.json:
  status: "COMPLETED"
  merged: true
  merge_commit: "<hash>"
  completed_at: <current timestamp>
```

### 10. Store in OpenMemory
```
Store completion:
  "Completed spec <spec-id> - PR merged at <hash>, branch deleted"
  Sector: "procedural"
  Tags: ["spec-completed", "<spec-id>", "merged", "pr"]
```

### 11. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== PULL REQUEST MERGED ===
Timestamp: <timestamp>
PR URL: <pr-url>
PR Number: <pr-number>
Merge Method: <method>
Merge Commit: <hash>
Branch Deleted: true

Reviews Approved: <count>
Checks Passed: <count>

=== SPEC COMPLETED ===
Final Status: COMPLETED
Completion Time: <timestamp>
Total Duration: <time from start>
```

### 12. Provide Final Report
```
Display:
✅ Spec <spec-id> completed successfully!

Merge Details:
  PR: <pr-url>
  Commit: <merge-hash>
  Method: <method>
  Reviews: <approved>/<total>
  Checks: All passed

Cleanup:
  Branch: <branch-name> deleted

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

Work complete! Ready for next spec.
```

## Merge Methods

### Squash Merge
```
- Combines all commits into one
- Clean history
- Recommended for feature branches
- Preserves PR description in commit
```

### Merge Commit
```
- Preserves full commit history
- Shows all development steps
- Creates merge commit
- Good for complex features
```

### Rebase Merge
```
- Linear history
- No merge commits
- Requires force push (careful)
- Clean but loses context
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

### Merge Conflicts
```
If merge conflicts detected:
  1. Log error details
  2. Notify user
  3. Suggest conflict resolution
  4. Keep spec as PR_CREATED
```

### Failed CI/CD Checks
```
If checks fail:
  1. Log failure details
  2. Show failed checks
  3. Suggest fixes
  4. Keep spec as PR_CREATED
```

### Insufficient Reviews
```
If reviews insufficient:
  1. Log missing approvals
  2. Show pending reviewers
  3. Suggest additional reviews
  4. Keep spec as PR_CREATED
```

### User Rejects Merge
```
If user types "reject":
  1. Cancel merge
  2. Log: "Merge rejected by user"
  3. Keep spec status as PR_CREATED
  4. Suggest: Merge manually later
```

## Validation Checklist

Before merging:
- ✅ Spec status is PR_CREATED
- ✅ PR exists and is open
- ✅ All reviews approved
- ✅ All CI/CD checks passed
- ✅ No merge conflicts
- ✅ User permissions verified

After merging:
- ✅ PR merged successfully
- ✅ Merge commit captured
- ✅ Branch deleted
- ✅ Spec status updated to COMPLETED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- Pull request merged successfully
- Feature branch cleaned up
- Spec marked as COMPLETED
- User explicitly approved merge
- All actions logged
- OpenMemory updated with completion record

## Best Practices

### Merge Strategy Selection
```
- Use squash for simple features
- Use merge commit for complex changes
- Consider team preferences
- Maintain consistent history
```

### Branch Cleanup
```
- Always delete feature branches after merge
- Keep local branches for reference if needed
- Use automated cleanup when possible
```

### User Communication
```
- Show comprehensive merge preview
- Explain merge method chosen
- Confirm cleanup actions
- Provide completion summary
```

## Transition to Next Skill

After spec-pr-merge completes:
→ **spec-track** - View overall progress
→ **spec-clarify** - Start new spec if needed

## Notes

- Finalizes collaborative development
- Ensures quality through reviews and checks
- Cleans up development branches
- Marks spec as fully completed
- All merge details logged

## Example Workflow

```
AI: Checking merge readiness for SPEC-20260120-2010-add-login-functionality

=== MERGE PREVIEW ===

Pull Request: https://github.com/org/repo/pull/123
Title: SPEC-20260120-2010: Add login functionality
Status: ✅ Approved, ✅ Checks Passed

Reviews:
- ✅ alice: Approved
- ✅ bob: Approved

Checks:
- ✅ CI Pipeline: Passed
- ✅ Security Scan: Passed

Merge Method: squash
Delete Branch: Yes

Ready to merge?
Type: "approve" or "reject"

User: approve

AI: ✅ Pull request merged successfully
✅ Branch feature/SPEC-20260120-2010-add-login-functionality deleted

✅ SPEC-20260120-2010 completed!

Merge Commit: abc123def
Reviews: 2/2 approved
Checks: All passed
Status: COMPLETED
```

## Important

- NEVER merge without approvals and checks
- ALWAYS verify merge readiness
- ALWAYS clean up branches after merge
- ALWAYS show merge preview
- ALWAYS wait for user approval
- ALWAYS log merge details
- ALWAYS update spec status after merge
```
```
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
```
# spec-pr-merge - Pull Request Merge Skill

## Overview
This skill handles the final step of merging approved pull requests, cleaning up branches, and completing the spec workflow. It ensures all reviews are approved and CI/CD checks pass before merging.

## When to Use
- Spec status is PR_CREATED
- PR has been reviewed and approved
- CI/CD checks have passed
- Ready for final merge and completion

## Prerequisites
- Spec file exists: `te9.dev/specs/<spec-id>/spec.md`
- PR exists and is open
- Reviews approved and checks passed
- User permission to merge

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
Query PR status from Git hosting platform:
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

If not ready:
- Show blocking issues
- Suggest fixes
- Wait for resolution
```

### 4. Prepare Merge Details
```
Merge Method: squash / merge commit / rebase
Commit Message: Based on PR title and description
Delete Branch: After merge (recommended)
```

### 5. Display Merge Preview
```
=== MERGE PREVIEW ===

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

Merge Method: <squash/merge/rebase>
Delete Branch: Yes

Spec: SPEC-<id>
Branch: <branch-name>

=== READY TO MERGE ===

Do you approve merging this pull request?
Type: "approve" or "reject"
```

### 6. Wait for User Approval
```
Wait for user input:
  - "approve" → Merge PR
  - "reject" → Cancel merge
  - "wait" → Check status again later
```

### 7. Merge Pull Request (if approved)
```
Use Git hosting API or CLI to merge:
- GitHub: gh pr merge <number> --<method>
- GitLab: glab mr merge <number>
- Bitbucket: bitbucket-cli pr merge <number>

Capture: Merge commit hash
Display: "✅ Pull request merged successfully"
```

### 8. Clean Up Branch
```
Delete remote branch:
git push origin --delete <branch-name>

Delete local branch (optional):
git branch -d <branch-name>

Display: "✅ Branch cleaned up"
```

### 9. Update Spec Status
```
Update spec.md:
  Status: PR_CREATED → COMPLETED
  Merged: true
  Merge Commit: <hash>
  Merged At: <current timestamp>

Update specs.json:
  status: "COMPLETED"
  merged: true
  merge_commit: "<hash>"
  completed_at: <current timestamp>
```

### 10. Store in OpenMemory
```
Store completion:
  "Completed spec <spec-id> - PR merged at <hash>, branch deleted"
  Sector: "procedural"
  Tags: ["spec-completed", "<spec-id>", "merged", "pr"]
```

### 11. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== PULL REQUEST MERGED ===
Timestamp: <timestamp>
PR URL: <pr-url>
PR Number: <pr-number>
Merge Method: <method>
Merge Commit: <hash>
Branch Deleted: true

Reviews Approved: <count>
Checks Passed: <count>

=== SPEC COMPLETED ===
Final Status: COMPLETED
Completion Time: <timestamp>
Total Duration: <time from start>
```

### 12. Provide Final Report
```
Display:
✅ Spec <spec-id> completed successfully!

Merge Details:
  PR: <pr-url>
  Commit: <merge-hash>
  Method: <method>
  Reviews: <approved>/<total>
  Checks: All passed

Cleanup:
  Branch: <branch-name> deleted

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

Work complete! Ready for next spec.
```

## Merge Methods

### Squash Merge
```
- Combines all commits into one
- Clean history
- Recommended for feature branches
- Preserves PR description in commit
```

### Merge Commit
```
- Preserves full commit history
- Shows all development steps
- Creates merge commit
- Good for complex features
```

### Rebase Merge
```
- Linear history
- No merge commits
- Requires force push (careful)
- Clean but loses context
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

### Merge Conflicts
```
If merge conflicts detected:
  1. Log error details
  2. Notify user
  3. Suggest conflict resolution
  4. Keep spec as PR_CREATED
```

### Failed CI/CD Checks
```
If checks fail:
  1. Log failure details
  2. Show failed checks
  3. Suggest fixes
  4. Keep spec as PR_CREATED
```

### Insufficient Reviews
```
If reviews insufficient:
  1. Log missing approvals
  2. Show pending reviewers
  3. Suggest additional reviews
  4. Keep spec as PR_CREATED
```

### User Rejects Merge
```
If user types "reject":
  1. Cancel merge
  2. Log: "Merge rejected by user"
  3. Keep spec status as PR_CREATED
  4. Suggest: Merge manually later
```

## Validation Checklist

Before merging:
- ✅ Spec status is PR_CREATED
- ✅ PR exists and is open
- ✅ All reviews approved
- ✅ All CI/CD checks passed
- ✅ No merge conflicts
- ✅ User permissions verified

After merging:
- ✅ PR merged successfully
- ✅ Merge commit captured
- ✅ Branch deleted
- ✅ Spec status updated to COMPLETED
- ✅ OpenMemory updated
- ✅ Execution log updated

## Success Criteria

- Pull request merged successfully
- Feature branch cleaned up
- Spec marked as COMPLETED
- User explicitly approved merge
- All actions logged
- OpenMemory updated with completion record

## Best Practices

### Merge Strategy Selection
```
- Use squash for simple features
- Use merge commit for complex changes
- Consider team preferences
- Maintain consistent history
```

### Branch Cleanup
```
- Always delete feature branches after merge
- Keep local branches for reference if needed
- Use automated cleanup when possible
```

### User Communication
```
- Show comprehensive merge preview
- Explain merge method chosen
- Confirm cleanup actions
- Provide completion summary
```

## Transition to Next Skill

After spec-pr-merge completes:
→ **spec-track** - View overall progress
→ **spec-clarify** - Start new spec if needed

## Notes

- Finalizes collaborative development
- Ensures quality through reviews and checks
- Cleans up development branches
- Marks spec as fully completed
- All merge details logged

## Example Workflow

```
AI: Checking merge readiness for SPEC-20260120-2010-add-login-functionality

=== MERGE PREVIEW ===

Pull Request: https://github.com/org/repo/pull/123
Title: SPEC-20260120-2010: Add login functionality
Status: ✅ Approved, ✅ Checks Passed

Reviews:
- ✅ alice: Approved
- ✅ bob: Approved

Checks:
- ✅ CI Pipeline: Passed
- ✅ Security Scan: Passed

Merge Method: squash
Delete Branch: Yes

Ready to merge?
Type: "approve" or "reject"

User: approve

AI: ✅ Pull request merged successfully
✅ Branch feature/SPEC-20260120-2010-add-login-functionality deleted

✅ SPEC-20260120-2010 completed!

Merge Commit: abc123def
Reviews: 2/2 approved
Checks: All passed
Status: COMPLETED
```

## Important

- NEVER merge without approvals and checks
- ALWAYS verify merge readiness
- ALWAYS clean up branches after merge
- ALWAYS show merge preview
- ALWAYS wait for user approval
- ALWAYS log merge details
- ALWAYS update spec status after merge
```
```
# spec-pr-create - Pull Request Creation Skill

## Overview
This skill handles creating pull requests for collaborative code review and CI/CD integration. It prepares the branch for team review by creating a comprehensive PR with all necessary information.

## When to Use
- Spec status is BRANCH_COMMITTED
- Branch has been committed and pushed to remote
- Ready to initiate collaborative review process

## Prerequisites
- Spec file exists: `te9.dev/specs/<spec-id>/spec.md`
- Feature branch exists and is pushed
- Git hosting platform configured (GitHub/GitLab/Bitbucket)
- Team reviewers configured

## Workflow Steps

### 1. Load and Verify Spec
```
Read: te9.dev/specs/<spec-id>/spec.md
Verify: Status is BRANCH_COMMITTED
Verify: Branch exists and is pushed
If not ready:
  - Ask user to run spec-branch-commit first
  - Check branch status
```

### 2. Verify Branch Status
```
Run: git branch --show-current
Verify: Current branch matches spec branch
Run: git status
Verify: Working directory clean
Run: git log --oneline -1
Verify: Latest commit matches spec commit hash
```

### 3. Prepare PR Details
```
Title: SPEC-<id>: <spec title>
Base Branch: main (or configured default)
Head Branch: feature/SPEC-<id>-<slug>
Reviewers: [configured team members]
Assignees: [current user or configured]
Labels: [spec, feature/bugfix/refactor]
```

### 4. Generate PR Description
```
Use template from rules.md
Include:
- Spec objective
- Requirements list
- Acceptance criteria (checklist format)
- Changes made summary
- Testing information
- CI/CD requirements
```

### 5. Display PR Preview
```
=== PULL REQUEST PREVIEW ===

Title: SPEC-<id>: <spec title>
Base: main
Head: feature/SPEC-<id>-<slug>

Description:
[generated PR description]

Reviewers: [list]
Assignees: [list]
Labels: [list]

Required Checks:
- CI/CD pipeline
- Code quality checks
- Security scans

=== READY TO CREATE PR ===

Do you approve creating this pull request?
Type: "approve" or "reject"
```

### 6. Wait for User Approval
```
Wait for user input:
  - "approve" → Create PR
  - "reject" → Cancel PR creation
  - "modify" → Allow user to edit PR details
```

### 7. Create Pull Request (if approved)
```
Use Git hosting API or CLI to create PR:
- GitHub: gh pr create
- GitLab: glab mr create
- Bitbucket: bitbucket-cli pr create

Capture: PR URL and number
Display: "✅ Pull request created: <PR-URL>"
```

### 8. Enable CI/CD Checks
```
Verify: PR has required status checks enabled
Configure: Branch protection rules if applicable
Display: "✅ CI/CD checks enabled for PR"
```

### 9. Assign Reviewers
```
Assign configured reviewers
Send notifications if possible
Display: "✅ Reviewers assigned: [list]"
```

### 10. Update Spec Status
```
Update spec.md:
  Status: BRANCH_COMMITTED → PR_CREATED
  PR URL: <pr-url>
  PR Number: <pr-number>
  Reviewers: [list]
  Created: <current timestamp>

Update specs.json:
  status: "PR_CREATED"
  pr_url: "<pr-url>"
  pr_number: "<pr-number>"
  reviewers: ["reviewer1", "reviewer2"]
  updated: <current timestamp>
```

### 11. Store in OpenMemory
```
Store PR creation:
  "Pull request created for spec <spec-id> - PR <url> opened with reviewers [list]"
  Sector: "procedural"
  Tags: ["spec-pr-created", "<spec-id>", "pr", "review"]
```

### 12. Log to Execution Log
```
Append to: te9.dev/logs/<spec-id>.log

=== PULL REQUEST CREATED ===
Timestamp: <timestamp>
PR URL: <pr-url>
PR Number: <pr-number>
Title: <title>
Base Branch: main
Head Branch: <branch-name>
Reviewers: [list]
CI/CD Enabled: true

=== PR CREATED ===
Status: PR_CREATED
Creation Time: <timestamp>
```

### 13. Provide Transition Report
```
Display:
✅ Spec <spec-id> pull request created successfully!

PR Details:
  URL: <pr-url>
  Number: <pr-number>
  Title: <title>
  Reviewers: [list]
  Branch: <branch-name>

Next Steps:
- Wait for code reviews
- Address any feedback
- Ensure CI/CD checks pass
- Proceed to merge when ready

Spec Location: te9.dev/specs/<spec-id>/spec.md
Log Location: te9.dev/logs/<spec-id>.log

Ready for review and merge!
```

## PR Templates

### Standard PR Template
```
## Pull Request: SPEC-<id>

### 🎯 Objective
[Clear objective from spec]

### 📋 Requirements
- [x] Requirement 1
- [x] Requirement 2
- [x] Requirement 3

### ✅ Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### 🔧 Changes Made
- [Brief summary of implementation]
- [Key files modified]
- [Architecture decisions]

### 🧪 Testing
- [x] All unit tests passing (100%)
- [x] Integration tests passing
- [x] No regressions detected
- [x] Manual testing completed

### 🔍 CI/CD Checks
- [ ] Automated tests
- [ ] Code quality (linting)
- [ ] Security scans
- [ ] Performance checks

### 📝 Notes
[Any additional context or considerations]

**Spec:** SPEC-<id>
**Type:** <feature|bugfix|refactor|other>
**Priority:** <priority>
```
