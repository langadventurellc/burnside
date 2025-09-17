/**
 * Provider Configuration Types
 *
 * TypeScript types inferred from provider configuration schemas.
 */

import type { z } from "zod";
import { providerSchemas } from "./providerSchemas";

// Individual types
type BaseProviderConfig = z.infer<
  typeof providerSchemas.BaseProviderConfigSchema
>;
type OpenAIProviderConfig = z.infer<
  typeof providerSchemas.OpenAIProviderConfigSchema
>;
type AnthropicProviderConfig = z.infer<
  typeof providerSchemas.AnthropicProviderConfigSchema
>;
type GoogleProviderConfig = z.infer<
  typeof providerSchemas.GoogleProviderConfigSchema
>;
type XAIProviderConfig = z.infer<
  typeof providerSchemas.XAIProviderConfigSchema
>;
type ProviderConfig = z.infer<typeof providerSchemas.ProviderConfigSchema>;
type ProviderRegistration = z.infer<
  typeof providerSchemas.ProviderRegistrationSchema
>;

/**
 * Provider configuration types collection
 */
export type ProviderSchemaTypes = {
  BaseProviderConfig: BaseProviderConfig;
  OpenAIProviderConfig: OpenAIProviderConfig;
  AnthropicProviderConfig: AnthropicProviderConfig;
  GoogleProviderConfig: GoogleProviderConfig;
  XAIProviderConfig: XAIProviderConfig;
  ProviderConfig: ProviderConfig;
  ProviderRegistration: ProviderRegistration;
};
