import type { Message } from "../core/messages/message";

/**
 * Chat Request Interface
 *
 * Configuration for standard chat completion requests.
 * Defines the structure for requesting chat responses from LLM providers.
 *
 * @example
 * ```typescript
 * const request: ChatRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello!" }] }
 *   ],
 *   model: "gpt-4",
 *   temperature: 0.7,
 *   maxTokens: 1000
 * };
 * ```
 */
export interface ChatRequest {
  /** Array of messages in the conversation */
  messages: Message[];
  /** Model identifier to use for completion */
  model: string;
  /** Sampling temperature (0.0 to 2.0) for response generation */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}
