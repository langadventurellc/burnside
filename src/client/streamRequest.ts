import type { ChatRequest } from "./chatRequest";

/**
 * Stream Request Interface
 *
 * Configuration for streaming chat completion requests.
 * Identical to ChatRequest with additional streaming-specific options.
 *
 * When tools are provided, the stream may be interrupted mid-response if the model
 * requests tool execution. The stream will pause, execute the tool, and resume
 * with the tool results integrated into the conversation.
 *
 * @example
 * ```typescript
 * const request: StreamRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello!" }] }
 *   ],
 *   model: "gpt-4",
 *   temperature: 0.7,
 *   stream: true,
 *   streamOptions: { includeUsage: true },
 *   tools: [
 *     { name: "echo", description: "Echo input", inputSchema: { type: "object" } }
 *   ]
 * };
 * ```
 */
export interface StreamRequest extends ChatRequest {
  /** Enable streaming response mode */
  stream?: boolean;
  /** Streaming-specific configuration options */
  streamOptions?: {
    /** Include token usage information in stream */
    includeUsage?: boolean;
    /** Buffer size for streaming chunks */
    bufferSize?: number;
  };
}
