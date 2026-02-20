# Spec PR Create - Pull Request Management

## Overview

The spec-pr-create step creates and configures pull requests for collaborative code review. This includes creating PRs with proper formatting, assigning reviewers, enabling CI/CD checks, and providing all necessary context for effective review.

**Core principle**: Pull requests are the gateway to code integration - they must be complete, well-documented, and ready for review.

## When to Use

This reference is used during **Step 5** of the te9.dev workflow, after successful branch push (Step 4) and before final review (Step 6).

**Prerequisites:**
- Spec status is `BRANCH_COMMITTED`
- Feature branch exists and is pushed to remote
- All CI/CD checks are passing or configured to run
- User has approved the implementation

## Core Procedures

### 1. Prepare Pull Request Content

**Gather all necessary information:**

```bash
# Get branch information
git branch --show-current

# Get commit information
git log origin/main...HEAD --oneline

# Get diff statistics
git diff --stat origin/main...HEAD

# Get list of changed files
git diff --name-only origin/main...HEAD
```

**Collect PR details:**
- Spec ID and title
- Branch name
- Commit summary
- Files changed
- Acceptance criteria status
- Related issues or dependencies

### 2. Create Pull Request

**Using GitHub CLI (Recommended):**

```bash
# Basic PR creation
gh pr create \
  --title "SPEC-20240115-1430: Add User Authentication" \
  --body "PR description..."

# With base branch specified
gh pr create \
  --base main \
  --title "SPEC-20240115-1430: Add User Authentication" \
  --body "PR description..."

# With reviewers and labels
gh pr create \
  --title "SPEC-20240115-1430: Add User Authentication" \
  --body "PR description..." \
  --reviewer @username1,@username2 \
  --label enhancement,security
```

**Using Git CLI:**

```bash
# Open PR creation in browser
git push -u origin feature/SPEC-20240115-1430-add-user-auth
hub pull-request \
  --base main \
  --title "SPEC-20240115-1430: Add User Authentication" \
  --message "PR description..."

# Or use GitHub's web interface
# Navigate to: https://github.com/owner/repo/compare/main...feature/SPEC-20240115-1430-add-user-auth
```

### 3. Pull Request Title Format

**Standard format:**
```
SPEC-<id>: <brief description>
```

**Examples:**
- `SPEC-20240115-1430: Add User Authentication`
- `SPEC-20240120-0930: Fix Payment Gateway Timeout`
- `SPEC-20240125-1645: Implement API Caching Layer`

**Title guidelines:**
- Keep under 72 characters (GitHub truncates longer titles)
- Use imperative mood ("Add", not "Added" or "Adding")
- Include spec ID for traceability
- Be specific and descriptive
- Mention the feature or fix name

### 4. Pull Request Body Template

**Use this comprehensive template:**

```markdown
## Overview

Brief description of what this PR changes and why.

**Spec ID:** SPEC-20240115-1430
**Spec Title:** Add User Authentication
**Related Issue:** #123 (if applicable)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Performance improvement
- [ ] Code cleanup
- [ ] Documentation update
- [ ] Other (please describe)

## Changes Made

### Files Changed
- `src/services/AuthService.ts` (new)
- `src/middleware/auth.ts` (new)
- `src/api/register.ts` (new)
- `src/api/login.ts` (new)
- `tests/auth.test.ts` (new)
- `package.json` (dependencies added)

### Key Features Implemented
1. User registration with password hashing
2. User login with JWT token generation
3. Authentication middleware for protected routes
4. Session token management (24-hour expiration)
5. Input validation and error handling

### Technical Details
- **Authentication Method:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt with salt rounds of 10
- **Token Storage:** HTTP-only cookies
- **Session Duration:** 24 hours
- **Dependencies Added:** jsonwebtoken, bcrypt, cookie-parser

## Acceptance Criteria Status

All acceptance criteria from the specification have been verified:

- [x] **AC1**: POST /api/register creates user with hashed password
  - Test: `test('creates user with hashed password', ...)`
  - Status: PASSED
  
- [x] **AC2**: POST /api/login returns valid session token
  - Test: `test('returns JWT token on successful login', ...)`
  - Status: PASSED
  
- [x] **AC3**: Invalid credentials return 401 error
  - Test: `test('returns 401 for invalid credentials', ...)`
  - Status: PASSED
  
- [x] **AC4**: Session tokens expire after 24 hours
  - Test: `test('token expires after 24 hours', ...)`
  - Status: PASSED

**All acceptance criteria: 4/4 PASSED**

## Testing

### Test Coverage
- **Unit Tests:** 25 tests, 100% passing
- **Integration Tests:** 8 tests, 100% passing
- **End-to-End Tests:** 5 tests, 100% passing
- **Overall Coverage:** 95.2% statements, 93.8% branches

### How to Test
1. Run unit tests: `npm test -- --testPathPattern=unit`
2. Run integration tests: `npm test -- --testPathPattern=integration`
3. Run E2E tests: `npm test -- --testPathPattern=e2e`
4. Manual testing:
   ```bash
   # Test registration
   curl -X POST http://localhost:3000/api/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   
   # Test login
   curl -X POST http://localhost:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Screenshots / Demos

[Include screenshots for UI changes or demo videos for new features]

## Checklist

- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [x] I have added tests that prove my fix is effective or that my feature works
- [x] New and existing unit tests pass locally with my changes
- [x] Any dependent changes have been merged and published in downstream modules

## Breaking Changes

[Describe any breaking changes or backwards incompatibilities]

If this PR introduces breaking changes, please:
1. Clearly describe what breaks
2. Explain migration path
3. Update documentation accordingly

## Performance Impact

- **Before:** [baseline metrics if applicable]
- **After:** [new metrics]
- **Impact:** [describe performance changes]

## Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens are signed with secure secret key
- HTTP-only cookies prevent XSS attacks
- Input validation prevents injection attacks
- Rate limiting implemented on auth endpoints

## Deployment Notes

- **Environment Variables Required:**
  - `JWT_SECRET`: Secret key for token signing
  - `JWT_EXPIRATION`: Token expiration time (default: 24h)
  - `BCRYPT_ROUNDS`: Salt rounds for password hashing (default: 10)

- **Database Migrations:** None required (new collection)

- **Configuration Changes:** Add auth middleware to protected routes

## Additional Information

[Any other information that reviewers should know]

## Reviewer Guidance

**Focus areas for review:**
1. Security implementation (password hashing, JWT, etc.)
2. Token management and expiration logic
3. Error handling and user feedback
4. Input validation and sanitization
5. Test coverage and quality

**Questions for reviewers:**
- [ ] Is the JWT secret key management approach appropriate?
- [ ] Should we add refresh tokens for better UX?
- [ ] Are there any additional security measures we should implement?
```

### 5. Assign Reviewers

**Using GitHub CLI:**

```bash
# Assign specific reviewers
gh pr edit <pr-number> --add-reviewer @username1,@username2

# Request team review
gh pr edit <pr-number> --add-reviewer team-name

# Set as draft to request review before making visible
gh pr create --draft
gh pr ready  # When ready for review
```

**Review Assignment Strategy:**

**Code Owner Review:**
- Assign to maintainers of affected files
- Use CODEOWNERS file if configured
- Example: `src/auth/** @auth-team`

**Functional Reviewer:**
- Assign to domain experts
- Request review from stakeholders
- Example: `@product-manager` for feature PRs

**Security Review (if applicable):**
- Assign to security team for auth changes
- Request review for sensitive data handling
- Example: `@security-team` for authentication PRs

**Testing:**
- Assign to QA team if applicable
- Request manual testing verification
- Example: `@qa-team` for complex features

### 6. Configure Labels and Milestones

**Add Labels:**

```bash
# Using GitHub CLI
gh pr edit <pr-number> --add-label "enhancement,security,priority-high"

# Common labels:
# - enhancement, bug, feature, refactor
# - priority-critical, priority-high, priority-medium, priority-low
# - security, performance, accessibility
# - breaking-change, documentation, tests
# - needs-review, approved, changes-requested
```

**Add Milestone:**

```bash
# Assign to milestone
gh pr edit <pr-number> --milestone "v1.2.0"

# List available milestones
gh milestone list
```

### 7. Enable CI/CD Checks

**Verify CI/CD Configuration:**

```bash
# Check CI status
gh pr checks <pr-number>

# View workflow runs
gh run list --pr <pr-number>

# View specific workflow
gh run view <run-id>
```

**Expected CI/CD Checks:**

1. **Automated Tests:**
   - Unit tests pass
   - Integration tests pass
   - E2E tests pass
   - Test coverage meets threshold

2. **Linting and Formatting:**
   - ESLint passes
   - Prettier checks pass
   - No style violations

3. **Security Scans:**
   - Dependency vulnerability scan
   - CodeQL analysis
   - SAST (Static Application Security Testing)

4. **Build Verification:**
   - Production build succeeds
   - Bundle size within limits
   - No build warnings

5. **Performance Tests:**
   - Load tests pass
   - Response times acceptable
   - No memory leaks

**Enable Additional Checks:**

```bash
# Request required checks before merge
gh api repos/:owner/:repo/branches/:branch/protection \
  --method PUT \
  -f required_status_checks='{"strict":true,"contexts":["ci/tests","ci/lint","ci/build"]}'

# Add branch protection rules (requires admin access)
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  -f required_pull_request_reviews='{"required_approving_review_count":1}'
```

### 8. Set Merge Requirements

**Configure branch protection rules:**

```bash
# Set minimum review requirements
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  -f required_pull_request_reviews='{
    "required_approving_review_count": 2,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  }'

# Set status check requirements
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  -f required_status_checks='{
    "strict": true,
    "contexts": ["ci/tests", "ci/lint", "ci/build"]
  }'

# Set other restrictions
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  -f enforce_admins=true \
  -f restrictions='{"users":[],"teams":[]}'
```

**Common Merge Requirements:**
- Minimum 2 approvals required
- All CI/CD checks passing
- No merge conflicts
- Up-to-date with main branch
- Code owner review completed

### 9. Notify Stakeholders

**Using GitHub CLI:**

```bash
# Mention users in PR description
# They will receive notifications

# Comment on PR to notify
gh pr comment <pr-number> --body "@team-name Please review this PR when you have a chance"

# Request specific review
gh pr edit <pr-number> --add-reviewer @username
```

**Best Practices for Notifications:**

**For Immediate Attention:**
```markdown
🚨 @team-name This PR addresses a critical security issue and needs immediate review.
```

**For Standard Review:**
```markdown
@reviewer1 @reviewer2 This PR is ready for review when you have time.

**Review Focus:**
- Security implementation
- Performance impact
- Test coverage
```

**For Discussion:**
```markdown
@architecture-team This PR introduces a new pattern. I'd appreciate architectural review before proceeding.

**Key Question:** [Specific technical question]
```

### 10. Update Spec Status

**After PR creation, update spec.md:**

```markdown
## Status

**PR_CREATED**

### Pull Request Information
- PR Number: #123
- PR Title: SPEC-20240115-1430: Add User Authentication
- PR URL: https://github.com/owner/repo/pull/123
- Branch: feature/SPEC-20240115-1430-add-user-auth
- Status: Under Review

### Reviewers Assigned
- @username1 - Code review
- @username2 - Security review
- @team-name - Architecture review

### CI/CD Checks
- Tests: Passing ✅
- Linting: Passing ✅
- Build: Passing ✅
- Security Scan: Pending ⏳
```

**Update execution log:**

```
[2024-01-15 16:00:00] Step 5: Spec PR Create completed
- PR created: #123
- PR URL: https://github.com/owner/repo/pull/123
- Reviewers assigned: @username1, @username2, @team-name
- CI/CD checks enabled and running
- Status updated to PR_CREATED
```

## Common Patterns

### Feature Pull Request

```markdown
## Overview
Implements user authentication with JWT tokens.

## Changes
- Added user registration endpoint
- Added user login endpoint
- Implemented JWT token management
- Added authentication middleware

## Acceptance Criteria
All 4 acceptance criteria passed.

## Testing
95% test coverage achieved.
```

### Bug Fix Pull Request

```markdown
## Overview
Fixes memory leak in image processing service.

## Bug Report
Fixes #456

## Root Cause
The bug was caused by [explanation].

## Changes
- Fixed unclosed file handles
- Added proper resource cleanup
- Added memory monitoring tests

## Verification
Verified fix with [steps].
```

### Refactoring Pull Request

```markdown
## Overview
Refactor user service to improve testability and reduce coupling.

## Motivation
The current implementation has these issues:
- Hard to test due to tight coupling
- Violates single responsibility principle
- Poor separation of concerns

## Changes
- Extracted validation logic to separate service
- Introduced dependency injection
- Improved error handling

## Testing
All existing tests pass. New tests added for refactored components.
```

## Error Handling

### PR Creation Fails

**Scenario:** `gh pr create` command fails

**Common Errors and Solutions:**

```bash
# Error: No commits between main and branch
# Solution: Check branch has changes
git log origin/main...HEAD --oneline

# Error: Branch doesn't exist on remote
# Solution: Push branch first
git push -u origin feature/SPEC-<id>-<slug>

# Error: PR already exists
# Solution: Get existing PR number
gh pr view feature/SPEC-<id>-<slug>

# Error: Missing permissions
# Solution: Check repository access
gh repo view
```

### CI/CD Checks Fail

**Scenario:** Automated checks fail after PR creation

**Investigation Steps:**

```bash
# Check which checks failed
gh pr checks <pr-number>

# View failure details
gh run view <run-id>

# View logs
gh run view <run-id> --log

# Re-run failed checks
gh run rerun <run-id>
```

**Common Failure Causes:**

1. **Test Failures:**
   - Check if test is flaky (re-run)
   - Verify test expectations
   - Check if environment differences caused failure

2. **Linting Errors:**
   - Run linter locally: `npm run lint`
   - Fix linting errors
   - Commit and push fix

3. **Build Failures:**
   - Check build logs
   - Verify dependencies
   - Check environment variables

4. **Security Vulnerabilities:**
   - Review security scan results
   - Update vulnerable dependencies
   - Or document acceptable risk (with approval)

### Merge Conflicts

**Scenario:** Cannot merge due to conflicts

**Solutions:**

```bash
# Update local branch
git fetch origin
git checkout feature/SPEC-<id>-<slug>
git rebase origin/main

# Resolve conflicts
# Edit files...
git add <resolved files>
git rebase --continue

# Push updated branch
git push --force-with-lease origin feature/SPEC-<id>-<slug>
```

**Notify reviewers:**
```markdown
I've rebased the branch to resolve merge conflicts. All tests are passing.

@reviewers Please re-review when you have time.
```

## Best Practices

### PR Creation

**Do:**
- Use descriptive PR titles with spec ID
- Provide comprehensive PR descriptions
- Include acceptance criteria status
- Link to related issues and specs
- Add appropriate labels and milestones
- Set correct reviewers
- Ensure CI/CD checks are configured

**Don't:**
- Create PRs without description
- Skip updating spec status
- Ignore CI/CD failures
- Assign inappropriate reviewers
- Use vague or misleading titles
- Create PRs with failing tests

### Review Management

**Do:**
- Be responsive to reviewer comments
- Address all feedback
- Clarify ambiguous requests
- Keep discussions focused
- Provide context when requested
- Test suggested changes

**Don't:**
- Ignore reviewer comments
- Be defensive about feedback
- Make unexplained changes
- Leave conversations hanging
- Push major changes without discussion
- Merge without addressing all feedback

### CI/CD Integration

**Do:**
- Ensure all checks pass before requesting review
- Monitor CI/CD status after changes
- Fix failures promptly
- Document acceptable risks
- Keep CI/CD configuration up to date
- Add appropriate checks for project needs

**Don't:**
- Ignore failing checks
- Suppress check failures
- Skip tests for "small" changes
- Disable checks to merge
- Merge with failing checks
- Leave CI/CD broken

## Verification Checklist

Before proceeding to Step 6 (spec-pr-review):

- [ ] Pull request created with correct title format
- [ ] PR description is comprehensive and complete
- [ ] Acceptance criteria status documented
- [ ] Appropriate reviewers assigned
- [ ] Labels and milestones set correctly
- [ ] CI/CD checks enabled and configured
- [ ] Branch protection rules applied
- [ ] Stakeholders notified (if applicable)
- [ ] Spec status updated to PR_CREATED
- [ ] Execution log updated with PR details
- [ ] PR link and number documented
- [ ] Merge requirements configured
- [ ] No merge conflicts
- [ ] Ready for review

## Next Steps

After successful PR creation:

1. Monitor PR review progress
2. Respond to reviewer feedback
3. Address any issues found
4. Ensure CI/CD checks remain passing
5. When approved, proceed to **Step 6: spec-pr-review**

**Reference:** `@references/spec-pr-review.md` for final review and merge procedures.