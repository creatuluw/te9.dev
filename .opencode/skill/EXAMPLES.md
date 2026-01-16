# OpenCode Skills Usage Examples

This document provides practical examples of how to use the te9-method's OpenCode Skills in various scenarios.

## Table of Contents
- [Basic Workflows](#basic-workflows)
  - [Checking PRD Status](#checking-prd-status)
  - [Simple Feature Addition](#simple-feature-addition)
  - [Bugfix](#bugfix)
  - [Refactoring](#refactoring)
- [Advanced Workflows](#advanced-workflows)
  - [New Project](#new-project)
  - [Multi-PRD Feature](#multi-prd-feature)
- [Skill Reference](#skill-reference)
- [Common Patterns](#common-patterns)

---

## Basic Workflows

### Checking PRD Status

**Scenario**: You want to see what PRDs are pending and get guidance on starting work

**User Prompt**:
```
Show me what PRD work needs to be done
```

**Agent Workflow**:

1. **Call PRD Work Skill**
```python
skill("prd-work")
```

**Agent Response**:
```markdown
# PRD Work Status Overview

## Active PRDs

| Title | PRD ID | Status | Priority |
|-------|--------|--------|----------|
| User Authentication System | PRD-20250115-143022 | IN_PROGRESS | 1 |
| Shopping Cart Feature | PRD-20250115-150033 | TODO | 1 |
| Payment Integration | PRD-20250115-152045 | TODO | 2 |

## Work Status Recap

**Total Active PRDs:** 3
**Currently In Progress:** 1
**Ready to Start:** 2 (TODO status with no blockers)

### Breakdown by Priority:
- **Priority 1 (High):** 2 PRDs (1 in progress, 1 ready)
- **Priority 2 (Medium):** 1 PRD (0 in progress, 1 ready)

### Immediate Attention Needed:
- **PRD-20250115-143022** (User Authentication) is in progress - complete this first

### Log Insights:

**IN_PROGRESS PRDs:**

**PRD-20250115-143022 (User Authentication System):**
- Last worked on: 2025-01-15 16:30:22 (4 hours ago)
- Progress: 3 of 5 criteria completed
- Completed:
  - User registration endpoint implemented
  - Login functionality with JWT tokens
  - Password hashing with bcrypt
- Remaining:
  - Email verification system
  - Password reset functionality
- Issues:
  - Email service integration failing with SMTP timeout
  - Need to configure email provider credentials
- Tests: 12 passing, 3 failing (email verification tests)
- Next: Fix email service configuration and implement remaining criteria

## How to Start Working on PRDs

### ⚠️ Existing Work In Progress

You have a PRD currently in progress:

**PRD-20250115-143022: User Authentication System**
- **Status:** IN_PROGRESS
- **Last Activity:** 2025-01-15 16:30:22 (4 hours ago)
- **Progress:** 3 of 5 acceptance criteria completed
- **Completed So Far:**
  - User registration endpoint with validation
  - Login functionality with JWT token generation
  - Password hashing using bcrypt
  - Database schema for users table
- **Remaining Work:**
  - Email verification system (criterion 4)
  - Password reset functionality (criterion 5)
- **Issues to Address:**
  - SMTP timeout error when sending verification emails
  - Email service credentials need configuration
  - 3 tests failing related to email verification
- **Test Status:** 12 tests passing, 3 tests failing

**Context from Log:**
The email service integration is currently failing with "SMTP timeout after 5000ms". 
The developer noted that email provider credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) 
need to be configured in environment variables. Template system is ready, just needs 
working email connection.

**Recommended Action:**
1. Review the log file: `/dev/prd/logs/PRD-20250115-143022.md`
2. Address the email service configuration issue:
   - Configure SMTP credentials in .env file
   - Test email connection
   - Fix the 3 failing email verification tests
3. Continue execution: `skill("prd-execute", { prdId: "PRD-20250115-143022", continueMode: true })`
4. Focus on remaining criteria:
   - Implement email verification flow (criterion 4)
   - Implement password reset flow (criterion 5)
5. Once complete, verify: `skill("prd-test", { prdId: "PRD-20250115-143022" })`
6. Finally, complete: `skill("prd-track", { prdId: "PRD-20250115-143022", eventType: "COMPLETED" })`

## Related Workflow Steps

### Critical Rules to Remember:
1. 📋 **Read Log Files First** - Understand context before starting work
2. 🧪 **100% Test Pass Rate Required** - No exceptions
3. ✍️ **One Commit Per PRD** - Must include PRD ID in message
4. 👤 **User Approval for Push** - Never auto-push
5. ✅ **Leave Clean State** - Code must build and tests pass
6. 📝 **Track Everything** - Log all progress and events
```

**Benefits**:
- Quick overview of all pending work
- **Deep context from log file analysis** - understand what's been done and what's left
- **Issue visibility** - see unresolved problems and blockers immediately
- **Progress tracking** - know exactly how far along each PRD is
- Clear guidance on what to do next based on actual work state
- Prioritized view of PRDs
- Workflow reminders included

**When to Use**:
- Starting a work session (get context from logs)
- Deciding which PRD to work on next (see progress and issues)
- After completing a PRD to see what's next
- When returning to the project after a break (catch up on progress)
- When you need to understand what was done previously
- When troubleshooting issues in in-progress PRDs

---

### Simple Feature Addition

**Scenario**: Add user profile page to existing webapp

**User Prompt**:
```
I need to add a user profile page where users can view and edit their profile information
```

**Agent Workflow**:

1. **Call Interview Skill**
```python
skill("prd-interview")
```
Agent conducts 9-question interview:
- Type: New Feature
- Title: User Profile Page
- Description: Create a profile page where users can view and edit their information including name, email, bio, and profile picture
- Acceptance Criteria:
  1. Profile page displays user information
  2. Users can edit their profile
  3. Profile picture upload functionality
  4. Data persists to database
  5. Form validation for all fields
- Priority: 2
- Dependencies: None
- Technologies: React, Node.js, MongoDB
- Constraints: Must be responsive
- Notes: Use existing user authentication

2. **User Approves Recap**

3. **Call Creation Skill**
```python
result = skill("prd-create", interview_data)
```
Returns:
```json
{
  "success": true,
  "interviewId": "INT-20250115-143022",
  "prdIds": ["PRD-20250115-143022"],
  "files": {
    "interview": "/dev/interviews/INT-20250115-143022.md",
    "database": "/dev/prd/prd.json",
    "runFolders": ["/dev/prd/runs/PRD-20250115-143022/"],
    "logs": ["/dev/prd/logs/PRD-20250115-143022.md"]
  }
}
```

4. **Call Execute Skill**
```python
result = skill("prd-execute", prdId="PRD-20250115-143022")
```
Agent implements:
- Creates profile page component
- Adds API endpoints for profile data
- Implements form validation
- Adds database schema updates
- Integrates profile picture upload

5. **Call Test Skill**
```python
result = skill("prd-test", prdId="PRD-20250115-143022")
```
Tests and verifies:
- All 5 acceptance criteria pass
- Full test suite passes (npm test)
- No regressions detected
- Code quality verified

6. **Call Track Skill**
```python
result = skill("prd-track", prdId="PRD-20250115-143022", eventType="COMPLETED", eventData={...})
```
Updates logs and marks PRD as DONE.

---

### Bugfix

**Scenario**: Fix login form not accepting valid passwords

**User Prompt**:
```
The login form is rejecting valid passwords and showing "Invalid credentials" even for correct passwords
```

**Agent Workflow**:

1. **Call Interview Skill**
```python
skill("prd-interview")
```
Agent conducts interview for Bugfix type:
- Type: Bugfix
- Title: Login Password Validation Bug
- Description: Login form incorrectly rejects valid passwords, preventing users from logging in
- Acceptance Criteria:
  1. Login form accepts valid passwords
  2. Appropriate error message for invalid passwords
  3. Test covers both scenarios
- Priority: 1 (Highest)
- Dependencies: None
- Technologies: React, Express, bcrypt
- Constraints: Urgent - users cannot access accounts
- Notes: Issue reported by multiple users

2. **Call Creation Skill**
```python
result = skill("prd-create", interview_data)
```

3. **Call Execute Skill**
```python
result = skill("prd-execute", prdId="PRD-20250115-150030")
```
Agent:
- Identifies bug in password comparison logic
- Fixes the comparison function
- Creates test to reproduce bug
- Verifies fix resolves issue
- Tests with various password formats

4. **Call Test Skill**
```python
result = skill("prd-test", prdId="PRD-20250115-150030")
```
Verifies:
- Bug is fixed
- Valid passwords now work
- Invalid passwords still rejected
- No regressions in other auth features

5. **Call Track Skill**
```python
result = skill("prd-track", prdId="PRD-20250115-150030", eventType="COMPLETED", eventData={...})
```

---

### Refactoring

**Scenario**: Refactor user service to use async/await instead of callbacks

**User Prompt**:
```
I need to refactor the user service from callback hell to async/await pattern for better maintainability
```

**Agent Workflow**:

1. **Call Interview Skill**
```python
skill("prd-interview")
```
- Type: Refactor
- Title: User Service Async Refactor
- Description: Convert user service from callback-based to async/await for improved readability and error handling
- Acceptance Criteria:
  1. All user service functions use async/await
  2. Error handling improved with try/catch
  3. Existing tests still pass
  4. No functional changes
  5. Code is more readable
- Priority: 3
- Dependencies: None
- Technologies: Node.js, JavaScript
- Constraints: Must not break existing functionality

2. **Call Creation Skill**
```python
result = skill("prd-create", interview_data)
```

3. **Call Execute Skill**
```python
result = skill("prd-execute", prdId="PRD-20250115-151545")
```
Agent:
- Identifies all callback-based functions
- Converts each to async/await
- Improves error handling
- Maintains same functionality
- Updates function signatures where needed

4. **Call Test Skill**
```python
result = skill("prd-test", prdId="PRD-20250115-151545")
```
Verifies:
- All tests still pass (no functional changes)
- Code is cleaner and more maintainable
- Performance is not degraded
- Error handling is improved

5. **Call Track Skill**
```python
result = skill("prd-track", prdId="PRD-20250115-151545", eventType="COMPLETED", eventData={...})
```

---

## Advanced Workflows

### New Project

**Scenario**: Create a complete e-commerce platform from scratch

**User Prompt**:
```
I want to create a new e-commerce platform with product catalog, shopping cart, checkout, and payment processing
```

**Agent Workflow**:

1. **Call Interview Skill**
```python
interview_data = skill("prd-interview")
```
Agent conducts interview for New Project type:
- Type: New Project
- Title: E-commerce Platform
- Description: Full-featured e-commerce platform with product management, shopping cart, checkout process, and payment integration
- Acceptance Criteria:
  1. Product catalog with categories
  2. Product search and filtering
  3. Shopping cart functionality
  4. User authentication
  5. Checkout process
  6. Payment integration with Stripe
  7. Order management
  8. Admin dashboard
  9. Email notifications
  10. Responsive design
  11. SEO optimization
  12. Product reviews and ratings
  13. Wishlist functionality
  14. Discount codes
  15. Inventory management
- Priority: 2
- Dependencies: None
- Technologies: React, Node.js, MongoDB, Stripe
- Constraints: Must be production-ready
- Notes: Need secure payment handling

2. **User Approves Recap**

3. **Detect Big Ask** (>10 criteria) and Call Plan Skill
```python
plan = skill("prd-plan", interview_data)
```
Agent creates multi-PRD plan:

```json
{
  "chunkingRequired": true,
  "totalPRDs": 5,
  "executionOrder": [1, 2, 3, 4, 5],
  "estimatedComplexity": "High",
  "prds": [
    {
      "prNumber": 1,
      "title": "Database Schema & Core Models",
      "focus": "Setup database, create user, product, and order models",
      "acceptanceCriteria": [
        "Database schema designed",
        "User model with authentication",
        "Product model with categories",
        "Order model with items",
        "Review and rating model"
      ],
      "dependencies": null,
      "priority": 1
    },
    {
      "prNumber": 2,
      "title": "Authentication System",
      "focus": "User authentication, registration, and authorization",
      "acceptanceCriteria": [
        "User registration",
        "Login/logout functionality",
        "Password reset",
        "JWT authentication",
        "Role-based authorization"
      ],
      "dependencies": ["PRD-20250115-160030-001"],
      "priority": 1
    },
    {
      "prNumber": 3,
      "title": "Product Management",
      "focus": "Product catalog, search, filtering, and inventory",
      "acceptanceCriteria": [
        "Product catalog with categories",
        "Product search functionality",
        "Filter by price, category, rating",
        "Inventory tracking",
        "Admin product management"
      ],
      "dependencies": ["PRD-20250115-160030-001"],
      "priority": 2
    },
    {
      "prNumber": 4,
      "title": "Shopping Cart & Checkout",
      "focus": "Shopping cart, wishlist, and checkout process",
      "acceptanceCriteria": [
        "Add/remove from cart",
        "Cart quantity management",
        "Wishlist functionality",
        "Checkout process",
        "Order calculation"
      ],
      "dependencies": ["PRD-20250115-160030-003", "PRD-20250115-160030-002"],
      "priority": 2
    },
    {
      "prNumber": 5,
      "title": "Payment & Order Management",
      "focus": "Payment integration and order management",
      "acceptanceCriteria": [
        "Stripe payment integration",
        "Order management",
        "Email notifications",
        "Discount codes",
        "Admin dashboard"
      ],
      "dependencies": ["PRD-20250115-160030-004"],
      "priority": 2
    }
  ]
}
```

4. **User Approves Plan**

5. **Call Creation Skill**
```python
result = skill("prd-create", {interview_data, prd_plan: plan})
```
Returns:
```json
{
  "success": true,
  "interviewId": "INT-20250115-160030",
  "prdIds": [
    "PRD-20250115-160030-001",
    "PRD-20250115-160030-002",
    "PRD-20250115-160030-003",
    "PRD-20250115-160030-004",
    "PRD-20250115-160030-005"
  ],
  "files": {
    "interview": "/dev/interviews/INT-20250115-160030.md",
    "database": "/dev/prd/prd.json (5 entries appended)",
    "runFolders": [
      "/dev/prd/runs/PRD-20250115-160030-001/",
      "/dev/prd/runs/PRD-20250115-160030-002/",
      "/dev/prd/runs/PRD-20250115-160030-003/",
      "/dev/prd/runs/PRD-20250115-160030-004/",
      "/dev/prd/runs/PRD-20250115-160030-005/"
    ],
    "logs": [
      "/dev/prd/logs/PRD-20250115-160030-001.md",
      "/dev/prd/logs/PRD-20250115-160030-002.md",
      "/dev/prd/logs/PRD-20250115-160030-003.md",
      "/dev/prd/logs/PRD-20250115-160030-004.md",
      "/dev/prd/logs/PRD-20250115-160030-005.md"
    ]
  }
}
```

6. **Execute PRDs in Order**

**PRD-001: Database Schema & Core Models**
```python
result = skill("prd-execute", prdId="PRD-20250115-160030-001")
result = skill("prd-test", prdId="PRD-20250115-160030-001")
result = skill("prd-track", prdId="PRD-20250115-160030-001", eventType="COMPLETED", eventData={...})
```

**PRD-002: Authentication System**
```python
result = skill("prd-execute", prdId="PRD-20250115-160030-002")
result = skill("prd-test", prdId="PRD-20250115-160030-002")
result = skill("prd-track", prdId="PRD-20250115-160030-002", eventType="COMPLETED", eventData={...})
```

**PRD-003: Product Management**
```python
result = skill("prd-execute", prdId="PRD-20250115-160030-003")
result = skill("prd-test", prdId="PRD-20250115-160030-003")
result = skill("prd-track", prdId="PRD-20250115-160030-003", eventType="COMPLETED", eventData={...})
```

**PRD-004: Shopping Cart & Checkout**
```python
result = skill("prd-execute", prdId="PRD-20250115-160030-004")
result = skill("prd-test", prdId="PRD-20250115-160030-004")
result = skill("prd-track", prdId="PRD-20250115-160030-004", eventType="COMPLETED", eventData={...})
```

**PRD-005: Payment & Order Management**
```python
result = skill("prd-execute", prdId="PRD-20250115-160030-005")
result = skill("prd-test", prdId="PRD-20250115-160030-005")
result = skill("prd-track", prdId="PRD-20250115-160030-005", eventType="COMPLETED", eventData={...})
```

7. **Project Complete!**
All 5 PRDs completed in dependency order, e-commerce platform is ready for deployment.

---

### Multi-PRD Feature

**Scenario**: Add comprehensive comments system to blog

**User Prompt**:
```
I need to add a full-featured comments system to my blog with nested replies, moderation, and notifications
```

**Agent Workflow**:

1. **Interview & Plan**
```python
interview_data = skill("prd-interview")
plan = skill("prd-plan", interview_data)
```

Creates 3 PRDs:
- PRD-001: Comment Model & Database
- PRD-002: Comment API & Frontend
- PRD-003: Moderation & Notifications

2. **Create All PRDs**
```python
result = skill("prd-create", {interview_data, prd_plan: plan})
```

3. **Execute PRDs Sequentially**

**PRD-001: Comment Model & Database**
```python
skill("prd-execute", prdId="PRD-20250115-170000-001")
# Creates comment schema, nested comment structure
skill("prd-test", prdId="PRD-20250115-170000-001")
skill("prd-track", prdId="PRD-20250115-170000-001", eventType="COMPLETED", eventData={...})
```

**PRD-002: Comment API & Frontend**
```python
skill("prd-execute", prdId="PRD-20250115-170000-002")
# Creates API endpoints, comment UI, reply functionality
skill("prd-test", prdId="PRD-20250115-170000-002")
skill("prd-track", prdId="PRD-20250115-170000-002", eventType="COMPLETED", eventData={...})
```

**PRD-003: Moderation & Notifications**
```python
skill("prd-execute", prdId="PRD-20250115-170000-003")
# Adds moderation panel, notification system
skill("prd-test", prdId="PRD-20250115-170000-003")
skill("prd-track", prdId="PRD-20250115-170000-003", eventType="COMPLETED", eventData={...})
```

4. **Feature Complete!**
Comments system with nested replies, moderation, and notifications fully implemented.

---

## Skill Reference

### prd-interview

**Purpose**: Conduct structured interview to gather requirements

**Usage**:
```python
interview_data = skill("prd-interview")
```

**Returns**:
```json
{
  "type": "work type",
  "title": "title",
  "description": "description",
  "acceptanceCriteria": ["criterion 1", "criterion 2"],
  "priority": 1,
  "dependencies": "dependencies or null",
  "technologies": "tech or null",
  "constraints": "constraints or null",
  "notes": "notes or null"
}
```

**Use when**: Starting any new work (Project, Feature, Refactor, Bugfix, Other)

---

### prd-plan

**Purpose**: Break large asks into multiple PRDs

**Usage**:
```python
plan = skill("prd-plan", interview_data)
```

**Returns**:
```json
{
  "chunkingRequired": true,
  "totalPRDs": 3,
  "executionOrder": [1, 2, 3],
  "estimatedComplexity": "Medium",
  "prds": [...]
}
```

**Use when**: 
- 10+ acceptance criteria
- Description >500 words
- Multiple independent features
- New Project type
- High complexity

---

### prd-create

**Purpose**: Generate PRD files and update database

**Usage** (single PRD):
```python
result = skill("prd-create", {
  "interviewData": interview_data
})
```

**Usage** (multi-PRD):
```python
result = skill("prd-create", {
  "interviewData": interview_data,
  "prdPlan": plan
})
```

**Returns**:
```json
{
  "success": true,
  "interviewId": "INT-20250115-143022",
  "prdIds": ["PRD-20250115-143022", "PRD-20250115-143022-001"],
  "files": {...}
}
```

**Use when**: After interview is complete and approved

---

### prd-execute

**Purpose**: Implement work on a specific PRD

**Usage**:
```python
result = skill("prd-execute", {
  "prdId": "PRD-20250115-143022",
  "continueMode": false,
  "focusArea": null
})
```

**Returns**:
```json
{
  "success": true,
  "prdId": "PRD-20250115-143022",
  "status": "DONE",
  "executionSummary": {
    "acceptanceCriteriaTotal": 5,
    "acceptanceCriteriaPassed": 5,
    "filesCreated": 3,
    "filesModified": 2,
    "filesDeleted": 0,
    "testResults": "All tests passed"
  },
  "testingReport": {...}
}
```

**Use when**: Implementing a specific PRD after creation

---

### prd-test

**Purpose**: Verify all acceptance criteria with tests

**Usage**:
```python
result = skill("prd-test", {
  "prdId": "PRD-20250115-143022",
  "criteriaToTest": null,
  "runFullSuite": true,
  "skipRegressions": false
})
```

**Returns**:
```json
{
  "success": true,
  "prdId": "PRD-20250115-143022",
  "testResults": {
    "totalCriteria": 5,
    "criteriaPassed": 5,
    "criteriaFailed": 0,
    "fullTestSuite": {...}
  },
  "regressions": [],
  "codeQuality": {...},
  "overallStatus": "PASS"
}
```

**Use when**: After execution is complete, before marking PRD as DONE

---

### prd-track

**Purpose**: Log progress, achievements, and issues

**Usage** (track progress):
```python
result = skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "PROGRESS",
  "eventData": {
    "achievement": "Implemented user authentication",
    "criteriaCompleted": [1, 2],
    "filesCreated": 2,
    "filesModified": 1
  }
})
```

**Usage** (log issue):
```python
result = skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "ISSUE",
  "eventData": {
    "issue": "Database connection timeout",
    "severity": "High",
    "impact": "Cannot save user data",
    "resolution": "Increased connection pool size"
  }
})
```

**Usage** (mark complete):
```python
result = skill("prd-track", {
  "prdId": "PRD-20250115-143022",
  "eventType": "COMPLETED",
  "eventData": {
    "testResults": {...},
    "filesCreated": 3,
    "filesModified": 2,
    "regressions": 0
  }
})
```

**Event Types**: STARTED, PROGRESS, ISSUE, COMPLETED, FAILED, PAUSED, RESUMED, TESTED, QUERY

---

## Common Patterns

### Pattern 1: Single PRD Workflow

```python
# 1. Interview
interview_data = skill("prd-interview")

# 2. Create
result = skill("prd-create", {"interviewData": interview_data})

# 3. Execute
result = skill("prd-execute", {"prdId": result["prdIds"][0]})

# 4. Test
result = skill("prd-test", {"prdId": result["prdIds"][0]})

# 5. Track
result = skill("prd-track", {
  "prdId": result["prdIds"][0],
  "eventType": "COMPLETED",
  "eventData": {...}
})
```

### Pattern 2: Multi-PRD Workflow

```python
# 1. Interview
interview_data = skill("prd-interview")

# 2. Plan (if big ask)
if is_big_ask(interview_data):
  plan = skill("prd-plan", interview_data)
else:
  plan = null

# 3. Create all PRDs
result = skill("prd-create", {
  "interviewData": interview_data,
  "prdPlan": plan
})

# 4. Execute each PRD in order
for prd_id in result["prdIds"]:
  skill("prd-execute", {"prdId": prd_id})
  skill("prd-test", {"prdId": prd_id})
  skill("prd-track", {
    "prdId": prd_id,
    "eventType": "COMPLETED",
    "eventData": {...}
  })

# 5. Done!
print("All PRDs completed successfully!")
```

### Pattern 3: Track Progress Mid-Execution

```python
# Start PRD
prd_id = "PRD-20250115-143022"

# Track start
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "STARTED",
  "eventData": {"startedBy": "AI Agent"}
})

# Implement first criterion
# ... implementation work ...

# Track progress
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "PROGRESS",
  "eventData": {
    "achievement": "Implemented user registration",
    "criteriaCompleted": [1],
    "filesCreated": 2
  }
})

# Implement second criterion
# ... implementation work ...

# Issue encountered!
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "ISSUE",
  "eventData": {
    "issue": "Email service not responding",
    "severity": "Medium",
    "impact": "Cannot send verification emails",
    "resolution": "Pending - switching to backup provider"
  }
})

# Resolve issue and continue
# ... fix issue ...

# Complete PRD
skill("prd-execute", {"prdId": prd_id})
skill("prd-test", {"prdId": prd_id})
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "COMPLETED",
  "eventData": {...}
})
```

### Pattern 4: Retry Failed PRD

```python
# PRD failed
prd_id = "PRD-20250115-143022"

# Track failure
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "FAILED",
  "eventData": {
    "reason": "Tests failing for criterion 3",
    "blockers": ["Email verification not working"],
    "canRetry": true
  }
})

# Fix issues manually or let agent retry
# ... fix issues ...

# Resume execution
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "RESUMED",
  "eventData": {"resumedBy": "AI Agent"}
})

# Try again
skill("prd-execute", {"prdId": prd_id, "continueMode": true})
skill("prd-test", {"prdId": prd_id})

# Success!
skill("prd-track", {
  "prdId": prd_id,
  "eventType": "COMPLETED",
  "eventData": {...}
})
```

---

## Tips and Best Practices

1. **Always call skills in order**: interview → (plan) → create → execute → test → track
2. **Check PRD dependencies**: Before executing a PRD, ensure all dependencies are DONE
3. **Test thoroughly**: Never mark a PRD as DONE without running tests
4. **Log progress**: Use `prd-track` regularly to maintain good history
5. **Handle failures gracefully**: If a PRD fails, log it, fix issues, and retry
6. **Review logs**: Check `/dev/prd/logs/<prd-id>.md` for detailed progress
7. **Verify file creation**: After `prd-create`, verify all files were created
8. **Run full test suite**: Always run `npm test` after each PRD
9. **Check for regressions**: Ensure new work doesn't break existing functionality
10. **Keep PRDs focused**: Each PRD should implement 3-7 criteria

---

## Troubleshooting

### Skill not found
**Solution**: Ensure skills are in `.opencode/skill/<name>/SKILL.md` directory

### prd.json doesn't exist
**Solution**: `prd-create` will create it with an empty array automatically

### Tests failing after PRD
**Solution**: 
1. Use `prd-track` to log the failure
2. Run `prd-execute` again with `continueMode: true`
3. Re-run `prd-test` after fixes

### Dependencies not satisfied
**Solution**: Complete dependent PRDs first, check status in `/dev/prd/prd.json`

### Permission denied when creating files
**Solution**: Check write permissions for `/dev/prd/` directory

---

Happy coding with the te9-method's OpenCode Skills! 🚀