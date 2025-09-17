/**
 * OpenAI Tool Format Schema
 *
 * Zod validation schemas for OpenAI function calling format to ensure
 * proper validation of generated tool definitions before sending to OpenAI API.
 *
 * Supports the OpenAI function calling specification with proper JSON Schema
 * parameter validation and type safety.
 *
 * @example
 * ```typescript
 * import { OpenAIToolSchema } from "./openAIToolSchema";
 *
 * const tool = {
 *   type: "function",
 *   function: {
 *     name: "get_weather",
 *     description: "Get current weather for a location",
 *     parameters: {
 *       type: "object",
 *       properties: {
 *         location: { type: "string", description: "City name" }
 *       },
 *       required: ["location"]
 *     }
 *   }
 * };
 *
 * const validated = OpenAIToolSchema.parse(tool);
 * ```
 */

import { z } from "zod";

/**
 * JSON Schema parameter validation for OpenAI function parameters.
 * Validates the parameters object structure expected by OpenAI API.
 */
export const OpenAIFunctionParametersSchema = z.object({
  /** Must be "object" for OpenAI function parameters */
  type: z.literal("object"),

  /** Object properties with their type definitions */
  properties: z.record(z.string(), z.unknown()).optional(),

  /** Array of required property names */
  required: z.array(z.string()).optional(),

  /** Whether to allow additional properties */
  additionalProperties: z.boolean().optional(),
});

/**
 * OpenAI function definition schema.
 * Validates individual function definitions within tool objects.
 */
export const OpenAIFunctionSchema = z.object({
  /** Function name (must be valid identifier) */
  name: z
    .string()
    .min(1, "Function name is required")
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      "Function name must be valid identifier (alphanumeric and underscore only)",
    ),

  /** Function description for LLM context */
  description: z.string().optional(),

  /** Function parameters in JSON Schema format */
  parameters: OpenAIFunctionParametersSchema,
});

/**
 * OpenAI tool schema for function calling.
 * Validates complete tool objects in OpenAI format.
 */
export const OpenAIToolSchema = z.object({
  /** Must be "function" for OpenAI tool calls */
  type: z.literal("function"),

  /** Function definition */
  function: OpenAIFunctionSchema,
});

/**
 * TypeScript type for OpenAI tool format
 */
export type OpenAITool = z.infer<typeof OpenAIToolSchema>;
