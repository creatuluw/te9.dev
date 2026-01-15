---
name: openmemory-store
description: Store memories in OpenMemory with automatic sector classification and intelligent tagging
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: memory-management
  category: openmemory
---

## ⚠️ CRITICAL: userId MUST Be Project Folder

**The `userId` parameter is MANDATORY for ALL OpenMemory operations.**

For every memory storage operation, the `userId` MUST be set to the **folder from or in which the user/agent is working**. This ensures:

1. **Context Isolation**: Each project/repo maintains its own separate memory space
2. **Project-Specific Context**: Memories are scoped to the current working directory
3. **Cross-Project Independence**: Working on multiple projects doesn't mix memories
4. **Repository-Level Persistence**: Memories persist and are retrieved only for the specific project/repo

### Determining userId

The `userId` should be:
- The **root folder name** of the current project (not the full path)
- The **repository name** for repo-based work
- Extracted from the full path: use only the final folder name

### Examples

```javascript
// ✅ CORRECT - Using folder name only
skill("openmemory-store", {
  "content": "Decision made",
  "userId": "myrecipes.xyz"
})

// ✅ CORRECT - Using repository name
skill("openmemory-store", {
  "content": "Key learning",
  "userId": "te9.dev"
})
```

// ❌ WRONG - Using generic user ID
skill("openmemory-store", {
  "content": "Important preference",
  "userId": "user123"  // Wrong! Not project-scoped
})

// ❌ WRONG - Using full path or generic ID
skill("openmemory-store", {
  "content": "Critical decision",
  "userId": "E:/projects/te9.dev"  // Wrong! Use folder name only
})
```

**This is non-negotiable**: Every `openmemory-store` call must use the project folder as `userId` to maintain proper context isolation.

# OpenMemory Store Skill

## What I Do

I store memories in OpenMemory with automatic sector classification, intelligent tag generation, and reinforcement tracking. I ensure memories are properly categorized and optimized for future retrieval.

## When to Use Me

Use me whenever you need to:
- **Store decisions** made during development
- **Capture user preferences** and feedback
- **Document technical patterns** and approaches
- **Record procedural knowledge** and workflows
- **Save emotional context** and user sentiment
- **Log reflective insights** and lessons learned
- **Track PRD progress** and achievements
- **Reinforce important memories** to prevent decay

## Quick Start

### Basic Usage

```javascript
result = skill("openmemory-store", {
  "content": "User prefers dark mode with high contrast",
  "userId": "te9.dev"
})
```

### With Manual Sector

```javascript
result = skill("openmemory-store", {
  "content": "Always validate user input before database queries",
  "sector": "procedural",
  "userId": "te9.dev",
  "tags": ["security", "validation", "database"]
})
```

### With Reinforcement

```javascript
result = skill("openmemory-store", {
  "content": "JWT tokens are preferred for authentication",
  "userId": "te9.dev",
  "reinforce": true,
  "importance": "high"
})
```

## Parameters

### Required Parameters

- **content** (string): The memory content to store
  - Can be 1-2000 characters
  - Use clear, descriptive language
  - Include key details for future retrieval
  - Examples:
    - "User prefers TypeScript over JavaScript for type safety"
    - "Authentication decisions: JWT > Session-based for scalability"
    - "Workflow: Always run tests before committing to main branch"

- **userId** (string): User identifier
  - **CRITICAL**: MUST be the project folder NAME only (e.g., "myproject")
  - Ensures memory isolation between projects/repositories
  - Use only the root folder name, NOT the full path
  - Examples: "te9.dev", "myrecipes.xyz", "myproject"
  - Do NOT use generic user IDs like "user123" or "default"

### Optional Parameters

- **sector** (string, default: auto-detect): Target memory sector
  - Options: `episodic`, `semantic`, `procedural`, `emotional`, `reflective`
  - If not specified, I'll auto-detect based on content analysis
  - See [Automatic Sector Classification](#automatic-sector-classification) below

- **tags** (array<string>, default: auto-generate): Tags for memory
  - Can provide explicit tags
  - If not specified, I'll generate relevant tags from content
  - Tags improve retrieval accuracy
  - Example: `["authentication", "JWT", "security", "decision"]`

- **metadata** (object, optional): Additional structured data
  - Key-value pairs for filtering and context
  - Examples:
    ```json
    {
      "source": "prd-interview",
      "prdId": "PRD-20250115-143022",
      "category": "technical",
      "priority": "high"
    }
    ```

- **reinforce** (boolean, default: false): Boost importance
  - `true`: Reinforce memory to prevent decay
  - Use for critical decisions, user preferences, patterns
  - Increases salience score immediately

- **importance** (string, optional): Importance level for reinforcement
  - Options: `low`, `medium`, `high`, `critical`
  - Affects initial salience and decay resistance
  - Only applies when `reinforce: true`

- **relatedMemories** (array<string>, optional): Links to related memories
  - Memory IDs to create connections with
  - Enables multi-hop context retrieval
  - Strengthens memory graph

- **timestamp** (string, optional): Custom timestamp
  - ISO 8601 format: "2025-01-15T10:30:00Z"
  - Default: current time
  - Use for historical data import or corrections

- **ttl** (number, optional): Time-to-live in days
  - How long memory should remain before decay
  - Default: varies by sector
  - Overrides sector-specific decay settings

## Automatic Sector Classification

I analyze content to automatically determine the best sector:

### Episodic (Events & Experiences)
- **Triggers**: "happened", "occurred", "discussed", "met", "said", "did"
- **Content**: Specific events, conversations, interactions
- **Examples**:
  - "User requested feature X during yesterday's meeting"
  - "We decided to switch from MongoDB to PostgreSQL"

### Semantic (Facts & Knowledge)
- **Triggers**: "is", "are", "definition", "how to", "what is", "best practice"
- **Content**: Facts, concepts, definitions, technical knowledge
- **Examples**:
  - "JWT tokens use 256-bit encryption by default"
  - "React hooks cannot be used in class components"

### Procedural (Workflows & Patterns)
- **Triggers**: "process", "workflow", "steps", "how to", "procedure", "routine"
- **Content**: How-to guides, workflows, procedures, patterns
- **Examples**:
  - "Always run tests before committing to main branch"
  - "Process for implementing OAuth2: 1. Register app, 2. Configure endpoints..."

### Emotional (Preferences & Sentiment)
- **Triggers**: "prefer", "like", "love", "hate", "frustrated", "happy", "feel"
- **Content**: User preferences, emotions, sentiment, feelings
- **Examples**:
  - "User strongly prefers minimal UI design"
  - "User expressed frustration with slow API responses"

### Reflective (Insights & Patterns)
- **Triggers**: "noticed", "pattern", "lesson", "realized", "insight", "trend"
- **Content**: Insights, lessons learned, patterns, meta-cognition
- **Examples**:
  - "We noticed that microservices complexity outweighs benefits for small teams"
  - "Lesson: Always validate API contracts before implementation"

## Intelligent Tag Generation

I extract relevant tags from content automatically:

### Technical Tags
- Frameworks: "React", "Node.js", "Express"
- Languages: "TypeScript", "Python", "Go"
- Libraries: "Lodash", "Axios", "Jest"
- Tools: "Docker", "Git", "Webpack"

### Domain Tags
- "authentication", "authorization", "security"
- "database", "API", "frontend", "backend"
- "testing", "deployment", "CI/CD"

### Pattern Tags
- "decision", "preference", "pattern", "workflow"
- "bug", "feature", "refactor", "optimization"

### Context Tags
- "user-feedback", "team-decision", "lessons-learned"
- "best-practice", "anti-pattern", "troubleshooting"

## Return Data

```json
{
  "success": true,
  "memoryId": "mem-20250115-143022-abc123",
  "sector": "semantic",
  "tags": ["JWT", "authentication", "security", "decision"],
  "salience": 0.85,
  "reinforced": true,
  "decayResistance": 0.92,
  "createdAt": "2025-01-15T14:30:22Z",
  "classification": {
    "primarySector": "semantic",
    "confidence": 0.92,
    "alternativeSectors": [
      { "sector": "procedural", "confidence": 0.65 }
    ]
  },
  "tagAnalysis": {
    "extracted": 4,
    "autoGenerated": 4,
    "manualProvided": 0,
    "confidence": 0.88
  }
}
```

## Usage Patterns

### Pattern 1: Store Interview Results

```javascript
// After prd-interview completes
result = skill("openmemory-store", {
  "content": "User requested authentication feature with JWT tokens",
  "sector": "episodic",
  "userId": interviewData.userId,
  "metadata": {
    "source": "prd-interview",
    "interviewId": interviewData.interviewId,
    "prdId": prdId
  },
  "tags": ["authentication", "JWT", "feature-request"]
})
```

### Pattern 2: Store Decision

```javascript
// After making technical decision
result = skill("openmemory-store", {
  "content": "Decision: Use PostgreSQL over MongoDB for transactional consistency",
  "userId": "te9.dev",
  "sector": "semantic",
  "reinforce": true,
  "importance": "high",
  "tags": ["database", "PostgreSQL", "decision", "transactional"],
  "metadata": {
    "prdId": "PRD-20250115-143022",
    "decisionType": "technical"
  }
})
```

### Pattern 3: Store User Preference

```javascript
// Capture user preference
result = skill("openmemory-store", {
  "content": "User prefers dark mode with high contrast and minimal animations",
  "userId": "user123",
  "sector": "emotional",
  "reinforce": true,
  "importance": "high",
  "tags": ["UI", "dark-mode", "preference", "design"]
})
```

### Pattern 4: Store Procedural Pattern

```javascript
// Document workflow
result = skill("openmemory-store", {
  "content": "Workflow: 1. Write tests, 2. Implement feature, 3. Run tests, 4. Commit",
  "userId": "te9.dev",
  "sector": "procedural",
  "tags": ["testing", "workflow", "TDD", "best-practice"],
  "metadata": {
    "category": "development-process",
    "applicableTo": "all-features"
  }
})
```

### Pattern 5: Store Reflective Insight

```javascript
// Document lessons learned
result = skill("openmemory-store", {
  "content": "Lesson: Early API contract validation prevents 80% of integration issues",
  "userId": "te9.dev",
  "sector": "reflective",
  "reinforce": true,
  "importance": "medium",
  "tags": ["lesson", "API", "integration", "validation", "insight"]
})
```

### Pattern 6: Store PRD Progress

```javascript
// Track PRD execution
result = skill("openmemory-store", {
  "content": "Completed PRD-20250115-143022: Implemented user authentication with JWT",
  "userId": "te9.dev",
  "sector": "episodic",
  "tags": ["completed", "authentication", "JWT", "PRD"],
  "metadata": {
    "source": "prd-execute",
    "prdId": "PRD-20250115-143022",
    "status": "DONE",
    "filesCreated": 3,
    "filesModified": 2
  }
})
```

## Best Practices

### 1. Use Clear, Specific Content

```javascript
// ❌ Too vague
result = skill("openmemory-store", {
  "content": "We did some stuff"
})

// ✅ Specific and actionable
result = skill("openmemory-store", {
  "content": "Implemented JWT authentication with 256-bit encryption and 30-minute token expiration"
})
```

### 2. Reinforce Important Memories

```javascript
// Critical decision - reinforce it
result = skill("openmemory-store", {
  "content": "Database migration must preserve all user data - use transactions",
  "reinforce": true,
  "importance": "critical"
})
```

### 3. Use Metadata for Context

```javascript
result = skill("openmemory-store", {
  "content": "User prefers TypeScript for type safety",
  "metadata": {
    "source": "conversation",
    "userId": "user123",
    "context": "language-selection",
    "timestamp": "2025-01-15T10:30:00Z"
  }
})
```

### 4. Link Related Memories

```javascript
// Store new memory with links to existing ones
result = skill("openmemory-store", {
  "content": "Extended JWT authentication to include refresh tokens",
  "relatedMemories": ["mem-20250110-143022", "mem-20250112-091530"]
})
```

### 5. Use Appropriate Importance Levels

```javascript
// Critical: Never forget this
skill("openmemory-store", { "content": "...", "importance": "critical" })

// High: Very important, reinforced frequently
skill("openmemory-store", { "content": "...", "importance": "high" })

// Medium: Important but can decay slowly
skill("openmemory-store", { "content": "...", "importance": "medium" })

// Low: Nice to know, can fade
skill("openmemory-store", { "content": "...", "importance": "low" })
```

## Integration with PRD Skills

### Automatic Storage During PRD Workflow

```javascript
// After prd-interview
skill("openmemory-store", {
  "content": `Interview completed for ${interviewData.title}: ${interviewData.description}`,
  "sector": "episodic",
  "metadata": { "interviewId": interviewId }
})

// After prd-create
skill("openmemory-store", {
  "content": `Created PRD ${prdId} with ${criteria.length} acceptance criteria`,
  "sector": "episodic",
  "tags": ["PRD", "created", prdId]
})

// After prd-execute
skill("openmemory-store", {
  "content": `Completed ${prdId}: ${executionSummary}`,
  "sector": "episodic",
  "metadata": { "prdId": prdId, "status": "DONE" }
})

// After prd-track (for important events)
skill("openmemory-store", {
  "content": `Progress: ${achievement}`,
  "sector": "episodic",
  "reinforce": true
})
```

### Store Key Decisions

```javascript
// When making a technical decision during execution
skill("openmemory-store", {
  "content": `Decision: ${decision} for ${prdId}`,
  "sector": "semantic",
  "reinforce": true,
  "importance": "high",
  "metadata": { "prdId": prdId, "decisionCategory": "technical" }
})
```

### Store Lessons Learned

```javascript
// When discovering patterns or issues
skill("openmemory-store", {
  "content": `Lesson learned during ${prdId}: ${lesson}`,
  "sector": "reflective",
  "reinforce": true,
  "tags": ["lesson", prdId]
})
```

## Reinforcement Strategy

### Automatic Reinforcement Triggers

I automatically reinforce memories when:
1. **Accessed frequently** - High recall count boosts salience
2. **Related to active PRDs** - Memories used in current work
3. **Part of patterns** - Recurring in multiple contexts
4. **Manually reinforced** - User explicitly marks as important

### Manual Reinforcement

```javascript
// Reinforce existing memory
result = skill("openmemory-reinforce", {
  "memoryId": "mem-20250115-143022",
  "importance": "high"
})
```

### Decay Mitigation

```javascript
// Use TTL for time-sensitive memories
result = skill("openmemory-store", {
  "content": "Temporary deployment password: temp123",
  "ttl": 7  // Auto-forget after 7 days
})
```

## Error Handling

### Common Errors

1. **Content too short**
   - Solution: Add more context and detail
   - Minimum: 10 characters

2. **Sector classification confidence low**
   - Solution: Provide explicit sector parameter
   - Review content for clarity

3. **Duplicate memory detected**
   - Solution: Use `openmemory-reinforce` instead
   - Or verify if new memory adds value

## Performance Considerations

- **Storage speed**: ~36ms average
- **Tag generation**: Adds ~10ms overhead
- **Reinforcement**: Adds ~15ms
- **Total**: ~60ms for typical store operation
- **Recommendation**: Batch stores when possible

## Security & Privacy

- User ID isolation ensures privacy
- No data leaves your local system
- Content is never shared or external
- TTL prevents sensitive data persistence

## Examples

### Example 1: Store User Preference

```javascript
result = skill("openmemory-store", {
  "content": "User prefers React over Vue for component development",
  "userId": "user123",
  "sector": "emotional",
  "reinforce": true,
  "importance": "high",
  "tags": ["React", "Vue", "preference", "frontend"]
})

// Returns: memoryId, sector="emotional", tags generated
```

### Example 2: Store Technical Decision

```javascript
result = skill("openmemory-store", {
  "content": "Decision: Use Redis for caching to reduce database load by 60%",
  "userId": "te9.dev",
  "sector": "semantic",
  "reinforce": true,
  "importance": "high",
  "tags": ["Redis", "caching", "decision", "performance"],
  "metadata": {
    "prdId": "PRD-20250115-143022",
    "impact": "60% load reduction"
  }
})

// Reinforced memory with high importance
```

### Example 3: Store Workflow

```javascript
result = skill("openmemory-store", {
  "content": "Deployment workflow: 1. Run tests, 2. Build, 3. Staging deploy, 4. QA, 5. Production deploy",
  "userId": "default",
  "sector": "procedural",
  "tags": ["deployment", "workflow", "CI/CD", "QA"],
  "metadata": {
    "applicableTo": "all-projects",
    "steps": 5
  }
})

// Procedural memory stored for future reference
```

### Example 4: Store Insight

```javascript
result = skill("openmemory-store", {
  "content": "Insight: 70% of bugs caught by integration tests were missing from unit tests",
  "userId": "default",
  "sector": "reflective",
  "reinforce": true,
  "importance": "medium",
  "tags": ["insight", "testing", "bug-pattern", "quality"]
})

// Reflective memory that will guide future testing decisions
```

## Advanced Features

### Memory Graph Construction

```javascript
// Store memory with explicit relationships
result = skill("openmemory-store", {
  "content": "Refresh token rotation improves security",
  "relatedMemories": [
    "mem-jwt-auth",           // Direct relation
    "mem-security-best-practices",  // Related topic
    "mem-token-expiration"    // Technical detail
  ]
})

// Creates graph edges for multi-hop context retrieval
```

### Time-Bound Memories

```javascript
// Temporary memory for sensitive data
result = skill("openmemory-store", {
  "content": "API key for testing: sk_test_12345",
  "userId": "default",
  "sector": "semantic",
  "ttl": 1  // Auto-delete after 1 day
})
```

### Batch Storage

```javascript
// Store multiple related memories
const memories = [
  { "content": "Feature X started" },
  { "content": "Feature X completed" },
  { "content": "Feature X deployed" }
]

memories.forEach(mem => {
  skill("openmemory-store", { 
    ...mem, 
    "userId": "default",
    "tags": ["feature-x", "progress"]
  })
})
```

## Need Help?

- Check OpenMemory documentation: https://openmemory.cavira.app/docs
- Use `openmemory-query` to verify memories were stored
- Review classification results in return data
- Adjust importance levels based on access patterns

---

**Remember**: Storing memories after important interactions is MANDATORY in the te9-method workflow. This skill makes it easy and intelligent!