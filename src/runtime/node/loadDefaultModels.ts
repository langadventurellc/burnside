import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  mapJsonToModelInfo,
  DefaultLlmModelsSchema,
} from "../../core/models/index.js";
import { ValidationError } from "../../core/errors/validationError.js";
import type { ModelInfo } from "../../core/providers/modelInfo.js";

/**
 * Node.js-specific utility to load and parse defaultLlmModels.json from file system
 *
 * @param filePath - Path to the defaultLlmModels.json file
 * @returns Array of ModelInfo objects with default capabilities
 * @throws ValidationError if file contains invalid JSON structure
 * @throws Error if file cannot be read
 *
 * @example
 * ```typescript
 * // Load default models for testing
 * const models = loadDefaultModels('./docs/defaultLlmModels.json');
 * console.log(`Loaded ${models.length} models`);
 * ```
 */
export function loadDefaultModels(filePath: string): ModelInfo[] {
  let jsonData: unknown;

  try {
    // Read and parse JSON file
    const fileContent = readFileSync(filePath, "utf8");
    jsonData = JSON.parse(fileContent) as unknown;

    // Validate structure with Zod schema
    const validatedData = DefaultLlmModelsSchema.parse(jsonData);

    // Convert to ModelInfo array using platform-agnostic mapper
    return mapJsonToModelInfo(validatedData);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError(
        `Invalid JSON syntax in ${filePath}: ${error.message}`,
        { cause: error },
      );
    }
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid defaultLlmModels.json structure in ${filePath}`,
        {
          zodErrors: error.errors,
          receivedData: jsonData,
        },
      );
    }
    throw error; // Re-throw file system errors
  }
}
