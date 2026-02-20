# Troubleshooting Guide

This document covers common issues when coding with AI and how to resolve them using the strict AI coding workflow.

## Table of Contents

1. [Context Drift in Long Chats](#1-context-drift-in-long-chats)
2. [AI Hallucinations](#2-ai-hallucinations)
3. [Off-Rails Debugging Loops](#3-off-rails-debugging-loops)
4. [Code Quality Drift](#4-code-quality-drift)
5. [Wrong API or Library Version](#5-wrong-api-or-library-version)
6. [Missing Error Handling](#6-missing-error-handling)
7. [Inconsistent Code Style](#7-inconsistent-code-style)
8. **Security Vulnerabilities** (#8-security-vulnerabilities)
9. [Test Quality Issues](#9-test-quality-issues)
10. [Over-Reliance on AI](#10-over-reliance-on-ai)

---

## 1. Context Drift in Long Chats

### Problem

The AI forgets earlier decisions, contradicts itself, or loses track of the overall goal after a long conversation.

### Why It Happens

- AI models have limited context windows
- Long conversations push earlier parts out of active memory
- The model loses the thread of the original task
- Without summaries, the AI can't maintain coherence

### Prevention (Using the Workflow)

**Follow these practices from Step 1 (Context) and Step 2 (Plan):**

- Keep conversations short and scoped
- One chat for design, one for part A, one for part B
- Summarize between steps: paste summary into next prompt
- Start fresh when thread feels messy

### Troubleshooting Steps

**If you notice context drift:**

1. **Stop and summarize:**
   ```
   Summarize where we are:
   - What was the original goal?
   - What have we completed so far?
   - What are we currently working on?
   - What's left to do?
   ```

2. **Start fresh with context:**
   - End current conversation
   - Start new chat
   - Paste summary from step 1
   - Continue from where you left off

3. **Use role-based separation:**
   - Design: One chat for planning only
   - Implementation: Separate chats for each step
   - Testing: Another chat for writing tests
   - Explanation: Final chat for documentation

### Example

**Before (problematic):**
```
User: Let's implement auth.
AI: [writes some code]
User: Now add registration.
AI: [writes more code]
User: Actually, I need password reset too.
AI: [adds password reset, but forgets earlier constraints]
User: What about token refresh?
AI: [loses track of auth requirements, suggests conflicting approach]
```

**After (fixed):**
```
Chat 1 - Planning:
User: Plan auth implementation.
AI: [detailed plan with all requirements]
User: approved

Chat 2 - Implementation Step 1:
User: Implement login endpoint from the approved plan.
AI: [implements login only]

Chat 3 - Implementation Step 2:
User: Implement registration endpoint from the approved plan.
AI: [implements registration only]

Chat 4 - Implementation Step 3:
User: Implement password reset from the approved plan.
AI: [implements password reset, staying consistent with earlier steps]
```

---

## 2. AI Hallucinations

### Problem

The AI confidently suggests code that:
- Calls functions that don't exist
- Uses libraries that aren't in the project
- References APIs from wrong versions
- Makes assumptions about architecture
- Ignores project constraints

### Why It Happens

- AI is guessing to fill gaps you left open
- You didn't provide enough context
- Model wasn't told to verify assumptions
- No rules/constraints were shared
- AI is trained on old code/examples

### Prevention (Using the Workflow)

**Follow these practices from Step 1 (Context):**

- Always load README, rules, and relevant files
- Tell AI what library versions you're using
- Ask AI to state its assumptions before coding
- Say: "If you're not sure, ask instead of guessing"

**From Step 2 (Plan):**

- Require approval before any code generation
- Ask: "Which version are you assuming?" for unfamiliar APIs
- Verify unfamiliar functions with official docs or search

### Troubleshooting Steps

**If AI hallucinates:**

1. **Stop and verify:**
   - Check if the suggested function/API exists in your version
   - Verify library is actually installed in the project
   - Check if the syntax matches your framework version

2. **Ask for clarification:**
   ```
   Which version of [library] are you assuming?
   Please verify that [function] exists in that version.
   Show me the documentation if possible.
   ```

3. **Provide explicit constraints:**
   ```
   We are using:
   - React 18.2.0
   - Node.js 18.x
   - Express 4.18.2
   - MongoDB 6.x with Mongoose 7.x
   
   Only use features available in these versions.
   ```

4. **Search before implementing:**
   ```
   Before writing code, verify that [API call] exists in [library] version [x].
   If you're unsure, tell me so we can check the docs together.
   ```

### Example

**Hallucinated code:**
```javascript
// AI suggests this, but it doesn't exist in our version
const response = await fetchWithTimeout(url, { timeout: 5000 });
```

**Fixed approach:**
```
User: Does fetchWithTimeout exist in Node 18?
AI: Actually, no. fetchWithTimeout is a utility function,
not a built-in. Here's how to implement it:
```

```javascript
// Correct implementation
const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
```

---

## 3. Off-Rails Debugging Loops

### Problem

The AI gets stuck suggesting variations of the same broken fix, reintroducing bugs from earlier attempts, or circling without making progress.

### Why It Happens

- The AI is doubling down on a wrong assumption
- Early decisions locked in a bad approach
- Without fresh context, it can't see alternatives
- Model is in a "local minimum" and can't escape

### Prevention (Using the Workflow)

**From Step 6 (Iterate):**

- After 2 failed attempts, STOP
- Start fresh chat with better context
- Restate problem with narrower focus
- Ask for explanation before asking for fixes

### Troubleshooting Steps

**If you're stuck in a debugging loop:**

1. **Count your attempts:**
   - If you've asked twice and answers are getting repetitive or worse, stop immediately
   - Don't keep saying "try again"

2. **Ask for explanation instead:**
   ```
   Do not fix anything yet.
   
   Explain what this function does, step by step.
   Then list the most likely failure cases.
   ```

3. **Start fresh with better context:**
   - End current conversation
   - Start new chat
   - Restate problem with more context:
     ```
     I've been trying to fix [issue].
     I've tried [approach A] and [approach B], both failed.
     The error is: [full error message]
     
   Here's what I know:
   - [fact 1]
   - [fact 2]
   - [fact 3]
   
   What's the most likely root cause?
   ```

4. **Narrow the question:**
   - Instead of: "fix this function"
   - Try: "Under what conditions could this variable be null here?"

### Example

**Stuck in loop (problematic):**
```
User: This function is returning undefined.
AI: Add return statement here. [doesn't work]
User: Still undefined.
AI: Try adding console.log. [doesn't work]
User: Still undefined.
AI: Maybe check if it's async? [doesn't work]
User: Still undefined.
AI: Let's try another approach... [getting worse]
```

**Fixed approach:**
```
[Start fresh chat]
User: I have a function that returns undefined.

Code:
```javascript
function getUser(id) {
  User.findById(id);
}
```

I've tried adding return, making it async, logging the result - none work.

Question: Under what conditions would User.findById(id) return undefined
instead of a promise or a user object?

AI: User.findById() is an async operation in Mongoose that returns a Promise.
Without await, you're not waiting for the result, so the function returns
the Promise (or undefined if there's an issue with how it's being called).

The fix is:
```javascript
async function getUser(id) {
  return await User.findById(id);
}
```
```

---

## 4. Code Quality Drift

### Problem

AI generates code that works but isn't maintainable:
- Poorly structured
- Inconsistent style
- Hard to read
- Difficult to test
- Lacks documentation

### Why It Happens

- AI optimizes for "works" not "maintainable"
- You didn't specify quality requirements
- No examples of good code in context
- AI wasn't asked to follow patterns

### Prevention (Using the Workflow)

**From Step 2 (Plan):**

- Ask for structure in the plan
- Request patterns from existing codebase
- Specify: "follow the pattern in file X"

**From Step 3 (Code - Implementer Role):**

- Prompt with: "refactor into smaller functions"
- Ask: "follow the pattern in file X"
- Specify: "make it readable and maintainable"

**From Step 4 (Review):**

- Review for code quality, not just correctness
- Ask AI: "would this be easy to maintain in 6 months?"
- Request refactoring if needed

### Troubleshooting Steps

**If code quality is poor:**

1. **Review with quality lens:**
   ```
   Review this code for maintainability:
   - Is it easy to understand?
   - Are functions too long?
   - Is the logic clear?
   - Would this be maintainable in 6 months?
   ```

2. **Request refactoring:**
   ```
   Refactor this code to be more maintainable:
   - Break into smaller functions
   - Add clear comments
   - Follow the pattern in [existing file]
   - Make it easy to test
   ```

3. **Provide examples:**
   ```
   Follow the code style in this file:
   
   [paste well-written example from your codebase]
   
   Write the new code in the same style.
   ```

4. **Enforce constraints:**
   ```
   Write code that follows these rules:
   - Functions should be < 50 lines
   - Each function should do one thing
   - Use descriptive names
   - Add JSDoc comments for complex logic
   ```

### Example

**Poor quality (before):**
```javascript
function processUserData(data) {
  let result = {};
  for (let i = 0; i < data.length; i++) {
    if (data[i].age > 18 && data[i].active) {
      if (result[data[i].department]) {
        result[data[i].department].push({
          name: data[i].name,
          email: data[i].email,
          salary: data[i].salary * 1.1
        });
      } else {
        result[data[i].department] = [{
          name: data[i].name,
          email: data[i].email,
          salary: data[i].salary * 1.1
        }];
      }
    }
  }
  return result;
}
```

**Refactored (after):**
```javascript
/**
 * Groups active adult employees by department with adjusted salary
 * @param {Array} employees - Array of employee objects
 * @returns {Object} Employees grouped by department
 */
function groupActiveEmployeesByDepartment(employees) {
  const activeAdultEmployees = filterActiveAdults(employees);
  const adjustedEmployees = applySalaryAdjustment(activeAdultEmployees);
  return groupByDepartment(adjustedEmployees);
}

/**
 * Filters employees who are active and over 18
 */
function filterActiveAdults(employees) {
  return employees.filter(emp => emp.age > 18 && emp.active);
}

/**
 * Increases salary by 10% for all employees
 */
function applySalaryAdjustment(employees) {
  return employees.map(emp => ({
    ...emp,
    salary: emp.salary * 1.1
  }));
}

/**
 * Groups employees by their department
 */
function groupByDepartment(employees) {
  return employees.reduce((acc, emp) => {
    const dept = emp.department;
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push({
      name: emp.name,
      email: emp.email,
      salary: emp.salary
    });
    return acc;
  }, {});
}
```

---

## 5. Wrong API or Library Version

### Problem

AI suggests code that uses:
- Syntax from an older library version
- Deprecated methods that were removed
- New features that don't exist in your version
- Different parameter names or signatures

### Why It Happens

- AI is trained on data up to a certain point
- It doesn't know which version you're using
- Multiple versions coexist in its training data
- It defaults to the most common or recent version

### Prevention (Using the Workflow)

**From Step 1 (Context):**

- Explicitly state library versions in context
- Include package.json or requirements.txt
- Say: "We're using version X.Y.Z of [library]"

**From Step 2 (Plan):**

- Ask: "Which version are you assuming?"
- Verify APIs against official docs

**From Step 3 (Code - Planner Role):**

- Require AI to verify unfamiliar APIs
- Ask for documentation links

### Troubleshooting Steps

**If you suspect wrong version:**

1. **Verify your version:**
   ```
   Check package.json:
   - Express: 4.18.2
   - React: 18.2.0
   - Node.js: 18.x
   
   Confirm these versions are correct.
   ```

2. **Ask AI:**
   ```
   Which version of [library] are you assuming for this code?
   Please verify the API exists in version [your version].
   ```

3. **Search and verify:**
   - Use search assistant or official docs
   - Check if the method exists in your version
   - Verify parameter names and signatures

4. **Provide explicit constraints:**
   ```
   We are using:
   - [library] version X.Y.Z
   - Only use APIs available in this version
   - If you're unsure, ask and we'll verify together
   ```

### Example

**Wrong version code:**
```javascript
// AI suggests this, but fetch wasn't available in Node 14
const response = await fetch('https://api.example.com');
```

**Correct version for Node 14:**
```javascript
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

const response = await fetchUrl('https://api.example.com');
```

---

## 6. Missing Error Handling

### Problem

AI generates code that:
- Doesn't catch errors
- Swallows errors silently
- Returns generic error messages
- Doesn't handle edge cases
- Crashes on unexpected inputs

### Why It Happens

- AI focuses on "happy path"
- Error handling wasn't specified in requirements
- You didn't ask for error scenarios
- AI assumes inputs are always valid

### Prevention (Using the Workflow)

**From Step 2 (Plan):**

- Ask: "What could go wrong?"
- "Call out important edge cases"
- Request error handling in the plan

**From Step 3 (Code - Tester Role):**

- Write tests for error paths
- Test edge cases explicitly

**From Step 4 (Review):**

- Check for: "Missing error handling"
- Verify error messages are informative

### Troubleshooting Steps

**If error handling is missing:**

1. **Ask for error scenarios:**
   ```
   What could go wrong with this code?
   List all error cases and how to handle them.
   ```

2. **Request specific error handling:**
   ```
   Add error handling for:
   - Network failures
   - Invalid inputs
   - Missing data
   - Database errors
   - Timeouts
   
   Use consistent error format: { success: false, error: message }
   ```

3. **Write tests for error paths:**
   ```
   Write tests for:
   - What happens if the API fails?
   - What happens if input is null?
   - What happens if database is down?
   ```

4. **Review generated code:**
   ```
   Review this code for error handling:
   - Are try-catch blocks where needed?
   - Are errors being caught or re-thrown?
   - Are error messages helpful?
   - Are edge cases handled?
   ```

### Example

**Without error handling (before):**
```javascript
async function getUserData(userId) {
  const user = await User.findById(userId);
  const posts = await Post.find({ userId });
  return { user, posts };
}
```

**With error handling (after):**
```javascript
async function getUserData(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const posts = await Post.find({ userId });
    
    return {
      success: true,
      data: { user, posts }
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

---

## 7. Inconsistent Code Style

### Problem

AI generates code that doesn't match:
- Your project's coding conventions
- Existing patterns in the codebase
- File naming conventions
- Import/export patterns
- Comment style

### Why It Happens

- You didn't provide rules/conventions
- No examples of existing code style
- AI defaults to common conventions
- Different models have different preferences

### Prevention (Using the Workflow)

**From Step 1 (Context):**

- Load AGENTS.md or CLAUDE.md with style rules
- Provide examples of existing code
- Show file organization patterns

**From Step 2 (Plan):**

- Ask: "What patterns should we follow?"
- Reference specific files as examples

**From Step 3 (Code - Implementer Role):**

- Prompt: "Follow the pattern in file X"
- "Match the style of this existing code"

### Troubleshooting Steps

**If code style is inconsistent:**

1. **Provide style guide:**
   ```
   Follow these coding conventions:
   - Use camelCase for variables and functions
   - Use PascalCase for classes and components
   - Use const by default, let only when needed
   - Add JSDoc comments for functions
   - Use async/await, not .then()/.catch()
   ```

2. **Show examples:**
   ```
   Follow this code style:
   
   [paste well-styled example from your codebase]
   
   Write the new code in the same style.
   ```

3. **Request pattern matching:**
   ```
   Follow the pattern in src/utils/example.js:
   - Same import organization
   - Same function naming
   - Same error handling approach
   - Same comment style
   ```

4. **Run linter:**
   - Use ESLint, Prettier, or similar tools
   - Show linter errors to AI
   - Ask AI to fix them

### Example

**Inconsistent style (before):**
```javascript
// New code uses different style
const get_user_by_id = async (id) => {
  const user = await User.FindById(id);
  if(!user){
    return null;
  }
  return user;
}
```

**Consistent style (after):**
```javascript
// Matches existing codebase
async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    return null;
  }
  return user;
}
```

---

## 8. Security Vulnerabilities

### Problem

AI generates code with security issues:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Hardcoded secrets
- Missing authentication checks
- Insecure data handling
- Broken access controls

### Why It Happens

- AI isn't security-focused by default
- Security wasn't mentioned in requirements
- AI doesn't know your security rules
- AI prioritizes functionality over security

### Prevention (Using the Workflow)

**From Step 1 (Context):**

- Include security rules in AGENTS.md
- Provide security guidelines
- List security-critical areas

**From Step 2 (Plan):**

- Ask: "What security considerations apply?"
- Request security-focused plan

**From Step 4 (Review):**

- Use security linters (ESLint security plugin, etc.)
- Review for common vulnerabilities
- Ask AI to identify security issues

### Troubleshooting Steps

**If you suspect security issues:**

1. **Ask for security review:**
   ```
   Review this code for security vulnerabilities:
   - SQL injection
   - XSS
   - Hardcoded secrets
   - Missing authentication
   - Broken access control
   ```

2. **Provide security checklist:**
   ```
   Ensure the code follows these security rules:
   - Never trust user input (validate and sanitize)
   - Use parameterized queries for database
   - Never hardcode secrets (use environment variables)
   - Check authentication/authorization on all endpoints
   - Escape user data before rendering
   - Use HTTPS for all network requests
   ```

3. **Run security tools:**
   ```
   npm audit
   eslint --plugin security
   ```
   Show results to AI and ask for fixes.

4. **Request secure implementation:**
   ```
   Rewrite this code to be secure:
   - Sanitize all user input
   - Use parameterized queries
   - Remove hardcoded secrets
   - Add proper authentication checks
   - Follow OWASP security guidelines
   ```

### Example

**Vulnerable code (before):**
```javascript
app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  const users = await db.query(query);
  res.json(users);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  const token = jwt.sign({ userId: user._id }, 'secret-key-123');
  res.json({ token });
});
```

**Secure code (after):**
```javascript
app.get('/user/:id', 
  authenticate,
  authorize('admin'),
  async (req, res) => {
    const userId = req.params.id;
    const users = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    res.json(users);
  }
);

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Compare hashed password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Use environment variable for secret
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ token });
});
```

---

## 9. Test Quality Issues

### Problem

AI generates tests that:
- Don't cover edge cases
- Have weak assertions
- Test implementation details
- Don't test error paths
- Are brittle or unreliable

### Why It Happens

- AI wasn't asked for comprehensive tests
- No examples of good test patterns
- Test requirements weren't specified
- AI focuses on happy path only

### Prevention (Using the Workflow)

**From Step 2 (Plan):**

- "Call out edge cases we should keep in mind"
- Request test strategy in the plan

**From Step 3 (Code - Tester Role):**

- Prompt: "Write a unit test for the happy path"
- "Write at least two edge case tests"
- "Write a regression test for this bug fix"

**From Step 5 (Test):**

- Review test coverage
- Check for edge cases
- Verify error paths are tested

### Troubleshooting Steps

**If tests are inadequate:**

1. **Request comprehensive tests:**
   ```
   Write comprehensive tests for this code:
   - Happy path (normal operation)
   - At least 3 edge cases
   - Error paths
   - Boundary conditions
   ```

2. **Specify test requirements:**
   ```
   Tests should verify:
   - Expected behavior for valid inputs
   - Behavior with null/undefined inputs
   - Behavior with empty arrays/strings
   - Behavior with invalid data types
   - Error handling
   ```

3. **Ask for stronger assertions:**
   ```
   The assertions are too weak. Instead of:
   expect(result).toBeDefined()
   
   Write:
   expect(result).toEqual({ expected: value })
   ```

4. **Review test coverage:**
   ```
   Review these tests:
   - What's missing?
   - Which edge cases aren't covered?
   - Are the assertions strong enough?
   ```

### Example

**Weak tests (before):**
```javascript
describe('calculateTotal', () => {
  it('should return a number', () => {
    const result = calculateTotal([10, 20, 30]);
    expect(result).toBeDefined();
  });
});
```

**Comprehensive tests (after):**
```javascript
describe('calculateTotal', () => {
  describe('Happy Path', () => {
    it('should calculate total of positive numbers', () => {
      const result = calculateTotal([10, 20, 30]);
      expect(result).toBe(60);
    });
    
    it('should handle zero values', () => {
      const result = calculateTotal([10, 0, 30]);
      expect(result).toBe(40);
    });
  });
  
  describe('Edge Cases', () => {
    it('should return 0 for empty array', () => {
      const result = calculateTotal([]);
      expect(result).toBe(0);
    });
    
    it('should handle negative numbers', () => {
      const result = calculateTotal([10, -5, 20]);
      expect(result).toBe(25);
    });
    
    it('should handle decimal numbers', () => {
      const result = calculateTotal([10.5, 20.3]);
      expect(result).toBeCloseTo(30.8);
    });
  });
  
  describe('Error Cases', () => {
    it('should throw error for null input', () => {
      expect(() => calculateTotal(null)).toThrow('Input must be an array');
    });
    
    it('should throw error for non-array input', () => {
      expect(() => calculateTotal('not an array')).toThrow('Input must be an array');
    });
  });
});
```

---

## 10. Over-Reliance on AI

### Problem

You trust AI output too much and:
- Don't review code carefully
- Accept wrong suggestions
- Lose your own coding instincts
- Can't explain what the code does
- Can't debug without AI

### Why It Happens

- AI seems confident even when wrong
- You're in a hurry
- You assume AI knows more than you
- You want to save time

### Prevention (Using the Workflow)

**From Step 4 (Review):**

- "Always do a final human pass before merging"
- Review all code, even if AI looks confident

**From Step 5 (Test):**

- Run tests yourself
- Verify results manually

**From Step 6 (Iterate):**

- Ask for explanations, not just fixes
- Understand the problem before accepting the fix

### Troubleshooting Steps

**If you're over-relying on AI:**

1. **Review before accepting:**
   ```
   I've generated this code. Before you accept it:
   - Read it carefully
   - Understand what it does
   - Check if it makes sense
   - Ask questions if anything is unclear
   ```

2. **Ask for explanations:**
   ```
   Don't just fix it. Explain:
   - What's causing this error?
   - Why is this the right fix?
   - What are the trade-offs?
   ```

3. **Verify independently:**
   - Read official docs yourself
   - Test the code manually
   - Run your own tests
   - Don't trust AI blindly

4. **Build your own knowledge:**
   ```
   Explain this code to me in plain English.
   I want to understand it well enough to explain it to someone else.
   ```

5. **Occasionally code without AI:**
   - Do small tasks without AI help
   - Keep your skills sharp
   - Stay in the driver's seat

### Example

**Over-reliant approach (problematic):**
```
AI: [generates complex function]
User: Looks good, thanks!
[User doesn't read or understand the code]
[Commits and deploys]
[Later: Bug appears, user can't fix it without AI]
```

**Balanced approach (healthy):**
```
AI: [generates complex function]
User: Let me review this...
   - Line 15: Why are you using reduce instead of map?
   - Line 22: What if this returns null?
   - Line 30: Shouldn't we handle this error case?
   
AI: [explains reasoning, acknowledges issues]
AI: Let me update it...
AI: [generates improved version]
User: Better! Now let me test it manually...
[User tests and verifies]
User: I understand what this does now. Good to go.
```

---

## Quick Reference: Common Issues and Fixes

| Issue | Prevention | Quick Fix |
|-------|------------|-----------|
| Context drift | Short chats, summaries | Start fresh with summary |
| Hallucinations | Load context, verify APIs | Check docs, ask "which version?" |
| Debugging loops | Stop after 2 attempts | Start fresh, ask for explanation |
| Poor code quality | Specify requirements | Request refactoring |
| Wrong version | State versions explicitly | Verify against docs |
| Missing error handling | Plan for edge cases | Add try-catch, error cases |
| Inconsistent style | Provide style guide | Show examples, match patterns |
| Security issues | Include security rules | Request security review |
| Weak tests | Specify test coverage | Add edge cases, stronger assertions |
| Over-reliance | Review all code | Ask for explanations, verify yourself |

---

## When to Reset and Start Fresh

Always start a fresh chat if:

- [ ] You've asked twice and answers are repetitive or worse
- [ ] AI is contradicting itself
- [ ] Context is getting too long (> 50 messages)
- [ ] You're stuck in a debugging loop
- [ ] AI suggests something that violates project rules
- [ ] You're working on a new phase or subtask
- [ ] Thread feels messy and hard to follow

---

## Getting Help

If you encounter an issue not covered here:

1. **Check the main workflow:**
   - Are you following all 6 steps?
   - Did you provide context?
   - Did you get plan approval?

2. **Review your prompt:**
   - Is it clear and specific?
   - Did you provide examples?
   - Did you specify constraints?

3. **Ask for clarification:**
   - "I'm not sure you understood. Here's what I need..."
   - "Let me restate the requirements..."

4. **Consult resources:**
   - See `examples.md` for detailed workflows
   - See `templates.md` for prompt patterns
   - See `tool-integration.md` for AI editor setup