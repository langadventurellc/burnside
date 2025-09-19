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
  // If it's already a JSON Schema object, return it
  if (!isZodSchema(schema)) {
    return schema as JSONSchema;
  }

  const zodSchema = schema;

  try {
    return convertZodToJSONSchema(zodSchema);
  } catch (error) {
    throw new ValidationError(
      `Failed to convert Zod schema to JSON Schema: ${error instanceof Error ? error.message : "Unknown error"}`,
      { zodSchema: zodSchema.constructor.name, originalError: error },
    );
  }
}

/**
 * Check if a schema is a Zod schema instance
 */
function isZodSchema(schema: unknown): schema is z.ZodTypeAny {
  return schema instanceof z.ZodType;
}

/**
 * Convert Zod schema to JSON Schema format
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema object
 * @throws Error for unsupported Zod schema types
 */
function convertZodToJSONSchema(zodSchema: z.ZodTypeAny): JSONSchema {
  return (
    convertZodObject(zodSchema) ||
    convertZodString(zodSchema) ||
    convertZodNumber(zodSchema) ||
    convertZodBoolean(zodSchema) ||
    convertZodEnum(zodSchema) ||
    convertZodArray(zodSchema) ||
    convertZodOptional(zodSchema) ||
    convertZodDefault(zodSchema) ||
    throwUnsupportedError(zodSchema)
  );
}

/**
 * Convert ZodObject to JSON Schema
 */
function convertZodObject(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodObject)) {
    return null;
  }

  const shape = zodSchema._def.shape() as Record<string, z.ZodTypeAny>;
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const [key, zodValue] of Object.entries(shape)) {
    properties[key] = convertZodToJSONSchema(zodValue);

    // Check if field is required (not optional)
    if (
      !(zodValue instanceof z.ZodOptional) &&
      !(zodValue instanceof z.ZodDefault)
    ) {
      required.push(key);
    }
  }

  const result: JSONSchema = {
    type: "object",
    properties,
    additionalProperties: false,
  };

  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

/**
 * Convert ZodString to JSON Schema
 */
function convertZodString(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodString)) {
    return null;
  }

  const jsonSchema: JSONSchema = { type: "string" };

  // Extract description from error messages if available
  const def = zodSchema._def;
  if (def.checks) {
    for (const check of def.checks) {
      if (check.message) {
        jsonSchema.description = check.message;
        break;
      }
    }
  }

  return jsonSchema;
}

/**
 * Convert ZodNumber to JSON Schema
 */
function convertZodNumber(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodNumber)) {
    return null;
  }

  const jsonSchema: JSONSchema = { type: "number" };

  // Extract min/max constraints
  const def = zodSchema._def;
  if (def.checks) {
    for (const check of def.checks) {
      if (check.kind === "min") {
        jsonSchema.minimum = check.value;
      } else if (check.kind === "max") {
        jsonSchema.maximum = check.value;
      }
    }
  }

  return jsonSchema;
}

/**
 * Convert ZodBoolean to JSON Schema
 */
function convertZodBoolean(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodBoolean)) {
    return null;
  }

  return { type: "boolean" };
}

/**
 * Convert ZodEnum to JSON Schema
 */
function convertZodEnum(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodEnum)) {
    return null;
  }

  return {
    type: "string",
    enum: zodSchema._def.values as string[],
  };
}

/**
 * Convert ZodArray to JSON Schema
 */
function convertZodArray(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodArray)) {
    return null;
  }

  return {
    type: "array",
    items: convertZodToJSONSchema(zodSchema._def.type as z.ZodTypeAny),
  };
}

/**
 * Convert ZodOptional to JSON Schema
 */
function convertZodOptional(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodOptional)) {
    return null;
  }

  return convertZodToJSONSchema(zodSchema._def.innerType as z.ZodTypeAny);
}

/**
 * Convert ZodDefault to JSON Schema
 */
function convertZodDefault(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodDefault)) {
    return null;
  }

  const jsonSchema = convertZodToJSONSchema(
    zodSchema._def.innerType as z.ZodTypeAny,
  );
  jsonSchema.default = zodSchema._def.defaultValue();
  return jsonSchema;
}

/**
 * Throw error for unsupported schema types
 */
function throwUnsupportedError(zodSchema: z.ZodTypeAny): never {
  throw new Error(`Unsupported Zod schema type: ${zodSchema.constructor.name}`);
}
