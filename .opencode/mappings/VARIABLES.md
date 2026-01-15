# OpenMemory Required Variables

This document defines all variables that MUST be set at the start of every LLM/agent session for proper OpenMemory integration.

## Table of Contents

- [Session Setup](#session-setup)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Variable Determination](#variable-determination)
- [Usage Examples](#usage-examples)
- [Validation Checklist](#validation-checklist)

---

## Session Setup

At the start of every LLM/agent session, the following variables MUST be initialized:

```javascript
// Initialize session variables
const SESSION_VARIABLES = {
  PROJECT_FOLDER_NAME: "<extract from working directory>",
  OPENMEMORY_API_URL: "<configured base URL>",
  OPENMEMORY_API_KEY: "<optional - if configured>"
}
```

**Timing:** These variables should be set BEFORE any OpenMemory operations are performed.

---

## Required Variables

### {{PROJECT_FOLDER_NAME}}

**Description:** The root folder name of the current project (NOT the full path).

**Purpose:** Used as the `user_id` parameter for ALL OpenMemory operations to ensure proper context isolation between projects.

**Examples:**
- `te9.dev`
- `myproject`
- `recipes-app`
- `blog-platform`

**Determination Method:**
Extract the folder name from the current working directory path.

**Examples:**
- Working in `E:/projects/te9.dev` → `PROJECT_FOLDER_NAME = "te9.dev"`
- Working in `/home/user/myproject` → `PROJECT_FOLDER_NAME = "myproject"`
- Working in `~/workspace/app` → `PROJECT_FOLDER_NAME = "app"`

**CRITICAL REQUIREMENTS:**
- ✅ Use folder NAME only (not full path)
- ✅ Must be consistent across all operations in a session
- ❌ Do NOT use generic IDs like "default" or "user123"
- ❌ Do NOT use full paths like "E:/projects/te9.dev"
- ❌ Do NOT include slashes or special characters

**Usage:**
```javascript
// In all OpenMemory operations
openmemory_openmemory_query({
  query: "user preferences",
  user_id: "{{PROJECT_FOLDER_NAME}}"  // e.g., "te9.dev"
})

openmemory_openmemory_store({
  content: "Decision made",
  user_id: "{{PROJECT_FOLDER_NAME}}"  // e.g., "te9.dev"
})
```

---

### {{OPENMEMORY_API_URL}}

**Description:** The base URL of the OpenMemory Backend API.

**Purpose:** Specifies the API endpoint for all OpenMemory operations.

-**Default Value:** `https://openmemory-production-f483.up.railway.app`

-**Examples:**
-- `https://openmemory-production-f483.up.railway.app` (production)
-- `http://localhost:8080` (local development)
-- `http://192.168.1.100:8080` (local network)

**Determination Method:**
-Read from MCP configuration in `opencode.json` (`mcp.openmemory.url`)
- Currently configured: `https://openmemory-production-f483.up.railway.app/mcp`

**Usage:**
```javascript
-// Used internally by MCP server
-// Not typically passed directly in function calls
-const MCP_ENDPOINT = "{{OPENMEMORY_API_URL}}"
-// Currently: https://openmemory-production-f483.up.railway.app/mcp
-```
```

---

### {{OPENMEMORY_API_KEY}}

**Description:** Optional API key for authentication (if configured).

**Purpose:** Authenticates requests to OpenMemory Backend when using direct API calls.

**Default Value:** `null` (authentication disabled)

**MCP Note:** When accessing OpenMemory via MCP server (configured in `opencode.json`), authentication is handled by the MCP connection. This variable is typically not needed for MCP-based access.

**Examples:**
- `your-secret-key`
- `sk_live_12345abcde`
- Environment variable: `${OPENMEMORY_API_KEY}`

**Determination Method:**
Read from configuration file or environment variable. If not configured, authentication is disabled.

**Usage:**
```javascript
// Sent as HTTP header (direct API access only - not needed for MCP)
headers: {
  "x-api-key": "{{OPENMEMORY_API_KEY}}"
}
```

---

## MCP Configuration

**Important:** OpenMemory is accessed via MCP (Model Context Protocol) server in this setup.

### Current MCP Setup

Configuration is defined in `opencode.json`:

```json
{
  "mcp": {
    "openmemory": {
      "type": "remote",
      "url": "https://openmemory-production-f483.up.railway.app/mcp"
    }
  }
}
```

### How MCP Changes Variable Usage

| Variable | Direct API Access | MCP Access |
|-----------|------------------|-------------|
| `{{PROJECT_FOLDER_NAME}}` | Passed as `user_id` parameter | Passed as `user_id` parameter |
| `{{OPENMEMORY_API_URL}}` | Used as HTTP endpoint | Handled by MCP server (configured in opencode.json) |
| `{{OPENMEMORY_API_KEY}}` | Sent as `x-api-key` header | **Not needed** - MCP handles authentication |

### MCP vs Direct API

**Using MCP (Current Setup):**
- Endpoint URL is configured in `opencode.json`
- Authentication is handled by MCP connection
- Variables are passed directly to MCP tools
- `{{OPENMEMORY_API_KEY}}` is typically not needed

**Using Direct API (Alternative):**
- Endpoint URL must be provided
- API key must be sent in headers
- HTTP requests made directly to OpenMemory Backend
- Requires `{{OPENMEMORY_API_KEY}}` configuration

### Benefits of MCP

- **Simplified configuration**: URL and auth in one place (opencode.json)
- **Consistent access**: Same MCP tools across all projects
- **Automatic auth**: No need to manage API keys in code
- **Tool integration**: MCP tools integrate directly with LLM tool calling

---

## Optional Variables

These variables are not required for basic operation but can be useful in specific scenarios.

### {{CURRENT_PRD_ID}}

**Description:** The ID of the currently active PRD.

**Purpose:** Automatically includes PRD context in memory operations.

**Example:** `PRD-20250115-143022`

**Usage:**
```javascript
openmemory_openmemory_store({
  content: "Decision made during PRD execution",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  metadata: {
    prdId: "{{CURRENT_PRD_ID}}"
  }
})
```

---

### {{CURRENT_INTERVIEW_ID}}

**Description:** The ID of the current interview session.

**Purpose:** Tracks interview-related memories.

**Example:** `INT-20250115-154039`

**Usage:**
```javascript
openmemory_openmemory_store({
  content: "Interview response captured",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  metadata: {
    source: "prd-interview",
    interviewId: "{{CURRENT_INTERVIEW_ID}}"
  }
})
```

---

### {{MEMORY_CONTEXT_TYPE}}

**Description:** The current context type for memory operations.

**Purpose:** Optimizes queries for specific scenarios.

**Values:**
- `general` - Default context gathering
- `prd-interview` - Before PRD interview
- `prd-execute` - Before PRD execution
- `decision-support` - For technical decisions
- `debugging` - For troubleshooting

**Usage:**
```javascript
openmemory_openmemory_query({
  query: "similar work",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  contextType: "{{MEMORY_CONTEXT_TYPE}}"
})
```

---

## Variable Determination

### Automatic Detection (Recommended)

The agent should automatically detect and set `{{PROJECT_FOLDER_NAME}}` based on the working directory:

```javascript
// Pseudo-code for automatic detection
function determineProjectFolderName(workingDirectory) {
  // Extract last folder name from path
  const pathParts = workingDirectory.split(/[/\\]/)
  return pathParts[pathParts.length - 1]
}

// Example
const workingDirectory = "E:/projects/te9.dev"
const PROJECT_FOLDER_NAME = determineProjectFolderName(workingDirectory)
// Result: "te9.dev"
```

### Manual Configuration (Fallback)

If automatic detection fails, variables can be manually configured:

```javascript
// Configuration file: .opencode/config.json
{
  "variables": {
    "PROJECT_FOLDER_NAME": "te9.dev",
      OPENMEMORY_API_URL: "https://openmemory-production-f483.up.railway.app",
    "OPENMEMORY_API_KEY": "your-secret-key"
  }
}
```

### Environment Variables

Variables can also be sourced from environment:

```bash
# .env file
PROJECT_FOLDER_NAME=te9.dev
OPENMEMORY_API_URL=http://localhost:8080
OPENMEMORY_API_KEY=your-secret-key
```

---

## Usage Examples

### Example 1: Basic Session Initialization

```javascript
// At start of every session
const SESSION = {
  -PROJECT_FOLDER_NAME=te9.dev
  -OPENMEMORY_API_URL=https://openmemory-production-f483.up.railway.app
  -# OPENMEMORY_API_KEY not needed for MCP
}

// Use in memory operations
context = openmemory_openmemory_query({
  query: "user preferences",
  user_id: SESSION.PROJECT_FOLDER_NAME
})
```

### Example 2: PRD Session with Context

```javascript
// Initialize session
const SESSION = {
  PROJECT_FOLDER_NAME: "myproject",
    OPENMEMORY_API_URL: "https://openmemory-production-f483.up.railway.app",
  CURRENT_PRD_ID: "PRD-20250115-143022",
  MEMORY_CONTEXT_TYPE: "prd-execute"
}

// Query with PRD context
context = openmemory_openmemory_query({
  query: "implementation patterns",
  user_id: SESSION.PROJECT_FOLDER_NAME,
  contextType: SESSION.MEMORY_CONTEXT_TYPE
})

// Store with PRD metadata
openmemory_openmemory_store({
  content: "Completed feature implementation",
  user_id: SESSION.PROJECT_FOLDER_NAME,
  metadata: {
    prdId: SESSION.CURRENT_PRD_ID,
    source: "prd-execute"
  }
})
```

### Example 3: Interview Session

```javascript
// Initialize session
const SESSION = {
  PROJECT_FOLDER_NAME: "recipes-app",
    OPENMEMORY_API_URL: "https://openmemory-production-f483.up.railway.app",
  CURRENT_INTERVIEW_ID: "INT-20250115-154039",
  MEMORY_CONTEXT_TYPE: "prd-interview"
}

// Query before interview
context = openmemory_openmemory_query({
  query: "user preferences for recipe features",
  user_id: SESSION.PROJECT_FOLDER_NAME,
  contextType: SESSION.MEMORY_CONTEXT_TYPE
})

// Store interview responses
openmemory_openmemory_store({
  content: "User wants social sharing for recipes",
  user_id: SESSION.PROJECT_FOLDER_NAME,
  metadata: {
    source: "prd-interview",
    interviewId: SESSION.CURRENT_INTERVIEW_ID
  }
})
```

---

## Validation Checklist

Before performing any OpenMemory operations, verify:

- [ ] `{{PROJECT_FOLDER_NAME}}` is set to folder name (not full path)
- [ ] `{{PROJECT_FOLDER_NAME}}` is consistent across operations
- [ ] `{{OPENMEMORY_API_URL}}` is accessible (MCP endpoint: `https://openmemory-production-f483.up.railway.app/mcp`)
- [ ] MCP server is configured in `opencode.json` (`mcp.openmemory.url`)
- [ ] `{{OPENMEMORY_API_KEY}}` is provided only if using direct API (not needed for MCP)
- [ ] No generic IDs (e.g., "default", "user123") are used
- [ ] Variables are properly substituted in function calls

### Quick Validation

```javascript
// Validate session variables
function validateSession(session) {
  const errors = []
  
  // Check PROJECT_FOLDER_NAME
  if (!session.PROJECT_FOLDER_NAME) {
    errors.push("PROJECT_FOLDER_NAME is not set")
  } else if (session.PROJECT_FOLDER_NAME.includes("/") || session.PROJECT_FOLDER_NAME.includes("\\")) {
    errors.push("PROJECT_FOLDER_NAME contains path separators - use folder name only")
  } else if (session.PROJECT_FOLDER_NAME === "default" || session.PROJECT_FOLDER_NAME === "user123") {
    errors.push("PROJECT_FOLDER_NAME is using generic ID - use actual project folder name")
  }
  
  // Check OPENMEMORY_API_URL
  if (!session.OPENMEMORY_API_URL) {
    errors.push("OPENMEMORY_API_URL is not set")
  }
  
  // Return validation result
  if (errors.length > 0) {
    throw new Error(`Session validation failed:\n${errors.join("\n")}`)
  }
  
  return true
}

// Usage
validateSession(SESSION)
```

---

## Best Practices

### 1. Initialize Early

Set all variables immediately at session start, before any memory operations.

```javascript
// ✅ CORRECT - Initialize first
const SESSION = { ... }
validateSession(SESSION)
context = openmemory_openmemory_query({ ... })

// ❌ WRONG - Initialize after operations
context = openmemory_openmemory_query({ ... })  // May fail!
const SESSION = { ... }
```

### 2. Use Consistent Naming

Maintain consistent variable naming across your codebase.

```javascript
// Recommended naming
const PROJECT_FOLDER_NAME = "te9.dev"
  OPENMEMORY_API_URL: "https://openmemory-production-f483.up.railway.app",
const OPENMEMORY_API_KEY = "your-secret-key"
```

### 3. Validate Before Use

Always validate variables before use to catch errors early.

```javascript
if (!PROJECT_FOLDER_NAME || PROJECT_FOLDER_NAME.includes("/")) {
  throw new Error("Invalid PROJECT_FOLDER_NAME")
}
```

### 4. Use Environment-Specific Config

Different environments should have different configurations.

```javascript
// Development
const DEV_CONFIG = {
  OPENMEMORY_API_URL: "http://localhost:8080",
  OPENMEMORY_API_KEY: null
}

// Production
const PROD_CONFIG = {
  OPENMEMORY_API_URL: "https://openmemory.example.com",
  OPENMEMORY_API_KEY: process.env.OPENMEMORY_API_KEY
}
```

### 5. Log Variable State

For debugging, log variable state at session start.

```javascript
console.log("Session initialized:", {
  PROJECT_FOLDER_NAME,
  OPENMEMORY_API_URL,
  hasApiKey: !!OPENMEMORY_API_KEY
})
```

---

## Troubleshooting

### Issue: "user_id not found"

**Cause:** `{{PROJECT_FOLDER_NAME}}` is not set or empty.

**Solution:** Ensure `{{PROJECT_FOLDER_NAME_NAME}}` is properly initialized and validated.

---

### Issue: "Authentication failed"

**Cause:** `{{OPENMEMORY_API_KEY}}` is missing or incorrect.

**Solution:** Verify API key configuration and that it matches the backend configuration.

---

### Issue: "Context mixing between projects"

**Cause:** Same `{{PROJECT_FOLDER_NAME}}` used across different projects.

**Solution:** Ensure each project uses its own folder name as `{{PROJECT_FOLDER_NAME}}`.

---

### Issue: "Variable not substituted"

**Cause:** Variable name doesn't match pattern `{{VARIABLE_NAME}}`.

**Solution:** Use double curly braces and correct variable name.

---

### Issue: "MCP connection failed"

**Cause:** OpenMemory MCP server URL is not accessible or misconfigured.

**Solution:** 
1. Verify `mcp.openmemory.url` in `opencode.json` is correct: `https://openmemory-production-f483.up.railway.app/mcp`
2. Check network connectivity to the MCP server
3. Ensure MCP server is running on Railway
4. Review MCP server logs for connection errors

**Current Setup:**
```json
{
  "mcp": {
    "openmemory": {
      "type": "remote",
      "url": "https://openmemory-production-f483.up.railway.app/mcp"
    }
  }
}
```

---

## Summary

| Variable | Type | Required | Example | Used For |
|----------|------|----------|---------|-----------|
| `{{PROJECT_FOLDER_NAME}}` | string | **YES** | `te9.dev` | `user_id` in all memory operations |
| `{{OPENMEMORY_API_URL}}` | string | **YES** | `https://openmemory-production-f483.up.railway.app` | MCP endpoint base URL |
| `{{OPENMEMORY_API_KEY}}` | string | optional | `null` (MCP handles auth) | MCP authentication (if configured) |
| `{{CURRENT_PRD_ID}}` | string | optional | `PRD-20250115-143022` | PRD context in metadata |
| `{{CURRENT_INTERVIEW_ID}}` | string | optional | `INT-20250115-154039` | Interview tracking |
| `{{MEMORY_CONTEXT_TYPE}}` | string | optional | `prd-execute` | Optimized queries |

**Key Requirement:** All memory operations MUST use `{{PROJECT_FOLDER_NAME}}` as the `user_id` parameter to ensure proper project context isolation.

**Remember:** Initialize session variables first, validate them, and then use them consistently throughout the session.