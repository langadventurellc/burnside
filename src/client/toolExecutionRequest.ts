import type { ChatRequest } from "./chatRequest";
import type { ToolCall } from "../core/tools/toolCall";
import type { ToolExecutionContext } from "../core/tools/toolExecutionContext";

/**
 * Tool Execution Request Interface
 *
 * Internal request interface that extends ChatRequest with tool call execution details
 * for provider integration during tool execution flow.
 *
 * Used internally by BridgeClient when tool calls have been detected in responses
 * and need to be executed before continuing the conversation.
 *
 * @example
 * ```typescript
 * const request: ToolExecutionRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello!" }] },
 *     { role: "assistant", content: [{ type: "text", text: "I'll use a tool to help." }] }
 *   ],
 *   model: "gpt-4",
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
 *     turnCount: 2,
 *     toolCallsInProgress: true
 *   }
 * };
 * ```
 */
export interface ToolExecutionRequest extends ChatRequest {
  /** Tool calls that have been executed in this request cycle */
  executedToolCalls: ToolCall[];
  /** Execution context for security and tracking */
  toolExecutionContext: ToolExecutionContext;
  /** Conversation state for multi-turn tracking */
  conversationState: {
    /** Number of turns in this conversation */
    turnCount: number;
    /** Whether tool calls are currently in progress */
    toolCallsInProgress: boolean;
    /** Additional state tracking metadata */
    metadata?: Record<string, unknown>;
  };
}
