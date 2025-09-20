/**
 * MCP JSON Schema Interface
 *
 * JSON Schema format used by MCP for tool parameter definitions.
 * Aligned with the ToolDefinition JSON schema format for compatibility.
 *
 * @see {@link https://json-schema.org/draft/2020-12/schema} JSON Schema Draft 2020-12
 * @see {@link https://spec.modelcontextprotocol.io/specification/basic/tools/} MCP Tools Specification
 */
export interface McpJsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  // Additional JSON Schema properties (using Record for flexibility)
  [key: string]: unknown;
}
