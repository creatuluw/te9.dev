/**
 * TinyTalk API service
 *
 * Service for interacting with TinyTalk Chat Completions API
 * Documentation: https://tinytalk.ai/docs/api-reference
 */

import type { AppError } from "$lib/types/errors";
import { NetworkError, ValidationError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  botId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionChunk {
  content: string;
  done: boolean;
}

/**
 * User intention types for chat routing
 */
export type ChatIntention =
  | { type: "create_task"; confidence: "high" | "medium" | "low" }
  | {
      type: "delete_task";
      taskSubject?: string;
      confidence: "high" | "medium" | "low";
    }
  | { type: "general_chat"; confidence: "high" | "medium" | "low" }
  | {
      type: "update_task";
      taskSubject?: string;
      confidence: "high" | "medium" | "low";
    }
  | { type: "unclear"; confidence: "low" };

export interface ChatIntentionRequest {
  messages: ChatMessage[];
  botId?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Send a chat completion request to TinyTalk API
 * Returns a streaming response that can be consumed
 *
 * @param request - Chat completion request
 * @returns Result containing a ReadableStream, or error
 *
 * @example
 * ```typescript
 * const result = await sendChatCompletion({
 *   botId: 'your-bot-id',
 *   messages: [{ role: 'user', content: 'Hello' }]
 * });
 *
 * if (result.success) {
 *   const stream = result.value;
 *   // Process stream...
 * }
 * ```
 */
export async function sendChatCompletion(
  request: ChatCompletionRequest,
): Promise<Result<ReadableStream<Uint8Array>, AppError>> {
  const apiKey = import.meta.env.PUBLIC_TINYTALK_API_KEY;
  const origin =
    import.meta.env.PUBLIC_TINYTALK_ORIGIN ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://localhost:5173");

  if (!apiKey) {
    return err(
      new NetworkError(
        "TinyTalk API key not configured. Set PUBLIC_TINYTALK_API_KEY in .env",
      ),
    );
  }

  try {
    const response = await fetch(
      "https://api.tinytalk.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Api-Key": apiKey,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId: request.botId,
          messages: request.messages,
          temperature: request.temperature ?? 0.1,
        }),
      },
    );

    if (!response.ok) {
      let errorMessage = `TinyTalk API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      return err(
        NetworkError.from(
          new Error(errorMessage),
          "https://api.tinytalk.ai/v1/chat/completions",
        ),
      );
    }

    if (!response.body) {
      return err(new NetworkError("No response body from TinyTalk API"));
    }

    return ok(response.body);
  } catch (error) {
    return err(
      NetworkError.from(error, "https://api.tinytalk.ai/v1/chat/completions"),
    );
  }
}

/**
 * Process a streaming response from TinyTalk API
 * Extracts content chunks from the stream
 *
 * @param stream - ReadableStream from API response
 * @param onChunk - Callback for each chunk received
 * @returns Promise that resolves when stream is complete
 *
 * @example
 * ```typescript
 * await processStream(stream, (chunk) => {
 *   console.log('Received:', chunk.content);
 * });
 * ```
 */
export async function processStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: ChatCompletionChunk) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          onChunk({ content: buffer, done: true });
        }
        break;
      }

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines (Server-Sent Events format)
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim() === "") continue;

        // Handle SSE format: "data: {content}"
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: " prefix

          if (data === "[DONE]") {
            onChunk({ content: "", done: true });
            return;
          }

          try {
            // Try to parse as JSON (some formats may include JSON)
            const parsed = JSON.parse(data);
            if (parsed.content || parsed.choices?.[0]?.delta?.content) {
              const content =
                parsed.content || parsed.choices[0].delta.content || "";
              onChunk({ content, done: false });
            }
          } catch {
            // If not JSON, treat as plain text
            onChunk({ content: data, done: false });
          }
        } else if (line.trim()) {
          // Plain text line
          onChunk({ content: line, done: false });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface ChatCompletionResponse {
  content: string;
  done: boolean;
}

/**
 * Send a non-streaming chat completion request to TinyTalk API
 * Returns the complete response
 *
 * @param request - Chat completion request
 * @returns Result containing the complete response, or error
 *
 * @example
 * ```typescript
 * const result = await sendChatCompletionNonStreaming({
 *   botId: 'your-bot-id',
 *   messages: [{ role: 'user', content: 'Hello' }]
 * });
 *
 * if (result.success) {
 *   console.log(result.value.content);
 * }
 * ```
 */
export async function sendChatCompletionNonStreaming(
  request: ChatCompletionRequest,
): Promise<Result<ChatCompletionResponse, AppError>> {
  const apiKey = import.meta.env.PUBLIC_TINYTALK_API_KEY;
  const origin =
    import.meta.env.PUBLIC_TINYTALK_ORIGIN ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://localhost:5173");

  if (!apiKey) {
    return err(
      new NetworkError(
        "TinyTalk API key not configured. Set PUBLIC_TINYTALK_API_KEY in .env",
      ),
    );
  }

  try {
    // Use streaming endpoint but collect all chunks
    const streamResult = await sendChatCompletion({
      botId: request.botId,
      messages: request.messages,
      temperature: request.temperature,
    });

    if (!streamResult.success) {
      return err(streamResult.error);
    }

    // Process stream and collect all content
    let fullContent = "";
    await processStream(streamResult.value, (chunk) => {
      if (chunk.content) {
        fullContent += chunk.content;
      }
    });

    return ok({
      content: fullContent,
      done: true,
    });
  } catch (error) {
    return err(
      NetworkError.from(error, "https://api.tinytalk.ai/v1/chat/completions"),
    );
  }
}

/**
 * Analyze user message to detect intention using TinyTalk
 * Routes to appropriate handler based on detected intention
 *
 * @param request - Chat intention analysis request
 * @returns Result containing the detected intention
 *
 * @example
 * ```typescript
 * const result = await detectChatIntention({
 *   messages: [{ role: 'user', content: 'maak een taak' }],
 *   botId: 'your-bot-id'
 * });
 * if (result.success) {
 *   switch (result.value.type) {
 *     case 'create_task':
 *       // Handle task creation
 *       break;
 *   }
 * }
 * ```
 */
export async function detectChatIntention(
  request: ChatIntentionRequest,
): Promise<Result<ChatIntention, AppError>> {
  const botId = request.botId || import.meta.env.PUBLIC_TINYTALK_BOT_ID || "";

  if (!botId) {
    return err(
      ValidationError.create(
        "TinyTalk bot ID not configured. Set PUBLIC_TINYTALK_BOT_ID in .env or provide botId parameter",
        "botId",
        botId,
      ),
    );
  }

  if (!request.messages || request.messages.length === 0) {
    return err(
      ValidationError.create(
        "Messages array cannot be empty",
        "messages",
        request.messages,
      ),
    );
  }

  const today = new Date();
  const todayFormatted = today.toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayISO = today.toISOString().split("T")[0];

  const systemPrompt = `Je bent een intelligente AI-assistent die de intentie van gebruikersberichten analyseert.

BELANGRIJK: Vandaag is ${todayFormatted} (${todayISO}).

Je taak is om te bepalen wat de gebruiker wil doen op basis van hun bericht.

BELANGRIJK: Je MOET je output altijd in JSON formaat geven met deze exacte structuur:
{
  "intention": "create_task" | "delete_task" | "update_task" | "general_chat" | "unclear",
  "confidence": "high" | "medium" | "low",
  "taskSubject": "naam van de taak (alleen bij delete_task of update_task, optioneel)"
}

REGELS:
1. **create_task**: Gebruiker wil een taak aanmaken
   - Herken: "maak een taak", "create task", "nieuwe taak", "ik wil X doen", "X volgende week", "X duurt Y uren", etc.
   - Als de gebruiker een activiteit beschrijft met details zoals deadline, uren, voor wie, etc., is dit waarschijnlijk create_task
   - VOORBEELD: "Ik wil de app kees testen volgende week het duurt 4 uren" → { "intention": "create_task", "confidence": "high" }

2. **delete_task**: Gebruiker wil een taak verwijderen
   - Herken: "verwijder", "delete", "wissen", "verwijder de taak", "delete taak X", etc.
   - Extract taskSubject als een specifieke taak wordt genoemd
   - Als alleen "verwijder de taak" wordt gezegd zonder specifieke naam, laat taskSubject leeg
   - VOORBEELD: "verwijder de test taak" → { "intention": "delete_task", "taskSubject": "test taak", "confidence": "high" }
   - VOORBEELD: "verwijder de taak" → { "intention": "delete_task", "taskSubject": "", "confidence": "high" }

3. **update_task**: Gebruiker wil een taak bijwerken
   - Herken: "update", "wijzig", "pas aan", "change task X", "update taak Y", etc.
   - Extract taskSubject als een specifieke taak wordt genoemd

4. **general_chat**: Algemene chat, vragen, hulp
   - Alles wat niet specifiek over taken gaat
   - Vragen, uitleg, algemene conversatie

5. **unclear**: Intentie is niet duidelijk
   - Gebruik alleen als je echt niet zeker bent

CONFIDENCE:
- "high": Je bent zeer zeker van de intentie
- "medium": Je bent redelijk zeker maar niet 100%
- "low": Je bent onzeker

Spreek altijd Nederlands in je responses, maar geef ALTIJD geldige JSON - geen extra tekst voor of na de JSON.

VOORBEELDEN:

Input: "Ik wil de app kees testen volgende week het duurt 4 uren"
Output: {"intention": "create_task", "confidence": "high"}

Input: "verwijder de test taak"
Output: {"intention": "delete_task", "taskSubject": "test taak", "confidence": "high"}

Input: "verwijder de taak"
Output: {"intention": "delete_task", "taskSubject": "", "confidence": "high"}

Input: "Hoe werkt dit systeem?"
Output: {"intention": "general_chat", "confidence": "high"}

Input: "Wat is de deadline van project X?"
Output: {"intention": "general_chat", "confidence": "high"}`;

  try {
    // Prepare messages for AI
    const aiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...request.messages.slice(-5), // Use last 5 messages for context
    ];

    // Call AI for intention detection
    const result = await sendChatCompletionNonStreaming({
      botId: botId,
      messages: aiMessages,
      temperature: request.temperature ?? 0.3, // Lower temperature for more consistent classification
      maxTokens: request.maxTokens ?? 200,
    });

    if (!result.success) {
      return err(result.error);
    }

    const responseContent = result.value.content.trim();

    // Try to extract JSON from response
    let jsonContent = responseContent;

    // Remove markdown code blocks if present
    if (responseContent.includes("```")) {
      const jsonMatch = responseContent.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/,
      );
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
    }

    // Parse JSON response
    let parsedResult: {
      intention: string;
      confidence: string;
      taskSubject?: string;
    };

    try {
      parsedResult = JSON.parse(jsonContent);
    } catch (parseError) {
      // Try to extract JSON object from text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch {
          return err(
            ValidationError.create(
              "AI response is not valid JSON",
              "response",
              responseContent,
            ),
          );
        }
      } else {
        return err(
          ValidationError.create(
            "AI response is not valid JSON",
            "response",
            responseContent,
          ),
        );
      }
    }

    // Validate intention type
    const validIntentions = [
      "create_task",
      "delete_task",
      "update_task",
      "general_chat",
      "unclear",
    ];
    if (!validIntentions.includes(parsedResult.intention)) {
      return err(
        ValidationError.create(
          `Invalid intention type: ${parsedResult.intention}`,
          "intention",
          parsedResult.intention,
        ),
      );
    }

    // Validate confidence
    const validConfidences = ["high", "medium", "low"];
    if (!validConfidences.includes(parsedResult.confidence)) {
      parsedResult.confidence = "medium";
    }

    // Build intention object based on type
    const intention: ChatIntention = (() => {
      switch (parsedResult.intention) {
        case "create_task":
          return {
            type: "create_task",
            confidence: parsedResult.confidence as "high" | "medium" | "low",
          };
        case "delete_task":
          return {
            type: "delete_task",
            taskSubject: parsedResult.taskSubject || undefined,
            confidence: parsedResult.confidence as "high" | "medium" | "low",
          };
        case "update_task":
          return {
            type: "update_task",
            taskSubject: parsedResult.taskSubject || undefined,
            confidence: parsedResult.confidence as "high" | "medium" | "low",
          };
        case "general_chat":
          return {
            type: "general_chat",
            confidence: parsedResult.confidence as "high" | "medium" | "low",
          };
        default:
          return {
            type: "unclear",
            confidence: "low",
          };
      }
    })();

    return ok(intention);
  } catch (error) {
    return err(NetworkError.from(error, "TinyTalk API"));
  }
}
