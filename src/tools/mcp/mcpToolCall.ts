/**
 * MCP Tool Call Interface
 *
 * Parameters for calling an MCP tool.
 * Used when invoking tools through the MCP protocol.
 *
 * @example
 * ```typescript
 * const toolCall: McpToolCall = {
 *   name: "calculator",
 *   arguments: {
 *     operation: "add",
 *     a: 10,
 *     b: 5
 *   }
 * };
 * ```
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/basic/tools/} MCP Tools Specification
 */
export interface McpToolCall {
  /**
   * Name of the tool to invoke, must match an available tool.
   */
  name: string;

  /**
   * Arguments to pass to the tool, validated against the tool's inputSchema.
   */
  arguments?: Record<string, unknown>;
}
