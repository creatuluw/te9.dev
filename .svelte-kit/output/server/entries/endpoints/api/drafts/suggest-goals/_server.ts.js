import { v as validateApiKey, u as unauthorized } from "../../../../../chunks/auth.js";
import { g as getAIConfig } from "../../../../../chunks/ai.js";
const POST = async ({ request, url }) => {
  const validation = await validateApiKey(request, url);
  if (!validation.valid) {
    return unauthorized(validation.error);
  }
  const body = await request.json();
  const { title, excerpt, link } = body;
  if (!title) {
    return new Response(JSON.stringify({ error: "Title is required" }), {
      status: 400,
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
  const prompt = `Analyze this bookmark and suggest 5-7 repurposing goals for writing a blog post.

Title: ${title}
URL: ${link || "Not provided"}
Summary: ${excerpt || "Not provided"}

Generate actionable suggestions that would make the blog post more valuable. Consider:
1. Target audience level (beginner/intermediate/advanced)
2. SEO keywords relevant to the topic
3. Comparisons with related technologies or alternatives
4. Practical code examples or tutorials
5. Performance or best practices focus
6. Common pitfalls to address

Format: Return ONLY a JSON array of suggestion strings, nothing else.
Example: ["Target beginners with step-by-step tutorial", "Include SEO keywords: react hooks tutorial"]`;
  console.log("[Suggest Goals] Generating suggestions for:", title);
  const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      thinking: { type: "disabled" }
    })
  });
  if (!aiResponse.ok) {
    const error = await aiResponse.text();
    console.error("[Suggest Goals] API error:", aiResponse.status, error);
    return new Response(JSON.stringify({ error: `AI API error: ${aiResponse.status}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const data = await aiResponse.json();
  const content = data.choices?.[0]?.message?.content || "";
  console.log("[Suggest Goals] Raw response:", content);
  try {
    let suggestions = [];
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      suggestions = JSON.parse(jsonMatch[0]);
    } else {
      const lines = content.split("\n").filter((l) => l.trim());
      suggestions = lines.map((l) => l.replace(/^[-\d.]+\s*/, "").trim()).filter(Boolean);
    }
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = [
        `Target ${title.toLowerCase().includes("intro") ? "beginners" : "intermediate developers"} with clear explanations`,
        "Include practical code examples",
        "Add a troubleshooting section",
        "Optimize for SEO with relevant keywords",
        "Compare with alternative approaches"
      ];
    }
    console.log("[Suggest Goals] Suggestions:", suggestions);
    return new Response(JSON.stringify({ suggestions }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("[Suggest Goals] Parse error:", e);
    return new Response(JSON.stringify({
      suggestions: [
        "Target developers with practical examples",
        "Include SEO keywords related to the topic",
        "Add code snippets and tutorials",
        "Compare with related technologies",
        "Cover best practices and pitfalls"
      ]
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
export {
  POST
};
