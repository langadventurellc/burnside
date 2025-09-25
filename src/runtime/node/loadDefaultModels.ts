import { z } from "zod";
import {
  mapJsonToModelInfo,
  DefaultLlmModelsSchema,
} from "../../core/models/index";
import { ValidationError } from "../../core/errors/validationError";
import type { ModelInfo } from "../../core/providers/modelInfo";

/**
 * Node-specific utility to load and parse defaultLlmModelson from file system
 *
 * @param filePath - Path to the defaultLlmModelson file
 * @returns Array of ModelInfo objects with default capabilities
 * @throws ValidationError if file contains invalid JSON structure
 * @throws Error if file cannot be read
 *
 * @example
 * ```typescript
 * // Load default models for testing
 * const models = await loadDefaultModels('./docs/defaultLlmModelson');
 * console.log(`Loaded ${models.length} models`);
 * ```
 */
export async function loadDefaultModels(
  filePath: string,
): Promise<ModelInfo[]> {
  let jsonData: unknown;

  try {
    // Lazy load Node.js fs module to avoid issues in non-Node environments
    const { readFileSync } = await import("node:fs");

    // Read and parse JSON file
    const fileContent = readFileSync(filePath, "utf8");
    jsonData = JSON.parse(fileContent) as unknown;

    // Validate structure with Zod schema
    const validatedData = DefaultLlmModelsSchema.parse(jsonData);

    // Convert to ModelInfo array using platform-agnostic mapper
    return mapJsonToModelInfo(validatedData);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new ValidationError(
        `Invalid JSON syntax in ${filePath}: ${error.message}`,
        { cause: error },
      );
    }
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Invalid defaultLlmModelson structure in ${filePath}`,
        {
          zodErrors: error.issues,
          receivedData: jsonData,
        },
      );
    }
    throw error; // Re-throw file system errors
  }
}
