# Step 5: Test - Detailed Guide

## What is Test-Driven Workflow?

Tests are not a separate phase - they're written immediately after code changes to verify correctness and serve as living documentation.

## Test Types by Scenario

### For New Functions

**When:** Implementing a new function or method

**Approach:**
```javascript
// 1. Write the function
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 2. Write tests immediately
describe('calculateTotal', () => {
  // Happy path
  it('calculates total correctly for multiple items', () => {
    const items = [
      { price: 10 },
      { price: 20 },
      { price: 30 }
    ];
    expect(calculateTotal(items)).toBe(60);
  });

  // Edge case: empty array
  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  // Edge case: single item
  it('returns single item price', () => {
    expect(calculateTotal([{ price: 15 }])).toBe(15);
  });

  // Edge case: decimal values
  it('handles decimal prices correctly', () => {
    const items = [{ price: 10.5 }, { price: 9.5 }];
    expect(calculateTotal(items)).toBe(20);
  });
});
```

### For Bug Fixes

**When:** Fixing a specific bug

**Approach:**
```javascript
// 1. Write regression test that FAILS before the fix
describe('Bug Fix: User login with expired token', () => {
  it('returns 401 for expired token', async () => {
    const expiredToken = 'expired.jwt.token';
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    // This test FAILS before fix, PASSES after fix
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('token expired');
  });
});

// 2. Fix the bug
app.get('/api/profile', authMiddleware, async (req, res) => {
  // ... fix: properly validate token expiration
});

// 3. Verify test passes
```

### For Multi-Component Changes

**When:** Feature spans multiple files/components

**Approach:**
```javascript
// Integration test covering the flow
describe('User Registration Flow', () => {
  it('registers user, creates profile, sends welcome email', async () => {
    // Step 1: Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@test.com', password: 'SecurePass123' });
    
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.token).toBeDefined();
    
    // Step 2: Verify profile created
    const profile = await User.findOne({ email: 'user@test.com' });
    expect(profile).toBeDefined();
    expect(profile.email).toBe('user@test.com');
    
    // Step 3: Verify email sent
    expect(emailMock.sendEmail).toHaveBeenCalledWith(
      'user@test.com',
      'Welcome to Our App'
    );
  });
});
```

## Testing Best Practices

### 1. Tests as Documentation

**❌ Bad: Confusing test**
```javascript
it('works', () => {
  expect(func(1, 2, 3)).toBe(6);
});
```

**✅ Good: Self-documenting test**
```javascript
it('calculates sum of three numbers', () => {
  expect(calculateSum([1, 2, 3])).toBe(6);
});
```

### 2. Test Structure: Arrange, Act, Assert

```javascript
it('validates email format', () => {
  // Arrange
  const invalidEmail = 'not-an-email';
  
  // Act
  const result = validateEmail(invalidEmail);
  
  // Assert
  expect(result).toBe(false);
});
```

### 3. Test Independence

```javascript
// ❌ Bad: Tests depend on order
describe('User Management', () => {
  let userId;
  
  it('creates user', () => {
    const user = createUser('user1@test.com');
    userId = user.id; // Saved for next test
  });
  
  it('deletes user', () => {
    deleteUser(userId); // Depends on previous test
  });
});

// ✅ Good: Each test is independent
describe('User Management', () => {
  it('creates user', () => {
    const user = createUser('user1@test.com');
    expect(user.id).toBeDefined();
  });
  
  it('deletes user', () => {
    const user = createUser('user2@test.com');
    const result = deleteUser(user.id);
    expect(result).toBe(true);
  });
});
```

### 4. Descriptive Test Names

```javascript
// ✅ Describe WHAT, WHEN, THEN
it('returns 400 when email is missing', () => {
  // Test code
});

it('returns 401 when token is expired', () => {
  // Test code
});

it('calculates total including tax when tax rate is provided', () => {
  // Test code
});
```

### 5. Test Edge Cases

**Always test:**
- Empty inputs
- Null/undefined values
- Boundary conditions (0, -1, max values)
- Invalid inputs
- Concurrent access (if relevant)

```javascript
describe('ArrayUtils', () => {
  describe('sum', () => {
    it('returns 0 for empty array', () => {
      expect(sum([])).toBe(0);
    });
    
    it('throws for null', () => {
      expect(() => sum(null)).toThrow();
    });
    
    it('handles negative numbers', () => {
      expect(sum([-5, 10, -3])).toBe(2);
    });
    
    it('handles large arrays efficiently', () => {
      const largeArray = new Array(10000).fill(1);
      expect(sum(largeArray)).toBe(10000);
    });
  });
});
```

## Test Coverage Guidelines

### Happy Path (Primary Functionality)
- At least 1 test per public function/method
- Test the most common use case
- Test with valid, realistic inputs

### Edge Cases (2-3 tests per function)
- Empty/null inputs
- Boundary values
- Invalid inputs
- Error conditions

### Integration (For multi-component features)
- Test complete user flows
- Test interaction between components
- Test error propagation through system

## Common Testing Pitfalls

### ❌ Testing Implementation Details

```javascript
// Bad: Tests internal variable
it('sets counter to 5', () => {
  obj.increment();
  obj.increment();
  obj.increment();
  obj.increment();
  obj.increment();
  expect(obj.counter).toBe(5); // Tests internal state
});

// Good: Tests behavior
it('returns 5 after 5 increments', () => {
  expect(obj.increment().increment().increment().increment().increment().getValue()).toBe(5);
});
```

### ❌ Testing Trivial Code

```javascript
// Bad: Testing simple getters
it('returns the name', () => {
  expect(user.name).toBe('John');
});

// Good: Don't test simple getters - waste of time
// Focus on business logic and edge cases
```

### ❌ Vague Assertions

```javascript
// Bad: Doesn't tell you what's wrong
it('works correctly', () => {
  expect(result).toBeTruthy();
});

// Good: Specific assertions
it('returns user object with id and email', () => {
  expect(result).toMatchObject({
    id: expect.any(Number),
    email: 'user@test.com'
  });
});
```

## When Tests Don't Make Sense

**If AI can't write a sensible test, consider:**

1. **Code is unclear** - Refactor the code first
2. **Function does too much** - Break it into smaller functions
3. **Test is too complex** - Simplify the code or test approach
4. **Missing requirements** - Clarify expected behavior

**Example:**
```javascript
// Bad: Unclear function, unclear test
function processData(data) {
  // Complex logic with unclear purpose
  // ...
}

// Good: Refactor, then test
function filterValidData(data) {
  return data.filter(item => item.isValid);
}

function calculateStatistics(validData) {
  // Calculate stats
}

// Now testing is straightforward
it('filters out invalid items', () => {
  // Test
});

it('calculates correct statistics', () => {
  // Test
});
```

## Testing Checklist

Before marking code as "done":

```
[ ] Happy path test written
[ ] At least 2 edge case tests written
[ ] If bug fix: regression test written
[ ] If multi-component: integration test written
[ ] Tests have descriptive names
[ ] Tests are independent (can run in any order)
[ ] Assertions are specific and meaningful
[ ] Tests document expected behavior
[ ] No test implementation details (test behavior, not internals)
[ ] All tests pass
[ ] Test coverage is adequate (>80% for critical code)
```

## Reviewing Existing Tests

**Prompt for reviewing tests:**
```
Review these tests:
[paste test code]

Check for:
1. Obvious edge cases missing
2. Weak or vague assertions
3. Testing implementation details instead of behavior
4. Test dependencies or ordering issues
5. Missing error conditions

Suggest improvements.
```

## Testing Prompts by Scenario

### New Function
```
Write unit tests for this function:
[paste function code]

- Write a test for the happy path
- Write at least 2 edge case tests
- Ensure tests have descriptive names
- Test behavior, not implementation details
```

### Bug Fix
```
Write a regression test for this bug:
[describe bug]

The test should:
- FAIL before the fix is applied
- PASS after the fix is applied
- Have a descriptive name describing the bug
- Include edge cases related to the bug
```

### Integration Test
```
Write an integration test for this feature:
[describe feature]

The test should:
- Cover a realistic user flow
- Test interaction between components
- Include relevant edge cases
- Verify end-to-end behavior
```

## Time Investment

| Task Type | Test Writing Time | Value |
|-----------|------------------|-------|
| Simple function | 5-10 min | Prevents regressions |
| Medium feature | 15-30 min | Documents behavior |
| Complex feature | 30-60 min | Catches edge cases |
| Bug fix | 10-20 min | Ensures fix works |

**Rule of thumb:** Test writing time should be 20-30% of implementation time for production code.

## See Also

- `resources/step-4-review.md` - Reviewing code with tests
- `resources/step-6-iterate.md` - Debugging with tests
- `resources/examples.md` - Complete workflow examples with tests