/**
 * Anthropic Messages API Provider Configuration Schema
 *
 * Configuration schema for the Anthropic Messages API provider, defining
 * API key validation, base URL configuration, timeout settings, and retry logic
 * with comprehensive Zod validation and TypeScript type safety.
 */

import { z } from "zod";

import { ANTHROPIC_DEFAULT_CONFIG } from "./constants.js";

/**
 * Anthropic Messages API Configuration Schema
 *
 * Comprehensive Zod schema for validating Anthropic provider configuration
 * with strict security requirements and sensible defaults.
 */
export const AnthropicMessagesConfigSchema = z.object({
  /** Anthropic API key (required) - must start with 'sk-ant-' */
  apiKey: z
    .string()
    .min(1, "API key is required")
    .startsWith(
      "sk-ant-",
      "Invalid Anthropic API key format - must start with 'sk-ant-'",
    ),

  /** Base URL for Anthropic API (optional, defaults to official endpoint) */
  baseUrl: z
    .string()
    .url("Base URL must be a valid URL")
    .refine(
      (url) => url.startsWith("https://"),
      "Base URL must use HTTPS protocol for security",
    )
    .default(ANTHROPIC_DEFAULT_CONFIG.baseUrl),

  /** API version in YYYY-MM-DD format (optional) */
  version: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Version must be in YYYY-MM-DD format")
    .default(ANTHROPIC_DEFAULT_CONFIG.version),

  /** Request timeout in milliseconds (optional) */
  timeout: z
    .number()
    .int("Timeout must be an integer")
    .positive("Timeout must be positive")
    .max(300000, "Timeout cannot exceed 300000ms (5 minutes)")
    .default(ANTHROPIC_DEFAULT_CONFIG.timeout),

  /** Maximum retry attempts (optional) */
  maxRetries: z
    .number()
    .int("Max retries must be an integer")
    .min(0, "Max retries cannot be negative")
    .max(5, "Max retries cannot exceed 5")
    .default(ANTHROPIC_DEFAULT_CONFIG.maxRetries),
});

/**
 * TypeScript interface inferred from the Zod schema
 */
export type AnthropicMessagesConfig = z.infer<
  typeof AnthropicMessagesConfigSchema
>;
