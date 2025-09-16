/**
 * OpenAI Responses v1 Provider Configuration Schema
 */

import { z } from "zod";

/**
 * OpenAI Responses v1 Provider Configuration Schema
 *
 * Configuration schema for the OpenAI Responses v1 provider, extending base
 * provider configuration with OpenAI-specific fields.
 */
export const OpenAIResponsesV1ConfigSchema = z.object({
  /** OpenAI API key (required) */
  apiKey: z.string().min(1, "API key is required"),

  /** Base URL for OpenAI API (optional, defaults to official endpoint) */
  baseUrl: z.string().url().default("https://api.openai.com/v1"),

  /** OpenAI organization ID (optional) */
  organization: z.string().optional(),

  /** OpenAI project ID (optional) */
  project: z.string().optional(),

  /** Request timeout in milliseconds (optional) */
  timeout: z.number().int().positive().max(120000).optional(),

  /** Custom headers to include in requests (optional) */
  headers: z.record(z.string(), z.string()).optional(),
});

export type OpenAIResponsesV1Config = z.infer<
  typeof OpenAIResponsesV1ConfigSchema
>;
