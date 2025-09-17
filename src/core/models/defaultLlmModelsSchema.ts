import { z } from "zod";

/**
 * JSON schema validation for defaultLlmModelson structure
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
 *       contextLength: 128000,
 *       providerPlugin: "openai-responses-v1",
 *       streaming: true,
 *       toolCalls: true,
 *       temperature: true
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
          providerPlugin: z.string().optional(),
          streaming: z.boolean().optional(),
          toolCalls: z.boolean().optional(),
          images: z.boolean().optional(),
          documents: z.boolean().optional(),
          temperature: z.boolean().optional(),
          thinking: z.boolean().optional(),
          supportedContentTypes: z.array(z.string()).optional(),
        }),
      ),
    }),
  ),
});
