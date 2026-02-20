# Step 3: Code - Multi-Agent Roles Guide

## Why Multi-Agent Approach?

Splitting coding work into specialized roles improves AI output quality by:
- Reducing cognitive load (one focused task at a time)
- Leveraging different AI model strengths
- Enabling specialization (planning vs. implementation)
- Providing natural checkpoints for verification

## The Four Roles

### Role 1: Planner

**Responsibilities:**
- Break down tasks into clear, sequential steps
- Identify dependencies between steps
- Call out edge cases and risks
- Question assumptions
- Estimate complexity

**When to use:**
- Complex tasks with multiple components
- New features requiring architecture decisions
- Refactoring affecting multiple files
- Any task where "how to approach" isn't obvious

**Planner Prompt Template:**
```
Act as a Planner. Break down this task into clear, sequential steps:

Task Description: <describe what needs to be done>

Context: <brief context from Step 1>

Requirements:
1. Break down into 3-7 steps (fewer for simple tasks, more for complex ones)
2. For each step, specify:
   - What needs to be done
   - Which files/modules are involved
   - What decisions need to be made
3. Call out edge cases to consider
4. Identify dependencies between steps
5. List any assumptions you're making

Provide a numbered list of steps.
```

**Example Output:**
```
Planner Response:

## Implementation Plan

**Step 1: Add Input Validation Middleware**
- File: routes/auth.js
- Create validation function that checks email format and password strength
- Edge cases: invalid email, weak password, missing fields
- No dependencies

**Step 2: Check for Existing User**
- File: routes/auth.js
- Query User model by email before creating
- Edge cases: duplicate email, database errors
- Depends on: Step 1 (validation first to avoid unnecessary queries)

**Step 3: Hash Password**
- File: routes/auth.js
- Use bcrypt.hash with 10 salt rounds
- No edge cases (bcrypt handles this)
- Depends on: Step 2 (only hash if user doesn't exist)

**Assumptions:**
- bcrypt is already installed
- JWT_SECRET is available in environment
- Error format: { success: false, error: message }
```

### Role 2: Implementer

**Responsibilities:**
- Write code strictly following approved plan
- Change only files listed in the plan
- Keep changes small and focused
- Ask before coding anything unclear
- Follow project conventions

**When to use:**
- After plan approval
- Well-defined coding tasks
- Implementation steps from Planner
- Refactoring with clear behavior preservation

**Implementer Prompt Template:**
```
Act as an Implementer. Follow the approved plan exactly:

Approved Plan:
<paste the approved plan from Planner role>

Context:
- Project rules from @AGENTS.md
- Related code: @files_to_modify.js

Implementation Rules:
1. Change ONLY the files listed in the plan
2. Keep each change small and focused (5-30 minutes)
3. Implement steps ONE AT A TIME
4. Follow project coding conventions exactly
5. If anything is unclear, STOP and ask for clarification
6. Do not add "nice to have" features
7. Do not refactor unless specified in plan

Ready to implement. Which step should I start with?
```

**Example Workflow:**
```
User: Implement Step 1 - Add Input Validation Middleware

Implementer Response:
I'll implement Step 1 now.

Code to add in routes/auth.js:
```javascript
function validateRegistration(req, res, next) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and password are required' 
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid email format' 
    });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ 
      success: false, 
      error: 'Password must be at least 8 characters' 
    });
  }
  
  next();
}
```

This adds validation following AGENTS.md error format.
Next step?
```

### Role 3: Tester

**Responsibilities:**
- Write tests for happy path and edge cases
- Create regression tests for bug fixes
- Write integration tests for multi-component changes
- Use tests as documentation
- Verify tests pass before moving on

**When to use:**
- Immediately after implementing code changes
- Before marking a step as complete
- When adding new functionality
- When fixing bugs (regression tests are mandatory)

**Tester Prompt Template:**
```
Act as a Tester. Write tests for this code change:

Code Change:
<paste the code that was implemented>

Context:
- Test framework: <Jest/pytest/etc.>
- Test conventions from AGENTS.md
- Existing test file: @test_file.js

Test Requirements:
1. Write a unit test for the happy path
2. Write at least 2 edge case tests
3. If this is a bug fix, write a regression test (should fail before fix, pass after)
4. If this touches multiple components, write an integration test
5. Use descriptive test names that document expected behavior
6. Follow project test conventions

Provide complete test code that can be run immediately.
```

**Example Test Code:**
```
Tester Response:

```javascript
describe('POST /api/auth/register', () => {
  describe('Happy Path', () => {
    it('should register a new user and return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user.password).not.toBe('Test123!'); // Hashed
    });
  });
  
  describe('Edge Cases', () => {
    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123!'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email format');
    });
    
    it('should reject weak password (too short)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('8 characters');
    });
    
    it('should reject duplicate email registration', async () => {
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Test123!', 10)
      });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already registered');
    });
  });
});
```

Run tests with: npm test
```

### Role 4: Explainer

**Responsibilities:**
- Summarize changes by file
- Explain logic in plain language
- List what could break and how tests cover it
- Document decisions and tradeoffs
- Provide context for future developers

**When to use:**
- After completing a feature or bug fix
- Before code review
- When documenting changes
- When merging PRs

**Explainer Prompt Template:**
```
Act as an Explainer. Summarize what changed:

Code Changes:
<paste the code changes>

Context:
- Task being completed: <description>
- Files modified: <list of files>
- Tests added: <test files/changes>

Summary Requirements:
1. Summarize changes by file (what changed, why)
2. Explain the logic in plain language
3. List what could break and how the tests cover it
4. Document any decisions or tradeoffs made
5. Note any assumptions or dependencies
6. Highlight any breaking changes

Provide a clear, developer-friendly summary.
```

**Example Output:**
```
Explainer Response:

## Summary of Changes

### File: routes/auth.js
**What changed:**
- Added `validateRegistration` middleware function
- Added POST /api/auth/register endpoint
- Integrated with existing User model and JWT token generation

**Why:**
- To allow users to register new accounts
- To match existing login endpoint pattern
- To follow project conventions for error handling

### File: tests/auth.test.js
**What changed:**
- Added comprehensive test suite for registration endpoint
- Tests cover happy path and 3 edge cases

**Why:**
- To verify registration works correctly
- To catch regressions in future
- To document expected behavior

## Logic Explanation

The registration flow:
1. **Validation**: Email format and password strength are checked first to fail fast
2. **Duplicate check**: Database queried before hashing to avoid unnecessary work
3. **Password hashing**: Bcrypt with 10 salt rounds matches existing login implementation
4. **User creation**: New user document saved with email and hashed password
5. **Token generation**: JWT signed with user ID, matches existing login token format

## Risk Assessment

**What could break:**
- Password hashing if bcrypt version changes
- Token generation if JWT_SECRET changes
- User model schema changes could break

**How tests cover it:**
- Happy path test verifies complete flow works
- Edge cases verify validation prevents bad data
- Hash verification confirms passwords aren't stored in plain text
- Integration test covers all components together

## Decisions Made

**Tradeoffs:**
- Chose 10 salt rounds for bcrypt (balance between security and performance)
- Immediate duplicate check (prevents race conditions vs. database unique constraint)

**Assumptions:**
- Email uniqueness enforced by application, not database
- JWT_SECRET is available in environment
- Error format matches AGENTS.md requirements

**No breaking changes** - this is additive functionality.
```

## Model Selection Strategy

### Use Reasoning Models (Claude, ChatGPT) for:
- **Planner role**: Requires thoughtful analysis and tradeoff consideration
- **Tester role**: Test quality and edge case identification benefit from reasoning
- **Explainer role**: Clear explanations require understanding context
- **Complex debugging**: When code behavior is unexpected

### Use Faster Models (GPT-3.5, Claude Haiku) for:
- **Implementer role**: When plan is well-defined, speed matters more than deep reasoning
- **Simple refactoring**: When just reformatting or restructuring code
- **Documentation generation**: When generating straightforward comments or docs
- **One-off changes**: Small, isolated changes with clear requirements

## When to Split Roles vs. Single Prompt

### Split into roles when:
- ✅ Complex tasks with 3+ steps
- ✅ Quality-critical code (security, algorithms, payments)
- ✅ Multi-step refactoring affecting multiple files
- ✅ Building new features from scratch
- ✅ User-facing functionality
- ✅ Code that will be reviewed by others

### Use single prompt when:
- ✅ Simple bug fixes (single file, obvious fix)
- ✅ Obvious changes (clear requirement, minimal code)
- ✅ Small tasks (< 5 minutes of work)
- ✅ Adding comments or documentation
- ✅ One-off formatting changes
- ✅ Copying existing patterns to new similar code

## Role Execution Workflow

### Standard Pattern:
```
1. Planner → Creates plan, user approves
2. Implementer → Implements Step 1
3. Tester → Writes tests for Step 1
4. User → Reviews and approves Step 1
5. Implementer → Implements Step 2
6. Tester → Writes tests for Step 2
7. User → Reviews and approves Step 2
... (repeat for all steps)
8. Explainer → Summarizes entire change
9. User → Final review and merge
```

### Parallel Pattern (for independent steps):
```
1. Planner → Creates plan with independent steps
2. Implementer → Implements Step 1, Tester tests it
3. Implementer → Implements Step 2, Tester tests it
   (Step 1 and 2 can be in parallel if independent)
4. Explainer → Summarizes all changes
```

### Streamlined Pattern (for simple tasks):
```
1. Planner/Implementer combined → Plan and implement in one pass
2. Tester → Write tests
3. Explainer → Summarize
```

## Best Practices

### For All Roles:
1. **Stay focused** - Each role has one job, do it well
2. **Follow conventions** - AGENTS.md rules apply to all roles
3. **Be explicit** - State assumptions and decisions clearly
4. **Ask questions** - When unclear, don't guess
5. **Keep context** - Remember what was established in previous roles

### For Planning:
1. **Break it down** - If a step is > 30 minutes, split it
2. **Think edges** - What could go wrong?
3. **Check dependencies** - Does step B depend on step A?
4. **Be realistic** - Don't cram too much into one step

### For Implementation:
1. **Follow the plan** - Don't deviate without permission
2. **Keep it small** - 5-30 minutes per step max
3. **Test as you go** - Don't wait until the end
4. **Use existing patterns** - Don't reinvent unless plan says to

### For Testing:
1. **Test early, test often** - After each implementation step
2. **Think like a user** - What would break the experience?
3. **Cover edges** - Nulls, empties, boundaries, errors
4. **Make tests readable** - They're documentation too

### For Explaining:
1. **Be clear, not verbose** - Explain what matters
2. **Focus on impact** - What changes, what stays same?
3. **List risks** - What could go wrong?
4. **Document decisions** - Why did we choose this approach?

## Common Pitfalls

### ❌ Planner: Too granular or too broad
```
Too granular: "Open file, type function name, add opening brace, add closing brace..."
→ Overwhelms, wastes time

Too broad: "Implement authentication"
→ Too vague, no guidance

✅ Just right: "Add registration endpoint with validation and JWT token generation"
```

### ❌ Implementer: Adding extras
```
Plan: "Add registration endpoint"
Implementer adds: "Registration, login, password reset, email verification..."
→ Not in plan, introduces untested code

✅ Follow plan exactly, ask for approval for new features
```

### ❌ Tester: Only testing happy path
```
Tests: "Registration works with valid email and password"
→ Misses edge cases, production bugs inevitable

✅ Test happy path + 2+ edge cases for every feature
```

### ❌ Explainer: Too technical or too vague
```
Too technical: "Modified auth.js to POST /register returning JWT with HS256 alg..."
→ Non-experts confused

Too vague: "Made changes to auth"
→ No useful information

✅ "Added user registration endpoint that validates input and returns JWT token"
```

## Verification Checklist

After completing all roles:
```
[ ] Planner created clear, sequential plan
[ ] Plan was explicitly approved before implementation
[ ] Implementer changed only approved files
[ ] Each implementation step was small (< 30 min)
[ ] Tester wrote tests immediately after each step
[ ] Tests cover happy path and 2+ edge cases
[ ] All tests pass
[ ] Explainer provided clear summary of changes
[ ] Risks and decisions documented
[ ] Code follows AGENTS.md conventions
[ ] Ready for human review
```

See `resources/step-4-review.md` for how to conduct thorough code review.