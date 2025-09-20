/**
 * MCP Tool Result Interface
 *
 * Result from calling an MCP tool.
 * Contains the response data and any metadata from tool execution.
 *
 * @example
 * ```typescript
 * const successResult: McpToolResult = {
 *   content: [
 *     {
 *       type: "text",
 *       text: "The calculation result is 15"
 *     }
 *   ],
 *   isError: false
 * };
 *
 * const errorResult: McpToolResult = {
 *   content: [
 *     {
 *       type: "text",
 *       text: "Error: Division by zero"
 *     }
 *   ],
 *   isError: true
 * };
 * ```
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/basic/tools/} MCP Tools Specification
 */

import type { McpToolResultContent } from "./mcpToolResultContent";

export interface McpToolResult {
  /**
   * Array of content items returned by the tool.
   * Tools can return multiple content items of different types.
   */
  content: McpToolResultContent[];

  /**
   * Whether the tool execution completed successfully.
   * True indicates success, false indicates an error occurred.
   */
  isError?: boolean;

  /**
   * Additional metadata about the tool execution.
   */
  meta?: Record<string, unknown>;
}
