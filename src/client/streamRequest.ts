import type { ChatRequest } from "./chatRequest";

/**
 * Stream Request Interface
 *
 * Configuration for streaming chat completion requests.
 * Extends ChatRequest with additional streaming-specific options.
 * Supports both single-turn and multi-turn streaming conversations.
 *
 * When tools are provided, the stream may be interrupted mid-response if the model
 * requests tool execution. The stream will pause, execute the tool, and resume
 * with the tool results integrated into the conversation.
 *
 * In multi-turn mode, streaming interruption is handled seamlessly across iterations,
 * with each turn potentially involving multiple stream-pause-resume cycles.
 *
 * @example
 * ```typescript
 * // Basic streaming request
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
 *
 * // Multi-turn streaming with interruption handling
 * const multiTurnStreamRequest: StreamRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Help me research a topic" }] }
 *   ],
 *   model: "gpt-4",
 *   stream: true,
 *   streamOptions: { includeUsage: true, bufferSize: 1024 },
 *   tools: [
 *     { name: "search", description: "Search for information", inputSchema: { type: "object" } }
 *   ],
 *   multiTurn: {
 *     maxIterations: 5,
 *     iterationTimeoutMs: 45000,
 *     enableStreaming: true,
 *     toolExecutionStrategy: "sequential"
 *   }
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
