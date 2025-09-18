/**
 * Client Module
 *
 * This module provides the primary public API for the LLM Bridge Library,
 * including the BridgeClient class and related types for chat and streaming
 * functionality. Supports both single-turn and multi-turn agent conversations
 * with configurable execution options.
 *
 * @example
 * ```typescript
 * import { BridgeClient } from "@llm-bridge/client";
 *
 * // Basic client setup
 * const client = new BridgeClient({
 *   defaultProvider: "openai",
 *   providers: { openai: { apiKey: "sk-..." } }
 * });
 *
 * // Multi-turn conversation with configurable options
 * const multiTurnRequest = {
 *   messages: [{ role: "user", content: [{ type: "text", text: "Help me research" }] }],
 *   model: "gpt-4",
 *   multiTurn: {
 *     maxIterations: 5,
 *     toolExecutionStrategy: "sequential"
 *   }
 * };
 * ```
 */

// Main client class
export { BridgeClient } from "./bridgeClient";

// Request and response types
export type { ChatRequest } from "./chatRequest";
export type { StreamRequest } from "./streamRequest";
export type { StreamDelta } from "./streamDelta";

// Tool execution types
export type { ToolExecutionRequest } from "./toolExecutionRequest";
export type { ToolExecutionStreamRequest } from "./toolExecutionStreamRequest";

// Configuration types
export type { BridgeClientConfig } from "./bridgeClientConfig";

// Tool integration utilities
export { extractToolCallsFromMessage } from "./extractToolCallsFromMessage";
export { formatToolResultsAsMessages } from "./formatToolResultsAsMessages";
export { shouldExecuteTools } from "./shouldExecuteTools";
export { validateToolDefinitions } from "./validateToolDefinitions";

// Streaming interruption utilities
export { StreamingInterruptionWrapper } from "./streamingInterruptionWrapper";
