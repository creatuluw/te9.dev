---
name: openmemory
description: OpenMemory skill suite for intelligent memory management with query, store, and context capabilities
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: memory-management
  category: openmemory
---

# OpenMemory Skill Suite

## Overview

The OpenMemory skill suite provides intelligent memory management for AI agents using OpenMemory's cognitive memory engine. This suite automates the mandatory memory workflow in the te9-method, making it easy to query, store, and synthesize context from long-term memories.

## What This Suite Provides

The OpenMemory skill suite includes three specialized skills:

### 1. openmemory-query
**Intelligent memory querying with automatic filtering and analysis**

- Query memories across all 5 sectors (episodic, semantic, procedural, emotional, reflective)
- Automatic sector detection based on query content
- Intelligent analysis that identifies patterns, decisions, and preferences
- Support for both contextual (HSG) and factual (temporal) queries
- Configurable result limits and salience thresholds

**Best for:**
- Retrieving specific memories before responding to users
- Finding past decisions and patterns
- Checking for similar work or issues
- Getting user preferences and technical context

### 2. openmemory-store
**Automatic memory storage with classification and tagging**

- Store memories with automatic sector classification
- Intelligent tag generation from content
- Optional reinforcement to prevent decay
- Support for both contextual memories and temporal facts
- Metadata tracking for traceability

**Best for:**
- Storing decisions made during conversations
- Capturing user preferences and feedback
- Documenting technical patterns and workflows
- Saving insights and lessons learned

### 3. openmemory-context
**Comprehensive context gathering across all memory sectors**

- Synthesize context from multiple memory types
- Identify relationships and patterns across sectors
- Generate actionable recommendations
- Find related PRDs and similar work
- Support for different context types (general, PRD, technical, etc.)

**Best for:**
- Getting full context before user responses (MANDATORY workflow)
- Preparing for PRD interviews
- Understanding user patterns before execution
- Making informed technical decisions

## When to Use Each Skill

### Use openmemory-query When:
- You need to find specific memories about a topic
- You want to check for past decisions or patterns
- You're looking for similar issues or solutions
- You need to retrieve user preferences
- You want to find related PRDs

**Example:**
```javascript
// Query for authentication patterns
result = skill("openmemory-query", {
  "query": "authentication implementation patterns",
  "userId": "default",
  "sectors": ["semantic", "procedural"],
  "limit": 15
})
```

### Use openmemory-store When:
- You've made an important decision
- User expresses a preference or feedback
- You discover a pattern or insight
- You want to document a workflow or procedure
- After completing a PRD or task

**Example:**
```javascript
// Store a technical decision
result = skill("openmemory-store", {
  "content": "Decision: Use JWT tokens with 256-bit encryption for authentication",
  "userId": "default",
  "sector": "semantic",
  "reinforce": true,
  "importance": "high"
})
```

### Use openmemory-context When:
- Before responding to ANY user request (MANDATORY)
- Before conducting PRD interviews
- Before executing PRDs
- When making technical decisions
- When exploring new features or debugging

**Example:**
```javascript
// Get comprehensive context before PRD interview
context = skill("openmemory-context", {
  "query": "user authentication system",
  "contextType": "prd-interview",
  "includeRelatedPRDs": true,
  "userId": "default"
})
```

## Integration with PRD Workflow

### Mandatory Memory Workflow (Simplified)

The OpenMemory skill suite makes the mandatory memory workflow effortless:

```javascript
// Step 1: QUERY FIRST (use openmemory-context for comprehensive context)
context = skill("openmemory-context", {
  "query": user_request,
  "userId": "default"
})

// Step 2: ANALYZE (context.summary, patterns, recommendations are ready to use)
// No manual analysis needed - context provides structured insights

// Step 3: INCORPORATE (use context to inform your response)
// Reference context.summary.keyInsights
// Follow context.recommendations
// Check context.warnings

// Step 4: STORE LAST (use openmemory-store to save learnings)
skill("openmemory-store", {
  "content": "Key decision or learning from this interaction",
  "userId": "default",
  "sector": "semantic"
})
```

### PRD Interview Integration

```javascript
// Get context before interview
context = skill("openmemory-context", {
  "query": interview_topic,
  "contextType": "prd-interview",
  "includeRelatedPRDs": true,
  "userId": "default"
})

// Use context to guide interview questions
// Check context.relatedPRDs to avoid duplication
// Use context.recommendations for acceptance criteria

// Store interview results
skill("openmemory-store", {
  "content": `Interview completed: ${interviewData.title}`,
  "userId": "default",
  "sector": "episodic",
  "metadata": { "interviewId": interviewId }
})
```

### PRD Execute Integration

```javascript
// Get context before execution
context = skill("openmemory-context", {
  "query": execution_topic,
  "contextType": "prd-execute",
  "prdId": prdId,
  "userId": "default"
})

// Follow context.patterns.procedural for implementation
// Check context.warnings to avoid past mistakes
// Use context.recommendations for best practices

// Query for specific patterns during execution
patterns = skill("openmemory-query", {
  "query": "implementation patterns for feature type",
  "sectors": ["procedural", "semantic"]
})

// Store completion and lessons learned
skill("openmemory-store", {
  "content": `Completed ${prdId}: following ${context.relatedPRDs.length} related PRDs`,
  "userId": "default",
  "sector": "episodic",
  "metadata": { "prdId": prdId, "status": "DONE" }
})
```

## Quick Reference

### Skill Selection Guide

| Situation | Use This Skill | Why |
|-----------|----------------|-----|
| Before any user response | `openmemory-context` | Comprehensive overview |
| Looking for specific memories | `openmemory-query` | Targeted retrieval |
| Storing a decision or preference | `openmemory-store` | Classification and tagging |
| Before PRD interview | `openmemory-context` with `contextType: "prd-interview"` | Related work and patterns |
| Before PRD execution | `openmemory-context` with `contextType: "prd-execute"` | Implementation patterns |
| Finding similar issues | `openmemory-query` | Specific search |
| Making technical decision | `openmemory-context` with `contextType: "decision-support"` | Past decisions and outcomes |
| Storing lesson learned | `openmemory-store` with `sector: "reflective"` | Pattern capture |

### Common Patterns

**Pattern 1: Full Memory Workflow**
```javascript
// Get context
context = skill("openmemory-context", {
  "query": topic,
  "userId": "default"
})

// Use context in work
// ...

// Store learnings
skill("openmemory-store", {
  "content": learning,
  "userId": "default",
  "sector": determineSector(learning)
})
```

**Pattern 2: Query Then Store**
```javascript
// Query for existing patterns
existing = skill("openmemory-query", {
  "query": topic,
  "userId": "default"
})

// If new pattern found, store it
if (existing.totalResults === 0) {
  skill("openmemory-store", {
    "content": newPattern,
    "userId": "default"
  })
}
```

**Pattern 3: Context-Aware Execution**
```javascript
// Get comprehensive context
context = skill("openmemory-context", {
  "query": topic,
  "contextType": "prd-execute",
  "userId": "default"
})

// Follow recommendations
context.recommendations.forEach(rec => implement(rec))

// Avoid warnings
context.warnings.forEach(warn => ensureAvoid(warn))

// Store outcome
skill("openmemory-store", {
  "content": outcome,
  "userId": "default",
  "metadata": { "followed": context.recommendations.length }
})
```

## Memory Sectors Reference

All OpenMemory skills work with 5 memory sectors:

| Sector | What It Stores | Auto-Detection Keywords |
|--------|---------------|------------------------|
| **episodic** | Events, conversations, specific occurrences | "happened", "discussed", "decided", "meeting" |
| **semantic** | Facts, knowledge, technical information | "is", "definition", "best practice", "how to" |
| **procedural** | Workflows, patterns, procedures | "process", "steps", "workflow", "how to" |
| **emotional** | Preferences, feelings, sentiment | "prefer", "like", "frustrated", "feel" |
| **reflective** | Insights, lessons, meta-analysis | "noticed", "pattern", "lesson", "insight" |

The skills automatically classify memories into the appropriate sector. You can also specify the sector manually for precision.

## Performance Benchmarks

| Skill | Average Time | Notes |
|-------|--------------|-------|
| openmemory-context (standard) | ~200ms | All sectors, hops=2 |
| openmemory-context (shallow) | ~120ms | Reduced depth |
| openmemory-query | ~110ms | 20 results default |
| openmemory-store | ~60ms | Including classification |

All operations are local-first with no external API calls.

## Best Practices

### 1. Always Use Context Before Responding
```javascript
// ✅ MANDATORY in te9-method
context = skill("openmemory-context", {
  "query": user_request,
  "userId": "default"
})
// Then respond based on context

// ❌ Never skip context gathering
```

### 2. Store Important Learnings
```javascript
// ✅ Store decisions and patterns
skill("openmemory-store", {
  "content": "Decision: Use JWT for authentication",
  "userId": "default",
  "reinforce": true
})

// ❌ Don't forget to capture what you learn
```

### 3. Use Appropriate Context Types
```javascript
// ✅ Use specific context type
context = skill("openmemory-context", {
  "query": topic,
  "contextType": "prd-interview"
})

// ❌ Don't always use general
```

### 4. Reinforce Critical Information
```javascript
// ✅ Reinforce important decisions
skill("openmemory-store", {
  "content": criticalDecision,
  "reinforce": true,
  "importance": "critical"
})
```

### 5. Check Related Work
```javascript
// ✅ Always check for related PRDs
context = skill("openmemory-context", {
  "query": feature_request,
  "includeRelatedPRDs": true
})

if (context.relatedPRDs.length > 0) {
  // Avoid duplication
}
```

## Getting Started

### Step 1: Get Context Before Any Interaction
```javascript
context = skill("openmemory-context", {
  "query": "what user is asking about",
  "userId": "default"
})
```

### Step 2: Use the Context
```javascript
// Check context.summary for overview
// Review context.patterns for recurring themes
// Use context.recommendations for guidance
// Check context.warnings for pitfalls
```

### Step 3: Store What You Learn
```javascript
skill("openmemory-store", {
  "content": "important decision or insight",
  "userId": "default",
  "sector": "appropriate-sector"
})
```

## Examples

### Example 1: Complete Memory Workflow

```javascript
// User asks: "How should I implement authentication?"

// Step 1: Get context
context = skill("openmemory-context", {
  "query": "authentication implementation",
  "userId": "default"
})

// Step 2: Use context in response
// context.summary shows: "User prefers JWT with 2FA on admin endpoints"
// context.recommendations shows: ["Use 256-bit encryption", "Implement refresh tokens"]
// context.relatedPRDs shows: ["PRD-20240115-143022: OAuth2 integration (DONE)"]

// Step 3: Provide informed response
// "Based on previous decisions, you should use JWT with 256-bit encryption..."

// Step 4: Store this interaction
skill("openmemory-store", {
  "content": "Provided authentication guidance recommending JWT",
  "userId": "default",
  "sector": "episodic"
})
```

### Example 2: PRD Interview with Context

```javascript
// User wants to add authentication feature

// Step 1: Get PRD interview context
context = skill("openmemory-context", {
  "query": "authentication feature",
  "contextType": "prd-interview",
  "includeRelatedPRDs": true,
  "userId": "default"
})

// Step 2: Use context to guide interview
// context.relatedPRDs: Already done OAuth2 integration - ask if this extends or replaces
// context.patterns.technical: User prefers JWT
// context.warnings: Avoid complex login flows

// Step 3: Conduct interview
interview = skill("prd-interview", {
  "context": context
})

// Step 4: Store interview results
skill("openmemory-store", {
  "content": `Interview: ${interview.title} with ${interview.criteria.length} criteria`,
  "userId": "default",
  "sector": "episodic",
  "metadata": { "interviewId": interview.id }
})
```

### Example 3: Decision Support

```javascript
// Need to choose database technology

// Step 1: Get decision support context
context = skill("openmemory-context", {
  "query": "database selection",
  "contextType": "decision-support",
  "depth": "deep",
  "userId": "default"
})

// Step 2: Review past decisions
context.patterns.decisions.forEach(dec => {
  console.log(`${dec.decision} - Reason: ${dec.reason}`)
})

// Step 3: Check outcomes
context.sectors.reflective.memories.forEach(mem => {
  console.log(`Lesson: ${mem.content}`)
})

// Step 4: Make decision and store
skill("openmemory-store", {
  "content": "Decision: Use PostgreSQL for transactional consistency",
  "userId": "default",
  "sector": "semantic",
  "reinforce": true,
  "importance": "high"
})
```

## Integration with Existing Skills

The OpenMemory skill suite integrates seamlessly with all te9-method skills:

### With prd-interview
```javascript
context = skill("openmemory-context", {
  "query": interview_topic,
  "contextType": "prd-interview"
})
interview = skill("prd-interview", { "context": context })
```

### With prd-create
```javascript
context = skill("openmemory-context", {
  "query": interviewData.title,
  "contextType": "prd-interview"
})
prd = skill("prd-create", { "interviewData": interviewData, "context": context })
```

### With prd-execute
```javascript
context = skill("openmemory-context", {
  "query": prd.title,
  "contextType": "prd-execute",
  "prdId": prdId
})
result = skill("prd-execute", { "prdId": prdId, "context": context })
```

### With prd-test
```javascript
// Query for similar testing patterns
patterns = skill("openmemory-query", {
  "query": "testing patterns for this feature type",
  "sectors": ["procedural"]
})
// Use patterns to guide testing approach
result = skill("prd-test", { "prdId": prdId, "patterns": patterns })
```

### With prd-track
```javascript
// Track progress
skill("prd-track", {
  "prdId": prdId,
  "eventType": "PROGRESS",
  "eventData": {...}
})

// Store memory in parallel
skill("openmemory-store", {
  "content": "Progress update",
  "userId": "default"
})
```

## Need Help?

- **openmemory-query**: See `E:/te9.dev/.opencode/skill/openmemory-query/SKILL.md`
- **openmemory-store**: See `E:/te9.dev/.opencode/skill/openmemory-store/SKILL.md`
- **openmemory-context**: See `E:/te9.dev/.opencode/skill/openmemory-context/SKILL.md`
- **OpenMemory docs**: https://openmemory.cavira.app/docs

## Summary

The OpenMemory skill suite makes the mandatory memory workflow in the te9-method effortless and intelligent:

1. **Query**: Use `openmemory-context` for comprehensive context before any interaction
2. **Analyze**: Context provides structured patterns, recommendations, and insights automatically
3. **Incorporate**: Use context to inform your responses and decisions
4. **Store**: Use `openmemory-store` to capture decisions, preferences, and insights

All three skills work together seamlessly to provide persistent, intelligent memory for your AI agent.