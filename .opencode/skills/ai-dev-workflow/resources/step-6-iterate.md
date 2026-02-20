# Step 6: Iterate - Detailed Guide

## What is Controlled Iteration?

When code breaks or tests fail, systematic debugging with full context prevents circular reasoning and stuck conversations. Controlled iteration means knowing when to retry, when to restart, and how to provide effective debugging information.

## The Debugging Process

### Phase 1: Gather Full Context

**Always include:**
1. **Error message or stack trace** - Copy the exact error, not paraphrasing
2. **Function where error occurs** - The specific code location
3. **Relevant surrounding code** - 10-20 lines before and after the error
4. **Types or interfaces** - TypeScript/Python types if applicable
5. **Expected behavior** - What you expected to happen
6. **Actual behavior** - What actually happened

**Context template:**
```
Here is the function and the error message.

Error Message:
<paste exact error message>

Stack Trace:
<paste stack trace>

Code:
<function with error>

Context:
- This function is called by <caller>
- It depends on <dependencies>
- The error occurs when <conditions>

What I expected: <expected behavior>
What actually happened: <actual behavior>
```

### Phase 2: Ask for Explanation First

**Why this matters:**
- Forces AI to understand the problem before proposing fixes
- Reveals misconceptions in the AI's understanding
- Often uncovers the root cause without coding changes

**Prompt template:**
```
Do not fix anything yet.
Explain what this function does, step by step.
Then list the most likely failure cases.
```

**What to look for:**
- Does the AI correctly understand the function's purpose?
- Are there edge cases the AI missed?
- Is there a misunderstanding of dependencies or types?

### Phase 3: Request Targeted Fix

**Once you understand the issue:**
```
Rewrite this function using best practices, 
while keeping it efficient and readable.
```

**Include constraints:**
- Performance requirements
- Security considerations
- Style guidelines from AGENTS.md

## Iteration Rules

### When to Retry (1-2 times max)

**Retry is appropriate for:**
- Minor typos or syntax errors
- Small misunderstandings that are easy to clarify
- Missing context that can be added
- Simple logic errors where the fix is obvious

**Example:**
```
User: It says "undefined is not a function" on line 45.
AI (try 1): Oh, that's because I used .map instead of .forEach. Let me fix.
AI (try 2): Wait, I see the issue now. It's a timing problem with async.
→ If still not fixed, STOP and restart
```

### When to Start Fresh

**Stop and restart when:**
- After 2 failed attempts at the same fix
- AI starts repeating the same incorrect approach
- Conversation becomes circular (same suggestions recycled)
- Context drift (AI forgets earlier decisions or requirements)
- Answers get worse over time
- AI seems confused about the original problem

**Signs you need to restart:**
```
AI: "Let me try a different approach..."
AI (later): "Actually, let me try what I suggested first..."
AI (even later): "Maybe we should reconsider..."
→ STOP. This is circular. Start fresh.
```

### Starting Fresh Template

```
Stop this conversation.
Start a fresh chat with better context.
Restate the problem with narrower focus.
Avoid saying "try again" repeatedly.

---

New conversation with refined context:

[Context - be more focused than before]
I'm working on [specific issue].

Context:
- [relevant files]
- [exact error]
- [what you tried and failed]

Problem:
The [specific function] fails because [root cause if known].

Task:
[Specific, focused task]
```

**Why this works:**
- Removes accumulated confusion
- Allows you to curate better context
- Resets the conversation state
- Prevents circular reasoning
- Focuses on what matters now, not history

## Debugging Strategies

### Strategy 1: Divide and Conquer

**Break down the problem:**
```
1. Is the data correct before the function?
2. Is the data correct after the function?
3. At what step does it go wrong?

Let me add console.log:
```
console.log('Input:', input);
console.log('Step 1:', result1);
console.log('Step 2:', result2);
console.log('Output:', output);
```
```

### Strategy 2: Binary Search

**For complex code:**
```
If a 100-line function fails:
1. Check lines 1-50 - works
2. Check lines 51-75 - works
3. Check lines 76-87 - fails
4. Check lines 76-81 - works
5. Check lines 82-87 - fails

The problem is in lines 82-87.
```

### Strategy 3: Minimal Reproduction

**Create smallest possible failing case:**
```
Instead of debugging entire app:
- Create minimal test case
- Remove unrelated dependencies
- Simplify data structures
- Isolate the specific bug

Example:
"I have a 500-line function failing.
Let me extract just the failing part into a simple test.
Now it's 10 lines and still fails.
Debug this instead."
```

### Strategy 4: Rubber Ducking

**Explain to yourself or AI:**
```
"This function takes user input, validates it,
then calls the database. The validation uses
regex to check email format. Wait... the regex
is for US phone numbers, not emails. That's why
it fails for valid emails!"

→ Often the solution emerges during explanation.
```

## Common Debugging Mistakes

### ❌ Vague Error Reports

```
"It doesn't work"
"It's broken"
"There's an error"
```

### ✅ Specific Error Reports

```
"Function `calculateTotal` returns NaN when 
input is empty array instead of 0"
"Database query throws 'duplicate key' error 
when inserting user with email 'test@test.com'"
```

### ❌ Guessing at Fixes

```
"Maybe it's a race condition?"
"Could be a memory issue?"
"I think we need to rewrite everything"
```

### ✅ Evidence-Based Debugging

```
"Console.log shows `result` is undefined on line 23"
"The stack trace points to `db.query()`"
"Test passes with input `['a', 'b']` but fails with `[]`"
```

### ❌ Repeated Retries

```
"Try again"
"Still broken"
"One more time"
"Circular for 10 attempts"
```

### ✅ Controlled Iteration

```
"Try 1 failed. Adding more context..."
"Try 2 failed. Different approach..."
"Try 2 failed twice. Stopping and restarting..."
```

## When to Use Different Approaches

### Use Explanation-First When:
- Complex logic or algorithms
- Unfamiliar code or libraries
- Integration issues between components
- Performance problems (need to understand before optimizing)

### Use Direct Fix When:
- Simple typos or syntax errors
- Missing imports or dependencies
- Obvious configuration issues
- Well-documented library usage errors

### Use Restart When:
- Multiple failed attempts at same fix
- AI seems confused or hallucinating
- Conversation has become circular
- Context has drifted significantly

## Conversation Management

### Keep Conversations Short

**Why:**
- Long chats cause context drift
- Model forgets earlier decisions
- Token limits cause truncated context
- AI recycles bad ideas

**Best practices:**
- One chat for design, one for implementation
- One chat for each major feature/component
- Summarize and paste into new chat
- Start fresh when thread feels messy

### Summarize Between Steps

**When starting new chat:**
```
Previous work:
- We implemented user registration endpoint
- Created tests for happy path and edge cases
- Fixed input validation bug
- All tests passing

Next task:
- Add password reset functionality
- Similar patterns to registration
- Use existing email service

Context files:
- @README.md
- @AGENTS.md
- @auth.js (registration endpoint reference)
- @emailService.js (for sending reset emails)
```

## Verification Checklist

After debugging, verify:
```
[ ] Error is resolved (no error messages)
[ ] Tests pass (existing + new)
[ ] Edge cases covered
[ ] Code follows AGENTS.md conventions
[ ] No regressions introduced
[ ] Performance acceptable
[ ] Security maintained
[ ] Documentation updated (if needed)
```

## Time Expectations

| Issue Type | Typical Resolution | Iteration Strategy |
|------------|-------------------|-------------------|
| Simple bug (typos, minor logic) | 5-10 minutes | Retry 1-2 times |
| Moderate bug (logic, state) | 15-30 minutes | Explain-first, then fix |
| Complex bug (race conditions, integration) | 30-60 minutes | Minimal reproduction, restart if needed |
| Performance issue | 30-90 minutes | Profile first, then optimize |
| Refactoring gone wrong | 30-60 minutes | Revert, restart with better context |

## Best Practices

1. **Always ask for explanation first** - prevents guessing
2. **Provide full error context** - exact messages, stack traces
3. **Stop after 2 failed attempts** - prevents circular reasoning
4. **Restart with better context** - not "try again" but "fresh start"
5. **Use minimal reproduction** - isolate the problem
6. **Summarize between chats** - maintain continuity
7. **Document what you learned** - prevent future issues
8. **Test the fix thoroughly** - ensure no regressions

## When to Escalate to Human

**Ask for human help when:**
- After 2 restarts and still stuck
- Problem involves infrastructure or deployment
- Issue requires domain expertise you don't have
- Debugging is taking longer than reimplementing
- Multiple approaches have failed

**Request format:**
```
I've been debugging this issue for [time] and tried [N] approaches.

Problem: [description]

Attempts:
1. [approach 1] - [result]
2. [approach 2] - [result]
3. [approach 3] - [result]

Context:
- Error: [paste error]
- Relevant files: [list]
- Tests: [status]

Can you provide guidance on how to proceed?
```

See `resources/decision-management.md` for more on iteration decisions and `resources/troubleshooting.md` for common debugging scenarios.