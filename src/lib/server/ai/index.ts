import { db } from "../db";
import type { AppConfig } from "$lib/types";

export interface AIGenerateOptions {
  bookmark: {
    title: string;
    link: string;
    excerpt?: string | null;
    reason_for_bookmark?: string | null;
  };
}

export interface AIGenerateResult {
  title: string;
  slug: string;
  content: string;
}

export async function getAIConfig(): Promise<AppConfig["ai"] | null> {
  return db.config.get("ai");
}

export async function generateBlogPost(
  options: AIGenerateOptions,
): Promise<AIGenerateResult> {
  const config = await getAIConfig();

  if (!config) {
    throw new Error("AI configuration not found");
  }

  const provider = config.provider;

  switch (provider) {
    case "anthropic":
      return generateWithAnthropic(config, options);
    case "openai":
      return generateWithOpenAI(config, options);
    case "openrouter":
      return generateWithOpenRouter(config, options);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

function createPrompt(options: AIGenerateOptions): string {
  const { bookmark } = options;

  return `Write a comprehensive blog post based on this bookmarked resource:

Title: ${bookmark.title}
URL: ${bookmark.link}
${bookmark.excerpt ? `Description: ${bookmark.excerpt}` : ""}
${bookmark.reason_for_bookmark ? `Why bookmarked: ${bookmark.reason_for_bookmark}` : ""}

Requirements:
1. Write in a professional, informative tone
2. Start with frontmatter in this exact format:
---
title: [Engaging Title]
date: ${new Date().toISOString().split("T")[0]}
description: [Brief description under 160 chars]
---

3. Include an introduction explaining the topic
4. Break content into clear sections with ## headers
5. Include practical examples where relevant
6. End with a "Key Takeaways" section with 3-5 bullet points
7. Add a note at the end: "Originally bookmarked from [domain]"
8. Write 1000-5000 words, depending on the complexity of the topic and source contents
9. Use markdown formatting throughout
10. Make it educational and actionable
11. ALWAYS: include the source from where the inspiration was from

Write the complete blog post now:`;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function generateWithAnthropic(
  config: AppConfig["ai"],
  options: AIGenerateOptions,
): Promise<AIGenerateResult> {
  const apiKey = config.api_key || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: createPrompt(options),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  const titleMatch = content.match(/title:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : options.bookmark.title;

  return {
    title,
    slug: generateSlug(title),
    content,
  };
}

async function generateWithOpenAI(
  config: AppConfig["ai"],
  options: AIGenerateOptions,
): Promise<AIGenerateResult> {
  const apiKey = config.api_key || process.env.OPENAI_API_KEY;
  const baseUrl = config.base_url || "https://api.openai.com/v1";

  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: createPrompt(options),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const titleMatch = content.match(/title:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : options.bookmark.title;

  return {
    title,
    slug: generateSlug(title),
    content,
  };
}

async function generateWithOpenRouter(
  config: AppConfig["ai"],
  options: AIGenerateOptions,
): Promise<AIGenerateResult> {
  const apiKey = config.api_key || process.env.OPENROUTER_API_KEY;
  const baseUrl = config.base_url || "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:5173",
      "X-Title": "Blog Writer",
    },
    body: JSON.stringify({
      model: config.model || "anthropic/claude-sonnet-4",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: createPrompt(options),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const titleMatch = content.match(/title:\s*(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : options.bookmark.title;

  return {
    title,
    slug: generateSlug(title),
    content,
  };
}
