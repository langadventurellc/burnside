import { z } from "zod";

/**
 * JSON schema validation for defaultLlmModels.json structure
 *
 * Validates the expected nested structure with providers containing
 * arrays of models with required metadata fields.
 *
 * @example
 * ```typescript
 * const jsonData = {
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
 * DefaultLlmModelsSchema.parse(jsonData); // validates structure
 * ```
 */
export const DefaultLlmModelsSchema = z.object({
  schemaVersion: z.string(),
  providers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      models: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          contextLength: z.number().positive(),
        }),
      ),
    }),
  ),
});
