/**
 * Agent Execution State Interface
 *
 * Represents the execution state during agent loop processing.
 * Tracks messages, tool calls, results, and continuation status for a single
 * agent execution cycle. Used internally by AgentLoop to maintain state
 * during tool execution and conversation flow.
 */

import type { Message } from "../messages/message";
import type { ToolCall } from "../tools/toolCall";
import type { ToolResult } from "../tools/toolResult";

/**
 * Represents the execution state during agent loop processing
 *
 * @example
 * ```typescript
 * const state: AgentExecutionState = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello" }] }
 *   ],
 *   toolCalls: [
 *     { id: "call-1", name: "echo", parameters: { data: "test" } }
 *   ],
 *   results: [
 *     { callId: "call-1", success: true, data: { echoed: "test" } }
 *   ],
 *   shouldContinue: true,
 *   lastResponse: "Tool executed successfully"
 * };
 * ```
 */
export interface AgentExecutionState {
  /** Array of messages in the conversation history */
  messages: Message[];
  /** Array of tool calls executed in this cycle */
  toolCalls: ToolCall[];
  /** Array of tool execution results */
  results: ToolResult[];
  /** Whether the conversation should continue after this execution */
  shouldContinue: boolean;
  /** Optional last response text from the agent */
  lastResponse?: string;
}
