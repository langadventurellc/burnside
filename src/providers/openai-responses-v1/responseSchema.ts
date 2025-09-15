/**
 * OpenAI Responses v1 Response Schema
 *
 * Zod schemas for validating OpenAI Responses API v1 response structure
 * before parsing to unified format.
 */

import { z } from "zod";

/**
 * OpenAI response content part schema
 */
const OpenAIResponseContentPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/**
 * OpenAI response message schema
 */
const OpenAIResponseMessageSchema = z.object({
  role: z.literal("assistant"),
  content: z.union([z.string(), z.array(OpenAIResponseContentPartSchema)]),
});

/**
 * OpenAI choice schema with message and metadata
 */
const OpenAIChoiceSchema = z.object({
  index: z.number(),
  message: OpenAIResponseMessageSchema,
  finish_reason: z
    .enum(["stop", "length", "content_filter", "tool_calls"])
    .nullable(),
});

/**
 * OpenAI usage schema
 */
const OpenAIUsageSchema = z.object({
  prompt_tokens: z.number().min(0),
  completion_tokens: z.number().min(0),
  total_tokens: z.number().min(0),
});

/**
 * Complete OpenAI Responses v1 response schema
 */
export const OpenAIResponsesV1ResponseSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion"),
  created: z.number(),
  model: z.string(),
  choices: z.array(OpenAIChoiceSchema),
  usage: OpenAIUsageSchema.optional(),
  system_fingerprint: z.string().optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type OpenAIResponsesV1Response = z.infer<
  typeof OpenAIResponsesV1ResponseSchema
>;
