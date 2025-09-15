/**
 * Tool Definition Interface
 *
 * Interface defining the structure and metadata for a tool that can be
 * executed by the LLM Bridge library. Provides the foundation for tool
 * registration and invocation across different providers.
 *
 * @example
 * ```typescript
 * const weatherTool: ToolDefinition = {
 *   name: "get_weather",
 *   description: "Get current weather for a location",
 *   parameters: {
 *     type: "object",
 *     properties: {
 *       location: { type: "string", description: "City name" }
 *     },
 *     required: ["location"]
 *   }
 * };
 * ```
 */
export interface ToolDefinition {
  /** Unique name identifier for the tool */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON Schema defining the tool's input parameters */
  parameters: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
  /** Optional metadata associated with the tool */
  metadata?: Record<string, unknown>;
}
