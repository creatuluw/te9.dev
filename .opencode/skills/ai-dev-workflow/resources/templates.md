I'm starting a new coding task. Let me load the project context.

Read @README to understand the project scope, architecture, and constraints.

Read @AGENTS.md to learn the coding style, rules, and constraints for this codebase.

Then read @main.py, @business_logic_1.py, and @business_logic_2.py carefully.

Your task is to update @business_logic_2.py to implement the following changes:
1. <change 1>
2. <change 2>
3. <change 3>

Follow the conventions in the README and AGENTS file.
Do not modify other files unless strictly necessary and explain any extra changes you make.
```

### Context with Specific Constraints

```
I need to make changes to the codebase. Here's the context:

Project Context:
- Stack: <tech stack>
- Version: <version numbers>
- Framework: <framework and version>
- Database: <database and version>

Project Rules (from @AGENTS.md):
- <rule 1>
- <rule 2>
- <rule 3>

Relevant Files:
- @file1.js - <brief description>
- @file2.js - <brief description>
- @file3.js - <brief description>

Task:
Implement <feature/fix/refactor> in @target_file.js

Constraints:
- Must use <specific library/version>
- Must follow <specific pattern>
- Must handle <specific edge cases>
```

### Context with Error Information

```
I need to debug an issue. Here's the context:

Error Message:
```
<paste full error message>
```

Stack Trace:
```
<paste stack trace>
```

Relevant Code:
- @file_with_error.js - The function where error occurs
- @related_file.js - Related code that might be involved

What I expected: <describe expected behavior>
What actually happened: <describe actual behavior>

Context:
- This function is called by <caller>
- It depends on <dependencies>
- The error occurs when <conditions>

Help me understand why this is happening and how to fix it.
```

### Context for New Feature

```
I need to implement a new feature. Here's the context:

Feature Description:
<describe what the feature should do>

Requirements:
1. <requirement 1>
2. <requirement 2>
3. <requirement 3>

Constraints:
- Must integrate with <existing system>
- Must follow <existing patterns>
- Must be compatible with <version constraints>

Existing Related Code:
- @file1.js - <description>
- @file2.js - <description>

Project Standards:
- Use <coding style>
- Follow <naming conventions>
- Use <error handling pattern>

Review the existing code and propose a plan for implementing this feature.
```

---

## Planning Templates

### Basic Plan Request

```
You are a senior engineer helping me with a new change.

First, read the description of the feature or bug:
<insert feature or bug description and any relevant context>

Step 1 — Plan only:
- Think step by step and outline a clear plan
- List the main steps you would take
- Call out important decisions or tradeoffs
- Mention edge cases we should keep in mind

Stop after the plan. Do not write any code until I say "approved."
```

### Plan with Architecture Considerations

```
I need to implement <feature/fix/refactor>. Create a detailed plan.

Context:
- Current architecture: <describe>
- Existing patterns: <describe>
- Dependencies: <list>

Requirements:
1. <requirement 1>
2. <requirement 2>
3. <requirement 3>

Plan should include:
1. **High-level approach**: What's the overall strategy?
2. **Step-by-step breakdown**: Each step with rationale
3. **Files to modify**: List of files and changes needed
4. **New files needed**: Any new files to create
5. **Dependencies**: Any new dependencies required
6. **Edge cases**: What could go wrong? How to handle?
7. **Trade-offs**: What are the pros/cons of this approach?
8. **Testing strategy**: How will we verify it works?
9. **Rollback plan**: How to revert if something goes wrong?

Stop after the plan. Wait for approval before writing code.
```

### Plan with Multiple Options

```
I need to implement <feature>. Propose different implementation approaches.

Requirements:
<describe requirements>

Please propose 2-3 different approaches with:
1. **Description**: How would this approach work?
2. **Pros**: What are the advantages?
3. **Cons**: What are the disadvantages?
4. **Complexity**: How complex is this to implement?
5. **Maintenance**: How easy to maintain going forward?
6. **Performance**: What are the performance implications?
7. **Risk**: What are the risks?

After presenting all options, recommend the best one and explain why.

Stop after the plan. Wait for my choice before writing code.
```

### Refactoring Plan

```
I need to refactor <code/module>. Create a refactoring plan.

Current Issues:
- <issue 1>
- <issue 2>
- <issue 3>

Goals:
- <goal 1>
- <goal 2>
- <goal 3>

Plan should include:
1. **Current state analysis**: What's wrong now?
2. **Desired state**: What should it look like?
3. **Step-by-step refactoring**: Each step with rationale
4. **Tests needed**: Ensure we don't break anything
5. **Migration path**: How to transition safely
6. **Verification**: How to confirm refactoring is correct

Critical: Behavior must remain 100% identical. Only structure/style changes.

Stop after the plan. Wait for approval before refactoring.
```

---

## Role-Based Templates

### Planner Role Template

```
Act as a Planner. Break down this task into clear, sequential steps.

Task: <describe task>

Context:
- <relevant context 1>
- <relevant context 2>

Requirements:
- <requirement 1>
- <requirement 2>

Provide:
1. **Step-by-step breakdown**: Numbered list of steps
2. **Files involved**: Which files need to change?
3. **Dependencies**: What depends on what?
4. **Edge cases**: What could go wrong?
5. **Assumptions**: What are we assuming?

Focus on planning only. Do not write any code.
```

### Implementer Role Template

```
Act as an Implementer. Follow the approved plan.

Approved Plan:
<paste approved plan>

Implementation Rules:
- Change only the files listed in the plan
- Keep changes small and focused (5-30 minutes each)
- Implement one step at a time
- Follow the coding conventions from @AGENTS.md
- If something is unclear, ask before coding
- Add comments for complex logic

Step 1: <describe first step>

Explain what you're about to change, then write the code for this step only.
```

### Tester Role Template

```
Act as a Tester. Write comprehensive tests for this code.

Code to Test:
<paste or reference code>

Context:
- Testing framework: <jest/mocha/jest/etc>
- Test file location: <path>
- Existing test patterns: <describe>

Write tests for:
1. **Happy path**: Normal operation with valid inputs
2. **Edge cases**: At least 2-3 edge cases (boundary values, unusual inputs)
3. **Error cases**: How does it handle errors?
4. **Integration**: Does it work with other components?

Test requirements:
- Each test should be independent
- Use descriptive test names
- Include setup/teardown if needed
- Cover all public functions/methods
- Test error paths explicitly

Write tests now.
```

### Tester Role for Bug Fix

```
Act as a Tester. Write a regression test for this bug.

Bug Description:
<describe bug>

Expected Behavior:
<what should happen>

Actual Behavior:
<what actually happens>

Code Fix:
<paste or reference the fix>

Requirements:
1. Write a test that would FAIL before the fix
2. The same test should PASS after the fix
3. Test should clearly document the expected behavior
4. Test should be specific enough to prevent regressions

Write the regression test now.
```

### Explainer Role Template

```
Act as an Explainer. Summarize what changed and why.

Changes Made:
- <change 1>
- <change 2>
- <change 3>

Provide:
1. **Summary by file**: What changed in each file?
2. **Logic explanation**: Plain English explanation of the logic
3. **Decisions made**: Why this approach?
4. **Trade-offs**: What are the pros/cons?
5. **What could break**: What are the risks?
6. **How tests cover it**: How do tests verify correctness?
7. **Future considerations**: What should we keep in mind?

Explain in clear, simple language that any developer could understand.
```

---

## Review Templates

### Manual Code Review Template

```
Review this code for correctness, quality, and security.

Code:
<paste or reference code>

Review Checklist:
- [ ] Logic is correct and meets requirements
- [ ] Error handling is comprehensive
- [ ] Edge cases are handled
- [ ] Code is readable and maintainable
- [ ] Follows project conventions
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Tests are adequate
- [ ] Documentation is clear

For each issue found:
1. **Issue**: What's the problem?
2. **Severity**: Critical/High/Medium/Low
3. **Location**: Where is it?
4. **Suggestion**: How to fix it?
5. **Reason**: Why is this important?

Provide detailed feedback.
```

### Security Review Template

```
Review this code for security vulnerabilities.

Code:
<paste or reference code>

Context:
- This code handles <type of data>
- It will be deployed in <environment>
- It will be accessed by <who>

Security Checklist:
- [ ] Input validation and sanitization
- [ ] SQL/NoSQL injection protection
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Authentication/authorization checks
- [ ] Sensitive data handling
- [ ] Secret/credential management
- [ ] Dependency vulnerabilities
- [ ] Rate limiting
- [ ] Logging and monitoring

For each vulnerability:
1. **Type**: OWASP category
2. **Severity**: Critical/High/Medium/Low
3. **Location**: Where is it?
4. **Exploit scenario**: How could it be exploited?
5. **Fix**: How to remediate?
```

### Performance Review Template

```
Review this code for performance issues.

Code:
<paste or reference code>

Context:
- Expected data volume: <size>
- Expected request rate: <rate>
- Performance requirement: <SLA>

Performance Checklist:
- [ ] Algorithmic complexity is appropriate
- [ ] No unnecessary loops or nested operations
- [ ] Database queries are optimized (indexes, pagination)
- [ ] No N+1 query problems
- [ ] Caching is used where appropriate
- [ ] Memory usage is reasonable
- [ ] Network calls are minimized
- [ ] Expensive operations are avoided in hot paths

For each issue:
1. **Issue**: What's the problem?
2. **Impact**: What's the performance impact?
3. **Benchmark**: How much slower/faster?
4. **Suggestion**: How to optimize?
5. **Trade-offs**: What are the pros/cons of the fix?
```

### Code Quality Review Template

```
Review this code for maintainability and quality.

Code:
<paste or reference code>

Quality Checklist:
- [ ] Functions are small and focused (< 50 lines)
- [ ] Names are descriptive and clear
- [ ] Code is DRY (no duplication)
- [ ] Logic is straightforward (no clever tricks)
- [ ] Comments explain "why" not "what"
- [ ] Error handling is consistent
- [ ] Constants are used for magic numbers/strings
- [ ] Structure follows project patterns

For each issue:
1. **Issue**: What's the problem?
2. **Why it matters**: Why should we fix this?
3. **Suggestion**: How to improve it?
4. **Example**: Show before/after if helpful
```

---

## Testing Templates

### Unit Test Template

```
Write unit tests for this function.

Function:
<paste or reference function>

Context:
- Testing framework: <jest/mocha/etc>
- Test file location: <path>

Requirements:
1. Test the happy path (normal operation)
2. Test at least 2 edge cases (boundary values, unusual inputs)
3. Test error cases (invalid inputs, null/undefined)
4. Tests should be independent and focused
5. Use descriptive test names

Write the tests now.
```

### Integration Test Template

```
Write an integration test for this feature.

Feature:
<describe feature>

Components Involved:
- <component 1>
- <component 2>
- <component 3>

Requirements:
1. Test a realistic user flow
2. Verify components work together correctly
3. Test error handling across components
4. Test with realistic data
5. Clean up resources after test

Write the integration test now.
```

### End-to-End Test Template

```
Write an end-to-end test for this user journey.

User Journey:
<describe user journey>

Steps:
1. <step 1>
2. <step 2>
3. <step 3>

Requirements:
1. Simulate real user interactions
2. Test through the UI (if applicable)
3. Verify final state
4. Handle async operations correctly
5. Include assertions for each step

Write the E2E test now.
```

### Test Review Template

```
Review these tests for quality and coverage.

Tests:
<paste or reference tests>

Code Being Tested:
<paste or reference code>

Review Checklist:
- [ ] Happy path is tested
- [ ] Edge cases are covered
- [ ] Error paths are tested
- [ ] Assertions are strong and specific
- [ ] Tests are independent
- [ ] Test names are descriptive
- [ ] Setup/teardown is correct
- [ ] Coverage is adequate

For each issue:
1. **Missing test**: What's not tested?
2. **Weak assertion**: Which assertion is too weak?
3. **Test issue**: What's wrong with the test?
4. **Suggestion**: How to fix it?

Provide detailed feedback.
```

---

## Debugging Templates

### Basic Debugging Template

```
Help me debug this issue.

Error Message:
```
<paste error>
```

Code:
```javascript
<paste function with error>
```

Context:
- This function is called by: <caller>
- It depends on: <dependencies>
- Expected behavior: <what should happen>
- Actual behavior: <what actually happens>

First, explain why this error is happening.
Then, provide a fix that follows best practices.
```

### Debugging with Explanation Template

```
I need help understanding why this code isn't working.

Code:
```javascript
<paste code>
```

Error:
```
<paste error>
```

First, explain what this function does step by step.
Then, list the most likely failure cases.
Do not fix anything yet - just explain the problem.
```

### Debugging with Full Context Template

```
I'm stuck debugging this issue. Here's full context.

The Problem:
<describe what's not working>

Error Message:
```
<paste full error>
```

Stack Trace:
```
<paste stack trace>
```

Function Code:
```javascript
<paste function>
```

Surrounding Code:
```javascript
<paste relevant surrounding code>
```

What I've Tried:
1. <attempt 1> - <result>
2. <attempt 2> - <result>
3. <attempt 3> - <result>

Environment:
- Node version: <version>
- Library versions: <versions>
- Database: <database and version>

Please:
1. Explain the root cause
2. Provide a clear, simple fix
3. Explain why this fix works
4. Suggest how to prevent similar issues
```

### Debugging After Failed Attempts Template

```
I've tried to fix this issue multiple times but it's still not working. Help me reset.

The Issue:
<describe issue>

Error:
```
<paste error>
```

Attempts Made:
1. <attempt 1> - didn't work because: <reason>
2. <attempt 2> - didn't work because: <reason>
3. <attempt 3> - didn't work because: <reason>

I think I might be going in circles. Please:
1. Forget the previous attempts
2. Analyze the problem from scratch
3. Identify the actual root cause
4. Provide a fresh solution
5. Explain why my previous approaches failed
```

---

## Human Interaction Templates

### Approval Request Template

```
I'm ready to proceed with the next step.

Task: <brief description>

Plan:
<summary of plan>

Files to modify:
- <file 1> - <change>
- <file 2> - <change>

Impact:
- What could break: <risks>
- Dependencies affected: <list>
- Testing needed: <what tests>

Estimated time: <time estimate>

Should I proceed? [yes/no/adjust]
```

### Advice Request Template

```
I have a decision to make and need your advice.

Situation:
<describe situation>

Options:

Option A: <description>
- Pros: <list advantages>
- Cons: <list disadvantages>
- Trade-offs: <explain>
- Complexity: <low/medium/high>
- Risk: <low/medium/high>

Option B: <description>
- Pros: <list advantages>
- Cons: <list disadvantages>
- Trade-offs: <explain>
- Complexity: <low/medium/high>
- Risk: <low/medium/high>

Option C: <description>
- Pros: <list advantages>
- Cons: <list disadvantages>
- Trade-offs: <explain>
- Complexity: <low/medium/high>
- Risk: <low/medium/high>

Context:
- Project constraints: <list>
- Time constraints: <explain>
- Team expertise: <describe>

Which approach should I take? [A/B/C/other]
```

### Feedback Request Template

```
I've completed <task>. Here are the results:

Summary:
<brief summary of what was done>

Changes Made:
- <change 1>
- <change 2>
- <change 3>

Files Modified:
- <file 1>
- <file 2>
- <file 3>

Tests Written:
- <number> tests covering:
  - <test type 1>
  - <test type 2>
  - <test type 3>

Test Results:
- All tests passing: <yes/no>
- Coverage: <percentage>

Potential Issues:
- <risk 1> - <mitigation>
- <risk 2> - <mitigation>

Does this meet your expectations? [yes/no/adjust]
```

### Completion Report Template

```
Task Complete: <task name>

Implementation Summary:
<what was implemented>

Key Changes:
1. <change 1>
2. <change 2>
3. <change 3>

Files Modified:
- <file 1>: <changes>
- <file 2>: <changes>

Tests Added:
- <test suite>: <test count> tests
- Coverage: <percentage>

Test Results:
✓ All tests passing
✓ No regressions detected

Known Issues:
- None / <list any issues>

Next Steps:
- <recommendation 1>
- <recommendation 2>

Ready for review and merge.
```

---

## Project-Specific Templates

### React Component Template

```
Implement a React component following project patterns.

Component: <component name>

Requirements:
1. <requirement 1>
2. <requirement 2>
3. <requirement 3>

Context:
- Using React <version>
- State management: <Redux/Context/etc>
- Styling: <CSS modules/Tailwind/etc>
- Testing: <Jest/RTL>

Project Patterns:
- Functional components with hooks
- TypeScript (if applicable)
- Component organization: <describe>
- Error handling pattern: <describe>

Plan the component structure:
1. Props interface
2. State management
3. Component breakdown
4. Styling approach
5. Testing strategy

Then implement following project conventions.
```

### Node.js API Endpoint Template

```
Implement a Node.js API endpoint following project patterns.

Endpoint: <method> <path>

Requirements:
1. <requirement 1>
2. <requirement 2>
3. <requirement 3>

Context:
- Framework: Express <version>
- Database: <MongoDB/PostgreSQL/etc>
- Authentication: <JWT/session/etc>
- Validation: <express-validator/joi/etc>

Project Patterns:
- Error response format: <describe>
- Success response format: <describe>
- Middleware chain: <describe>
- Database query pattern: <describe>

Plan the endpoint:
1. Validation middleware
2. Authentication/authorization
3. Business logic
4. Database operations
5. Response formatting
6. Error handling

Then implement following project conventions.
```

### Database Migration Template

```
Create a database migration for this schema change.

Change Description:
<describe what needs to change>

Context:
- Database: <PostgreSQL/MySQL/MongoDB/etc>
- Migration tool: <Knex/TypeORM/Prisma/etc>
- Production data: <yes/no>

Requirements:
1. <requirement 1>
2. <requirement 2>

Plan the migration:
1. Current schema: <describe>
2. Desired schema: <describe>
3. Migration steps: <list>
4. Rollback plan: <how to revert>
5. Data migration: <if applicable>
6. Downtime needed: <yes/no>

Write the migration SQL/code.
```

### CI/CD Pipeline Template

```
Set up CI/CD pipeline for this project.

Requirements:
- Automated testing on push
- Automated deployment on merge to main
- Security scanning
- Code quality checks

Context:
- Platform: <GitHub Actions/GitLab CI/etc>
- Language: <language>
- Deployment target: <AWS/Vercel/Heroku/etc>

Pipeline Stages:
1. Install dependencies
2. Run linters
3. Run tests
4. Build application
5. Run security scans
6. Deploy to staging
7. Run integration tests
8. Deploy to production

Create the pipeline configuration.
```

---

## Best Practices for Using Templates

### Customization Guidelines

1. **Replace placeholders**: Always replace `<placeholder>` text with actual values
2. **Add context**: Include project-specific information
3. **Remove irrelevant sections**: Keep only what applies to your situation
4. **Adjust complexity**: Simplify for small tasks, expand for complex ones
5. **Follow project conventions**: Adapt to your team's style

### Template Selection Guide

| Task | Use This Template |
|------|------------------|
| New feature | Context with Feature → Plan with Architecture |
| Bug fix | Context with Error → Debugging with Full Context |
| Refactoring | Refactoring Plan → Manual Code Review |
| Adding tests | Tester Role → Test Review |
| Reviewing PR | Manual Code Review → Security Review |
| Production deployment | Completion Report |

### Template Maintenance

- Keep templates up to date with project changes
- Add new templates as you discover useful patterns
- Share templates with team members
- Document when templates don't work well

### Combining Templates

You can combine templates for complex workflows:

```
Example: Implementing a new feature with comprehensive testing

1. Start with: Context with Specific Constraints
2. Follow with: Plan with Architecture Considerations
3. Then: Implementer Role (for each step)
4. Next: Tester Role (for each component)
5. Then: Manual Code Review
6. Finally: Completion Report
```

---

## Tips for Writing Effective Prompts

### Clarity

❌ Bad: "Fix this code"
✅ Good: "This function returns undefined when called with a null user ID. Add null checking and return an appropriate error message."

### Context

❌ Bad: "Add authentication"
✅ Good: "Add JWT authentication to the POST /api/login endpoint using the existing User model. Follow the same token format used in the /api/auth/login endpoint."

### Specificity

❌ Bad: "Make it faster"
✅ Good: "Optimize this database query. It currently takes 5 seconds with 1000 records. Target is under 100ms. You can add indexes or rewrite the query structure."

### Constraints

❌ Bad: "Handle errors"
✅ Good: "Add try-catch blocks around all async operations. Return errors in the format { success: false, error: message }. Log all errors with console.error."

### Examples

❌ Bad: "Follow the pattern"
✅ Good: "Follow the code structure in src/utils/example.js. Use the same import organization, function naming, and error handling approach."

---

## Template Library Index

### Quick Access

| Category | Templates |
|----------|-----------|
| **Context** | Basic, Specific Constraints, Error Info, New Feature |
| **Planning** | Basic, Architecture, Multiple Options, Refactoring |
| **Roles** | Planner, Implementer, Tester, Explainer |
| **Review** | Manual, Security, Performance, Code Quality |
| **Testing** | Unit, Integration, E2E, Test Review |
| **Debugging** | Basic, with Explanation, Full Context, After Failed Attempts |
| **Human** | Approval, Advice, Feedback, Completion |
| **Project** | React, Node.js API, Database, CI/CD |

### By Phase

| Phase | Templates |
|-------|------------|
| **Context** | All Context templates |
| **Plan** | All Planning templates |
| **Code** | Implementer, Planner roles |
| **Review** | All Review templates |
| **Test** | All Testing templates, Tester role |
| **Iterate** | All Debugging templates |
| **Human** | All Human Interaction templates |

---

For detailed examples of using these templates in real workflows, see `examples.md`.