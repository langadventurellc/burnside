import type { Message } from "../core/messages/message";
import type { ToolDefinition } from "../core/tools/toolDefinition";
import type { AgentExecutionOptions } from "../core/agent/agentExecutionOptions";

/**
 * Chat Request Interface
 *
 * Configuration for standard chat completion requests.
 * Defines the structure for requesting chat responses from LLM providers.
 * Supports both single-turn and multi-turn conversation configurations.
 *
 * @example
 * ```typescript
 * // Basic single-turn request
 * const request: ChatRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Hello!" }] }
 *   ],
 *   model: "gpt-4",
 *   temperature: 0.7,
 *   maxTokens: 1000,
 *   tools: [
 *     { name: "echo", description: "Echo input", inputSchema: { type: "object" } }
 *   ]
 * };
 *
 * // Multi-turn conversation request
 * const multiTurnRequest: ChatRequest = {
 *   messages: [
 *     { role: "user", content: [{ type: "text", text: "Help me with a task" }] }
 *   ],
 *   model: "gpt-4",
 *   tools: [
 *     { name: "search", description: "Search for information", inputSchema: { type: "object" } }
 *   ],
 *   multiTurn: {
 *     maxIterations: 5,
 *     iterationTimeoutMs: 30000,
 *     toolExecutionStrategy: "sequential",
 *     enableStreaming: true
 *   }
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
  /** Tool definitions for tool execution (only processed when BridgeClient has tools enabled) */
  tools?: ToolDefinition[];
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
  /**
   * Multi-turn conversation configuration options
   *
   * Enables multi-turn agent execution with configurable iteration limits,
   * timeout controls, and tool execution strategies. When provided, the agent
   * will conduct multi-turn conversations until natural completion or limits are reached.
   *
   * @example
   * ```typescript
   * // Basic multi-turn configuration
   * multiTurn: {
   *   maxIterations: 3,
   *   iterationTimeoutMs: 15000
   * }
   *
   * // Advanced multi-turn with parallel tool execution
   * multiTurn: {
   *   maxIterations: 10,
   *   iterationTimeoutMs: 30000,
   *   toolExecutionStrategy: "parallel",
   *   maxConcurrentTools: 2,
   *   enableStreaming: true
   * }
   * ```
   */
  multiTurn?: Partial<AgentExecutionOptions>;
}
