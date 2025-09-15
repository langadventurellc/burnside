import { z } from "zod";
import type { ModelInfo } from "../providers/modelInfo.js";
import type { ModelCapabilities } from "../providers/modelCapabilities.js";
import { ValidationError } from "../errors/validationError.js";
import { DefaultLlmModelsSchema } from "./defaultLlmModelsSchema.js";

/**
 * Type definition for the validated defaultLlmModels.json structure
 */
type DefaultLlmModelsJson = z.infer<typeof DefaultLlmModelsSchema>;

/**
 * Platform-agnostic function to convert defaultLlmModels.json structure
 * to ModelInfo array with default capabilities
 *
 * Maps the nested provider/model JSON structure to ModelInfo objects,
 * inferring provider IDs from parent objects and setting default capabilities
 * for all models. Providers can later enrich capabilities as needed.
 *
 * @param jsonData - Validated JSON data from defaultLlmModels.json
 * @returns Array of ModelInfo objects with default capabilities
 *
 * @example
 * ```typescript
 * const jsonData: DefaultLlmModelsJson = {
 *   schemaVersion: "1.0.0",
 *   providers: [{
 *     id: "openai",
 *     name: "OpenAI",
 *     models: [{
 *       id: "gpt-4o-2024-08-06",
 *       name: "GPT-4o",
 *       contextLength: 128000
 *     }]
 *   }]
 * };
 *
 * const models = mapJsonToModelInfo(jsonData);
 * // Returns: [{
 * //   id: "gpt-4o-2024-08-06",
 * //   name: "GPT-4o",
 * //   provider: "openai",
 * //   capabilities: { streaming: false, toolCalls: false, ... },
 * //   metadata: { contextLength: 128000 }
 * // }]
 * ```
 *
 * @throws ValidationError - When JSON structure is invalid
 */
export function mapJsonToModelInfo(
  jsonData: DefaultLlmModelsJson,
): ModelInfo[] {
  try {
    // Validate JSON structure before processing
    const validatedData = DefaultLlmModelsSchema.parse(jsonData);

    return validatedData.providers.flatMap((provider) =>
      provider.models.map((model) => {
        const capabilities: ModelCapabilities = {
          streaming: false,
          toolCalls: false,
          images: false,
          documents: false,
          maxTokens: model.contextLength,
          supportedContentTypes: [],
        };

        const modelInfo: ModelInfo = {
          id: model.id,
          name: model.name,
          provider: provider.id, // Inferred from parent provider object
          capabilities,
          metadata: {
            contextLength: model.contextLength,
            originalProviderId: provider.id,
          },
        };

        return modelInfo;
      }),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid defaultLlmModels.json structure", {
        zodErrors: error.errors,
        receivedData: jsonData,
      });
    }
    // Re-throw other errors unchanged
    throw error;
  }
}
