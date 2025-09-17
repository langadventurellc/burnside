/**
 * Tool Call Interface
 *
 * Represents a request to execute a tool with specific parameters and metadata.
 * Used to track tool execution requests from LLM providers and maintain
 * execution context throughout the tool system pipeline.
 *
 * @example
 * ```typescript
 * const toolCall: ToolCall = {
 *   id: "call_abc123",
 *   name: "calculate_sum",
 *   parameters: { a: 5, b: 3 },
 *   metadata: {
 *     providerId: "openai",
 *     timestamp: "2024-01-15T10:30:00.000Z",
 *     contextId: "conversation_456"
 *   }
 * };
 * ```
 */

/**
 * Represents a request to execute a tool with specific parameters.
 *
 * This interface defines the structure for tool calls initiated by LLM providers
 * or other parts of the system. Each tool call includes a unique identifier,
 * the tool name to execute, parameters for the tool, and optional metadata
 * for tracking and context.
 */
export interface ToolCall {
  /**
   * Unique identifier for this tool call.
   * Used to correlate tool calls with their results and maintain execution state.
   */
  id: string;

  /**
   * Name of the tool to execute.
   * Must match a registered tool name in the ToolRouter system.
   */
  name: string;

  /**
   * Input parameters for the tool execution.
   * Structure depends on the specific tool's parameter schema.
   */
  parameters: Record<string, unknown>;

  /**
   * Optional metadata for tracking and context.
   * Provides additional information about the tool call's origin and context.
   */
  metadata?: {
    /**
     * Identifier of the provider that initiated this tool call.
     * Examples: "openai", "anthropic", "local"
     */
    providerId?: string;

    /**
     * ISO 8601 timestamp when the tool call was created.
     * Used for tracking execution timing and debugging.
     */
    timestamp?: string;

    /**
     * Context identifier linking this tool call to a conversation or session.
     * Helps maintain execution context across multiple tool calls.
     */
    contextId?: string;
  };
}
