import type { ContentPart } from "./contentPart";
import type { Role } from "./role";
import type { SourceRef } from "./sourceRef";

/**
 * Core Message Interface
 *
 * Core message interface representing a single message in a conversation.
 * Provides a unified structure for messages across different LLM providers.
 *
 * @example
 * ```typescript
 * const message: Message = {
 *   id: "msg-456",
 *   role: "user",
 *   content: [
 *     { type: "text", text: "What is the weather like today?" }
 *   ],
 *   timestamp: new Date().toISOString(),
 *   sources: [{ id: "weather-api", url: "https://api.weather.com" }]
 * };
 * ```
 */
export interface Message {
  /** Optional unique identifier for the message */
  id?: string;
  /** The role of the message sender */
  role: Role;
  /** Array of content parts that make up the message */
  content: ContentPart[];
  /** Optional timestamp when the message was created */
  timestamp?: string;
  /** Optional array of source references cited in the message */
  sources?: SourceRef[];
  /** Optional metadata associated with the message */
  metadata?: Record<string, unknown>;
}
