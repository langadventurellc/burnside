/**
 * xAI v1 Streaming Response Schema
 *
 * Zod schema for validating xAI API v1 streaming response chunks.
 */

import { z } from "zod";

/**
 * xAI tool call function schema
 */
const XAIToolCallFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(), // JSON string
});

/**
 * xAI tool call schema
 */
const XAIToolCallSchema = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: XAIToolCallFunctionSchema,
});

/**
 * xAI usage schema with detailed token information
 */
const XAIUsageSchema = z
  .object({
    input_tokens: z.number().min(0),
    input_tokens_details: z.object({
      cached_tokens: z.number().min(0),
    }),
    output_tokens: z.number().min(0),
    output_tokens_details: z.object({
      reasoning_tokens: z.number().min(0),
    }),
    total_tokens: z.number().min(0),
  })
  .optional();

/**
 * xAI Streaming Response Chunk Schema
 */
export const XAIV1StreamingResponseSchema = z.object({
  /** Unique response identifier */
  id: z.string(),

  /** Response object type for streaming */
  object: z.literal("response.chunk"),

  /** Response status */
  status: z.string().optional(),

  /** Model used for generation */
  model: z.string(),

  /** Delta output for streaming */
  output: z.array(
    z.object({
      type: z.literal("message"),
      delta: z.object({
        role: z.literal("assistant").optional(),
        content: z
          .array(
            z.object({
              type: z.literal("output_text"),
              text: z.string().optional(),
            }),
          )
          .optional(),
        tool_calls: z.array(XAIToolCallSchema).optional(),
      }),
    }),
  ),

  /** Usage information (typically only in final chunk) */
  usage: XAIUsageSchema,

  /** Response creation timestamp */
  created_at: z.number().optional(),
});

/**
 * TypeScript type derived from the streaming response schema
 */
export type XAIV1StreamingResponse = z.infer<
  typeof XAIV1StreamingResponseSchema
>;
