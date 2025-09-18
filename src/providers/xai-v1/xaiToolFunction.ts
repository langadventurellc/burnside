/**
 * xAI Tool Function Type
 *
 * Type definition for xAI tool function format, which follows OpenAI compatibility.
 */

/**
 * xAI tool function type (matches OpenAI format)
 */
export interface XAIToolFunction {
  name: string;
  description?: string;
  parameters: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}
