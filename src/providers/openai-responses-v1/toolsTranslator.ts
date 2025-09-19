/**
 * OpenAI Tools Array Translation Functions
 *
 * Converts arrays of ToolDefinition to OpenAI tools format.
 * Separated from single tool translation to follow one-export-per-file rule.
 */

import { ValidationError } from "../../core/errors/validationError";
import { translateToolDefinitionToOpenAI } from "./toolTranslator";
import type { OpenAITool } from "./openAIToolSchema";

import { z } from "zod";

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
 * Convert multiple ToolDefinitions to OpenAI tools array
 *
 * @param tools - Array of ToolDefinitions to convert
 * @returns Array of OpenAI tool format objects
 * @throws ValidationError if any tool conversion fails
 */
export function translateToolsForOpenAI(tools: ToolDefinition[]): OpenAITool[] {
  if (!Array.isArray(tools)) {
    throw new ValidationError("Tools must be an array", { tools });
  }

  return tools.map((tool, index) => {
    try {
      return translateToolDefinitionToOpenAI(tool);
    } catch (error) {
      throw new ValidationError(
        `Failed to translate tool at index ${index}: ${error instanceof Error ? error.message : "Unknown error"}`,
        { toolIndex: index, toolName: tool.name, originalError: error },
      );
    }
  });
}
