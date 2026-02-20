import { d as db } from "./db.js";
async function getAIConfig() {
  const config = await db.config.get("ai");
  const baseUrl = process.env.AI_BASE_URL || config?.base_url || "https://api.openai.com/v1";
  const apiKey = process.env.AI_API_KEY || config?.api_key || "";
  const model = process.env.AI_MODEL || config?.model || "gpt-4o";
  return { baseUrl, apiKey, model };
}
function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 80);
}
async function testAIConnection() {
  try {
    const { baseUrl, apiKey, model } = await getAIConfig();
    if (!apiKey) {
      return { success: false, message: "AI API key not configured" };
    }
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "user", content: 'Say "Connection successful" in exactly those words.' }
        ],
        max_tokens: 20,
        thinking: { type: "disabled" }
      })
    });
    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `API error: ${response.status} - ${error}` };
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return {
      success: true,
      message: `Connected successfully using ${model}. Response: ${content}`
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}
export {
  generateSlug as a,
  getAIConfig as g,
  testAIConnection as t
};
