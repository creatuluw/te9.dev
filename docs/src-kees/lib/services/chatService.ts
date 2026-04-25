/**
 * General Chat API service
 *
 * Service for interacting with chat completion APIs
 * Can be extended to support various chat providers
 */

import type { AppError } from "$lib/types/errors";
import { NetworkError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
  done: boolean;
}

export interface ChatCompletionChunk {
  content: string;
  done: boolean;
}

/**
 * Send a chat completion request
 * Returns a streaming response that can be consumed
 *
 * @param request - Chat completion request
 * @returns Result containing a ReadableStream, or error
 *
 * @example
 * ```typescript
 * const result = await sendChatCompletion({
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
  // TODO: Replace with actual API endpoint
  // For now, this is a placeholder that can be extended
  const apiUrl = import.meta.env.PUBLIC_CHAT_API_URL || "/api/chat/completions";
  const apiKey = import.meta.env.PUBLIC_CHAT_API_KEY;

  if (!apiKey) {
    return err(
      new NetworkError(
        "Chat API key not configured. Set PUBLIC_CHAT_API_KEY in .env",
      ),
    );
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: request.stream ?? true,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Chat API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || errorData.error?.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      return err(NetworkError.from(new Error(errorMessage), apiUrl));
    }

    if (!response.body) {
      return err(new NetworkError("No response body from Chat API"));
    }

    return ok(response.body);
  } catch (error) {
    return err(NetworkError.from(error, apiUrl));
  }
}

/**
 * Process a streaming response from Chat API
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

/**
 * Send a non-streaming chat completion request
 * Returns the complete response
 *
 * @param request - Chat completion request
 * @returns Result containing the complete response, or error
 *
 * @example
 * ```typescript
 * const result = await sendChatCompletionNonStreaming({
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
  const apiUrl = import.meta.env.PUBLIC_CHAT_API_URL || "/api/chat/completions";
  const apiKey = import.meta.env.PUBLIC_CHAT_API_KEY;

  if (!apiKey) {
    return err(
      new NetworkError(
        "Chat API key not configured. Set PUBLIC_CHAT_API_KEY in .env",
      ),
    );
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Chat API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || errorData.error?.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      return err(NetworkError.from(new Error(errorMessage), apiUrl));
    }

    const data = await response.json();

    // Extract content from various response formats
    const content =
      data.content ||
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      data.message?.content ||
      "";

    return ok({
      content,
      done: true,
    });
  } catch (error) {
    return err(NetworkError.from(error, apiUrl));
  }
}
