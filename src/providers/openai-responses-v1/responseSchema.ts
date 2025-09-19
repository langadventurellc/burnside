/**
 * OpenAI Responses v1 Response Schema
 *
 * Zod schemas for validating OpenAI Responses API v1 response structure
 * before parsing to unified format.
 */

import { z } from "zod";

/**
 * OpenAI response content part schema (Responses API format)
 */
const OpenAIResponseContentPartSchema = z.object({
  type: z.literal("output_text"),
  text: z.string(),
  annotations: z.array(z.unknown()).optional(),
  logprobs: z.array(z.unknown()).optional(),
});

/**
 * OpenAI tool call function schema
 */
const OpenAIToolCallFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(), // JSON string
});

/**
 * OpenAI tool call schema
 */
const OpenAIToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: OpenAIToolCallFunctionSchema,
});

/**
 * OpenAI response output message schema (Responses API format)
 */
const OpenAIResponseOutputMessageSchema = z.object({
  id: z.string().optional(),
  type: z.literal("message"),
  status: z.string().optional(),
  role: z.literal("assistant"),
  content: z.array(OpenAIResponseContentPartSchema),
  tool_calls: z.array(OpenAIToolCallSchema).optional(),
});

/**
 * OpenAI reasoning output schema (used in GPT-5 models)
 */
const OpenAIResponseOutputReasoningSchema = z.object({
  id: z.string().optional(),
  type: z.literal("reasoning"),
  summary: z.array(z.unknown()).optional(),
});

/**
 * OpenAI function call output schema (Responses API format)
 */
const OpenAIResponseOutputFunctionCallSchema = z.object({
  id: z.string(),
  type: z.literal("function_call"),
  status: z.string(),
  arguments: z.string(),
  call_id: z.string(),
  name: z.string(),
});

/**
 * OpenAI response output schema (Responses API format)
 * Supports message, reasoning, and function call outputs
 */
const OpenAIResponseOutputSchema = z.union([
  OpenAIResponseOutputMessageSchema,
  OpenAIResponseOutputReasoningSchema,
  OpenAIResponseOutputFunctionCallSchema,
]);

/**
 * OpenAI usage schema (Responses API format)
 */
const OpenAIUsageSchema = z.object({
  input_tokens: z.number().min(0),
  output_tokens: z.number().min(0),
  total_tokens: z.number().min(0).optional(),
});

/**
 * Complete OpenAI Responses v1 response schema
 */
export const OpenAIResponsesV1ResponseSchema = z.object({
  id: z.string(),
  object: z.literal("response"),
  status: z.string(),
  model: z.string(),
  output: z.array(OpenAIResponseOutputSchema),
  usage: OpenAIUsageSchema.optional(),
  created_at: z.number().optional(),
});

/**
 * TypeScript types derived from schemas
 */
export type OpenAIResponsesV1Response = z.infer<
  typeof OpenAIResponsesV1ResponseSchema
>;
