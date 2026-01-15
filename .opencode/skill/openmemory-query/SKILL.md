---
name: openmemory-query
description: Query OpenMemory with intelligent filtering, analysis, and context extraction
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: memory-management
  category: openmemory
---

# OpenMemory Query Skill

## ⚠️ CRITICAL: userId MUST Be Project Folder Name

**The `userId` parameter is MANDATORY and MUST be set to the project folder name (not the full path).**

This ensures **context isolation** between projects/repositories. Each project has its own memory space, preventing cross-contamination and maintaining proper context boundaries.

**How to Determine userId:**
- The **folder name** of the current project (e.g., `"te9.dev"`)
- The **last segment** of the working directory when the agent is invoked
- The **repository name** for repo-based work

**Examples:**
```javascript
// ✅ CORRECT - Using folder name as userId
skill("openmemory-query", {
  "query": "user preferences",
  "userId": "te9.dev"
})
```

// ❌ WRONG - Using generic user ID
skill("openmemory-query", {
  "query": "user preferences",
  "userId": "user123"  // Wrong! Not project-scoped
})
```

**This is non-negotiable**: Every `openmemory-query` call must use the project folder as `userId`.

## What I Do

I provide intelligent querying capabilities for OpenMemory with automatic filtering, sector-based analysis, and structured context extraction. I transform raw memory results into actionable insights.

## When to Use Me

Use me whenever you need to:
- **Query before responding** to a user request (mandatory workflow)
- **Retrieve context** about a specific topic or entity
- **Find past decisions** and patterns
- **Get user preferences** and interaction history
- **Discover relationships** between entities in memory
- **Analyze procedural knowledge** and workflows
- **Check emotional context** and user sentiment
- **Find relevant technical context** for development work

## Quick Start

### Basic Usage

```javascript
result = skill("openmemory-query", {
  "query": "user preferences for UI design",
  "userId": "te9.dev"
})
```

### With Sector Filtering

```javascript
result = skill("openmemory-query", {
  "query": "authentication implementation decisions",
  "userId": "te9.dev",
  "sectors": ["semantic", "procedural"],
  "limit": 15
})
```

### For PRD Workflow Integration

```javascript
result = skill("openmemory-query", {
  "query": "similar features or bugfixes",
  "context": "user authentication",
  "userId": "te9.dev",
  "analysis": true
})
```

## Parameters

### Required Parameters

- **query** (string): Search query or keywords
  - Use relevant keywords for best results
  - Supports natural language queries
  - Examples: "user preferences", "API decisions", "bug patterns"

- **userId** (string): User identifier - **MUST be project folder name**
  - **Examples**: `"te9.dev"`, `"myproject"`, `"app"`
  - Ensures context isolation between projects/repositories
  - Use the folder name (not full path) of the current working directory or repository
  - **NEVER** use generic IDs like "user123" or "default"

### Optional Parameters

- **limit** (number, default: 20): Maximum results to return
  - Range: 1-100
  - Higher limit = more comprehensive but slower
  - Recommended: 10-20 for most queries

- **sectors** (array<string>, default: all): Filter by memory sectors
  - Options: `episodic`, `semantic`, `procedural`, `emotional`, `reflective`
  - Can query multiple sectors: `["semantic", "procedural"]`
  - Default: queries all sectors for comprehensive results

- **timeframe** (object, optional): Filter by time range
  - ```json
    {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
    ```
  - ISO 8601 format required
  - Useful for recent interactions or historical context

- **minSalience** (number, optional): Minimum relevance score
  - Range: 0.0-1.0
  - Default: 0.3
  - Filters out low-relevance memories

- **includeDecayed** (boolean, default: false): Include decayed memories
  - `false`: Only active memories (default)
  - `true`: Include memories that have decayed

- **context** (string, optional): Additional context for disambiguation
  - Helps refine query results
  - Example: "related to React components"

- **analysis** (boolean, default: true): Enable intelligent analysis
  - `true`: Provides categorized summaries and insights
  - `false`: Returns raw results only

- **format** (string, default: "structured"): Output format
  - Options: `structured` (JSON), `summary` (markdown), `both`
  - Structured for programmatic use
  - Summary for human-readable output

## Return Data

### Structure

```json
{
  "success": true,
  "query": "user authentication preferences",
  "totalResults": 8,
  "activeResults": 6,
  "decayedResults": 2,
  "analysis": {
    "keyTopics": ["password policy", "JWT tokens", "2FA"],
    "patterns": [
      "User consistently prefers JWT over session-based auth",
      "Strong preference for 2FA on sensitive endpoints"
    ],
    "relationships": {
      "JWT": ["security", "performance", "stateless"],
      "2FA": ["security", "user experience"]
    },
    "decisions": [
      "Adopted JWT tokens for stateless authentication",
      "Required 2FA for admin endpoints"
    ],
    "preferences": {
      "technical": ["JWT", "OpenID Connect"],
      "workflow": ["minimal friction", "clear error messages"]
    }
  },
  "memories": {
    "episodic": [
      {
        "content": "User requested password reset functionality",
        "timestamp": "2024-01-15T10:30:00Z",
        "salience": 0.85,
        "decayScore": 0.92,
        "tags": ["password", "reset", "feature"]
      }
    ],
    "semantic": [
      {
        "content": "JWT tokens use 256-bit encryption",
        "timestamp": "2024-01-10T14:20:00Z",
        "salience": 0.92,
        "decayScore": 0.95,
        "tags": ["JWT", "security", "encryption"]
      }
    ],
    "procedural": [
      {
        "content": "Process for implementing OAuth2 providers",
        "timestamp": "2024-01-12T09:15:00Z",
        "salience": 0.78,
        "decayScore": 0.88,
        "tags": ["OAuth2", "implementation", "workflow"]
      }
    ],
    "emotional": [
      {
        "content": "User expressed frustration with complex login flows",
        "timestamp": "2024-01-14T16:45:00Z",
        "salience": 0.82,
        "decayScore": 0.90,
        "tags": ["UX", "frustration", "login"]
      }
    ],
    "reflective": [
      {
        "content": "Authentication decisions always prioritize security over convenience",
        "timestamp": "2024-01-13T11:00:00Z",
        "salience": 0.75,
        "decayScore": 0.85,
        "tags": ["principle", "security", "priority"]
      }
    ]
  },
  "summary": "User has strong preference for JWT-based authentication with 2FA on sensitive endpoints. Key decisions favor security over convenience, with emphasis on minimal friction and clear UX patterns.",
  "recommendedActions": [
    "Consider JWT implementation for stateless requirements",
    "Include 2FA for admin endpoints",
    "Prioritize clear error messages in authentication flows"
  ]
}
```

## Analysis Features

### Automatic Pattern Detection

I analyze query results to identify:
- **Recurring themes**: Topics that appear multiple times
- **Decision patterns**: Consistent approaches to problems
- **Preference trends**: User choices and habits
- **Technical patterns**: Code/architecture preferences
- **Workflow patterns**: How work is typically approached

### Relationship Extraction

I discover relationships between entities:
- **Direct relationships**: Explicitly stated connections
- **Co-occurrence**: Items appearing together frequently
- **Temporal**: Related events happening in sequence
- **Causal**: Cause-effect relationships

### Confidence Scoring

Each result includes confidence metrics:
- **Salience**: How relevant to the current query
- **Decay Score**: How "fresh" the memory is (considering reinforcement)
- **Confidence**: Overall reliability of the result

## Usage Patterns

### Pattern 1: Before Any User Interaction

```javascript
// MANDATORY: Query before responding to user
context = skill("openmemory-query", {
  "query": "[user's request keywords]",
  "userId": "[user]",
  "limit": 20
})

// Use context to inform response
if (context.analysis.patterns.includes("prefers TypeScript")) {
  // Provide TypeScript examples
}
```

### Pattern 2: PRD Interview Context

```javascript
// Query for similar work before PRD interview
context = skill("openmemory-query", {
  "query": "user authentication features",
  "context": "past features and bugfixes",
  "userId": "te9.dev",
  "sectors": ["episodic", "semantic", "procedural"],
  "analysis": true
})

// Use context to guide interview questions
if (context.analysis.decisions.includes("JWT preferred")) {
  // Ask about JWT specifically
}
```

### Pattern 3: Technical Decision Support

```javascript
// Query for past decisions before implementing
context = skill("openmemory-query", {
  "query": "database schema decisions",
  "sectors": ["semantic", "procedural"],
  "limit": 15,
  "analysis": true
})

// Follow established patterns
if (context.analysis.decisions.includes("use UUIDs for primary keys")) {
  // Implement with UUIDs
}
```

### Pattern 4: Sentiment Awareness

```javascript
// Check emotional context before sensitive topics
context = skill("openmemory-query", {
  "query": "testing preferences",
  "sectors": ["emotional", "reflective"],
  "limit": 10,
  "analysis": true
})

// Adjust approach based on sentiment
if (context.summary.includes("frustration")) {
  // Provide clear, detailed explanations
}
```

## Best Practices

### 1. Use Relevant Keywords

```javascript
// ❌ Too vague
result = skill("openmemory-query", { "query": "stuff" })

// ✅ Specific and relevant
result = skill("openmemory-query", { "query": "React component testing patterns" })
```

### 2. Filter by Sector for Efficiency

```javascript
// ❌ Unnecessarily querying all sectors
result = skill("openmemory-query", { 
  "query": "database schema",
  "sectors": ["episodic", "semantic", "procedural", "emotional", "reflective"]
})

// ✅ Target only relevant sectors
result = skill("openmemory-query", { 
  "query": "database schema",
  "sectors": ["semantic", "procedural"]
})
```

### 3. Limit Results Appropriately

```javascript
// ❌ Too many results, slow and overwhelming
result = skill("openmemory-query", { "query": "UI patterns", "limit": 100 })

// ✅ Reasonable limit for most cases
result = skill("openmemory-query", { "query": "UI patterns", "limit": 20 })
```

### 4. Leverage Analysis

```javascript
// ❌ Ignoring analysis
result = skill("openmemory-query", { "analysis": false })

// ✅ Using analysis for insights
result = skill("openmemory-query", { "analysis": true })
// Access result.analysis for patterns, decisions, preferences
```

### 5. Check for Decayed Memories

```javascript
// Include decayed memories for historical context
result = skill("openmemory-query", {
  "query": "past project decisions",
  "includeDecayed": true,
  "timeframe": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2023-12-31T23:59:59Z"
  }
})
```

## Error Handling

### Common Errors

1. **No results found**
   - Solution: Broaden query keywords, increase limit, check timeframe
   - Or confirm this is genuinely a new topic

2. **Too many irrelevant results**
   - Solution: Add context, filter by sector, increase minSalience

3. **Analysis missing expected patterns**
   - Solution: Increase limit to get more data points
   - Check if analysis is enabled

## Integration with Other Skills

### With prd-interview

```javascript
// Query before interview to gather context
context = skill("openmemory-query", {
  "query": "similar work",
  "context": interview_topic
})

// Pass context to interview skill
skill("prd-interview", { "context": context })
```

### With prd-execute

```javascript
// Query before execution for patterns
context = skill("openmemory-query", {
  "query": "implementation patterns",
  "sectors": ["procedural", "semantic"]
})

// Use patterns to guide implementation
skill("prd-execute", { "prdId": prd_id, "context": context })
```

### With openmemory-store

```javascript
// Query for existing memories before storing
existing = skill("openmemory-query", { "query": topic })

// Only store if new or needs reinforcement
if (existing.totalResults === 0) {
  skill("openmemory-store", { "content": new_content, ... })
} else {
  skill("openmemory-reinforce", { "query": topic })
}
```

## Performance Considerations

- **Query speed**: ~110ms for 20 results (sub-40ms with caching)
- **Sector filtering**: Faster than querying all sectors
- **Timeframe filtering**: Reduces result set, improves speed
- **Analysis overhead**: Adds ~50ms but provides valuable insights
- **Recommendation**: Use sector filters and appropriate limits

## Security & Privacy

- User ID isolation ensures memory privacy
- No data leaves your local system
- Decayed memories are filtered by default
- Salience scoring prevents low-quality results

## Examples

### Example 1: Finding User Preferences

```javascript
result = skill("openmemory-query", {
  "query": "user preferences",
  "userId": "te9.dev",
  "sectors": ["emotional", "reflective"],
  "limit": 15
})

// result.analysis.preferences
// {
//   "visual": ["minimal", "dark mode", "clean typography"],
//   "interaction": ["keyboard shortcuts", "quick actions"],
//   "layout": ["sidebar navigation", "content-focused"]
// }
```

### Example 2: Technical Context for PRD

```javascript
result = skill("openmemory-query", {
  "query": "authentication implementation",
  "sectors": ["semantic", "procedural"],
  "analysis": true
})

// Use for PRD decisions
if (result.analysis.decisions.includes("JWT preferred")) {
  // Specify JWT in PRD
}
```

### Example 3: Finding Similar Work

```javascript
result = skill("openmemory-query", {
  "query": "user profile features",
  "context": "past implementations",
  "limit": 20,
  "analysis": true
})

// result.analysis.patterns
// ["Always include avatar upload", "Privacy settings are critical", ...]
```

## Advanced Features

### Multi-Hop Context

OpenMemory's graph system supports multi-hop reasoning:

```javascript
result = skill("openmemory-query", {
  "query": "JWT token security",
  "hops": 2  // Follow relationships up to 2 levels deep
})

// Finds related concepts: encryption, payload, header, validation, etc.
```

### Temporal Queries

Track how preferences evolve over time:

```javascript
result = skill("openmemory-query", {
  "query": "API design patterns",
  "timeframe": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "analysis": true
})

// Analyze trends and evolution of preferences
```

## Need Help?

- Check OpenMemory documentation: https://openmemory.cavira.app/docs
- Review query examples in the main documentation
- Use `analysis: true` for better understanding of results
- Start with basic queries, then add filters as needed

---

**Remember**: Querying OpenMemory is MANDATORY before responding to any user request in the te9-method workflow. This skill makes it easy and efficient!