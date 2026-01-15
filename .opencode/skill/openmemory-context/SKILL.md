---
name: openmemory-context
description: Gather comprehensive context from OpenMemory across all sectors for conversations and PRD workflow
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: memory-context
  category: openmemory
---

# OpenMemory Context Skill

## What I Do

I gather comprehensive context from OpenMemory across all memory sectors to provide a complete picture before starting conversations, PRD interviews, or development work. I synthesize past decisions, preferences, patterns, and related work into actionable insights.

## When to Use Me

Use me whenever you need to:
- **Get full context** before responding to a user request (MANDATORY in te9-method)
- **Prepare for PRD interview** with relevant past work and preferences
- **Understand user patterns** across all sectors before execution
- **Find related PRDs** and similar work to avoid duplication
- **Analyze trends** in user preferences and technical decisions over time
- **Discover relationships** between entities and concepts
- **Get situational awareness** before starting new features or bugfixes
- **Review emotional context** to understand user sentiment and preferences

## Quick Start

### Get Context Before Any User Request

```javascript
context = skill("openmemory-context", {
  "query": "user's request keywords",
  "userId": "te9.dev"
})
```

### Get Context for PRD Interview

```javascript
context = skill("openmemory-context", {
  "query": "user authentication",
  "contextType": "prd-interview",
  "userId": "te9.dev"
})
```

### Get Context Before PRD Execution

```javascript
context = skill("openmemory-context", {
  "query": "authentication implementation",
  "contextType": "prd-execute",
  "prdId": "PRD-20250115-143022",
  "userId": "te9.dev"
})
```

## Parameters

### Required Parameters

- **query** (string): Primary search query or keywords
  - Use relevant keywords from user's request
  - Examples: "user authentication", "React components", "database design"
  - Supports natural language queries

- **userId** (string): Project folder name (MANDATORY)
  - **MUST be the folder NAME (not full path) of the current project/repo**
  - Examples: "myapp", "te9.dev", "project"
  - Ensures context isolation between projects
  - Default: "default" (WARNING: Do not use! Always use project folder name)
  - See [Critical userId Requirement](#-critical-userid-must-be-project-folder) above

### Optional Parameters

- **contextType** (string, default: "general"): Type of context gathering
  - Options: `general`, `prd-interview`, `prd-execute`, `decision-support`
  - Affects which sectors and details are prioritized
  - See [Context Types](#context-types) below

- **prdId** (string, optional): Related PRD ID
  - Links context to specific PRD
  - Finds memories related to this PRD and its dependencies
  - Used when contextType is "prd-interview" or "prd-execute"

- **timeframe** (object, optional): Time range for context
  - ```json
    {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
    ```
  - Default: All time
  - Useful for recent context or historical analysis

- **includeDecayed** (boolean, default: false): Include decayed memories
  - `false`: Only active memories (default)
  - `true`: Include memories that have faded over time

- **hops** (number, default: 2): Graph traversal depth
  - 0: Direct results only
  - 1: Direct + 1-hop relationships
  - 2: Direct + 2-hop relationships (default)
  - Higher values provide deeper context but slower

- **minSalience** (number, default: 0.1): Minimum relevance score
  - Range: 0.0-1.0
  - Filters out low-relevance memories

- **sectors** (array<string>, optional): Filter by sectors
  - Options: `episodic`, `semantic`, `procedural`, `emotional`, `reflective`
  - Default: All sectors
  - Use to focus context on specific memory types

- **includeFacts** (boolean, default: true): Include temporal facts
  - `true`: Include entity relationships and temporal data
  - `false`: Only semantic/HSG results

- **maxMemories** (number, default: 50): Maximum memories per sector
  - Limit to prevent overwhelming context
  - Default provides comprehensive but manageable results

- **analysisDepth** (string, default: "medium"): Analysis detail level
  - Options: `shallow`, `medium`, `deep`
  - Affects pattern detection and relationship analysis

## Context Types

### General Context

Default type for general user interactions. Provides balanced context across all sectors.

**Priorities**: All sectors equally weighted, recent interactions preferred

**Use when**: Responding to general questions, providing assistance, exploring topics

### PRD Interview Context

Optimized for gathering requirements. Focuses on past work, preferences, and patterns related to the topic.

**Priorities**: Semantic > Procedural > Episodic > Emotional > Reflective

**Includes**:
- Similar past features and bugfixes
- Technical preferences and patterns
- Related PRDs and their outcomes
- User preferences and emotional context
- Lessons learned from similar work

**Use when**: Conducting prd-interview skill

### PRD Execution Context

Optimized for implementing work. Focuses on technical patterns, workflows, and decisions.

**Priorities**: Procedural > Semantic > Reflective > Episodic > Emotional

**Includes**:
- Implementation patterns and workflows
- Technical decisions and rationale
- Related PRD dependencies and their status
- Code style and architecture preferences
- Common pitfalls and lessons learned

**Use when**: Executing prd-execute skill

### Decision Support Context

Optimized for making technical decisions. Focuses on past decisions, outcomes, and patterns.

**Priorities**: Semantic > Reflective > Episodic > Procedural > Emotional

**Includes**:
- Past decisions on similar topics
- Outcomes of those decisions
- Alternative approaches considered
- User and team preferences
- Industry best practices learned

**Use when**: Evaluating options, choosing technologies, architectural decisions

## Return Data

```json
{
  "success": true,
  "query": "user authentication",
  "contextType": "prd-interview",
  "generatedAt": "2025-01-15T14:30:00Z",
  "summary": {
    "overview": "User has strong preference for JWT-based authentication with 2FA on sensitive endpoints. Past implementations used OAuth2 with refresh tokens. User values security over convenience but prefers minimal friction in login flows.",
    "keyInsights": [
      "JWT tokens are preferred over session-based authentication",
      "2FA required for admin endpoints only",
      "User prefers minimal friction in login UX",
      "OAuth2 integration completed successfully in PRD-20240115-143022"
    ],
    "relatedPRDs": [
      "PRD-20240115-143022: OAuth2 integration (DONE)",
      "PRD-20240220-091530: User registration flow (DONE)",
      "PRD-20240310-143022: 2FA implementation (IN_PROGRESS)"
    ]
  },
  "sectors": {
    "episodic": {
      "total": 8,
      "active": 7,
      "decayed": 1,
      "memories": [
        {
          "id": "mem-abc123",
          "content": "Requested OAuth2 integration for authentication",
          "timestamp": "2024-01-15T10:30:00Z",
          "salience": 0.85,
          "decayScore": 0.92,
          "tags": ["authentication", "OAuth2", "feature-request"]
        }
      ]
    },
    "semantic": {
      "total": 12,
      "active": 10,
      "decayed": 2,
      "memories": [
        {
          "id": "mem-def456",
          "content": "JWT tokens use 256-bit encryption with 30-minute expiration",
          "timestamp": "2024-01-10T14:20:00Z",
          "salience": 0.92,
          "decayScore": 0.95,
          "tags": ["JWT", "security", "encryption", "tokens"]
        }
      ]
    },
    "procedural": {
      "total": 5,
      "active": 5,
      "decayed": 0,
      "memories": [
        {
          "id": "mem-ghi789",
          "content": "OAuth2 implementation workflow: 1. Register app, 2. Configure endpoints, 3. Test flow, 4. Deploy",
          "timestamp": "2024-01-12T09:15:00Z",
          "salience": 0.78,
          "decayScore": 0.88,
          "tags": ["OAuth2", "workflow", "implementation", "steps"]
        }
      ]
    },
    "emotional": {
      "total": 4,
      "active": 4,
      "decayed": 0,
      "memories": [
        {
          "id": "mem-jkl012",
          "content": "User expressed frustration with complex login flows requiring multiple steps",
          "timestamp": "2024-01-14T16:45:00Z",
          "salience": 0.82,
          "decayScore": 0.90,
          "tags": ["UX", "frustration", "login", "complexity"]
        }
      ]
    },
    "reflective": {
      "total": 3,
      "active": 3,
      "decayed": 0,
      "memories": [
        {
          "id": "mem-mno345",
          "content": "Lesson learned: Authentication decisions should always prioritize security but balance with UX",
          "timestamp": "2024-01-13T11:00:00Z",
          "salience": 0.75,
          "decayScore": 0.85,
          "tags": ["lesson", "authentication", "security", "UX", "balance"]
        }
      ]
    }
  },
  "facts": [
    {
      "subject": "user-123",
      "predicate": "location",
      "object": "San Francisco",
      "valid_from": "2024-01-01T00:00:00Z",
      "confidence": 1.0
    }
  ],
  "patterns": {
    "technical": [
      "Consistent preference for stateless authentication (JWT)",
      "Standard practice: 256-bit encryption for tokens",
      "Pattern: 30-minute token expiration across projects"
    ],
    "preferences": [
      "Strong preference for minimal friction in UX",
      "Security-focused but UX-aware approach",
      "Prefers OAuth2 over custom auth implementations"
    ],
    "decisions": [
      "JWT > Session-based authentication",
      "2FA required for admin endpoints",
      "Refresh tokens implemented for long-term sessions"
    ]
  },
  "relationships": {
    "direct": [
      {
        "from": "authentication",
        "to": "JWT",
        "weight": 0.92,
        "evidence": 5
      },
      {
        "from": "authentication",
        "to": "2FA",
        "weight": 0.75,
        "evidence": 3
      }
    ],
    "inferred": [
      {
        "from": "security",
        "to": "JWT",
        "weight": 0.85,
        "reason": "JWT is preferred authentication method for security"
      }
    ]
  },
  "recommendations": [
    "Implement JWT with 256-bit encryption and 30-minute expiration",
    "Include 2FA for admin endpoints",
    "Focus on minimal friction login UX (single-page where possible)",
    "Consider OAuth2 if third-party login is needed",
    "Follow established patterns from PRD-20240115-143022"
  ],
  "warnings": [
    "User expressed frustration with complex login flows - avoid multi-step processes",
    "Previous attempt at session-based authentication was rejected",
    "Ensure proper error messages for authentication failures"
  ],
  "nextSteps": [
    "Review PRD-20240115-143022 for OAuth2 implementation details",
    "Check PRD-20240310-143022 for 2FA requirements",
    "Query for similar bugfix patterns if this is a bugfix request"
  ]
}
```

## Usage Patterns

### Pattern 1: MANDATORY - Before Any User Request

```javascript
// Step 1: Query context (MANDATORY in te9-method)
context = skill("openmemory-context", {
  "query": "user request keywords",
  "userId": "te9.dev"
})

// Step 2: Analyze context
if (context.summary.keyInsights.includes("prefers TypeScript")) {
  // Use TypeScript in examples and code
}

if (context.warnings.some(w => w.includes("complex"))) {
  // Avoid overly complex solutions
}

// Step 3: Respond with context-aware answer
// ... incorporate context into response
```

### Pattern 2: Context for PRD Interview

```javascript
// Before conducting PRD interview
context = skill("openmemory-context", {
  "query": interview_topic,
  "contextType": "prd-interview",
  "userId": project_folder_name  // e.g., "myapp"
})

// Use context to guide interview
if (context.patterns.technical.includes("JWT preferred")) {
  // Ask specifically about JWT vs alternatives
}

// Check for similar work
if (context.summary.relatedPRDs.length > 0) {
  // Ask if this builds on or replaces existing work
}

// Incorporate recommendations
context.recommendations.forEach(rec => {
  // Consider these in acceptance criteria
})
```

### Pattern 3: Context for PRD Execution

```javascript
// Before executing PRD
context = skill("openmemory-context", {
  "query": "feature implementation",
  "contextType": "prd-execute",
  "prdId": prdId,
  "userId": project_folder_name  // e.g., "myapp"
})

// Follow established patterns
context.patterns.procedural.forEach(pattern => {
  // Implement according to pattern
})

// Check dependencies
if (context.summary.relatedPRDs.length > 0) {
  // Verify dependencies are complete
}

// Avoid warnings
context.warnings.forEach(warning => {
  // Ensure not repeating past mistakes
})
```

### Pattern 4: Decision Support

```javascript
// When making technical decision
context = skill("openmemory-context", {
  "query": "database selection for transactional requirements",
  "contextType": "decision-support",
  "userId": "te9.dev"
})

// Review past decisions
context.patterns.decisions.forEach(decision => {
  // Consider consistency with past choices
})

// Check outcomes
context.sectors.reflective.memories.forEach(memory => {
  // Learn from past lessons
})

// Make informed decision
if (context.recommendations.includes("PostgreSQL")) {
  // Choose PostgreSQL
}
```

### Pattern 5: Pattern Discovery

```javascript
// Discover patterns across user interactions
context = skill("openmemory-context", {
  "query": "testing approaches",
  "timeframe": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "analysisDepth": "deep",
  "userId": "te9.dev"
})

// Analyze patterns
context.patterns.preferences.forEach(pref => {
  // Document preference trends
})

// Identify evolution
const trends = identifyTrends(context)
// Use trends to understand user growth
```

## Best Practices

### 1. Always Get Context First

```javascript
// ✅ MANDATORY in te9-method
context = skill("openmemory-context", { "query": query, "userId": userId })
// Then respond based on context

// ❌ Never skip context gathering
// Directly responding without memory context
```

### 2. Use Appropriate Context Type

```javascript
// ✅ Use specific context type
context = skill("openmemory-context", {
  "query": "feature implementation",
  "contextType": "prd-execute"
})

// ❌ Don't use general for everything
context = skill("openmemory-context", {
  "query": "feature implementation",
  "contextType": "general"  // Wrong type
})
```

### 3. Leverage Recommendations

```javascript
// ✅ Act on recommendations
context.recommendations.forEach(rec => {
  // Incorporate into work
})

// ❌ Ignore recommendations
// Don't skip the actionable guidance
```

### 4. Check Warnings

```javascript
// ✅ Address warnings proactively
context.warnings.forEach(warning => {
  // Avoid repeating past issues
})

// ❌ Ignore warnings
// Past mistakes will likely be repeated
```

### 5. Use Related PRDs

```javascript
// ✅ Check related work
context.summary.relatedPRDs.forEach(prd => {
  // Don't duplicate work
  // Build on existing solutions
})

// ❌ Ignore related work
// May duplicate effort or miss dependencies
```

### 6. Review Patterns

```javascript
// ✅ Follow established patterns
context.patterns.technical.forEach(pattern => {
  // Maintain consistency
})

// ❌ Ignore patterns
// Inconsistent approach across projects
```

## Integration with PRD Workflow

### Mandatory Memory Workflow

```javascript
// Step 1: QUERY FIRST (MANDATORY)
context = skill("openmemory-context", {
  "query": user_request,
  "userId": project_folder_name  // e.g., "myapp"
})

// Step 2: ANALYZE
// - Review context.summary
// - Check context.patterns
// - Identify related PRDs
// - Review recommendations

// Step 3: INCORPORATE
// - Reference past interactions from context
// - Adapt to preferences found in context
// - Build upon decisions in context
// - Maintain consistency with patterns

// Step 4: STORE LAST (after interaction)
skill("openmemory-store", {
  "content": "Key decision made",
  "userId": userId,
  "sector": "semantic",
  "reinforce": true
})
```

### PRD Interview Integration

```javascript
// Before interview
context = skill("openmemory-context", {
  "query": interview_topic,
  "contextType": "prd-interview",
  "includeRelatedPRDs": true,
  "userId": project_folder_name  // e.g., "myapp"
})

// Conduct interview with context
skill("prd-interview", {
  "context": context,  // Pass context to interview skill
  // ... other parameters
})

// After interview
skill("openmemory-store", {
  "content": `Interview completed: ${interviewData.title}`,
  "userId": userId,
  "sector": "episodic",
  "metadata": { "interviewId": interviewId }
})
```

### PRD Execute Integration

```javascript
// Before execution
context = skill("openmemory-context", {
  "query": "feature implementation",
  "contextType": "prd-execute",
  "prdId": prdId,
  "userId": project_folder_name  // e.g., "myapp"
})

// Execute with context awareness
skill("prd-execute", {
  "prdId": prdId,
  "context": context,
  // ... other parameters
})

// After execution
skill("openmemory-store", {
  "content": `Completed ${prdId}: ${result.summary}`,
  "userId": userId,
  "sector": "episodic",
  "metadata": { "prdId": prdId, "status": "DONE" }
})
```

## Advanced Features

### Multi-Hop Context Discovery

```javascript
// Deep context with 3-hop graph traversal
context = skill("openmemory-context", {
  "query": "authentication security",
  "hops": 3,
  "analysisDepth": "deep"
})

// Finds: authentication -> JWT -> encryption -> 256-bit -> ...
```

### Temporal Trend Analysis

```javascript
// Analyze how preferences evolved over time
context = skill("openmemory-context", {
  "query": "API design patterns",
  "timeframe": {
    "start": "2023-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "analysisDepth": "deep"
})

// Identify trends in technical choices and preferences
```

### Cross-User Context Comparison

```javascript
// Compare contexts across users (with appropriate permissions)
context = skill("openmemory-context", {
  "query": "React component patterns",
  "userId": "te9.dev",
  "compareWith": ["user-123", "user-456"]
})

// Identify shared patterns and unique preferences
```

## Performance Considerations

- **Context gathering speed**: ~200ms for comprehensive context (all sectors, hops=2)
- **Sector filtering**: Faster (~120ms) when sectors specified
- **Shallow analysis**: ~150ms (good for quick context)
- **Deep analysis**: ~300ms (best for complex decisions)
- **Hops impact**: Each additional hop adds ~50ms
- **Recommendation**: Use appropriate contextType and analysisDepth

## Security & Privacy

- User ID isolation ensures privacy
- No data leaves your local system
- Context is never shared externally
- Decayed memories filtered by default
- Related PRDs respect access permissions

## Error Handling

### Common Errors

1. **No context found**
   - Solution: Broaden query, increase timeframe, check userId
   - Or confirm this is genuinely a new topic

2. **Context too overwhelming**
   - Solution: Reduce hops, filter sectors, limit maxMemories
   - Use specific contextType

3. **Missing related PRDs**
   - Solution: Check PRD database integrity
   - Verify PRD IDs in metadata

## Examples

### Example 1: Get Context for Feature Request

```javascript
context = skill("openmemory-context", {
  "query": "user authentication",
  "contextType": "prd-interview",
  "userId": "te9.dev"
})
```

// context.summary.overview:
// "User has strong preference for JWT with 2FA on sensitive endpoints"

// context.recommendations:
// ["Implement JWT with 256-bit encryption", "Include 2FA for admin"]

// context.warnings:
// ["Avoid complex login flows - user expressed frustration"]
```

### Example 2: Context for Bugfix

```javascript
context = skill("openmemory-context", {
  "query": "database timeout during authentication",
  "contextType": "prd-execute",
  "userId": "te9.dev"
})

// context.patterns.technical:
// ["Increase connection pool for high load", "Use timeouts and retries"]

// context.sectors.reflective:
// ["Lesson: Connection pooling reduced timeouts by 80%"]

// Use these patterns to fix the bug
```

### Example 3: Decision Support

```javascript
context = skill("openmemory-context", {
  "query": "frontend framework selection",
  "contextType": "decision-support",
  "userId": "te9.dev"
})

// context.patterns.decisions:
// ["React > Vue for component reusability", "TypeScript > JavaScript"]

// context.summary.relatedPRDs:
// ["PRD-20240115-143022: React migration (DONE)"]

// Make decision based on past success
```

## Need Help?

- Check OpenMemory documentation: https://openmemory.cavira.app/docs
- Review context types for specific use cases
- Use `analysisDepth: "deep"` for complex decisions
- Always follow MANDATORY workflow: Query → Analyze → Incorporate → Store

---

**Remember**: Getting context with `openmemory-context` is MANDATORY before responding to any user request in the te9-method workflow. This skill provides comprehensive, actionable context for every interaction!