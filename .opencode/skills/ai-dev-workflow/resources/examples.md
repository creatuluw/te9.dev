# Workflow Examples

This document provides detailed, step-by-step examples of the strict AI coding workflow in action.

## Example 1: Implementing a User Registration Feature

### Step 1: Context Gathering

**Project Setup:**
- Backend: Node.js with Express
- Database: MongoDB with Mongoose
- Authentication: JWT tokens
- Frontend: React (not involved in this example)

**Context Loading:**
```
I'm starting a new coding task. Let me load the project context.

Reading: README.md
→ Project is a task management API
→ Uses Node.js, Express, MongoDB, JWT auth
→ Already has user model and login endpoint

Reading: AGENTS.md
→ All dates must be UTC
→ Use async/await, not callbacks
→ Always return consistent error format: { success: false, error: message }
→ Never store passwords in plain text
→ Use bcrypt for password hashing

Reading: models/User.js
→ User schema: email (unique, required), password (required), createdAt (Date)
→ Method: comparePassword(candidatePassword)

Reading: routes/auth.js
→ Already has POST /api/auth/login
→ Uses jwt.sign for token generation

Reading: tests/auth.test.js
→ Tests cover login with valid credentials
→ Tests cover login with invalid credentials
```

**Context Summary:**
```
Project context loaded:
- Stack: Node.js, Express, MongoDB, Mongoose, JWT
- User model exists with email and password
- Login endpoint already implemented
- Rules: UTC dates, async/await, consistent error format, bcrypt hashing
- Need to add registration endpoint that:
  1. Validates email format and uniqueness
  2. Hashes password with bcrypt
  3. Creates user in database
  4. Returns JWT token
  5. Follows existing error format
```

### Step 2: Planning

**User Request:**
```
I need to implement a user registration endpoint: POST /api/auth/register
It should accept email and password, validate input, create user, and return JWT token.
```

**AI (Planner Role) - Plan Only:**
```
Acting as Planner. Here's my detailed plan for user registration:

## Plan Overview
Add POST /api/auth/register endpoint that validates input, creates user, and returns JWT token.

## Detailed Steps

**Step 1: Input Validation Middleware**
- Create validation middleware for email format and password strength
- Email: must be valid email format
- Password: minimum 8 characters, at least one letter and one number
- Return 400 with error format if validation fails

**Step 2: Check for Existing User**
- Query database for existing user with same email
- If user exists, return 409 with "Email already registered"
- This prevents duplicate accounts

**Step 3: Hash Password**
- Use bcrypt.hash with 10 salt rounds
- This matches the existing comparePassword implementation
- Store hashed password, never plain text

**Step 4: Create User Document**
- Use Mongoose User.create()
- Save email, hashed password, and createdAt (UTC)
- Validate user is created successfully

**Step 5: Generate JWT Token**
- Use existing jwt.sign implementation
- Sign with user ID (use same secret as login)
- Return token in response

**Step 6: Return Response**
- On success: 201 with { success: true, token: jwtToken }
- On error: 400/409/500 with consistent error format

## Edge Cases to Consider

1. **Duplicate Email**: Check database before creating, return 409
2. **Weak Password**: Validation rejects passwords < 8 chars or missing letters/numbers
3. **Invalid Email Format**: Regex validation for email format
4. **Database Connection Error**: Handle MongoDB connection failures gracefully
5. **JWT Generation Error**: Handle token signing failures
6. **Missing Fields**: Validate email and password are present

## Files to Modify

1. `routes/auth.js` - Add new POST /api/auth/register route
2. `middleware/validation.js` - Create (if not exists) or add validation logic
3. `tests/auth.test.js` - Add registration tests

## Dependencies

No new dependencies needed (already using bcrypt, jsonwebtoken, express-validator)

## Potential Issues

- Ensure bcrypt salt rounds match existing implementation (10)
- Use same JWT secret and expiration as login endpoint
- Follow existing error response format consistently
- Ensure createdAt is stored in UTC (MongoDB Date handles this)

Stop here. Do not write code until you say "approved."
```

**User Response:**
```
approved
```

### Step 3: Implementation

**AI (Implementer Role) - Step 1:**
```
Step 1: Creating input validation middleware

I'll create middleware/validation.js with email and password validation:

[CODE: middleware/validation.js]
```

```javascript
const { body, validationResult } = require('express-validator');

// Validation rules for registration
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
];

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg
    });
  }
  next();
};

module.exports = { validateRegistration, handleValidationErrors };
```

**AI (Implementer Role) - Step 2:**
```
Step 2: Adding registration route to auth.js

I'll add the registration endpoint to routes/auth.js:

[CODE: routes/auth.js - add register route]
```

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validateRegistration, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// JWT Secret (same for login)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Existing login route...
router.post('/login', async (req, res) => {
  // ... existing code
});

// NEW: Registration route
router.post('/register',
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        createdAt: new Date() // MongoDB stores as UTC
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return success response
      return res.status(201).json({
        success: true,
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  }
);

module.exports = router;
```

**AI (Implementer Role) - Step 3:**
```
Step 3: Writing tests for registration endpoint

I'll add tests to tests/auth.test.js:

[CODE: tests/auth.test.js - add registration tests]
```

```javascript
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');

describe('POST /api/auth/register', () => {
  
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Happy Path', () => {
    it('should register a new user and return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.password).not.toBe('ValidPass123'); // Should be hashed
    });
  });

  describe('Edge Cases', () => {
    it('should reject registration with duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123'
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'DifferentPass456'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should reject weak password (too short)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Short1'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('8 characters');
    });

    it('should reject weak password (no letters)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '12345678'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('letter');
    });

    it('should reject weak password (no numbers)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'OnlyLetters'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('number');
    });
  });
});
```

### Step 4: Review

**AI (Reviewer Role) - Manual Review:**
```
Reviewing registration endpoint implementation:

✓ Logic Correct:
  - Checks for existing user before creating
  - Hashes password with bcrypt (salt rounds: 10)
  - Generates JWT token correctly
  - Returns appropriate HTTP status codes (201, 400, 409, 500)

✓ Error Handling:
  - Validation errors handled with consistent format
  - Database errors caught and logged
  - Duplicate email check prevents race condition

✓ Security:
  - Password never stored in plain text
  - Password strength enforced
  - JWT token uses secure secret
  - Email normalized to prevent duplicates (test@example.com vs Test@Example.com)

✓ Consistency:
  - Follows existing error format: { success: false, error: message }
  - Uses async/await throughout
  - Same JWT secret and expiration as login

✓ Edge Cases Covered:
  - Duplicate email
  - Invalid email format
  - Weak password (multiple scenarios)
  - Database connection errors

Minor suggestion: Consider adding rate limiting to prevent abuse
```

**AI (CodeRabbit or Similar Tool) - Automated Review:**
```
Automated review results:

✓ No security vulnerabilities detected
✓ No SQL/NoSQL injection risks (using parameterized queries via Mongoose)
✓ Proper error handling throughout
⚠ Suggestion: Add rate limiting middleware (not blocking)
⚠ Suggestion: Consider adding email verification workflow (future enhancement)
```

### Step 5: Test

**AI (Tester Role) - Test Execution:**
```
Running registration tests...

Results:
✓ All tests passing (6 tests)
  ✓ Happy path: registration successful
  ✓ Edge case: duplicate email
  ✓ Edge case: invalid email format
  ✓ Edge case: weak password (too short)
  ✓ Edge case: weak password (no letters)
  ✓ Edge case: weak password (no numbers)

Coverage:
- Routes: 100% covered
- Middleware: 100% covered
- Error paths: 100% covered
```

**AI (Explainer Role) - Summary:**
```
Summary of Changes:

Files Modified:
1. routes/auth.js - Added POST /api/auth/register endpoint
2. middleware/validation.js - Created new file with validation logic
3. tests/auth.test.js - Added 6 registration tests

What Changed:
- New endpoint accepts email and password
- Validates input format and strength
- Checks for duplicate emails
- Hashes passwords with bcrypt
- Creates user in MongoDB
- Returns JWT token on success

Logic Explained:
1. Validation middleware checks email format and password strength
2. Database query checks for existing user to prevent duplicates
3. bcrypt.hash() creates secure password hash (10 salt rounds)
4. Mongoose creates user document with email, hashed password, and createdAt
5. jwt.sign() generates authentication token
6. Consistent error format maintained throughout

What Could Break:
- Registration if email already exists (handled with 409)
- Registration if password is weak (handled with 400)
- Registration if database is down (handled with 500)
- Token generation if JWT secret changes (would invalidate all tokens)

How Tests Cover Risks:
- Duplicate email test prevents account hijacking
- Password validation tests prevent weak accounts
- Happy path test ensures normal flow works
- Error handling tests verify all error paths
```

### Step 6: Verification

**User:**
```
Does this meet your expectations? [yes/no/adjust]
```

```
yes
```

**Final Step:**
```
✅ Registration endpoint implemented successfully
✅ All tests passing
✅ Code reviewed and verified
✅ Ready for PR review and merge
```

---

## Example 2: Fixing a Bug - Slow Database Query

### Step 1: Context Gathering

**User Issue:**
```
The dashboard page is very slow. It takes 5+ seconds to load when I have 1000+ tasks.
```

**Context Loading:**
```
Reading: README.md
→ Project: Task management dashboard
→ Stack: Node.js, Express, MongoDB, React frontend
→ Performance requirement: < 1 second for dashboard load

Reading: models/Task.js
→ Task schema: title, description, status, assignedTo, createdAt, updatedAt
→ Indexes: only _id (default)

Reading: routes/dashboard.js
→ GET /api/dashboard returns all tasks for current user
→ Query: Task.find({ assignedTo: userId })

Reading: logs/performance.log
→ Dashboard query time: 5.2s with 1000 tasks
→ Most time spent in database query

Error/Issue:
Query is slow because:
1. No index on assignedTo field
2. Fetching all fields when only some are needed
3. No pagination for large result sets
```

### Step 2: Planning

**User Request:**
```
Fix the slow dashboard load time.
```

**AI (Planner Role) - Explanation First:**
```
Do not fix yet. Let me explain the problem step by step.

## Why the Query is Slow

1. **Missing Index on assignedTo**:
   - MongoDB must scan entire collection to find matching documents
   - With 1000+ tasks, this is O(n) operation
   - Without index, every query requires full collection scan

2. **Fetching All Fields**:
   - Query returns all fields: title, description, status, assignedTo, createdAt, updatedAt
   - Dashboard only needs: title, status, createdAt
   - Fetching unnecessary fields increases network transfer and memory usage

3. **No Pagination**:
   - Query fetches ALL tasks for user
   - Dashboard displays first 20 tasks, but query returns 1000+
   - Unnecessary data transfer and processing

4. **No Result Caching**:
   - Every dashboard visit triggers full query
   - Most users check dashboard frequently
   - Same data fetched repeatedly

## Most Likely Failure Cases

If not fixed:
1. Database performance degrades as task count grows
2. Server becomes unresponsive with many concurrent users
3. Poor user experience leads to churn

Potential issues with fixes:
1. Adding index increases write time slightly
2. Pagination requires frontend changes
3. Caching adds complexity

## Proposed Fixes

**Priority 1 - Add Index** (Critical):
- Create index on assignedTo field
- Reduces query from O(n) to O(log n)
- Immediate performance improvement

**Priority 2 - Project Fields** (High):
- Select only fields needed for dashboard
- Reduces data transfer by ~50%
- Minimal implementation effort

**Priority 3 - Add Pagination** (Medium):
- Return only tasks for current page
- Frontend must handle pagination UI
- More complex, but scales better

**Priority 4 - Add Caching** (Low):
- Cache dashboard results for 5 minutes
- Requires cache invalidation strategy
- Best for read-heavy workloads

## Recommended Approach

Start with Priority 1 and 2 (index + field projection):
- Fastest implementation
- Biggest performance gain
- Minimal risk
- Can add pagination/caching later if needed

Stop here. Do not write code until you say "approved."
```

**User Response:**
```
approved for Priority 1 and 2
```

### Step 3: Implementation

**AI (Implementer Role) - Step 1:**
```
Step 1: Adding index on assignedTo field

I'll update models/Task.js to add the index:

[CODE: models/Task.js - add index]
```

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // NEW: Add index for faster queries
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for common query pattern
taskSchema.index({ assignedTo: 1, createdAt: -1 }); // NEW: Tasks by user, sorted by date

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
```

**AI (Implementer Role) - Step 2:**
```
Step 2: Adding field projection to dashboard query

I'll update routes/dashboard.js to select only needed fields:

[CODE: routes/dashboard.js - add field projection]
```

```javascript
const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard tasks for current user
router.get('/', auth, async (req, res) => {
  try {
    const { userId } = req.user;

    // NEW: Select only fields needed for dashboard
    const tasks = await Task.find({ assignedTo: userId })
      .select('title status createdAt') // NEW: Project only needed fields
      .sort({ createdAt: -1 })
      .limit(100); // NEW: Reasonable limit for dashboard

    return res.json({
      success: true,
      tasks
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    });
  }
});

module.exports = router;
```

### Step 4: Testing

**AI (Tester Role) - Regression Test:**
```
Writing regression test for query performance:

[CODE: tests/dashboard.test.js - add performance test]
```

```javascript
const request = require('supertest');
const app = require('../app');
const Task = require('../models/Task');
const User = require('../models/User');

describe('GET /api/dashboard - Performance', () => {
  let user;
  let testTasks;

  beforeAll(async () => {
    // Create test user
    user = await User.create({
      email: 'test@example.com',
      password: 'hashedpassword'
    });

    // Create 1000 test tasks
    testTasks = [];
    for (let i = 0; i < 1000; i++) {
      testTasks.push({
        title: `Task ${i}`,
        description: `Description ${i}`,
        status: i % 3 === 0 ? 'done' : 'todo',
        assignedTo: user._id
      });
    }
    await Task.insertMany(testTasks);
  });

  afterAll(async () => {
    await Task.deleteMany({});
    await User.deleteMany({});
  });

  it('should load dashboard within 1 second with 1000 tasks', async () => {
    const startTime = Date.now();

    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`); // Assume valid token setup

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tasks).toBeDefined();
    expect(duration).toBeLessThan(1000); // Must complete in < 1 second

    console.log(`Dashboard load time: ${duration}ms`);
  });

  it('should only return fields needed for dashboard', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);

    const task = response.body.tasks[0];

    // Should have these fields
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('status');
    expect(task).toHaveProperty('createdAt');

    // Should NOT have these fields
    expect(task).not.toHaveProperty('description');
    expect(task).not.toHaveProperty('updatedAt');
    expect(task).not.toHaveProperty('assignedTo');
  });

  it('should respect 100 task limit', async () => {
    const response = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.body.tasks.length).toBeLessThanOrEqual(100);
  });
});
```

### Step 5: Review & Iterate

**Test Results:**
```
Running performance tests...

Results:
✓ Dashboard load time: 180ms (down from 5200ms) - 96% improvement
✓ Field projection working correctly
✓ 100 task limit respected
✓ All regression tests passing

Performance improvement confirmed!
```

**AI (Explainer Role) - Summary:**
```
Summary of Bug Fix:

Files Modified:
1. models/Task.js - Added indexes on assignedTo and (assignedTo, createdAt)
2. routes/dashboard.js - Added field projection and result limit

What Changed:
- Added index on assignedTo field
- Added compound index on (assignedTo, createdAt) for sorted queries
- Query now selects only: title, status, createdAt
- Added 100 task limit to dashboard

Performance Results:
- Before: 5200ms
- After: 180ms
- Improvement: 96% faster

What This Fixes:
- Full collection scans eliminated by index
- Reduced data transfer by ~50%
- Limited result size prevents memory issues

Trade-offs:
- Write operations slightly slower (index maintenance)
- Dashboard limited to 100 recent tasks (acceptable for UI)
- Pagination not yet implemented (can be added later)

Tests Cover:
- Performance requirement (< 1 second)
- Field projection correctness
- Task limit enforcement
```

---

## Example 3: Refactoring - Extracting Utility Functions

### Step 1: Context Gathering

**User Request:**
```
The auth routes have duplicate code for JWT generation and password hashing.
Extract these into reusable utility functions.
```

**Context Loading:**
```
Reading: routes/auth.js
→ Contains login endpoint
→ JWT generation logic: jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' })
→ Password verification: await user.comparePassword(candidatePassword)
→ Contains registration endpoint (from previous example)
→ JWT generation: duplicate of login logic
→ Password hashing: bcrypt.hash(password, 10)

Reading: AGENTS.md
→ DRY principle: Don't Repeat Yourself
→ Utilities go in utils/ directory
→ Follow existing naming conventions

Issue Identified:
- JWT generation code duplicated in login and register routes
- If token logic changes, must update two places
- No centralized place for token-related logic
```

### Step 2: Planning

**AI (Planner Role):**
```
Plan for extracting auth utilities:

## Overview
Extract duplicate JWT and password handling into utils/auth.js

## Steps

1. Create utils/auth.js with:
   - generateToken(userId) - Generate JWT token
   - hashPassword(password) - Hash password with bcrypt
   - comparePassword(candidate, hashed) - Compare passwords

2. Update routes/auth.js:
   - Import from utils/auth
   - Replace duplicate JWT generation with generateToken()
   - Replace bcrypt.hash with hashPassword()
   - Already uses user.comparePassword() so no change there

3. Write tests for utils/auth.js

## Benefits
- Single source of truth for auth logic
- Easier to test in isolation
- Changes to token logic only need to be made once
- Follows DRY principle

## Edge Cases
- Ensure token expiration stays consistent
- Ensure salt rounds for hashing are correct
- Tests must verify identical behavior before and after refactoring

Stop here. Do not write code until you say "approved."
```

**User Response:**
```
approved
```

### Step 3: Implementation

**AI (Implementer Role):**
```
Step 1: Creating utils/auth.js

[CODE: utils/auth.js]
```

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRATION = '24h';
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Generate JWT token for user
 * @param {string} userId - User's MongoDB _id
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plain text password with hashed password
 * @param {string} candidatePassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = {
  generateToken,
  hashPassword,
  comparePassword
};
```

**AI (Implementer Role):**
```
Step 2: Updating routes/auth.js to use utilities

[CODE: routes/auth.js - refactored]
```

```javascript
const express = require('express');
const User = require('../models/User');
const { validateRegistration, handleValidationErrors } = require('../middleware/validation');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth'); // NEW

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // NEW: Use utility function
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // NEW: Use utility function
    const token = generateToken(user._id);

    return res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Registration endpoint
router.post('/register',
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // NEW: Use utility function
      const hashedPassword = await hashPassword(password);

      const user = await User.create({
        email,
        password: hashedPassword,
        createdAt: new Date()
      });

      // NEW: Use utility function
      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }
);

module.exports = router;
```

### Step 4: Testing

**AI (Tester Role) - New Utility Tests:**
```
Writing tests for utils/auth.js:

[CODE: tests/auth-utils.test.js]
```

```javascript
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');

describe('Auth Utils', () => {
  const testUserId = '507f1f77bcf86cd799439011';

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should decode to correct userId', () => {
      const token = generateToken(testUserId);
      const decoded = require('jsonwebtoken').decode(token);

      expect(decoded.userId).toBe(testUserId);
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // Bcrypt hashes are long
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Bcrypt uses salt
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);

      const result = await comparePassword(password, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hashedPassword = await hashPassword(password);

      const result = await comparePassword(wrongPassword, hashedPassword);

      expect(result).toBe(false);
    });
  });
});
```

**AI (Tester Role) - Regression Tests:**
```
Running existing auth tests to verify behavior unchanged:

Results:
✓ All existing login tests still passing
✓ All existing registration tests still passing
✓ New utility tests passing
✓ Token format identical before/after refactoring
✓ Password hashing identical before/after refactoring
✓ Behavior preserved 100%
```

### Step 5: Review

**AI (Reviewer Role):**
```
Reviewing refactoring:

✓ Refactoring Benefits:
  - Code duplication eliminated
  - Single source of truth for auth logic
  - Easier to maintain and test
  - Follows DRY principle

✓ Backward Compatibility:
  - Token generation unchanged
  - Password hashing unchanged
  - All existing tests passing
  - API behavior identical

✓ Code Quality:
  - Functions properly documented with JSDoc
  - Constants defined at top for easy configuration
  - Clear function names and parameters

✓ Test Coverage:
  - Utility functions tested in isolation
  - Existing auth tests still pass (regression)
  - Edge cases covered (different hashes, wrong passwords)

Refactoring is successful and safe for deployment!
```

---

## Key Takeaways

These examples demonstrate:

1. **Context First**: Always load project context before coding
2. **Plan Before Code**: Get approval before writing any code
3. **Small Steps**: Implement one piece at a time
4. **Test Immediately**: Write tests right after code changes
5. **Review Thoroughly**: Check logic, security, and consistency
6. **Explain Changes**: Document what changed and why

The workflow may seem detailed, but it prevents:
- AI hallucinations (context prevents guessing)
- Bad approaches (planning catches issues early)
- Large broken changes (small steps are easy to fix)
- Missing edge cases (testing catches problems)
- Security issues (review finds vulnerabilities)
- Confusing code (explanations clarify logic)