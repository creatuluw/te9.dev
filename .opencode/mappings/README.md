# OpenMemory Mappings Directory

This directory contains comprehensive mappings between OpenMemory tool functions and the OpenMemory Backend API, along with required session variable documentation.

## Purpose

These mappings provide:
- **API Endpoint Specifications**: Exact OpenMemory Backend API endpoints and their parameters
- **Tool Function Mappings**: How LLM tool functions map to API calls
- **Variable Definitions**: Required session variables and how to determine them
- **Parameter References**: Complete parameter documentation for all operations

## Files

### [VARIABLES.md](./VARIABLES.md)
**Required Session Variables Setup**

Defines all variables that MUST be initialized at the start of every LLM/agent session:

- `{{PROJECT_FOLDER_NAME}}` - Project folder name (used as `user_id`)
- `{{OPENMEMORY_API_URL}}` - API base URL
- `{{OPENMEMORY_API_KEY}}` - Optional API key for authentication
- Optional variables for PRD context (`{{CURRENT_PRD_ID}}`, etc.)

**When to read:** Before starting any OpenMemory integration work.

**Key content:**
- Variable determination methods (automatic vs manual)
- Validation checklist
- Usage examples
- Best practices for session initialization

### [OPENMEMORY.md](./OPENMEMORY.md)
**API Endpoint and Tool Function Mappings**

Complete reference mapping tool functions to OpenMemory Backend API endpoints:

- `POST /memory/add` ← `openmemory_openmemory_store()`
- `POST /memory/query` ← `openmemory_openmemory_query()`
- `POST /memory/reinforce` ← Reinforcement operations
- `GET /memory/all` ← List all memories
- User operations (`GET /users/:user_id/*`)
- Temporal graph operations (`/api/temporal/fact`)

**When to read:** When implementing or debugging OpenMemory operations.

**Key content:**
- Exact API request/response formats
- Parameter mappings (function ↔ API)
- Required vs optional parameters
- Usage examples for each endpoint
- Error handling guidance

## Usage Guide

### For Agent/LLM Implementation

1. **Initialize Session First** (See [VARIABLES.md](./VARIABLES.md))
   ```javascript
   const SESSION = {
     PROJECT_FOLDER_NAME: "te9.dev",  // Extracted from working directory
     OPENMEMORY_API_URL: "https://openmemory-production-f483.up.railway.app",  // MCP endpoint
     OPENMEMORY_API_KEY: null  // MCP handles authentication
   }
   ```

2. **Use Tool Functions** (See [OPENMEMORY.md](./OPENMEMORY.md))
   ```javascript
   // Query memories
   openmemory_openmemory_query({
     query: "user preferences",
     user_id: SESSION.PROJECT_FOLDER_NAME
   })
   
   // Store memories
   openmemory_openmemory_store({
     content: "User prefers JWT",
     user_id: SESSION.PROJECT_FOLDER_NAME
   })
   ```

### For Documentation Updates

When updating these mappings:
1. Check [https://openmemory.cavira.app/docs/api/routes](https://openmemory.cavira.app/docs/api/routes) for current API
2. Update [OPENMEMORY.md](./OPENMEMORY.md) with any endpoint changes
3. Update [VARIABLES.md](./VARIABLES.md) if new parameters are introduced
4. Test mappings against actual API responses

## Key Concepts

### Variable Substitution Pattern

All documentation uses `{{VARIABLE_NAME}}` pattern to indicate placeholders that must be resolved at runtime:

```javascript
// Documentation shows:
user_id: "{{PROJECT_FOLDER_NAME}}"

// Runtime resolves to:
user_id: "te9.dev"  // Actual folder name
```

### user_id Parameter

**CRITICAL:** All memory operations require `user_id` parameter set to `{{PROJECT_FOLDER_NAME}}`.

- ✅ **Correct:** `user_id: "{{PROJECT_FOLDER_NAME}}"` (resolves to folder name)
- ❌ **Wrong:** `user_id: "default"` (generic ID, no isolation)
- ❌ **Wrong:** `user_id: "/path/to/project"` (full path, not folder name)

### Context Isolation

Each project maintains separate memory space through `{{PROJECT_FOLDER_NAME}}` variable:

| Project | Working Directory | PROJECT_FOLDER_NAME | user_id |
|---------|------------------|---------------------|----------|
| te9.dev | `E:/projects/te9.dev` | `te9.dev` | `"te9.dev"` |
| recipes-app | `/home/user/recipes-app` | `recipes-app` | `"recipes-app"` |
| blog-platform | `~/workspace/blog-platform` | `blog-platform` | `"blog-platform"` |

## Integration Points

### With [.opencode/prompts/build.md](../prompts/build.md)

Build.md references these mappings for:
- Session variable initialization
- API parameter specifications
- Memory workflow implementation

### With [.opencode/skill/OPENMEMORY.md](../skill/OPENMEMORY.md)

OPENMEMORY.md skill documentation references these mappings for:
- Function parameter details
- API endpoint information
- Usage examples

## Validation

### Session Validation Checklist

Before performing OpenMemory operations:

- [ ] `{{PROJECT_FOLDER_NAME}}` is set to folder name (not full path)
- [ ] `{{OPENMEMORY_API_URL}}` is accessible
- [ ] `{{OPENMEMORY_API_KEY}}` is provided if auth is enabled
- [ ] No generic IDs (e.g., "default", "user123") are used
- [ ] Variables are properly substituted in function calls

### API Mapping Validation

When testing tool functions:

1. Verify function parameters match API body structure
2. Check that `user_id` uses `{{PROJECT_FOLDER_NAME}}`
3. Validate optional parameters have correct defaults
4. Confirm response format matches documentation

## Troubleshooting

### Common Issues

**Issue:** "Variable not substituted"
- **Cause:** Missing `{{}}` wrapper or incorrect variable name
- **Solution:** Use `{{PROJECT_FOLDER_NAME}}` with double curly braces

**Issue:** "user_id contains path separators"
- **Cause:** Using full path instead of folder name
- **Solution:** Extract folder name only, not full path

**Issue:** "No memories found"
- **Cause:** `{{PROJECT_FOLDER_NAME}}` different from previous sessions
- **Solution:** Ensure same folder name is used consistently

## References

- **[OpenMemory API Documentation](https://openmemory.cavira.app/docs/api/routes)** - Official API reference
- **[.opencode/prompts/build.md](../prompts/build.md)** - Implementation workflows
- **[.opencode/skill/OPENMEMORY.md](../skill/OPENMEMORY.md)** - Skill usage guide

## Summary

| File | Purpose | When to Reference |
|-------|----------|------------------|
| [VARIABLES.md](./VARIABLES.md) | Required session variables | Before session initialization |
| [OPENMEMORY.md](./OPENMEMORY.md) | API endpoint mappings | When implementing/debugging operations |
| [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) | Production MCP configuration | Setting up or troubleshooting production access |

**Key Requirement:** Always initialize session variables first (see [VARIABLES.md](./VARIABLES.md)), then use tool functions with proper parameter mappings (see [OPENMEMORY.md](./OPENMEMORY.md)). For production setup, see [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md).