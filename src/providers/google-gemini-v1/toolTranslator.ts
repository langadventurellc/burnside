/**
 * Google Gemini v1 Tool Translation Functions
 *
 * Converts unified ToolDefinition format to Google Gemini's function calling format,
 * enabling the Gemini provider to use tools defined in the unified format.
 *
 * Handles Zod schema to JSON Schema conversion and supports provider hints
 * for custom Gemini function definitions.
 *
 * @example
 * ```typescript
 * import { translateToolDefinitions } from "./toolTranslator";
 *
 * const geminiTools = translateToolDefinitions(toolDefinitions);
 * // Use in Gemini request: { tools: [{ function_declarations: geminiTools }] }
 * ```
 */

import { z } from "zod";
import { ValidationError } from "../../core/errors/validationError";
import type { ToolDefinition } from "../../core/tools/toolDefinition";

/**
 * JSON Schema type definition for Gemini function parameters
 */
interface JSONSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
  description?: string;
}

/**
 * Gemini function declaration format
 */
interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: JSONSchema;
}

/**
 * Gemini function hint structure - matches the expected Gemini function format
 */
interface GeminiFunctionHint {
  name: string;
  description?: string;
  parameters?: JSONSchema;
}

/**
 * Unified function call format for parsing Gemini responses
 */
interface UnifiedFunctionCall {
  name: string;
  arguments: Record<string, unknown>;
  id?: string;
}

/**
 * Gemini function call from API response
 */
interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

/**
 * Tool translator with all translation functions
 */
export const toolTranslator = {
  /**
   * Convert multiple ToolDefinitions to Gemini function declarations array
   *
   * @param tools - Array of unified ToolDefinitions to convert
   * @returns Array of Gemini function declarations
   * @throws ValidationError for unsupported schema types or invalid tool definitions
   */
  translateToolDefinitions(
    tools: ToolDefinition[],
  ): GeminiFunctionDeclaration[] {
    if (!Array.isArray(tools)) {
      throw new ValidationError("Tools must be an array", { tools });
    }

    return tools.map((tool) => translateSingleTool(tool));
  },

  /**
   * Parse Gemini function call response to unified format
   *
   * @param functionCall - Gemini function call from API response
   * @returns Unified function call format
   * @throws ValidationError for malformed function calls
   */
  parseFunctionCall(functionCall: GeminiFunctionCall): UnifiedFunctionCall {
    if (!functionCall || typeof functionCall !== "object") {
      throw new ValidationError("Function call must be an object", {
        functionCall,
      });
    }

    if (!functionCall.name || typeof functionCall.name !== "string") {
      throw new ValidationError("Function call must have a valid name", {
        functionCall,
      });
    }

    return {
      name: functionCall.name,
      arguments: functionCall.args || {},
      id: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };
  },
};

/**
 * Convert a single ToolDefinition to Gemini function declaration format
 *
 * @param toolDef - The unified ToolDefinition to convert
 * @returns Gemini function declaration object
 * @throws ValidationError for unsupported schema types or invalid tool names
 */
function translateSingleTool(
  toolDef: ToolDefinition,
): GeminiFunctionDeclaration {
  // Check for provider hints first - they override schema conversion
  if (toolDef.hints?.gemini) {
    const geminiHints = toolDef.hints.gemini as Record<string, unknown>;
    if (geminiHints.function) {
      const hintFunction = geminiHints.function as GeminiFunctionHint;

      // Validate hint structure
      if (!hintFunction.name || typeof hintFunction.name !== "string") {
        throw new ValidationError(
          `Invalid Gemini function hint for tool '${toolDef.name}': function name is required`,
          { toolName: toolDef.name, hint: hintFunction },
        );
      }

      return {
        name: hintFunction.name,
        description: hintFunction.description,
        parameters: hintFunction.parameters,
      };
    }
  }

  // Extract JSON Schema from the tool's input schema
  const parametersSchema = extractJSONSchemaFromZod(toolDef.inputSchema);

  // Build Gemini function declaration format
  const geminiFunction: GeminiFunctionDeclaration = {
    name: toolDef.name,
    description: toolDef.description || `Execute ${toolDef.name} tool`,
  };

  // Only include parameters if the schema has properties
  if (
    parametersSchema.properties &&
    Object.keys(parametersSchema.properties).length > 0
  ) {
    geminiFunction.parameters = {
      type: "object",
      properties: parametersSchema.properties,
      required: parametersSchema.required || [],
    };
  }

  return geminiFunction;
}

/**
 * Parse Gemini function call response to unified format
 *
 * @param functionCall - Gemini function call from API response
 * @returns Unified function call format
 * @throws ValidationError for malformed function calls
 */
export function parseFunctionCall(
  functionCall: GeminiFunctionCall,
): UnifiedFunctionCall {
  if (!functionCall || typeof functionCall !== "object") {
    throw new ValidationError("Function call must be an object", {
      functionCall,
    });
  }

  if (!functionCall.name || typeof functionCall.name !== "string") {
    throw new ValidationError("Function call must have a valid name", {
      functionCall,
    });
  }

  return {
    name: functionCall.name,
    arguments: functionCall.args || {},
    id: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  };
}

/**
 * Extract JSON Schema from Zod schema or return existing JSON Schema
 *
 * @param schema - Zod schema or JSON Schema object
 * @returns JSON Schema compatible with Gemini parameters format
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
    convertZodLiteral(zodSchema) ||
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
    enum: zodSchema._def.values as (string | number | boolean)[],
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
 * Convert ZodLiteral to JSON Schema
 */
function convertZodLiteral(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodLiteral)) {
    return null;
  }

  const value = zodSchema._def.value as string | number | boolean;
  const type = typeof value;

  if (type === "string" || type === "number" || type === "boolean") {
    return {
      type: type,
      enum: [value] as (string | number | boolean)[],
    };
  }

  return null;
}

/**
 * Throw error for unsupported schema types
 */
function throwUnsupportedError(zodSchema: z.ZodTypeAny): never {
  throw new Error(`Unsupported Zod schema type: ${zodSchema.constructor.name}`);
}
