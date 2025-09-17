/**
 * xAI Tools Array Translation
 *
 * Converts arrays of unified ToolDefinition objects to xAI function format.
 * Provides error handling and context for failed tool conversions.
 *
 * @example
 * ```typescript
 * import { translateToolsForXAI } from "./toolsTranslator";
 *
 * const xaiTools = translateToolsForXAI(toolDefinitions);
 * // Use in xAI request: { tools: xaiTools }
 * ```
 */

import { ValidationError } from "../../core/errors/validationError";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { translateToolDefinitionToXAI } from "./toolTranslator";
import type { XAITool } from "./xaiTool";

/**
 * Convert an array of ToolDefinitions to xAI tools format
 *
 * @param tools - Array of unified ToolDefinition objects to convert
 * @returns Array of xAI tool format objects
 * @throws ValidationError with detailed context for failed tool conversions
 */
export function translateToolsForXAI(tools: ToolDefinition[]): XAITool[] {
  if (!Array.isArray(tools)) {
    throw new ValidationError("Tools must be an array", { tools });
  }

  const xaiTools: XAITool[] = [];
  const errors: Array<{ index: number; name: string; error: string }> = [];

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    try {
      const xaiTool = translateToolDefinitionToXAI(tool);
      xaiTools.push(xaiTool);
    } catch (error) {
      errors.push({
        index: i,
        name: tool.name || `tool-${i}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Failed to convert ${errors.length} tool(s) to xAI format:\n${errors
      .map((e) => `  - [${e.index}] ${e.name}: ${e.error}`)
      .join("\n")}`;

    throw new ValidationError(errorMessage, {
      totalTools: tools.length,
      failedTools: errors.length,
      errors,
    });
  }

  return xaiTools;
}
