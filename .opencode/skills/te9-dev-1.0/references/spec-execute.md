---
name: spec-execute
description: Detailed guidance for executing specification implementation using test-driven development
---

# Spec Execute - Implementation Guide

## Overview

This reference provides detailed guidance for implementing specifications using the test-driven development methodology. It builds upon the core TDD principles and applies them within the spec-driven workflow context.

## Implementation Planning

### Load and Analyze Spec

1. **Read the specification file** from `te9.dev/specs/<id>/spec.md`
2. **Extract key elements**:
   - User request and context
   - Clarified requirements
   - Acceptance criteria
   - Technical constraints
   - Dependencies on other systems

3. **Create implementation plan**:
   - Identify all files/modules to modify
   - Determine test strategy for each component
   - Order implementation by dependencies
   - Estimate complexity and potential blockers

### Example Spec Analysis

```markdown
Spec: SPEC-20240115-1430-add-user-auth

Requirements:
- Users can register with email/password
- Passwords must be hashed before storage
- Login validates credentials
- Sessions expire after 24 hours

Acceptance Criteria:
1. POST /api/register creates user with hashed password
2. POST /api/login returns valid session token
3. Invalid credentials return 401 error
4. Session tokens expire after 24 hours

Implementation Plan:
1. Create User model with password hashing
2. Implement /api/register endpoint
3. Implement /api/login endpoint
4. Add session middleware
5. Write end-to-end tests
```

## Test-Driven Development Cycle

### RED Phase - Write Failing Test

**Principles:**
- Write ONE minimal test at a time
- Test should fail for the RIGHT reason (feature missing)
- Test name must describe behavior, not implementation
- Use real code, avoid mocks when possible

**Test Structure:**
```typescript
// Good test - clear name, tests behavior
test('registers new user with hashed password', async () => {
  const userData = {
    email: 'user@example.com',
    password: 'securePassword123'
  };

  const response = await request(app)
    .post('/api/register')
    .send(userData);

  expect(response.status).toBe(201);
  expect(response.body.email).toBe(userData.email);
  expect(response.body.password).toBeUndefined(); // Never return password
  
  // Verify password is hashed in database
  const user = await User.findOne({ email: userData.email });
  expect(user.password).not.toBe(userData.password);
  expect(bcrypt.compare(userData.password, user.password)).toBe(true);
});

// Bad test - vague name, tests implementation
test('registration works', async () => {
  // ...
});
```

**Verify Test Fails Correctly:**
```bash
# Run the test
npm test path/to/test.spec.ts

# Expected output:
# FAIL src/api/register.spec.ts
#   ✕ registers new user with hashed password (5ms)
#   ReferenceError: User is not defined
```

**What to Check:**
- [ ] Test fails (not errors)
- [ ] Error message is expected
- [ ] Fails because feature is missing (not typos)
- [ ] Test name is clear and descriptive

**If Test Passes Immediately:**
- DELETE THE TEST - it's testing existing behavior
- You're not testing what you think you are
- Write a new test that actually tests the new feature

### GREEN Phase - Write Minimal Code

**Principles:**
- Write SIMPLEST code to pass the test
- Don't add features "just in case"
- Don't refactor yet - that comes next
- Don't worry about "ugly" code

**Example:**
```typescript
// Minimal code to pass the test - no extra features
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await User.create({
    email,
    password: hashedPassword
  });
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user.toObject();
  res.status(201).json(userWithoutPassword);
});
```

**Common Anti-Patterns to Avoid:**

❌ **Over-engineering:**
```typescript
// Don't add features you don't need
app.post('/api/register', async (req, res) => {
  const { email, password, confirmPassword, username, phone, ... } = req.body;
  
  // YAGNI - You Ain't Gonna Need It
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  
  // Extra validation not in requirements
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  // ... more code than needed
});
```

✅ **Minimal implementation:**
```typescript
// Only what the test requires
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });
  const { password: _, ...userWithoutPassword } = user.toObject();
  res.status(201).json(userWithoutPassword);
});
```

**Verify Code Passes:**
```bash
npm test path/to/test.spec.ts

# Expected output:
# PASS src/api/register.spec.ts
#   ✓ registers new user with hashed password (15ms)
```

**What to Check:**
- [ ] Test passes
- [ ] Other tests still pass (no regressions)
- [ ] Output is pristine (no errors, no warnings)
- [ ] Code is minimal (no extra features)

### REFACTOR Phase - Clean Up

**Principles:**
- Only refactor when tests are GREEN
- Don't add new behavior
- Focus on code quality and maintainability
- Keep tests green throughout

**When to Refactor:**
- Duplicate code appears
- Complex logic can be extracted
- Names are unclear
- Code is hard to understand

**Example:**
```typescript
// After GREEN - we have duplicate code in login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // This logic duplicates what's in register
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // ... rest of code
});

// Refactor - extract to helper
async function authenticateUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // ... rest of code
});
```

**What to Refactor:**
- [ ] Remove duplication
- [ ] Improve names
- [ ] Extract functions/methods
- [ ] Simplify complex logic
- [ ] Improve readability

**What NOT to Refactor:**
- [ ] Don't add new features
- [ ] Don't change behavior
- [ ] Don't "optimize prematurely"
- [ ] Don't refactor without tests

## Logging Changes

### What to Log

Every change must be logged to `te9.dev/logs/<id>.log`:

```
=== SPEC-20240115-1430-add-user-auth Execution Log ===

[2024-01-15 14:30:00] Step 3: Spec Execute started
[2024-01-15 14:30:15] Spec loaded: SPEC-20240115-1430-add-user-auth
[2024-01-15 14:31:00] Implementation plan created
[2024-01-15 14:32:00] Test: registers new user with hashed password - FAILED (as expected)
[2024-01-15 14:32:30] Implementation: POST /api/register endpoint created
[2024-01-15 14:33:00] Test: registers new user with hashed password - PASSED
[2024-01-15 14:34:00] Acceptance Criteria 1: POST /api/register creates user with hashed password - PASSED
[2024-01-15 14:35:00] Test: validates credentials and returns session token - FAILED (as expected)
[2024-01-15 14:36:00] Implementation: POST /api/login endpoint created
[2024-01-15 14:36:30] Test: validates credentials and returns session token - PASSED
[2024-01-15 14:37:00] Acceptance Criteria 2: POST /api/login returns valid session token - PASSED
[2024-01-15 14:38:00] Test: rejects invalid credentials - FAILED (as expected)
[2024-01-15 14:38:30] Implementation: Error handling for invalid credentials added
[2024-01-15 14:39:00] Test: rejects invalid credentials - PASSED
[2024-01-15 14:40:00] Acceptance Criteria 3: Invalid credentials return 401 error - PASSED
[2024-01-15 14:41:00] Test: session tokens expire after 24 hours - FAILED (as expected)
[2024-01-15 14:42:00] Implementation: Session expiration logic added
[2024-01-15 14:43:00] Test: session tokens expire after 24 hours - PASSED
[2024-01-15 14:44:00] Acceptance Criteria 4: Session tokens expire after 24 hours - PASSED
[2024-01-15 14:45:00] Comprehensive test suite run - PASSED (25 tests, 0 failures)
[2024-01-15 14:46:00] Step 3: Spec Execute completed
[2024-01-15 14:46:00] Spec status updated to: READY_FOR_BRANCH_COMMIT
```

### Log Format

Each log entry should include:
- **Timestamp**: When the action occurred
- **Action**: What was done (test, implementation, verification)
- **Result**: PASSED/FAILED
- **Evidence**: Output or proof of result

## Verifying Acceptance Criteria

### Process for Each Criterion

1. **Map to tests**: Identify which tests verify this criterion
2. **Run tests**: Execute all related tests
3. **Verify evidence**: Check that tests pass for the right reason
4. **Document status**: Update spec with PASSED/FAILED
5. **Provide proof**: Include test output in log

### Example Verification

```markdown
## Acceptance Criteria 3: Invalid credentials return 401 error

**Test Coverage:**
- `test('login with invalid email returns 401', ...)`
- `test('login with invalid password returns 401', ...)`
- `test('login with missing credentials returns 401', ...)`

**Test Results:**
```
PASS src/api/login.spec.ts
  ✓ login with invalid email returns 401 (5ms)
  ✓ login with invalid password returns 401 (4ms)
  ✓ login with missing credentials returns 401 (3ms)
```

**Status:** ✅ PASSED

**Evidence:**
```typescript
// Test output shows 401 status code
expect(response.status).toBe(401);
expect(response.body.error).toBe('Invalid credentials');
```
```

### Updating Spec Status

After all acceptance criteria are verified:

```markdown
## Status

**Current:** READY_FOR_BRANCH_COMMIT

**Acceptance Criteria:**
- [✅] POST /api/register creates user with hashed password
- [✅] POST /api/login returns valid session token
- [✅] Invalid credentials return 401 error
- [✅] Session tokens expire after 24 hours

**All criteria verified and passed.**
```

## Running Comprehensive Tests

### Test Types

1. **Unit Tests**: Test individual functions/classes
   ```bash
   npm test -- --testPathPattern=unit
   ```

2. **Integration Tests**: Test multiple components together
   ```bash
   npm test -- --testPathPattern=integration
   ```

3. **End-to-End Tests**: Test full user flows
   ```bash
   npm test -- --testPathPattern=e2e
   ```

4. **All Tests**: Run complete test suite
   ```bash
   npm test
   ```

### Test Coverage

Ensure comprehensive coverage:
```bash
npm test -- --coverage

# Expected output:
# ----------------|---------|----------|---------|---------|-------------------
# File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
# ----------------|---------|----------|---------|---------|-------------------
# All files      |   95.42 |    93.75 |   96.15 |   95.28 |                   
#  api           |   98.21 |    97.22 |   100   |   98.21 |                   
#  models        |   92.86 |    90.91 |    92.3 |   92.86 | 45,67            
#  middleware    |   95.12 |    93.18 |    95   |   95.12 | 123              
# ----------------|---------|----------|---------|---------|-------------------
```

**Target Coverage:**
- Overall: 90%+ statements, 85%+ branches
- Critical paths: 95%+ statements
- Non-critical code: 80%+ acceptable

## Common Patterns and Examples

### Database Operations

```typescript
// Test
test('creates user in database', async () => {
  const userData = {
    email: 'user@example.com',
    password: 'password123'
  };

  const user = await User.create(userData);

  expect(user.email).toBe(userData.email);
  expect(user.password).not.toBe(userData.password); // Should be hashed
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeDefined();
});

// Verify RED: Test fails with "User is not defined"

// GREEN: Minimal implementation
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

// REFACTOR: Add validation helper
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### API Endpoints

```typescript
// Test
test('POST /api/register returns 201 with user data', async () => {
  const userData = {
    email: 'user@example.com',
    password: 'password123'
  };

  const response = await request(app)
    .post('/api/register')
    .send(userData);

  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({
    email: userData.email,
    id: expect.any(String),
    createdAt: expect.any(String)
  });
  expect(response.body.password).toBeUndefined();
});

// GREEN: Minimal implementation
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.create({ email, password });
  const { password: _, ...userWithoutPassword } = user.toObject();
  res.status(201).json(userWithoutPassword);
});
```

### Error Handling

```typescript
// Test
test('POST /api/register with duplicate email returns 409', async () => {
  const userData = {
    email: 'user@example.com',
    password: 'password123'
  };

  // First registration succeeds
  await request(app).post('/api/register').send(userData);

  // Second registration with same email fails
  const response = await request(app)
    .post('/api/register')
    .send(userData);

  expect(response.status).toBe(409);
  expect(response.body.error).toBe('Email already registered');
});

// GREEN: Minimal implementation
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.create({ email, password });
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw error;
  }
});

// REFACTOR: Extract error handler
function handleDatabaseError(error) {
  if (error.code === 11000) {
    return { status: 409, error: 'Email already registered' };
  }
  throw error;
}

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.create({ email, password });
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    const { status, error: errorMessage } = handleDatabaseError(error);
    res.status(status).json({ error: errorMessage });
  }
});
```

## Debugging Test Failures

### Test Fails for Wrong Reason

**Problem:** Test fails with unexpected error

```bash
# Unexpected error
FAIL src/api/register.spec.ts
  TypeError: Cannot read properties of undefined (reading 'send')
```

**Solution:**
1. Check test setup (is app initialized?)
2. Verify imports (are modules loaded?)
3. Check async/await (are you awaiting properly?)
4. Fix the error, not the test

**Example Fix:**
```typescript
// Bad - missing await
test('registers user', async () => {
  const response = request(app)  // ❌ Missing await
    .post('/api/register')
    .send(userData);
});

// Good - awaiting the request
test('registers user', async () => {
  const response = await request(app)  // ✅ Added await
    .post('/api/register')
    .send(userData);
});
```

### Test Errors Instead of Fails

**Problem:** Syntax error or runtime error

```bash
# Syntax error
ReferenceError: bcrypt is not defined
```

**Solution:**
1. Add missing imports
2. Fix typos in variable names
3. Check module exports
4. Verify all dependencies are installed

**Example Fix:**
```typescript
// Bad - missing import
const hashedPassword = await bcrypt.hash(password, 10);  // ❌

// Good - import added
import bcrypt from 'bcrypt';  // ✅
const hashedPassword = await bcrypt.hash(password, 10);
```

### Regression Tests Fail

**Problem:** New test passes, but old tests fail

```bash
PASS src/api/register.spec.ts
FAIL src/api/login.spec.ts  // This used to pass!
```

**Solution:**
1. Identify what changed
2. Check if change is intentional
3. Fix broken tests OR revert change
4. Never ignore failing tests

**Example:**
```typescript
// Change broke login test
// Before: password was stored as-is
// After: password is hashed

// Update login test to match new behavior
test('login validates hashed password', async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  await User.create({ email: 'user@example.com', password: hashedPassword });
  
  const response = await request(app)
    .post('/api/login')
    .send({ email: 'user@example.com', password: 'password123' });
  
  expect(response.status).toBe(200);
});
```

## Integration with TDD Reference

This spec-execute guide builds upon the core TDD principles defined in `@references/test-driven-development.md`. Ensure you:

1. **Read the TDD reference** before starting implementation
2. **Follow RED-GREEN-REFACTOR** cycle strictly
3. **Never skip watching tests fail**
4. **Never write code before tests**
5. **Never add features not in spec**

When you encounter testing challenges, refer to:
- `@references/test-driven-development.md` - Core TDD methodology
- `@references/testing-anti-patterns.md` - Common pitfalls to avoid

## Completion Checklist

Before proceeding to Step 4 (Spec Branch Commit):

- [ ] Spec loaded and analyzed
- [ ] Implementation plan documented
- [ ] All tests written before implementation
- [ ] Each test watched fail (RED step)
- [ ] Each test passed after implementation (GREEN step)
- [ ] All code refactored while keeping tests green (REFACTOR step)
- [ ] All acceptance criteria verified and PASSED
- [ ] Comprehensive test suite run and passing
- [ ] Test coverage meets targets (90%+ statements)
- [ ] All changes logged to execution log
- [ ] Spec status updated to READY_FOR_BRANCH_COMMIT
- [ ] No failing tests in any test suite
- [ ] No warnings or errors in output
- [ ] Code is ready for review and commit

## Next Steps

After completing Spec Execute:

1. Proceed to **Spec Branch Commit** (Step 4)
2. Reference: `@references/spec-branch-commit.md`
3. Create feature branch with spec ID
4. Commit all changes
5. Request user approval before pushing
