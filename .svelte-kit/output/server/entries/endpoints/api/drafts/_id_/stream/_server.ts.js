import { v as validateApiKey, u as unauthorized } from "../../../../../../chunks/auth.js";
import { d as db } from "../../../../../../chunks/db.js";
import { g as getAIConfig } from "../../../../../../chunks/ai.js";
function getBlogPostPrompt(bookmark, metadata) {
  const systemPrompt = `You are a skilled technical writer who creates engaging blog posts from bookmarked content. 
Write in a clear, conversational style that's easy to understand.
Include practical examples and insights where relevant.
Format the content in Markdown with proper headings, lists, and code blocks when appropriate.
The post should be informative and valuable to readers interested in technology and development.`;
  let userPrompt = `Create a blog post based on this bookmarked content:

Title: ${bookmark.title}
URL: ${bookmark.link}
${bookmark.excerpt ? `Summary: ${bookmark.excerpt}` : ""}
${bookmark.reason_for_bookmark ? `Why bookmarked: ${bookmark.reason_for_bookmark}` : ""}

Requirements:
1. Create an engaging blog post title (different from the bookmark title)
2. Write a comprehensive article (800-1500 words)
3. Include an introduction that hooks the reader
4. Cover the main concepts/ideas from the source
5. Add practical takeaways or insights
6. End with a brief conclusion
7. Format in clean Markdown

First line should be the title as a heading (e.g., "# Your Title Here"), then the content.`;
  if (metadata?.repurposing_goals) {
    userPrompt += `

IMPORTANT - Additional Repurposing Goals:
${metadata.repurposing_goals}

Please tailor the blog post to meet these specific requirements while maintaining quality and relevance.`;
  }
  return { systemPrompt, userPrompt };
}
function getSkillPrompt(bookmark) {
  const systemPrompt = `You are an AI skill creator. Your job is to research a topic and generate a reusable SKILL.md file that can be used by AI agents to work with that topic.

Skills are modular, self-contained packages with:
- YAML frontmatter (name, description)
- Trigger conditions (when to use the skill)
- Step-by-step workflow
- Code examples
- All references embedded inline

IMPORTANT: You must include ALL necessary information inline. Do NOT reference external URLs or say "see documentation". Embed the actual content, code, and explanations directly.`;
  const userPrompt = `Research and create a skill file (SKILL.md) for this topic:

Title: ${bookmark.title}
URL: ${bookmark.link}
${bookmark.excerpt ? `Summary: ${bookmark.excerpt}` : ""}
${bookmark.reason_for_bookmark ? `Why bookmarked: ${bookmark.reason_for_bookmark}` : ""}

Your task:
1. Analyze the topic from the bookmark
2. Generate a comprehensive skill file that includes:
   - YAML frontmatter with name and description
   - Clear trigger conditions (when should this skill be used?)
   - Step-by-step workflow for using this technology/tool
   - Installation instructions (embedded inline)
   - Core concepts and API reference (embedded inline)
   - Code examples (embedded inline)
   - Common patterns and best practices
   - Troubleshooting tips

CRITICAL RULES:
- Include ALL information inline - no external references
- If you know the topic well, include comprehensive details
- Format as valid Markdown with proper YAML frontmatter
- Make it immediately usable by an AI agent

Format:
---
name: topic-name
description: Clear description of what this skill does
---

# Skill Title

## When to Use
[Trigger conditions]

## Workflow
[Step-by-step instructions]

## Installation
[Inline installation instructions]

## Core Concepts
[Embedded explanations]

## API Reference
[Embedded API details with examples]

## Code Examples
[Inline code examples]

## Best Practices
[Tips and patterns]

## Troubleshooting
[Common issues and solutions]

Start with the YAML frontmatter, then the Markdown content.`;
  return { systemPrompt, userPrompt };
}
const POST = async ({ params, request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid draft ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const draft = await db.drafts.findById(id);
  if (!draft) {
    return new Response(JSON.stringify({ error: "Draft not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const bookmark = await db.bookmarks.findById(draft.bookmark_id);
  if (!bookmark) {
    return new Response(JSON.stringify({ error: "Bookmark not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { baseUrl, apiKey, model } = await getAIConfig();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const draftType = draft.draft_type || "blog_post";
  const metadata = draft.metadata;
  let systemPrompt;
  let userPrompt;
  if (draftType === "skill") {
    const prompts = getSkillPrompt(bookmark);
    systemPrompt = prompts.systemPrompt;
    userPrompt = prompts.userPrompt;
  } else {
    const prompts = getBlogPostPrompt(bookmark, metadata);
    systemPrompt = prompts.systemPrompt;
    userPrompt = prompts.userPrompt;
  }
  console.log("[AI Stream] Starting generation for draft:", id, "type:", draftType);
  const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: draftType === "skill" ? 8e3 : 4e3,
      stream: true,
      thinking: { type: "disabled" }
    })
  });
  if (!aiResponse.ok) {
    const error = await aiResponse.text();
    console.error("[AI Stream] API error:", aiResponse.status, error);
    return new Response(JSON.stringify({ error: `AI API error: ${aiResponse.status}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const reader = aiResponse.body?.getReader();
  if (!reader) {
    return new Response(JSON.stringify({ error: "No response body" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullContent = "";
  let newTitle = draft.title;
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        await db.drafts.update(id, {
          title: newTitle,
          content: fullContent
        });
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, title: newTitle })}

`));
        controller.close();
        return;
      }
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              if (!newTitle || newTitle === bookmark.title) {
                const titleMatch = fullContent.match(/^#\s+(.+?)(?:\n|$)/);
                if (titleMatch) {
                  newTitle = titleMatch[1].trim();
                }
                const yamlNameMatch = fullContent.match(/^name:\s*(.+?)$/m);
                if (yamlNameMatch) {
                  newTitle = yamlNameMatch[1].trim();
                }
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, fullContent })}

`));
            }
          } catch {
          }
        }
      }
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
};
export {
  POST
};
