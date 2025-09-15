/**
 * Model ID type - branded string with provider:model format validation
 *
 * @example
 * ```typescript
 * const modelId: ModelId = createModelId("openai", "gpt-4");
 * // modelId is "openai:gpt-4"
 * ```
 */
export type ModelId = string & { readonly __brand: "ModelId" };
