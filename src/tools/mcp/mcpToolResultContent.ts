/**
 * MCP Tool Result Content Interface
 *
 * Content item in an MCP tool result.
 * Represents a single piece of content returned by a tool execution.
 *
 * @example
 * ```typescript
 * const textContent: McpToolResultContent = {
 *   type: "text",
 *   text: "The calculation result is 15"
 * };
 *
 * const dataContent: McpToolResultContent = {
 *   type: "image",
 *   data: imageBuffer,
 *   mimeType: "image/png"
 * };
 * ```
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/basic/tools/} MCP Tools Specification
 */
export interface McpToolResultContent {
  /**
   * Type of content (e.g., "text", "image", "resource").
   * MCP specification defines standard content types.
   */
  type: string;

  /**
   * Text content for text-type results.
   */
  text?: string;

  /**
   * Binary or structured data for non-text content types.
   */
  data?: unknown;

  /**
   * MIME type for data content when applicable.
   */
  mimeType?: string;

  /**
   * Additional metadata about this content item.
   */
  annotations?: Record<string, unknown>;
}
