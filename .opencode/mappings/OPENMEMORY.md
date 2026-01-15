# OpenMemory API Mappings

This document maps OpenMemory tool functions to OpenMemory Backend API endpoints, including exact attributes, parameters, and required variables.

## Table of Contents

- [Required Variables](#required-variables)
- [API Endpoint Mappings](#api-endpoint-mappings)
- [Tool Function → API Mapping](#tool-function--api-mapping)
- [Parameter Reference](#parameter-reference)
- [Usage Examples](#usage-examples)

---

## Required Variables

The following variables MUST be set at the start of every LLM/agent session:

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `{{PROJECT_FOLDER_NAME}}` | **Root folder name** of current project (not full path) | `te9.dev`, `myproject`, `recipes-app` | Extracted from working directory |
| `{{OPENMEMORY_API_URL}}` | OpenMemory Backend API base URL (accessed via MCP server) | `https://openmemory-production-f483.up.railway.app` | Configuration (`opencode.json` MCP settings) |
| `{{OPENMEMORY_API_KEY}}` | API key for authentication (if configured) | `your-secret-key` | Configuration |

**MCP Access Note:** OpenMemory is accessed via MCP server configured in `opencode.json`. The MCP endpoint URL is `https://openmemory-production-f483.up.railway.app/mcp`. Authentication is handled by the MCP connection, so `{{OPENMEMORY_API_KEY}}` is typically not needed when using MCP tools.

**CRITICAL:** The `{{PROJECT_FOLDER_NAME}}` is used as the `user_id` parameter for ALL OpenMemory operations to ensure proper context isolation.

---

## API Endpoint Mappings

### 1. Memory Operations

#### Store Memory
```
POST /memory/add
```

**Request Body:**
```json
{
  "content": "User likes blue widgets",
  "tags": ["preference"],
  "metadata": { "source": "chat" },
  "user_id": "{{PROJECT_FOLDER_NAME}}"
}
```

**Tool Function Mapping:**
```javascript
openmemory_openmemory_store({
  content: "User likes blue widgets",
  tags: ["preference"],
  metadata: { "source": "chat" },
  user_id: "{{PROJECT_FOLDER_NAME}}"
})
// Maps to: POST /memory/add
```

#### Query Memory
```
POST /memory/query
```

**Request Body:**
```json
{
  "query": "What widgets does the user like?",
  "k": 20,
  "filters": {
    "sector": "semantic",
    "min_score": 0.5,
    "user_id": "{{PROJECT_FOLDER_NAME}}"
  }
}
```

**Tool Function Mapping:**
```javascript
openmemory_openmemory_query({
  query: "What widgets does the user like?",
  limit: 20,
  filters: {
    sector: "semantic",
    min_score: 0.5,
    user_id: "{{PROJECT_FOLDER_NAME}}"
  }
})
// Maps to: POST /memory/query
```

#### Reinforce Memory
```
POST /memory/reinforce
```

**Request Body:**
```json
{
  "id": "memory-uuid-here",
  "boost": 0.1
}
```

#### Update Memory
```
PATCH /memory/:id
```

**Request Body:**
```json
{
  "content": "Updated content",
  "tags": ["new-tag"],
  "user_id": "{{PROJECT_FOLDER_NAME}}"
}
```

#### Get All Memories
```
GET /memory/all?l=100&u=0&sector=semantic&user_id={{PROJECT_FOLDER_NAME}}
```

**Query Parameters:**
- `l` - Limit (default: 100)
- `u` - Offset (default: 0)
- `sector` - Filter by sector (episodic, semantic, procedural, emotional, reflective)
- `user_id` - Filter by user

#### Delete Memory
```
DELETE /memory/:id
```

**Query/Body:** `user_id` (optional, for ownership check)

---

### 2. Temporal Graph Operations

#### Create Fact
```
POST /api/temporal/fact
```

**Request Body:**
```json
{
  "subject": "Company",
  "predicate": "has_CEO",
  "object": "Alice",
  "valid_from": "2024-01-01",
  "confidence": 1.0
}
```

**Note:** Facts are entity relationships in a temporal graph, separate from contextual memories. No `user_id` required.

#### Get Current Fact
```
GET /api/temporal/fact/current?subject=Company&predicate=has_CEO
```

#### Update Fact
```
PATCH /api/temporal/fact/:id
```

**Request Body:**
```json
{
  "confidence": 0.8,
  "metadata": { "verified": true }
}
```

#### Invalidate Fact
```
DELETE /api/temporal/fact/:id
```

**Request Body:**
```json
{
  "valid_to": "2024-12-31"
}
```

#### Timeline & Analysis
```
GET /api/temporal/timeline
GET /api/temporal/search
GET /api/temporal/compare
GET /api/temporal/stats
GET /api/temporal/volatile
```

---

### 3. User Operations

#### Get User Summary
```
GET /users/{{PROJECT_FOLDER_NAME}}/summary
```

**Response:** Summary of user's memories, patterns, and insights.

#### Get User Memories
```
GET /users/{{PROJECT_FOLDER_NAME}}/memories
```

**Response:** All memories for the specified user_id.

#### Delete User Memories
```
DELETE /users/{{PROJECT_FOLDER_NAME}}/memories
```

**Note:** This is a destructive operation - deletes all memories for the user.

---

## Tool Function → API Mapping

### openmemory_openmemory_query()

**Maps to:** `POST /memory/query`

**Parameters:**
```javascript
openmemory_openmemory_query({
  query: string,           // Search query or keywords
  limit: number = 20,      // Maps to: k in API
  user_id: string,         // Maps to: filters.user_id in API (MUST be {{PROJECT_FOLDER_NAME}})
  sector?: string,         // Maps to: filters.sector in API
  min_score?: number,      // Maps to: filters.min_score in API
  timeframe?: {            // Additional filtering (not directly supported by API, handle client-side)
    start: string,         // ISO 8601 date
    end: string           // ISO 8601 date
  }
})
```

**API Mapping:**
```javascript
// Function call
openmemory_openmemory_query({
  query: "authentication patterns",
  limit: 20,
  user_id: "{{PROJECT_FOLDER_NAME}}",
  sector: "semantic",
  min_score: 0.5
})

// Maps to API request
POST /memory/query
{
  "query": "authentication patterns",
  "k": 20,
  "filters": {
    "user_id": "{{PROJECT_FOLDER_NAME}}",
    "sector": "semantic",
    "min_score": 0.5
  }
}
```

---

### openmemory_openmemory_store()

**Maps to:** `POST /memory/add`

**Parameters:**
```javascript
openmemory_openmemory_store({
  content: string,         // Memory content (1-2000 characters)
  user_id: string,         // Maps to: user_id in API (MUST be {{PROJECT_FOLDER_NAME}})
  sector?: string,         // Stored in metadata
  tags?: string[],         // Maps to: tags in API
  metadata?: object,       // Maps to: metadata in API
  reinforce?: boolean,     // Triggers additional call to POST /memory/reinforce
  importance?: string,     // Determines boost value (low: 0.05, medium: 0.1, high: 0.2, critical: 0.5)
  ttl?: number,           // Time-to-live in days (client-side handling)
  timestamp?: string      // ISO 8601 timestamp (stored in metadata)
})
```

**API Mapping:**
```javascript
// Function call
openmemory_openmemory_store({
  content: "User prefers JWT authentication",
  user_id: "{{PROJECT_FOLDER_NAME}}",
  sector: "emotional",
  tags: ["preference", "authentication", "JWT"],
  metadata: {
    source: "chat",
    confidence: "high"
  },
  reinforce: true,
  importance: "high"
})

// Maps to API request
POST /memory/add
{
  "content": "User prefers JWT authentication",
  "tags": ["preference", "authentication", "JWT"],
  "user_id": "{{PROJECT_FOLDER_NAME}}",
  "metadata": {
    "source": "chat",
    "confidence": "high",
    "sector": "emotional",
    "importance": "high"
  }
}

// Followed by (if reinforce: true)
POST /memory/reinforce
{
  "id": "<returned_memory_id>",
  "boost": 0.2  // high importance = 0.2
}
```

**Importance → Boost Mapping:**
- `low` → `0.05`
- `medium` → `0.1`
- `high` → `0.2`
- `critical` → `0.5`

---

## Parameter Reference

### user_id

**CRITICAL REQUIREMENT:** Must always be `{{PROJECT_FOLDER_NAME}}`

- **Incorrect:** `user123`, `default`, `/path/to/project`
- **Correct:** `te9.dev`, `myproject`, `recipes-app`

**Usage:**
- Required in ALL memory operations
- Ensures context isolation between projects
- Used in: `POST /memory/add`, `POST /memory/query`, `GET /memory/all`, `GET /users/:user_id/*`

### query

**Type:** string

**Purpose:** Search query or natural language question

**Examples:**
- `"authentication patterns"`
- `"What does the user prefer for databases?"`
- `"user feedback on UI design"`

**Used in:** `POST /memory/query`

### k / limit

**Type:** number (default: 20 for query, 100 for all)

**Purpose:** Maximum number of results to return

**API Parameter:** `k` in POST /memory/query
**Function Parameter:** `limit`

**Used in:** `POST /memory/query`, `GET /memory/all`

### filters

**Type:** object

**Properties:**
- `sector`: Filter by memory sector (episodic, semantic, procedural, emotional, reflective)
- `min_score`: Minimum relevance/salience score (0.0-1.0)
- `user_id`: Filter by user

**Used in:** `POST /memory/query`

### content

**Type:** string (1-2000 characters)

**Purpose:** Memory content to store

**Examples:**
- `"User prefers dark mode with high contrast"`
- `"Decision: Use PostgreSQL for transactional consistency"`
- `"Lesson: Early API validation prevents 80% of integration issues"`

**Used in:** `POST /memory/add`

### tags

**Type:** array<string>

**Purpose:** Categorization tags for better retrieval

**Examples:**
- `["preference", "authentication", "JWT"]`
- `["decision", "database", "PostgreSQL"]`
- `["lesson", "API", "integration"]`

**Used in:** `POST /memory/add`

### metadata

**Type:** object (key-value pairs)

**Purpose:** Additional structured data for filtering and context

**Common Keys:**
- `source`: Source of memory (chat, prd-interview, code-review, etc.)
- `prdId`: Related PRD identifier
- `sector`: Memory sector classification
- `confidence`: Confidence level (low, medium, high)
- `importance`: Importance level (low, medium, high, critical)

**Used in:** `POST /memory/add`

### boost

**Type:** number (0.0-1.0)

**Purpose:** Boost memory salience to prevent decay

**Used in:** `POST /memory/reinforce`

### sector (Memory Sectors)

**Values:**
- `episodic`: Events, conversations, specific occurrences
- `semantic`: Facts, knowledge, technical information
- `procedural`: Workflows, patterns, procedures
- `emotional`: Preferences, feelings, sentiment
- `reflective`: Insights, lessons, meta-analysis

**Used in:** `GET /memory/all` (query param), `POST /memory/query` (filter)

---

## Usage Examples

### Example 1: Basic Query

```javascript
// Before responding to user
context = openmemory_openmemory_query({
  query: "user preferences for authentication",
  limit: 20,
  user_id: "{{PROJECT_FOLDER_NAME}}"  // e.g., "te9.dev"
})

// API Request
POST /memory/query
{
  "query": "user preferences for authentication",
  "k": 20,
  "filters": {
    "user_id": "te9.dev"
  }
}
```

### Example 2: Store with Tags and Metadata

```javascript
// Store user preference
openmemory_openmemory_store({
  content: "User prefers JWT over session-based authentication",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // e.g., "te9.dev"
  sector: "emotional",
  tags: ["preference", "authentication", "JWT"],
  metadata: {
    source: "prd-interview",
    prdId: "PRD-20250115-143022",
    confidence: "high"
  }
})

// API Request
POST /memory/add
{
  "content": "User prefers JWT over session-based authentication",
  "user_id": "te9.dev",
  "tags": ["preference", "authentication", "JWT"],
  "metadata": {
    "source": "prd-interview",
    "prdId": "PRD-20250115-143022",
    "confidence": "high",
    "sector": "emotional"
  }
}
```

### Example 3: Query with Filters

```javascript
// Query for technical decisions
context = openmemory_openmemory_query({
  query: "database technology decisions",
  limit: 15,
  user_id: "{{PROJECT_FOLDER_NAME}}",  // e.g., "te9.dev"
  sector: "semantic",
  min_score: 0.6
})

// API Request
POST /memory/query
{
  "query": "database technology decisions",
  "k": 15,
  "filters": {
    "user_id": "te9.dev",
    "sector": "semantic",
    "min_score": 0.6
  }
}
```

### Example 4: Store and Reinforce

```javascript
// Store critical decision with reinforcement
openmemory_openmemory_store({
  content: "Production endpoints require JWT authentication with 256-bit encryption",
  user_id: "{{PROJECT_FOLDER_NAME}}",  // e.g., "te9.dev"
  sector: "semantic",
  reinforce: true,
  importance: "critical"
})

// API Request 1
POST /memory/add
{
  "content": "Production endpoints require JWT authentication with 256-bit encryption",
  "user_id": "te9.dev",
  "tags": ["auto-generated-tags"],
  "metadata": {
    "sector": "semantic",
    "importance": "critical"
  }
}

// API Request 2 (automatic follow-up)
POST /memory/reinforce
{
  "id": "<returned_memory_id>",
  "boost": 0.5  // critical = 0.5
}
```

### Example 5: Get User Summary

```javascript
// Get project summary
GET /users/{{PROJECT_FOLDER_NAME}}/summary

// Example:
GET /users/te9.dev/summary
```

---

## Temporal Graph Usage

### Example 1: Create Fact

```javascript
// Store entity relationship
POST /api/temporal/fact
{
  "subject": "te9.dev",
  "predicate": "uses",
  "object": "PostgreSQL",
  "valid_from": "2024-01-15",
  "confidence": 1.0
}
```

### Example 2: Query Current Fact

```javascript
// Get current database
GET /api/temporal/fact/current?subject=te9.dev&predicate=uses

// Response:
{
  "object": "PostgreSQL",
  "valid_from": "2024-01-15"
}
```

### Example 3: Invalidate and Replace Fact

```javascript
// Invalidate old fact
DELETE /api/temporal/fact/:id
{
  "valid_to": "2024-12-31"
}

// Create new fact
POST /api/temporal/fact
{
  "subject": "te9.dev",
  "predicate": "uses",
  "object": "MySQL",
  "valid_from": "2025-01-01",
  "confidence": 1.0
}
```

---

## Best Practices

### 1. Always Use {{PROJECT_FOLDER_NAME}} for user_id

```javascript
// ✅ CORRECT
openmemory_openmemory_query({
  query: "preferences",
  user_id: "{{PROJECT_FOLDER_NAME}}"
})

// ❌ WRONG
openmemory_openmemory_query({
  query: "preferences",
  user_id: "user123"  // Breaks context isolation
})
```

### 2. Use Appropriate Limit Values

- Quick queries: `10-15`
- Comprehensive context: `20-30`
- Full history: Use `GET /memory/all` instead

### 3. Tag Consistently

Use consistent tag patterns:
- `preference` for user preferences
- `decision` for technical decisions
- `pattern` for recurring themes
- `lesson` for insights
- Include domain tags: `authentication`, `database`, `UI`

### 4. Leverage Metadata

Store structured data for future filtering:
```javascript
metadata: {
  source: "prd-interview",
  prdId: "PRD-20250115-143022",
  category: "technical",
  impact: "high"
}
```

### 5. Reinforce Important Memories

Critical decisions and patterns should be reinforced:
```javascript
openmemory_openmemory_store({
  content: criticalContent,
  user_id: "{{PROJECT_FOLDER_NAME}}",
  reinforce: true,
  importance: "critical"
})
```

---

## Error Handling

### Common Errors

1. **Missing user_id**
   - Ensure `{{PROJECT_FOLDER_NAME}}` is set
   - Verify variable substitution

2. **No results found**
   - Broaden query terms
   - Increase limit
   - Lower min_score threshold

3. **Invalid sector**
   - Use: episodic, semantic, procedural, emotional, reflective

4. **Content too long**
   - Max 2000 characters
   - Break into multiple related memories

---

## Security Considerations

1. **API Key:** Include `x-api-key` header if configured
2. **User Isolation:** Always use `{{PROJECT_FOLDER_NAME}}` as user_id
3. **Input Validation:** Validate content length before storing
4. **Rate Limiting:** Consider rate limits for high-frequency operations

---

## Summary

| Tool Function | API Endpoint | Required Variables |
|--------------|--------------|-------------------|
| `openmemory_openmemory_query()` | `POST /memory/query` | `{{PROJECT_FOLDER_NAME}}` (user_id) |
| `openmemory_openmemory_store()` | `POST /memory/add` | `{{PROJECT_FOLDER_NAME}}` (user_id) |
| `GET /memory/all` | `GET /memory/all` | `{{PROJECT_FOLDER_NAME}}` (user_id) |
| `GET /users/:user_id/summary` | `GET /users/{{PROJECT_FOLDER_NAME}}/summary` | `{{PROJECT_FOLDER_NAME}}` |

**Key Takeaway:** All memory operations MUST use `{{PROJECT_FOLDER_NAME}}` as the `user_id` parameter to ensure proper project context isolation.