# Decision Management - Detailed Guide

## What is Decision Management?

Decision management provides clear frameworks for making choices when working with AI. It prevents common pitfalls by establishing when to use different approaches, how to handle edge cases, and what to do when things don't go as planned.

## Decision Framework: When to Use Different AI Models

### Reasoning Models (Claude, ChatGPT, GPT-4)

**Best for:**
- Planning and design (Step 2)
- Explaining complex logic (Explainer role)
- Writing high-quality tests (Tester role)
- Debugging unfamiliar code
- Architecture decisions
- Algorithm implementation

**Why:**
- Better at understanding context and requirements
- Can reason through tradeoffs and implications
- More likely to catch edge cases
- Better at following complex instructions

**When to use:**
```
Task: "Design authentication system"
→ Use Claude/ChatGPT (requires architectural thinking)

Task: "Debug this complex race condition"
→ Use Claude/ChatGPT (needs deep analysis)

Task: "Write comprehensive test suite"
→ Use Claude/ChatGPT (quality matters)
```

### Faster Models (GPT-3.5, Claude Haiku, smaller models)

**Best for:**
- Implementation (Implementer role) when plan is well-defined
- Simple code changes or refactoring
- Formatting and style fixes
- Generating boilerplate code
- Adding comments or documentation

**Why:**
- Faster execution saves time
- Lower cost for large codebases
- Sufficient for well-defined tasks
- Reduces latency in iterative workflows

**When to use:**
```
Task: "Rename all instances of 'username' to 'userId'"
→ Use GPT-3.5 (simple, well-defined)

Task: "Extract this function to a separate file"
→ Use GPT-3.5 (clear instructions, no decisions)

Task: "Add JSDoc comments to this module"
→ Use GPT-3.5 (mechanical task)
```

### Decision Tree

```
Start: What type of task?

├─ Requires planning/design?
│  └─ YES → Use reasoning model
│
├─ Requires quality tests?
│  └─ YES → Use reasoning model
│
├─ Well-defined implementation?
│  └─ Plan clear and detailed?
│     ├─ YES → Use faster model
│     └─ NO → Use reasoning model
│
├─ Simple refactoring/formatting?
│  └─ YES → Use faster model
│
└─ Debugging unfamiliar code?
   └─ YES → Use reasoning model
```

## Decision Framework: Split Roles vs. Single Prompt

### Split into Roles When

**Complex tasks with multiple steps:**
```
✅ Split: "Implement user authentication with registration, login, logout, 
   password reset, and email verification"
   → Planner breaks down, Implementer codes, Tester tests, Explainer documents

❌ Single prompt: "Implement user authentication with registration, login, 
   logout, password reset, and email verification"
   → AI misses details, forgets edge cases, produces uneven quality
```

**Quality-critical code:**
```
✅ Split: "Payment processing with Stripe integration"
   → Planner considers security, Implementer follows plan carefully, 
     Tester covers failure modes, Explainer documents risks

❌ Single prompt: "Payment processing with Stripe integration"
   → AI might miss security considerations, error handling, or edge cases
```

**Multi-step refactoring:**
```
✅ Split: "Extract utility functions from 5 controllers, update all callers,
   ensure all tests pass"
   → Planner identifies dependencies, Implementer changes systematically,
     Tester verifies behavior preserved

❌ Single prompt: "Extract utility functions from 5 controllers"
   → AI might miss callers, break existing functionality
```

**Building new features:**
```
✅ Split: "Add file upload feature with drag-and-drop, progress tracking,
   file validation, and S3 integration"
   → Each aspect gets focused attention

❌ Single prompt: "Add file upload feature"
   → Too broad, likely incomplete or buggy
```

### Use Single Prompt When

**Simple bug fixes:**
```
✅ Single prompt: "This function returns undefined when input is empty array,
   fix it to return 0"
   → Clear problem, clear solution

❌ Split roles: Overkill for simple fix
```

**Obvious changes:**
```
✅ Single prompt: "Update the error message on line 45 to match our format"
   → Trivial change, no decisions needed

❌ Split roles: Wastes time
```

**Small tasks (< 5 minutes):**
```
✅ Single prompt: "Add logging to this function"
   → Quick change, straightforward

❌ Split roles: Unnecessary overhead
```

**Adding comments or documentation:**
```
✅ Single prompt: "Add JSDoc comments to these 3 functions"
   → Mechanical task, clear instructions

❌ Split roles: Doesn't add value
```

### Decision Matrix

| Task Complexity | Quality Critical? | Approach |
|----------------|-------------------|----------|
| Simple | No | Single prompt |
| Simple | Yes | Split roles |
| Medium | No | Split roles (optional) |
| Medium | Yes | Split roles |
| Complex | No | Split roles |
| Complex | Yes | MUST split roles |

## Decision Framework: Context Curation

### Always Include in Context

✅ **Project README**
```
Always: "Read README.md to understand architecture"
Why: Provides big picture, prevents architectural mismatches
```

✅ **Rules/Conventions File**
```
Always: "Read AGENTS.md for coding standards"
Why: Ensures code matches project conventions
```

✅ **Source Files Being Modified**
```
Always: "Read userRoutes.js to understand current implementation"
Why: Provides context for changes
```

✅ **Error Messages, Stack Traces, Logs**
```
When debugging: "Error: Cannot read property 'userId' of undefined at line 45"
Why: Exact error information is critical
```

✅ **Expected vs Actual Behavior**
```
When fixing bugs: "Expected: Returns user object. Actual: Returns undefined"
Why: Helps AI understand the problem
```

### Always Exclude from Context

❌ **Large Documentation Files (> 300 words)**
```
Exclude: Entire API documentation
Include: Only relevant endpoint specifications
```

❌ **Irrelevant Files or Unrelated Code**
```
Exclude: Reading entire codebase to fix one function
Include: Only the function and related code
```

❌ **Duplicate Information**
```
Exclude: Same information in multiple files
Include: Most relevant source
```

❌ **Package Manifests (unless version constraints matter)**
```
Exclude: Full package.json, requirements.txt
Include: Only if specific version constraints are relevant
```

### Context Limits

**300-Word Rule:**
```
If context exceeds 300 words, cut it down
→ Focus on what prevents guessing
→ Remove fluff, duplication, irrelevant details
```

**Human-Readability Test:**
```
Ask: "Would a human read all this before starting?"
If NO → Simplify context
If YES → Context is appropriate
```

**Focus on Signals:**
```
✅ Good context: Specific requirements, constraints, error messages
❌ Bad context: Generic descriptions, redundant information, entire codebase
```

## Decision Framework: Conversation Management

### When to Keep Conversations Short

**Signs you should reset:**
- Thread exceeds 50-100 messages
- AI starts recycling the same suggestions
- Earlier decisions are being forgotten
- Context window is filling up
- Token usage is high for minimal progress

**Why reset:**
- Long chats cause context drift
- Model forgets earlier decisions
- Recycles bad ideas or circles back
- Token limits cause truncated context
- Fresh start = better focus

### Best Practices for Conversation Management

**One Chat Per Major Task:**
```
Chat 1: Design phase (Planner)
Chat 2: Implementation phase (Implementer)
Chat 3: Testing phase (Tester)
Chat 4: Documentation phase (Explainer)
```

**Summarize Between Steps:**
```
End of Chat 1 Summary:
"We designed user authentication with:
- JWT token authentication
- Password hashing with bcrypt
- Registration and login endpoints
- Error handling consistent with existing patterns

Next: Implement step by step in new chat."
```

**Paste Summary into Next Chat:**
```
Start of Chat 2:
"Previous work summary:
- Designed user authentication system
- Plan approved: 5 steps
- Key decisions: bcrypt with 10 rounds, JWT with HS256

Current task: Implement Step 1 - Input validation middleware"
```

**Start Fresh When Thread Feels Messy:**
```
If conversation is:
- Going in circles
- Repeating same errors
- Confused about original goal
→ STOP and start new chat with focused summary
```

## Decision Framework: Error Handling

### When to Retry

**Retry is appropriate for:**
- Minor typos or syntax errors (1-2 times)
- Small misunderstandings that are easy to clarify
- Missing context that can be added
- Simple logic errors where the fix is obvious

**Example:**
```
User: "It says 'undefined is not a function' on line 45"
AI: "I need to see the code to fix it"
User: [Pastes code]
AI: "Ah, I see the issue. Let me fix it"
[Fixes successfully]
→ Good use of retry
```

### When to Start Fresh

**Stop and restart when:**
- After 2 failed attempts at the same fix
- AI starts repeating the same incorrect approach
- Conversation becomes circular
- Context drift occurs
- Answers get worse over time

**Example:**
```
Attempt 1: AI suggests approach A - fails
Attempt 2: AI suggests approach B - fails
Attempt 3: AI suggests approach A again - circular
→ STOP. Start fresh with better context.
```

### When to Escalate to Human

**Ask for human help when:**
- After 2 restarts and still stuck
- Problem involves infrastructure or deployment
- Issue requires domain expertise you don't have
- Debugging is taking longer than reimplementing
- Multiple approaches have failed
- Unclear requirements or ambiguous specs

**Request format:**
```
I've been debugging this issue for 45 minutes and tried 4 approaches.

Problem: [description]

Attempts:
1. Approach A: [description] - [result]
2. Approach B: [description] - [result]
3. Approach C: [description] - [result]
4. Approach D: [description] - [result]

Context:
- Error: [paste error]
- Relevant files: [list]
- Tests: [status]

Can you provide guidance on how to proceed?
```

## Decision Framework: Quality vs. Speed

### High Priority: Quality

**When quality matters most:**
- Security-sensitive code (auth, payments, data handling)
- Production-critical features
- Algorithmic code that must be correct
- User-facing functionality
- Code that will be reviewed by others

**Decision:**
- Use reasoning models
- Split into multiple roles
- Write comprehensive tests
- Do thorough review
- Take time to get it right

**Example:**
```
Task: "Implement payment processing with Stripe"
→ Quality is critical
→ Use GPT-4 for planning
→ Split into Planner/Implementer/Tester roles
→ Write tests for all edge cases
→ Do thorough security review
→ Expect 2-4 hours
```

### High Priority: Speed

**When speed matters most:**
- Prototyping or experimentation
- Internal tools or scripts
- One-off tasks
- Non-critical features
- Learning exercises

**Decision:**
- Use faster models
- Single prompt if possible
- Minimal testing
- Quick review
- Iterate quickly

**Example:**
```
Task: "Create a script to parse log files"
→ Speed is priority
→ Use GPT-3.5
→ Single prompt approach
→ Quick test
→ Minimal review
→ Expect 15-30 minutes
```

### Balanced Approach

**When both quality and speed matter:**
- Standard feature implementation
- Bug fixes in production code
- Refactoring for maintainability
- Most development tasks

**Decision:**
- Use appropriate model for task type
- Split roles if complex, single prompt if simple
- Write good tests but don't over-engineer
- Reasonable review process
- Balance thoroughness with efficiency

**Example:**
```
Task: "Add user profile update endpoint"
→ Balanced priority
→ Use Claude for planning, GPT-3.5 for implementation
→ Planner/Implementer roles
→ Tests for happy path + edge cases
→ Standard review
→ Expect 1-2 hours
```

## Decision Framework: Security Decisions

### Always Consider Security For

**Authentication/Authorization:**
```
✅ Always: "Review code for authentication bypasses"
✅ Always: "Check authorization on protected endpoints"
✅ Always: "Verify passwords are hashed, not stored in plain text"
✅ Always: "Validate JWT token signature and expiration"
```

**Input Validation:**
```
✅ Always: "Validate user input before processing"
✅ Always: "Sanitize data before database queries"
✅ Always: "Check file types and sizes for uploads"
✅ Always: "Validate API payloads against schema"
```

**Data Handling:**
```
✅ Always: "Never expose sensitive data in error messages"
✅ Always: "Encrypt sensitive data at rest"
✅ Always: "Use HTTPS for all communications"
✅ Always: "Log security events appropriately"
```

### Security Decision Checklist

```
Before accepting code, verify:
[ ] No SQL injection vulnerabilities
[ ] No XSS vulnerabilities
[ ] No CSRF vulnerabilities
[ ] Proper authentication and authorization
[ ] Input validation present and sufficient
[ ] Output encoding/escaping
[ ] Secrets not hardcoded
[ ] Sensitive data not exposed
[ ] Proper error handling (no information leakage)
[ ] Rate limiting on sensitive endpoints
[ ] File upload validation (type, size, content)
[ ] Secure session management
[ ] Secure dependencies (no known vulnerabilities)
```

### When to Request Security Review

**Mandatory security review for:**
- Authentication/authorization changes
- Payment processing
- Personal data handling (PII)
- File upload/download
- Email generation
- External API integrations
- Configuration changes

**Request format:**
```
I've implemented [feature] that handles [sensitive data].

Security concerns addressed:
- Input validation: [description]
- Data encryption: [description]
- Access control: [description]
- Logging: [description]

Please review for any security issues I may have missed.
```

## Decision Framework: Performance Decisions

### When to Optimize

**Optimize when:**
- Code is too slow for requirements
- Database queries are inefficient
- Memory usage is excessive
- Scaling issues are expected
- User experience is impacted

**Don't optimize when:**
- Code is fast enough
- Premature optimization
- Complex optimization for minor gains
- Code becomes less maintainable

### Performance Decision Tree

```
Start: Is there a performance problem?

├─ Measure first
│  └─ Profile/benchmark to confirm issue
│
├─ Identify bottleneck
│  ├─ Database? → Check queries, indexes, N+1 problem
│  ├─ Algorithm? → Time complexity, inefficient logic
│  ├─ Network? → Too many requests, payload size
│  └─ Rendering? → Unnecessary re-renders, heavy DOM
│
├─ Choose optimization approach
│  ├─ Simple fix? → Implement immediately
│  ├─ Needs design change? → Plan and implement
│  └─ Complex refactor? → Break into phases
│
└─ Verify improvement
   └─ Re-measure to confirm fix worked
```

### Performance Best Practices

**Database Queries:**
```
✅ Use indexes appropriately
✅ Avoid N+1 queries
✅ Select only needed fields
✅ Use pagination for large datasets
✅ Cache frequently accessed data
```

**Algorithm Efficiency:**
```
✅ Choose appropriate data structures
✅ Consider time complexity
✅ Avoid nested loops when possible
✅ Use built-in optimized functions
✅ Cache expensive computations
```

**API Design:**
```
✅ Minimize payload sizes
✅ Use compression (gzip, brotli)
✅ Implement caching (ETag, Last-Modified)
✅ Use async operations appropriately
✅ Rate limit to prevent abuse
```

## Decision Framework: Testing Decisions

### What to Test Always

✅ **Critical business logic:**
```
Always test: Payment calculations, authentication, authorization
```

✅ **Public APIs:**
```
Always test: All endpoints, error conditions, edge cases
```

✅ **Bug fixes:**
```
Always test: Regression test that fails before fix, passes after
```

✅ **Complex algorithms:**
```
Always test: Boundary conditions, edge cases, error handling
```

### What to Test Sometimes

⚠️ **Simple getters/setters:**
```
Maybe test: Only if they contain logic or validation
```

⚠️ **UI components:**
```
Maybe test: Critical user flows, not every component
```

⚠️ **Third-party library usage:**
```
Maybe test: Only if custom wrapper or complex integration
```

### Test Coverage Goals

```
Critical code (security, payments):      90-100%
Core business logic:                     80-90%
Public APIs:                             80-90%
Utility functions:                       70-80%
Simple UI components:                    50-70%
```

### When to Write Integration Tests

**Write integration tests for:**
- Features spanning multiple components
- Database interactions
- External API integrations
- User flows spanning multiple endpoints
- Complex state management

**Skip integration tests for:**
- Simple unit-tested functions
- Pure utility functions
- Trivial components

## Decision Framework: Refactoring Decisions

### When to Refactor

✅ **Refactor when:**
- Code is hard to understand
- Code has duplicated logic
- Code is difficult to test
- Code has grown complex over time
- New features are hard to add
- Performance issues identified
- Security vulnerabilities found

❌ **Don't refactor when:**
- Code works and is understandable
- No clear benefit
- Low priority feature
- Deadline is approaching
- Resources are limited

### Refactoring Approach

**Incremental Refactoring:**
```
1. Write tests for existing behavior
2. Make small changes
3. Verify tests pass after each change
4. Commit frequently
5. Stop when tests fail
```

**Safe Refactoring Checklist:**
```
[ ] Tests written for existing behavior
[ ] Tests all passing before refactor
[ ] Changes are small and focused
[ ] Tests run after each change
[ ] Behavior preserved (all tests pass)
[ ] No breaking changes
[ ] Documentation updated
[ ] Team notified of changes
```

### When to Avoid Refactoring

```
❌ Don't refactor if:
- No clear problem to solve
- Code works and is maintainable
- Time/budget constraints
- Legacy code with no tests
- About to be deprecated
- Team lacks expertise
```

## Common Decision Pitfalls

### ❌ Guessing at Requirements

```
"I assume you want X"
→ Assumptions lead to wrong implementation

✅ Ask clarifying questions
"Do you want X or Y?"
```

### ❌ Optimizing Prematurely

```
"This function could be 0.1ms faster"
→ Not worth the complexity

✅ Focus on value
"This feature saves users 5 minutes per task"
```

### ❌ Over-engineering

```
"Let me build a framework for this simple task"
→ Wastes time, adds complexity

✅ Keep it simple
"Let me just write the function"
```

### ❌ Skipping Tests

```
"Tests will slow me down"
→ Bugs will slow you down more

✅ Test early and often
"Tests catch bugs before production"
```

### ❌ Ignoring Conventions

```
"I know a better way to do this"
→ Inconsistency harms maintainability

✅ Follow established patterns
"This matches our existing codebase"
```

## Decision Checklist Summary

```
Before proceeding, verify:

[ ] Right AI model selected for task
[ ] Roles split or single prompt decision made
[ ] Context curated appropriately (not too much, not too little)
[ ] Conversation is focused and not drifting
[ ] Quality vs. speed tradeoff considered
[ ] Security implications reviewed
[ ] Performance implications considered
[ ] Testing approach determined
[ ] Refactoring need assessed
[ ] Human help requested if stuck after 2 restarts
```

## See Also

- `resources/step-1-context.md` - Context gathering strategies
- `resources/step-2-plan.md` - Planning decisions
- `resources/step-3-code.md` - Role selection and execution
- `resources/step-6-iterate.md` - Iteration and debugging decisions
- `resources/human-interaction.md` - When to involve humans