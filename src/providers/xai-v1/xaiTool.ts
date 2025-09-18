/**
 * xAI Tool Type
 *
 * Type definition for xAI tool format, which follows OpenAI Responses API compatibility.
 * Uses flat structure instead of nested function object.
 */

/**
 * xAI tool type (matches OpenAI Responses API format)
 */
export interface XAITool {
  type: "function";
  name: string;
  description?: string;
  parameters: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}
