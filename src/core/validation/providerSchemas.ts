/**
 * Provider Configuration Schemas
 *
 * Zod schemas for validating provider configurations across all supported
 * LLM providers (OpenAI, Anthropic, Google, xAI). Provides a base schema
 * with common fields and provider-specific extensions for type-safe
 * configuration validation.
 */

import { z } from "zod";

/**
 * Base provider configuration schema with common fields
 */
const BaseProviderConfigSchema = z.object({
  /** Base URL for the provider API */
  baseUrl: z.string().url().optional(),

  /** API key for authentication */
  apiKey: z.string().min(1).optional(),

  /** Custom headers to include in requests */
  headers: z.record(z.string(), z.string()).optional(),

  /** Request timeout in milliseconds */
  timeout: z.number().int().positive().max(60000).optional(),

  /** Rate limiting configuration */
  rateLimiting: z
    .object({
      requestsPerMinute: z.number().int().positive().optional(),
      tokensPerMinute: z.number().int().positive().optional(),
    })
    .optional(),

  /** Retry configuration */
  retry: z
    .object({
      maxAttempts: z.number().int().min(1).max(5).default(3),
      backoffMs: z.number().int().positive().default(1000),
      jitterMs: z.number().int().positive().default(100),
    })
    .optional(),
});

/**
 * OpenAI-specific provider configuration
 */
const OpenAIProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z.string().url().default("https://api.openai.com/v1"),
  apiKey: z.string().min(1), // Required for OpenAI
  organization: z.string().optional(),
  project: z.string().optional(),
});

/**
 * Anthropic-specific provider configuration
 */
const AnthropicProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z.string().url().default("https://api.anthropic.com"),
  apiKey: z.string().min(1), // Required for Anthropic
  version: z.string().default("2023-06-01"),
});

/**
 * Google-specific provider configuration
 */
const GoogleProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta"),
  apiKey: z.string().min(1), // Required for Google
  region: z.string().optional(),
});

/**
 * xAI-specific provider configuration
 */
const XAIProviderConfigSchema = BaseProviderConfigSchema.extend({
  baseUrl: z.string().url().default("https://api.x.ai/v1"),
  apiKey: z.string().min(1), // Required for xAI
});

/**
 * Union type for all provider configurations
 */
const ProviderConfigSchema = z.union([
  OpenAIProviderConfigSchema,
  AnthropicProviderConfigSchema,
  GoogleProviderConfigSchema,
  XAIProviderConfigSchema,
]);

/**
 * Provider registration schema with metadata
 */
const ProviderRegistrationSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  config: ProviderConfigSchema,
  plugin: z.object({
    // Basic plugin shape validation - actual implementation validated at runtime
    id: z.string(),
    name: z.string(),
    version: z.string(),
    translateRequest: z.function(),
    parseResponse: z.function().returns(z.union([z.promise(z.any()), z.any()])),
    normalizeError: z.function(),
  }),
});

/**
 * Provider configuration schemas collection
 */
export const providerSchemas = {
  BaseProviderConfigSchema,
  OpenAIProviderConfigSchema,
  AnthropicProviderConfigSchema,
  GoogleProviderConfigSchema,
  XAIProviderConfigSchema,
  ProviderConfigSchema,
  ProviderRegistrationSchema,
};
