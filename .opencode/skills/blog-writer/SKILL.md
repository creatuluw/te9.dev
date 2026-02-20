# Blog Writer Skill

Automatically generates markdown blog posts from bookmarked content.

## Overview

This skill is invoked by the backend API when a bookmark is approved for blogging. It uses AI to generate structured, SEO-friendly markdown content.

## When to Use

- User sets `blog_approved = true` on a bookmark
- User clicks "Generate Blog Draft" in the bookmark edit UI
- API endpoint `/api/generate/:bookmarkId` is called

## AI Provider Configuration

The system supports three AI providers. Configure via the `/api/config` endpoint:

### Anthropic Claude (Default)
```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "api_key": "sk-ant-..."
  }
}
```

### OpenAI
```json
{
  "ai": {
    "provider": "openai",
    "model": "gpt-4o",
    "api_key": "sk-..."
  }
}
```

### OpenRouter
```json
{
  "ai": {
    "provider": "openrouter",
    "model": "anthropic/claude-sonnet-4",
    "api_key": "sk-or-...",
    "base_url": "https://openrouter.ai/api/v1"
  }
}
```

## Generated Content Structure

Each generated blog post follows this structure:

```markdown
---
title: [Generated Title]
date: YYYY-MM-DD
description: [SEO description under 160 chars]
---

# [Title]

[Introduction paragraph explaining the topic]

## [Section 1]

[Content with examples]

## [Section 2]

[Content with examples]

## Key Takeaways

- [Point 1]
- [Point 2]
- [Point 3]

---

*Originally bookmarked from [source domain]*
```

## Workflow

1. **Trigger**: Bookmark marked as approved or generate button clicked
2. **Context Gathering**: System retrieves bookmark URL, title, excerpt, and user's reason_for_bookmark
3. **AI Generation**: AI provider generates structured markdown content
4. **Draft Creation**: Content saved to `drafts` table with status `pending`
5. **Review**: User reviews in `/drafts` UI
6. **Approval/Feedback**: User approves, rejects, or provides feedback for rewrite
7. **Publish**: Approved drafts published to `/posts/` directory

## Prompt Template

The AI receives this structured prompt:

```
Write a comprehensive blog post based on this bookmarked resource:

Title: [bookmark title]
URL: [bookmark link]
Description: [bookmark excerpt]
Why bookmarked: [reason_for_bookmark]

Requirements:
1. Write in a professional, informative tone
2. Start with frontmatter
3. Include an introduction explaining the topic
4. Break content into clear sections with ## headers
5. Include practical examples where relevant
6. End with a "Key Takeaways" section
7. Add attribution note at the end
8. Write 800-1200 words
9. Use markdown formatting throughout
10. Make it educational and actionable
```

## Environment Variables

```env
AI_PROVIDER=anthropic
AI_API_KEY=your_api_key
AI_MODEL=claude-sonnet-4-20250514
```

Or per-provider:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate/:id` | POST | Generate draft from bookmark |
| `/api/drafts` | GET | List all drafts |
| `/api/drafts/:id` | PATCH | Update draft (status, content, feedback) |
| `/api/drafts/:id/publish` | POST | Publish approved draft |
| `/api/config` | PATCH | Update AI provider settings |

## Error Handling

- **No API Key**: Returns error asking user to configure AI provider
- **Generation Failed**: Returns error with provider message
- **Draft Exists**: Returns 409 conflict with existing draft

## Best Practices

1. **Provide Context**: Always fill in `reason_for_bookmark` for better content
2. **Review Before Publishing**: AI content should be reviewed and edited
3. **Use Feedback**: Reject with feedback to regenerate better content
4. **Check Slug**: Auto-generated slugs may need manual adjustment
