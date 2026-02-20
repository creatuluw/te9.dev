I'm ready to [action description].

Plan: [brief summary of what will be done]
Files to modify: [list of files]
Impact: [what could break]
Risk: [low/medium/high] - [risk description]

Should I proceed? [yes/no/adjust]
```

**Example 1: Before Coding**
```
I'm ready to implement the user registration endpoint.

Plan:
1. Add input validation middleware
2. Check for duplicate email
3. Hash password with bcrypt
4. Create user document
5. Return JWT token

Files to modify:
- routes/auth.js (new endpoint)
- tests/auth.test.js (new tests)

Impact:
- No breaking changes (additive feature)
- Requires bcrypt package (already installed)

Risk: low - Standard authentication pattern

Should I proceed? [yes/no/adjust]
```

**Example 2: Before Merge**
```
I'm ready to merge PR #42 (user registration).

Changes:
- Added POST /api/auth/register endpoint
- Input validation for email and password
- Password hashing with bcrypt
- JWT token generation
- Comprehensive test coverage (12 tests, all passing)

Files modified:
- routes/auth.js
- tests/auth.test.js

Impact:
- Additive functionality, no breaking changes
- Enables user registration feature

Risk: low - Thoroughly tested, follows existing patterns

Should I proceed? [yes/no/adjust]
```

**Example 3: Before Destructive Action**
```
I'm ready to remove the deprecated user_sessions table.

Plan:
1. Verify no code references user_sessions table
2. Add migration to drop table
3. Run migration on staging first
4. After 1 week of staging success, run on production

Files to modify:
- migrations/drop_user_sessions.js (new migration)

Impact:
- Old session data will be lost (but deprecated for 6 months)
- No code impact (migrated to new session system)

Risk: medium - Irreversible data loss, but data is deprecated

Should I proceed? [yes/no/adjust]
```

## When to Request Human Advice

### Recommended for:
- **Choosing between multiple implementation approaches** - When trade-offs aren't clear
- **Handling ambiguous requirements** - When specs are unclear or contradictory
- **Deciding on library/tool choices** - Security, performance, or compatibility concerns
- **Architecture or design decisions** - Long-term project impact
- **Handling unfamiliar codebases or technologies** - Need domain expertise
- **Performance optimization strategies** - Multiple valid approaches
- **Security decisions** - Authentication, authorization, encryption approaches
- **Refactoring scope** - How much to change vs. incremental improvements

### Advice Request Template

**Format:**
```
I encountered [situation] with options:

Option A: [description]
- Pros: [list advantages]
- Cons: [list disadvantages]
- Trade-offs: [explain]
- Risk: [low/medium/high]

Option B: [description]
- Pros: [list advantages]
- Cons: [list disadvantages]
- Trade-offs: [explain]
- Risk: [low/medium/high]

Context: [relevant background information]
Constraints: [time, resources, technical constraints]

Which approach should I take? [A/B/other/let me think about it]
```

**Example 1: Implementation Approach**
```
I encountered a database query performance issue with options:

Option A: Add database index
- Pros: Simple, immediate fix, minimal code change
- Cons: Adds storage overhead, may slow writes slightly
- Trade-offs: Faster reads vs. slower writes
- Risk: low

Option B: Cache query results in memory (Redis)
- Pros: Dramatically faster for hot data, reduces database load
- Cons: Adds infrastructure complexity, cache invalidation issues
- Trade-offs: Performance vs. complexity
- Risk: medium (cache invalidation bugs are tricky)

Option C: Denormalize data
- Pros: No query needed, instant access
- Cons: Data duplication, complex synchronization
- Trade-offs: Speed vs. data integrity
- Risk: high (potential data inconsistency)

Context:
- Query runs 1000x per second, takes 200ms each
- Data is user profile information, changes infrequently
- We have Redis available but rarely use it

Constraints:
- Need to improve response time to <50ms
- Can add infrastructure but prefer simpler solutions
- Data consistency is critical

Which approach should I take? [A/B/C/other]
```

**Example 2: Library Choice**
```
I need to choose an HTTP client for this service with options:

Option A: Axios
- Pros: Widely used, excellent docs, automatic JSON parsing, interceptors
- Cons: Larger bundle size (15KB), one more dependency
- Trade-offs: Feature-rich vs. lightweight
- Risk: low

Option B: Native fetch API
- Pros: Built-in, no dependency, modern standard
- Cons: Less feature-rich, manual error handling, older browser support
- Trade-offs: Simplicity vs. features
- Risk: low

Option C: ky
- Pros: Lightweight (3KB), modern API, excellent TypeScript support
- Cons: Less popular, smaller community, fewer examples
- Trade-offs: Bundle size vs. ecosystem support
- Risk: low

Context:
- Building a Node.js backend service (no browser compatibility concerns)
- Need to make authenticated API calls to external services
- Need retry logic for failed requests
- TypeScript codebase

Constraints:
- Bundle size matters but not critical (Node.js)
- Need good TypeScript support
- Prefer well-maintained libraries

Which approach should I take? [A/B/C/other]
```

**Example 3: Architecture Decision**
```
I'm designing the real-time notifications system with options:

Option A: Server-Sent Events (SSE)
- Pros: Simple HTTP-based, one-way (server to client), easy to implement
- Cons: Server can't receive data from client, limited to GET requests
- Trade-offs: Simplicity vs. bidirectional communication
- Risk: low

Option B: WebSockets
- Pros: Full-duplex (bidirectional), lower latency, widely supported
- Cons: More complex state management, scaling challenges, firewall issues
- Trade-offs: Flexibility vs. complexity
- Risk: medium (scaling and state management)

Option C: Polling
- Pros: Simplest, works everywhere, no infrastructure changes
- Cons: High server load, delayed notifications, inefficient
- Trade-offs: Simplicity vs. performance and real-time nature
- Risk: high (performance and user experience issues)

Context:
- Need real-time notifications for 10,000+ users
- Notifications are one-way (server to client only)
- Users expect <1 second delivery time
- Current infrastructure: standard HTTP, no WebSocket setup

Constraints:
- Must handle scale efficiently
- Prefer simpler implementation if it meets requirements
- Budget for infrastructure improvements if needed
- Deployment timeline: 2 weeks

Which approach should I take? [A/B/C/other]
```

## When to Request Human Feedback

### Required after:
- **Completing plan** - Before coding begins
- **Completing each major code change** - After implementation, before next step
- **Generating tests** - Review test quality and coverage
- **Fixing bugs** - Verify fix works and doesn't introduce regressions
- **Before merging any PR** - Final quality gate
- **Performance optimizations** - Verify improvements are measurable
- **Security fixes** - Ensure vulnerabilities are properly addressed

### Feedback Request Template

**Format:**
```
I completed [task] with the following results:

Changes:
- [change 1]
- [change 2]
- [change 3]

Tests written: [number]
- Test types: [unit tests, integration tests, e2e tests]
- Coverage: [percentage]
- Status: [all passing / x failing]

Files modified: [list of files]
Lines changed: [+X, -Y]

Performance: [before → after] (if applicable)
Security: [issues addressed / no issues found]

Known issues: [any known issues or limitations]
Next steps: [what should happen next]

Does this meet your expectations? [yes/no/adjust]
```

**Example 1: After Feature Implementation**
```
I completed user registration feature with the following results:

Changes:
- Added POST /api/auth/register endpoint
- Input validation for email format and password strength
- Email uniqueness check before creation
- Password hashing with bcrypt (10 salt rounds)
- JWT token generation using existing signing logic

Tests written: 12 tests
- Test types: 1 integration test, 11 unit tests
- Coverage: 95% for new code
- Status: all passing

Test breakdown:
- 3 happy path tests
- 4 edge case tests (invalid email, weak password, duplicate email, missing fields)
- 2 security tests (password hashing verification, JWT token format)
- 3 regression tests (existing login still works)

Files modified:
- routes/auth.js (+78 lines)
- tests/auth.test.js (+156 lines)
Lines changed: +234, -0

Performance:
- Registration endpoint: 45ms average (includes bcrypt hashing)
- Duplicate check: 12ms average (indexed email field)
- No performance regression in existing endpoints

Security:
- Passwords hashed with bcrypt (industry standard)
- No secrets hardcoded
- SQL injection protection (parameterized queries)
- XSS protection (input validation)

Known issues:
- None identified

Next steps:
- Ready for code review and merge

Does this meet your expectations? [yes/no/adjust]
```

**Example 2: After Bug Fix**
```
I completed fix for slow database query bug with the following results:

Changes:
- Added database index on Task.assignedTo field
- Updated query to use .lean() for faster serialization
- Added query limit to 100 results (pagination for more)

Tests written: 4 tests
- Test types: 2 performance tests, 2 functional tests
- Coverage: 100% for modified code
- Status: all passing

Test breakdown:
- 1 performance test: query now <1 second with 1000 tasks
- 1 performance test: only required fields returned (verified response size)
- 2 functional tests: query still returns correct data

Files modified:
- models/Task.js (+2 lines - index)
- routes/dashboard.js (+1 line - .lean(), +1 line - limit)
Lines changed: +4, -0

Performance:
- Before: 4.2 seconds for 1000 tasks (timeout error)
- After: 0.8 seconds for 1000 tasks (within SLA)
- Response size reduced by 40% (using .lean())
- No performance regression in other queries

Security:
- No security implications (index and query optimization only)

Known issues:
- With 1000+ tasks, users must use pagination (expected behavior)
- Index migration needed for production database

Next steps:
- Create and test database migration
- Run migration on staging database
- Deploy to production after staging verification

Does this meet your expectations? [yes/no/adjust]
```

**Example 3: After Refactoring**
```
I completed refactoring of authentication code with the following results:

Changes:
- Extracted authentication logic to src/utils/auth.js
- Created reusable functions: generateToken(), hashPassword(), comparePassword()
- Updated all routes to use new utility functions
- Removed duplicate password hashing code (3 instances removed)

Tests written: 9 new tests
- Test types: 9 unit tests for utility functions
- Coverage: 100% for new utility functions
- Status: all passing

Test breakdown:
- 3 tests for generateToken() (valid token, correct payload, expiration)
- 3 tests for hashPassword() (correct hashing, different salts, bcrypt rounds)
- 3 tests for comparePassword() (match, no match, error handling)
- All existing tests still pass (no regressions)

Files modified:
- src/utils/auth.js (new file, +45 lines)
- routes/auth.js (-52 lines, +15 lines)
- routes/user.js (-8 lines, +5 lines)
Lines changed: +65, -60 (net +5, but much better code organization)

Performance:
- No performance change (same logic, just reorganized)
- Slightly faster due to reduced code duplication

Security:
- No security changes (same bcrypt implementation, just centralized)

Known issues:
- None identified

Next steps:
- Ready for code review
- Consider adding authentication tests in future (currently only unit tests)

Does this meet your expectations? [yes/no/adjust]
```

## When to Require Human Review

### Must-have human review for:
- **All pull requests before merging** - Final quality gate
- **Security-sensitive code** - Authentication, authorization, payments, data handling
- **Algorithmic code that must be correct** - Financial calculations, cryptography, data processing
- **Database migrations or schema changes** - Irreversible data structure changes
- **Configuration changes affecting production** - Environment variables, feature flags
- **Any code that could cause financial or reputational damage** - Critical user paths
- **Complex refactoring** - Changes affecting multiple files or components
- **Performance-critical code** - High-traffic paths, expensive operations
- **External API integrations** - Third-party dependencies, rate limits, error handling

### Review Checklist Template

**Format:**
```
Please review this [PR/change] for [description]:

## Summary
[Brief description of what was changed and why]

## Changes
[Files modified, lines changed, high-level overview]

## Tests
[Test coverage, test results, test types]

## Risk Assessment
- Risk level: [low/medium/high]
- Potential impact: [what could go wrong]
- Mitigation: [how risks are addressed]

## Areas Requiring Special Attention
1. [Area 1 - e.g., security concern]
2. [Area 2 - e.g., performance consideration]
3. [Area 3 - e.g., complex logic]

## Approvals Needed
- [ ] Code review
- [ ] Security review (if applicable)
- [ ] Performance review (if applicable)
- [ ] Database review (if migrations)
- [ ] QA verification (if production change)

## Review Questions
[Any specific questions for reviewers]

Please review by [deadline] if possible.
```

**Example 1: Security-Sensitive PR**
```
Please review this PR for payment processing implementation:

## Summary
Added credit card payment processing using Stripe API. This handles tokenization, charge creation, and error handling for user payments.

## Changes
Files modified:
- src/payment/stripe.js (new file, +156 lines)
- routes/payment.js (new file, +89 lines)
- tests/payment.test.js (new file, +234 lines)
Lines changed: +479, -0

Key changes:
- Stripe client initialization with API key from environment
- Tokenization endpoint for card details (never sees raw card numbers)
- Charge creation with amount, currency, and metadata
- Error handling for card declines, insufficient funds, etc.
- Idempotency key support to prevent duplicate charges

## Tests
Test coverage: 98% for payment code
Test results: 48 tests, all passing
Test types:
- 32 unit tests for individual functions
- 12 integration tests for Stripe API interactions (mocked)
- 4 end-to-end tests for complete payment flow

## Risk Assessment
Risk level: HIGH - Payment processing is security-critical
Potential impact:
- Financial loss if charges processed incorrectly
- Security breach if card details mishandled
- Poor user experience if payments fail unexpectedly

Mitigation:
- Never handles raw card numbers (Stripe.js on client)
- Uses Stripe SDK (tested, secure, industry standard)
- All payment code in dedicated, reviewed module
- Comprehensive test coverage including error cases
- Idempotency prevents duplicate charges
- Error logging for all payment attempts

## Areas Requiring Special Attention
1. **Security**: Verify Stripe API key is stored securely (environment variable)
2. **Error handling**: Check that card declines, network errors are handled gracefully
3. **Idempotency**: Ensure duplicate charges cannot occur
4. **Logging**: Verify sensitive payment data is NOT logged
5. **Compliance**: Code should comply with PCI-DSS requirements (Stripe handles most)

## Approvals Needed
- [x] Code review
- [ ] Security review (required - payment processing)
- [ ] Performance review (payment timeout handling)
- [ ] QA verification (test on Stripe test environment)
- [ ] Finance team approval (business logic verification)

## Review Questions
- Are error messages user-friendly without exposing sensitive info?
- Should we add 3D Secure (SCA) for regulatory compliance?
- Is the idempotency key implementation correct?
- Are we handling all Stripe error codes appropriately?

Please review by Friday EOD if possible. We plan to deploy to staging next week.
```

**Example 2: Database Migration PR**
```
Please review this PR for user_sessions table removal:

## Summary
Removes deprecated user_sessions table and migrates to new session system. Old table has been unused for 6 months.

## Changes
Files modified:
- migrations/20240105_drop_user_sessions.js (new file, +23 lines)
Lines changed: +23, -0

Key changes:
- DROP TABLE user_sessions migration
- Verification query to check for any active sessions before drop
- Rollback script available (recreates table with schema)

## Tests
Test coverage: N/A (migration only)
Test results: Migration tested on staging, successful
Test procedure:
1. Verified no code references user_sessions table
2. Confirmed no active sessions in staging database
3. Ran migration on staging - successful
4. Verified application still works after migration

## Risk Assessment
Risk level: MEDIUM - Irreversible data loss (but deprecated)
Potential impact:
- Data loss if table contains active sessions
- Application errors if any code still references table

Mitigation:
- Verified no code references table (grep search)
- Confirmed table unused for 6 months (last migration log)
- Tested on staging first
- Rollback script available if needed
- Production deployment delayed 1 week after staging

## Areas Requiring Special Attention
1. **Data loss**: Confirm table is truly deprecated and safe to drop
2. **Code references**: Verify grep search found all references
3. **Rollback plan**: Confirm rollback script works (tested on staging)
4. **Deployment timing**: Should run during low-traffic period

## Approvals Needed
- [x] Code review
- [ ] Database review (required - migration)
- [ ] QA verification (verify no sessions in production)
- [ ] Operations approval (deployment window)

## Review Questions
- Is 1 week delay between staging and production sufficient?
- Should we backup the table before dropping (data is old)?
- Are there any cron jobs or scheduled tasks that might reference this table?

Please review by Wednesday. We plan to run migration Sunday 2 AM UTC.
```

## Human Interaction Best Practices

### When Requesting Approval
1. **Be specific** - Clearly state what will be done
2. **Include context** - Why is this change needed?
3. **Show impact** - What could break or be affected?
4. **Assess risk** - Low, medium, high - and why
5. **Offer options** - yes/no/adjust - give control to human

### When Requesting Advice
1. **Present options** - Don't just ask "what should I do?"
2. **Show trade-offs** - Pros, cons, risks for each option
3. **Provide context** - Constraints, requirements, timeline
4. **Be honest** - If you're unsure, say so
5. **Explain reasoning** - Why are you considering these options?

### When Requesting Feedback
1. **Show results** - What was actually accomplished?
2. **Include metrics** - Test coverage, performance improvements
3. **Be transparent** - Known issues, limitations
4. **Suggest next steps** - What should happen next?
5. **Ask specific questions** - Not just "is this good?"

### When Requiring Review
1. **Flag risks early** - Identify security, performance, complexity concerns
2. **Provide context** - Why is this review important?
3. **Set expectations** - What should reviewers focus on?
4. **Include evidence** - Test results, performance data
5. **Respect time** - Provide deadline if time-sensitive

## Common Mistakes

### ❌ Vague Requests
```
"Can I proceed?" (with no context)
→ Human has no information to make decision
```

### ✅ Specific Requests
```
"Can I proceed with user registration implementation?
Plan: 5 steps, files: 2, risk: low, tests: 12, all passing"
→ Human has all information needed
```

### ❌ Overwhelming Requests
```
20 pages of code changes, no summary, no context
→ Human can't review effectively
```

### ✅ Focused Requests
```
Summary: Added user registration endpoint
Key changes: 5 steps, 2 files
Tests: 12 tests, all passing
Risk: low
[Then include detailed changes as context]
→ Human understands impact, can review efficiently
```

### ❌ No Context
```
"Should I use library A or B?"
→ Human can't make informed recommendation
```

### ✅ With Context
```
"Should I use Axios or Native Fetch?
Context: Node.js backend, TypeScript, need retry logic
Constraints: Good TypeScript support, prefer well-maintained"
→ Human can make informed recommendation
```

## Escalation Guidelines

**Escalate to human immediately when:**
- Security vulnerabilities are discovered
- Production systems are affected
- Data loss or corruption is possible
- Legal or compliance concerns arise
- Multiple approaches have failed
- You're unsure about critical decisions

**Don't escalate for:**
- Minor code style issues
- Trivial implementation details
- Questions answered in documentation
- Simple errors you can fix yourself

## Communication Channels

**Use the right channel:**
- **Approval requests**: Primary communication (Slack, email, chat)
- **Advice requests**: Appropriate channel (may be async)
- **Feedback requests**: Primary communication
- **Code reviews**: PR review tool (GitHub, GitLab)
- **Urgent issues**: Direct communication (call, urgent message)

## Timing Considerations

**Request approval/advice:**
- **Before work starts**: For major decisions
- **During implementation**: For blockers or uncertainty
- **Before deployment**: For production changes

**Provide feedback:**
- **After each major milestone**: Keep human informed
- **Before final review**: Catch issues early
- **As soon as problems arise**: Don't hide bad news

## Summary

Human interaction is not a weakness—it's a strength. Know when to:
- **Ask for approval**: Before irreversible actions or critical decisions
- **Seek advice**: When multiple valid approaches exist
- **Provide feedback**: After completing work, to verify quality
- **Require review**: For security-critical or high-impact changes

The AI provides, the human decides. Together, they produce reliable, trustworthy code.

See `resources/decision-management.md` for more on when to involve humans in decision-making processes.