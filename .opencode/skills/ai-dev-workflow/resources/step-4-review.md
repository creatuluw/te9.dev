# Step 4: Review - Detailed Guide

## Why Review Matters

AI-generated code needs extra review because:
- AI may make logic errors or incorrect assumptions
- AI might miss edge cases
- AI can introduce security vulnerabilities
- AI may not follow project conventions perfectly

## Review Process

### 1. Manual Review
**Carefully read generated code:**
- Follow execution flow
- Check variable names and logic
- Verify error handling
- Ensure all requirements met

### 2. AI-Assisted Review
**Use automated review tools:**
- CodeRabbit for PR reviews
- GitHub Copilot for inline suggestions
- Claude Code for reasoning checks
- LLM-based code review tools

### 3. Linting
**Run static analysis:**
- ESLint (JavaScript/TypeScript)
- Pylint, Black, mypy (Python)
- RuboCop (Ruby)
- Prettier for formatting

### 4. Security Check
**Verify no security issues:**
- SQL injection vulnerabilities
- XSS vulnerabilities
- Exposed secrets or API keys
- Improper input validation
- Insecure authentication/authorization

## What to Check For

### Critical Issues (Must Fix)
- ❌ Logic errors
- ❌ Missing error handling
- ❌ Security vulnerabilities
- ❌ Incorrect algorithm implementation
- ❌ Race conditions
- ❌ Memory leaks
- ❌ Hardcoded secrets

### Code Quality Issues (Worth Fixing)
- ⚠️ Poor variable naming
- ⚠️ Inconsistent formatting
- ⚠️ Overly complex logic
- ⚠️ Missing comments where needed
- ⚠️ Dead code
- ⚠️ Inefficient but working code

### Convention Compliance (Should Match)
- ⚠️ Naming conventions
- ⚠️ File structure
- ⚠️ Import patterns
- ⚠️ Error format
- ⚠️ Logging patterns

## Review Checklist

### Logic and Functionality
```
[ ] Code implements the planned changes
[ ] All requirements met
[ ] Edge cases handled
[ ] Error conditions covered
[ ] No obvious bugs
```

### Code Quality
```
[ ] Variables have meaningful names
[ ] Functions are small and focused
[ ] Logic is clear and readable
[ ] No unnecessary complexity
[ ] Comments where logic is unclear
```

### Security
```
[ ] No SQL injection vulnerabilities
[ ] No XSS vulnerabilities
[ ] Input validation present
[ ] Secrets not hardcoded
[ ] Authentication/authorization correct
```

### Testing
```
[ ] Tests written for changes
[ ] Tests cover happy path
[ ] Tests cover edge cases
[ ] Tests are meaningful (not just assertTrue(true))
```

### Conventions
```
[ ] Naming follows project style
[ ] Formatting consistent with codebase
[ ] Error format matches existing
[ ] Import patterns followed
[ ] File structure matches conventions
```

## Comment Classification

### Must-Fix Comments
**Issues that will cause bugs or security problems:**
```
// ❌ Critical: No error handling if user not found
const user = await User.findById(id);
return user; // Will crash if user doesn't exist
```

**Fix:**
```javascript
const user = await User.findById(id);
if (!user) {
  throw new Error('User not found');
}
return user;
```

### Worth Considering Comments
**Style suggestions or alternative approaches:**
```
// ⚠️ Consider: Could use destructuring for clarity
const firstName = user.name.first;
const lastName = user.name.last;
```

**Alternative:**
```javascript
const { first: firstName, last: lastName } = user.name;
```

### Good Practices to Validate
```
// ✓ Good: Proper error handling with consistent format
if (!user) {
  return { success: false, error: 'User not found' };
}
```

## Review Question Framework

Before accepting code, ask:

### 1. Bug Prevention
- **Would this likely cause a bug?**
  - Test with edge cases
  - Verify error handling
  - Check for null/undefined cases

### 2. Maintainability
- **Would this confuse someone reading the code later?**
  - Is logic clear?
  - Are variable names meaningful?
  - Are there comments where needed?

### 3. Security
- **Could this be exploited?**
  - Check for injection vulnerabilities
  - Verify input validation
  - Ensure secrets not exposed

### 4. Performance
- **Will this scale?**
  - Check for N+1 queries
  - Verify proper indexing
  - Consider caching needs

## Common Review Pitfalls

### ❌ Shallow Review
```
"I looked at the code and it seems fine"
→ Misses subtle bugs, security issues, edge cases
```

### ✅ Thorough Review
```
"I traced execution, checked error paths, verified security,
tested edge cases, and confirmed all requirements"
→ Catches issues before production
```

### ❌ Trusting AI Blindly
```
"The AI wrote it, so it must be correct"
→ AI makes mistakes, needs verification
```

### ✅ Critical Review
```
"The AI suggested this, but I verified it handles all edge cases
and follows our conventions"
→ AI provides, human verifies
```

## Review Workflow

### Before Code Review
1. Understand the requirement
2. Read the approved plan
3. Know expected behavior
4. Identify affected areas

### During Code Review
1. Read code line by line
2. Trace execution paths
3. Check error handling
4. Verify security
5. Test edge cases mentally

### After Code Review
1. Document findings
2. Request fixes for critical issues
3. Suggest improvements for code quality
4. Verify all tests pass

## When to Request Changes

### Always Request Changes For
- Security vulnerabilities
- Logic errors
- Missing error handling
- Incorrect implementation

### Usually Request Changes For
- Code quality issues
- Naming violations
- Formatting inconsistencies
- Missing tests

### Sometimes Request Changes For
- Alternative implementations
- Performance optimizations
- Code style preferences

## Best Practices

1. **Review with context** - Understand requirements before reviewing
2. **Be constructive** - Explain why change is needed, provide examples
3. **Focus on critical issues** - Don't bikeshed on minor style
4. **Verify tests** - Ensure tests actually test what they claim
5. **Check security** - AI often misses security concerns
6. **Follow conventions** - Consistency is key to maintainability
7. **Think about edge cases** - What happens if X, Y, or Z?
8. **Consider maintainability** - Will this be easy to understand later?

## Integration with Workflow

After implementing code (Step 3):
1. Run automated tests
2. Perform manual review using this checklist
3. Request changes if needed
4. Once review passes, proceed to Step 5 (Test)

See `resources/step-5-test.md` for testing after review.