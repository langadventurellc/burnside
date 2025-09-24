/**
 * OpenAI Tool Translation Functions
 *
 * Converts unified ToolDefinition format to OpenAI's function calling format,
 * enabling the OpenAI provider to use tools defined in the unified format.
 *
 * Handles Zod schema to JSON Schema conversion and supports provider hints
 * for custom OpenAI function definitions.
 *
 * @example
 * ```typescript
 * import { translateToolDefinitionToOpenAI } from "./toolTranslator";
 *
 * const openaiTool = translateToolDefinitionToOpenAI(toolDefinition);
 * // Use in OpenAI request: { tools: [openaiTool] }
 * ```
 */

import { z } from "zod";
import { ValidationError } from "../../core/errors/validationError";
import { OpenAIToolSchema, type OpenAITool } from "./openAIToolSchema";
import isZodSchema from "../../core/validation/isZodSchema";

// Type definition compatible with the actual ToolDefinition from core
interface ToolDefinition {
  name: string;
  description?: string;
  inputSchema: z.ZodTypeAny | object;
  outputSchema?: z.ZodTypeAny | object;
  hints?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * JSON Schema type definition for OpenAI parameters
 */
interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
  description?: string;
  additionalProperties?: boolean;
}

/**
 * OpenAI function hint structure - matches the expected OpenAI function format
 */
interface OpenAIFunctionHint {
  name: string;
  description?: string;
  parameters: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

/**
 * Convert a single ToolDefinition to OpenAI function format
 *
 * @param toolDef - The unified ToolDefinition to convert
 * @returns OpenAI tool format object
 * @throws ValidationError for unsupported schema types or invalid tool names
 */
export function translateToolDefinitionToOpenAI(
  toolDef: ToolDefinition,
): OpenAITool {
  // Check for provider hints first - they override schema conversion
  if (toolDef.hints?.openai) {
    const openaiHints = toolDef.hints.openai as Record<string, unknown>;
    if (openaiHints.function) {
      const hintFunction = openaiHints.function as OpenAIFunctionHint;
      const openaiTool: OpenAITool = {
        type: "function",
        name: hintFunction.name,
        description: hintFunction.description,
        parameters: hintFunction.parameters,
      };

      // Validate the hint-based tool conforms to OpenAI schema
      const result = OpenAIToolSchema.safeParse(openaiTool);
      if (!result.success) {
        throw new ValidationError(
          `Invalid OpenAI function hint for tool '${toolDef.name}': ${result.error.message}`,
          { toolName: toolDef.name, zodError: result.error },
        );
      }

      return openaiTool;
    }
  }

  // Extract JSON Schema from the tool's input schema
  const parametersSchema = extractJSONSchemaFromZod(toolDef.inputSchema);

  // Build OpenAI tool format (Responses API format)
  const openaiTool: OpenAITool = {
    type: "function",
    name: toolDef.name,
    description: toolDef.description || `Execute ${toolDef.name} tool`,
    parameters: {
      type: "object",
      properties: parametersSchema.properties || {},
      required: parametersSchema.required || [],
      additionalProperties: false,
    },
  };

  // Validate the generated tool conforms to OpenAI schema
  const result = OpenAIToolSchema.safeParse(openaiTool);
  if (!result.success) {
    throw new ValidationError(
      `Generated OpenAI tool format is invalid for '${toolDef.name}': ${result.error.message}`,
      { toolName: toolDef.name, zodError: result.error },
    );
  }

  return openaiTool;
}

/**
 * Extract JSON Schema from Zod schema or return existing JSON Schema
 *
 * @param schema - Zod schema or JSON Schema object
 * @returns JSON Schema compatible with OpenAI parameters format
 * @throws ValidationError for unsupported Zod schema types
 */
function extractJSONSchemaFromZod(schema: z.ZodTypeAny | object): JSONSchema {
  if (!isZodSchema(schema)) {
    return schema as JSONSchema;
  }

  try {
    return convertZodToJSONSchema(schema);
  } catch (error) {
    throw new ValidationError(
      `Failed to convert Zod schema to JSON Schema: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { zodSchema: schema.constructor.name, originalError: error },
    );
  }
}

/**
 * Convert Zod schema to JSON Schema format
 */
function convertZodToJSONSchema(zodSchema: z.ZodTypeAny): JSONSchema {
  const jsonSchema = z.toJSONSchema(zodSchema);

  if (
    !jsonSchema ||
    typeof jsonSchema !== "object" ||
    Array.isArray(jsonSchema)
  ) {
    throw new Error(
      `Unsupported JSON Schema output for ${zodSchema.constructor.name}`,
    );
  }

  return jsonSchema as JSONSchema;
}
