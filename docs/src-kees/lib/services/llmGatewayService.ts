/**
 * LLM Gateway Service
 *
 * Service for interacting with the Qwen3.5-4B LLM Gateway
 * Uses OpenAI-compatible API endpoint (/v1/chat/completions)
 *
 * Environment routing:
 * - DEV: Uses public Railway URL (accessible from local machine)
 * - PROD: Uses private Railway network (faster, internal routing)
 */

import type { AppError } from "$lib/types/errors";
import { NetworkError } from "$lib/types/errors";
import { ok, err, type Result } from "$lib/types/result";

// ============================================
// Configuration
// ============================================

// The LLM gateway is called from the browser, not server-side.
// The internal Railway URL is only reachable from within the Railway private
// network (server-to-server), so the browser must always use the public URL.
// If you want to use the internal URL for faster prod calls, you would need to
// create a server-side API proxy (+server.ts) that forwards requests to the
// internal gateway.
const LLM_GATEWAY_URL = "https://llm-gateway-production-f86c.up.railway.app/v1";
const DEFAULT_MODEL = "unsloth/Qwen3.5-2B-GGUF";

function getBaseUrl(): string {
  return LLM_GATEWAY_URL;
}

// ============================================
// Types
// ============================================

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  responseFormat?: { type: "text" | "json_object" };
}

export interface ChatCompletionChunk {
  content: string;
  done: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GatewayHealthStatus {
  healthy: boolean;
  status?: string;
  model?: string;
}

// ============================================
// Health Check
// ============================================

/**
 * Check if the LLM gateway is healthy
 * @returns Result with health status
 */
export async function checkHealth(): Promise<
  Result<GatewayHealthStatus, AppError>
> {
  const baseUrl = getBaseUrl();
  const healthUrl = baseUrl.replace(/\/v1\/?$/, "/health");

  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return ok({ healthy: false });
    }

    const data = await response.json();
    return ok({
      healthy: true,
      status: data.status,
      model: data.model,
    });
  } catch {
    return ok({ healthy: false });
  }
}

// ============================================
// Streaming Chat Completion
// ============================================

/**
 * Send a streaming chat completion request to the LLM Gateway
 * Returns a ReadableStream that can be consumed with processStream
 *
 * @param request - Chat completion request
 * @returns Result containing a ReadableStream, or error
 *
 * @example
 * ```typescript
 * const result = await sendChatCompletion({
 *   messages: [{ role: "user", content: "Hello" }],
 *   temperature: 0.7,
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
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/chat/completions`;

  const body = {
    model: request.model || DEFAULT_MODEL,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 2048,
    stream: true,
    ...(request.responseFormat
      ? { response_format: request.responseFormat }
      : {}),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000), // 2 minute timeout for LLM inference
    });

    if (!response.ok) {
      let errorMessage = `LLM Gateway error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      return err(NetworkError.from(new Error(errorMessage), url));
    }

    if (!response.body) {
      return err(new NetworkError("No response body from LLM Gateway"));
    }

    return ok(response.body);
  } catch (error) {
    return err(NetworkError.from(error, url));
  }
}

// ============================================
// Stream Processing
// ============================================

/**
 * Process a streaming response from the LLM Gateway
 * Extracts content chunks from the OpenAI-compatible SSE stream
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

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines (Server-Sent Events format)
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;

        // Handle SSE format: "data: {json}"
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") {
            onChunk({ content: "", done: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);

            // OpenAI-compatible format: choices[0].delta.content
            const delta = parsed.choices?.[0]?.delta?.content;
            const finishReason = parsed.choices?.[0]?.finish_reason;

            if (delta) {
              onChunk({ content: delta, done: false });
            }

            if (finishReason === "stop") {
              onChunk({ content: "", done: true });
              return;
            }
          } catch {
            // If not JSON, treat as plain text
            onChunk({ content: data, done: false });
          }
        } else if (line.trim()) {
          // Plain text line (fallback)
          onChunk({ content: line, done: false });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================
// Non-Streaming Chat Completion
// ============================================

/**
 * Send a non-streaming chat completion request to the LLM Gateway
 * Returns the complete response
 *
 * @param request - Chat completion request
 * @returns Result containing the complete response, or error
 *
 * @example
 * ```typescript
 * const result = await sendChatCompletionNonStreaming({
 *   messages: [{ role: "user", content: "Hello" }],
 *   temperature: 0.3,
 * });
 *
 * if (result.success) {
 *   console.log(result.value.content);
 * }
 * ```
 */
export async function sendChatCompletionNonStreaming(
  request: ChatCompletionRequest,
): Promise<Result<{ content: string; done: boolean }, AppError>> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/chat/completions`;

  const body = {
    model: request.model || DEFAULT_MODEL,
    messages: request.messages,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 2048,
    stream: false,
    ...(request.responseFormat
      ? { response_format: request.responseFormat }
      : {}),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      let errorMessage = `LLM Gateway error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      return err(NetworkError.from(new Error(errorMessage), url));
    }

    const data: ChatCompletionResponse = await response.json();

    const content = data.choices?.[0]?.message?.content || "";

    return ok({
      content,
      done: true,
    });
  } catch (error) {
    return err(NetworkError.from(error, url));
  }
}

// ============================================
// Convenience Methods
// ============================================

/**
 * Simple chat completion helper - send messages and get a text response
 *
 * @param messages - Array of chat messages
 * @param options - Optional parameters
 * @returns Result containing the response text
 */
export async function chat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<Result<string, AppError>> {
  const result = await sendChatCompletionNonStreaming({
    messages,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  });

  if (!result.success) {
    return err(result.error);
  }

  return ok(result.value.content);
}

/**
 * JSON mode chat completion - forces the model to respond with valid JSON
 *
 * @param messages - Array of chat messages
 * @param options - Optional parameters
 * @returns Result containing the parsed JSON response
 */
export async function chatJSON<T = unknown>(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<Result<T, AppError>> {
  const result = await sendChatCompletionNonStreaming({
    messages,
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 1024,
    responseFormat: { type: "json_object" },
  });

  if (!result.success) {
    return err(result.error);
  }

  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonContent = result.value.content.trim();

    // Remove markdown code blocks if present
    if (jsonContent.includes("```")) {
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
    }

    const parsed = JSON.parse(jsonContent) as T;
    return ok(parsed);
  } catch {
    return err(
      new NetworkError(`Failed to parse JSON response from LLM Gateway`),
    );
  }
}
