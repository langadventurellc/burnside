import type { StreamRequest } from "./streamRequest";
import type { ToolExecutionRequest } from "./toolExecutionRequest";

/**
 * Tool Execution Stream Request Interface
 *
 * Internal streaming request interface for tool execution integration that combines
 * streaming capabilities with tool execution state tracking.
 *
 * Used internally by BridgeClient for streaming tool execution where the stream
 * may be interrupted for tool calls and then resumed with tool results.
 *
 * @example
 * ```typescript
 * const request: ToolExecutionStreamRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello!" }] }
 *   ],
 *   model: "gpt-4",
 *   stream: true,
 *   tools: [
 *     { name: "echo", description: "Echo input", parameters: {} }
 *   ],
 *   executedToolCalls: [
 *     { id: "call_123", name: "echo", parameters: { text: "hello" } }
 *   ],
 *   toolExecutionContext: {
 *     requestId: "req_456",
 *     userId: "user_789",
 *     timestamp: new Date().toISOString()
 *   },
 *   conversationState: {
 *     turnCount: 1,
 *     toolCallsInProgress: true
 *   },
 *   streamInterrupted: true,
 *   resumeStreaming: {
 *     fromPosition: 145,
 *     withToolResults: true,
 *     continuationToken: "stream_token_abc"
 *   }
 * };
 * ```
 */
export interface ToolExecutionStreamRequest
  extends StreamRequest,
    Omit<
      ToolExecutionRequest,
      "messages" | "model" | "temperature" | "maxTokens" | "tools" | "options"
    > {
  /** Whether the stream has been interrupted for tool execution */
  streamInterrupted?: boolean;
  /** Configuration for resuming streaming after tool execution */
  resumeStreaming?: {
    /** Position in the stream to resume from */
    fromPosition?: number;
    /** Whether tool results should be integrated */
    withToolResults: boolean;
    /** Provider-specific continuation token */
    continuationToken?: string;
    /** Additional streaming resumption metadata */
    metadata?: Record<string, unknown>;
  };
}
