You are a senior engineer helping me with a new feature.

First, read the feature description:
<insert feature description and requirements>
<insert any relevant context from Step 1>

Step 1 — Plan only:
- Think step by step and outline a clear plan
- List the main steps you would take
- Call out important decisions or tradeoffs
- Mention edge cases we should keep in mind
- Identify any dependencies on other code
- Question any unclear requirements

Stop after the plan. Do not write any code until I say "approved."
```

### Template 2: Bug Fix

```
You are a senior engineer helping me debug an issue.

Read the bug report and context:
<insert bug description>
<insert error messages, logs, or stack traces>
<insert relevant code context>

Step 1 — Plan only:
- Explain the likely root cause
- Outline the fix strategy
- List the steps to fix it
- Mention potential side effects or risks
- Identify what tests are needed
- Call out any edge cases in the fix

Stop after the plan. Do not write any code until I say "approved."
```

### Template 3: Refactoring

```
You are a senior engineer helping me refactor code.

Read the code to refactor:
@file_to_refactor.js

Read the refactoring goals:
<insert what needs to improve>

Step 1 — Plan only:
- Identify what needs to change
- Outline the refactoring steps
- Call out risks to existing behavior
- Identify what tests verify behavior preservation
- Mention any API changes or breaking changes
- List the order of operations

Stop after the plan. Do not write any code until I say "approved."
```

### Template 4: API Integration

```
You are a senior engineer helping me integrate with an API.

Read the API documentation:
<insert API docs or link>

Read the integration requirements:
<insert what the integration should do>

Step 1 — Plan only:
- Identify the API endpoints needed
- Outline data flow and transformations
- List error handling requirements
- Mention rate limiting or authentication needs
- Identify edge cases (API failures, timeouts, invalid responses)
- Plan for data validation and sanitization

Stop after the plan. Do not write any code until I say "approved."
```

## Implementation Phase Template

```
Step 2 — Implement:
Once I say "approved," implement the plan one step at a time:
- For each step, explain what you are about to change
- Propose the code changes for that step only
- Write tests for that step where it makes sense
- Show the diff or proposed changes
- Wait for confirmation before moving to next step
```

## Planning Guidelines

### Do's
✅ Use chat models for planning (better at reasoning)
✅ Switch to AI editor for implementation (better with repo)
✅ Ask AI to state assumptions about library versions and APIs
✅ Verify unfamiliar APIs with search assistant or official docs
✅ Question unclear requirements before planning
✅ Include edge cases in the plan
✅ Consider error handling in the plan

### Don'ts
❌ Don't let AI generate code in planning phase
❌ Don't accept vague plans - push for specificity
❌ Don't skip edge cases and error handling
❌ Don't proceed without understanding dependencies
❌ Don't ignore performance or security implications
❌ Don't assume AI knows library versions or APIs

## Common Planning Mistakes

### ❌ Skipping Planning
```
User: "Add user registration"
AI: [Generates 200 lines of code without plan]
Result: Wrong implementation, missing features, needs rewrite
```

### ✅ Planning First
```
User: "Add user registration"
AI: "Here's my plan: 1. Validate email format, 2. Check duplicate, 3. Hash password, 4. Create user, 5. Return JWT. Edge cases: invalid email, weak password, duplicate email."
User: "approved"
AI: [Implements step by step with validation]
Result: Correct implementation, all cases handled
```

### ❌ Vague Plans
```
Plan: "Add authentication"
→ Too broad, AI guesses implementation
```

### ✅ Specific Plans
```
Plan: "Add JWT authentication with:
- Login endpoint (POST /api/auth/login)
- Token validation middleware
- Protected routes for dashboard
- Error handling for invalid tokens"
→ Clear scope, AI knows exactly what to build
```

### ❌ Missing Edge Cases
```
Plan: "Add payment processing"
→ Doesn't consider payment failures, refunds, timeouts
```

### ✅ Including Edge Cases
```
Plan: "Add payment processing:
- Process payment with Stripe
- Handle successful payments
- Handle failed payments with retry logic
- Handle payment timeouts
- Support refunds
- Validate payment amount"
→ Comprehensive, covers failure modes
```

## When Plans Need Revision

**Revise plan when:**
- Requirements change mid-planning
- AI identifies a better approach
- New dependencies or constraints discovered
- Plan is too complex - break it down further
- User feedback reveals missing requirements

**Don't revise plan when:**
- Minor implementation details (save for implementation phase)
- Coding preferences (handle in implementation)
- Style questions (follow AGENTS.md)

## Planning Verification Checklist

Before approving a plan, verify:

```
[ ] Plan addresses all requirements
[ ] Steps are clear and sequential
[ ] Edge cases are identified
[ ] Error handling is considered
[ ] Dependencies are identified
[ ] Tradeoffs are called out
[ ] Ambiguous requirements are questioned
[ ] Implementation approach is sound
[ ] Tests are planned for critical paths
[ ] Security implications are considered
[ ] API changes are documented (if any)
[ ] Breaking changes are identified (if any)
[ ] Time estimate is reasonable
[ ] Plan complexity matches task complexity
```

## Planning by Task Type

### Simple Bug Fix
**Plan focus:**
- Root cause identification
- Fix strategy
- Regression test needed
- Side effects to watch for

**Example:**
```
1. Identify that query lacks proper index
2. Add index to database field
3. Verify query uses index
4. Write test for query performance
```

### New Feature
**Plan focus:**
- Feature breakdown into components
- Integration points with existing code
- API changes or additions
- Data model changes
- Test strategy

**Example:**
```
1. Add user preferences model
2. Create API endpoints for getting/setting preferences
3. Add preferences to user profile UI
4. Update authentication to include preferences
5. Write tests for all endpoints
```

### Refactoring
**Plan focus:**
- What code needs to change
- How to preserve existing behavior
- Order of operations to avoid breakage
- Tests that verify behavior preservation
- Potential side effects

**Example:**
```
1. Extract validation logic to utility function
2. Update all callers to use new utility
3. Verify all existing tests pass
4. Add tests for utility function
5. Remove duplicated validation code
```

### API Integration
**Plan focus:**
- API endpoints to call
- Authentication/authorization
- Data transformation needs
- Error handling strategy
- Rate limiting considerations
- Fallback mechanisms

**Example:**
```
1. Create API client with authentication
2. Implement data fetch function with error handling
3. Add retry logic for failed requests
4. Transform API data to match our models
5. Write tests for successful and failed requests
```

## Planning Questions to Ask AI

**For every plan:**
- "What are the edge cases?"
- "What could go wrong?"
- "Are there any dependencies?"
- "What tests do we need?"
- "What are the tradeoffs?"

**For complex tasks:**
- "Can you break this into smaller steps?"
- "What if this approach fails?"
- "Is there a simpler way to do this?"
- "What assumptions are you making?"

**For unclear requirements:**
- "What do you mean by [term]?"
- "What should happen in [edge case]?"
- "How should we handle [error condition]?"

## Tips for Better Planning

1. **Be specific** - Vague plans lead to vague implementations
2. **Think edge cases** - Most bugs are in edge cases, not happy path
3. **Question everything** - Don't let AI assume things
4. **Plan tests** - Tests are part of the plan, not an afterthought
5. **Consider failures** - What happens when things go wrong?
6. **Identify risks** - What could break existing functionality?
7. **Think maintenance** - Will this be easy to maintain?

See `resources/step-3-code.md` for how to implement approved plans using multi-agent roles.