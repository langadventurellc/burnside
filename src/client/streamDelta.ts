import type { Message } from "../core/messages/message";

/**
 * Stream Delta Interface
 *
 * Represents an incremental chunk in a streaming response.
 * Contains partial content and metadata for real-time updates.
 *
 * @example
 * ```typescript
 * const delta: StreamDelta = {
 *   id: "chunk-123",
 *   delta: {
 *     role: "assistant",
 *     content: [{ type: "text", text: "Hello" }]
 *   },
 *   finished: false,
 *   usage: { promptTokens: 10, completionTokens: 5 }
 * };
 * ```
 */
export interface StreamDelta {
  /** Unique identifier for this chunk */
  id: string;
  /** Partial message content for this chunk */
  delta: Partial<Message>;
  /** Whether this is the final chunk in the stream */
  finished: boolean;
  /** Token usage information (included when available) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
  };
  /** Additional metadata for this chunk */
  metadata?: Record<string, unknown>;
}
