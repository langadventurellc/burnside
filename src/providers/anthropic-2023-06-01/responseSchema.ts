/**
 * Anthropic Messages API Response Schema
 *
 * Zod schemas for validating responses from the Anthropic Messages API v2023-06-01
 * before parsing to unified format.
 */

import { z } from "zod";

/**
 * Anthropic text content block schema
 */
const AnthropicTextBlock = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/**
 * Anthropic tool use content block schema
 */
const AnthropicToolUseBlock = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

/**
 * Union of all Anthropic content block types
 */
const AnthropicContentBlock = z.union([
  AnthropicTextBlock,
  AnthropicToolUseBlock,
]);

/**
 * Anthropic usage statistics schema
 */
const AnthropicUsage = z.object({
  input_tokens: z.int().nonnegative(),
  output_tokens: z.int().nonnegative(),
});

/**
 * Anthropic Messages API response schema for non-streaming responses
 */
export const AnthropicMessagesResponseSchema = z.object({
  /** Unique identifier for the response */
  id: z.string(),

  /** Response type - always "message" */
  type: z.literal("message"),

  /** Role of the responder - always "assistant" */
  role: z.literal("assistant"),

  /** Array of content blocks in the response */
  content: z.array(AnthropicContentBlock),

  /** Model that generated the response */
  model: z.string(),

  /** Reason the response stopped */
  stop_reason: z
    .enum(["end_turn", "max_tokens", "stop_sequence", "tool_use"])
    .nullable(),

  /** Stop sequence that triggered the stop (if applicable) */
  stop_sequence: z.string().nullable().optional(),

  /** Token usage statistics */
  usage: AnthropicUsage,
});

/**
 * Anthropic streaming delta content schema
 */
const AnthropicStreamingDelta = z.object({
  /** Type of streaming event */
  type: z.enum([
    "message_start",
    "content_block_start",
    "content_block_delta",
    "content_block_stop",
    "message_delta",
    "message_stop",
  ]),

  /** Message data for message_start events */
  message: z
    .object({
      id: z.string().optional(),
      type: z.literal("message").optional(),
      role: z.literal("assistant").optional(),
      content: z.array(z.unknown()).optional(),
      model: z.string().optional(),
      stop_reason: z.string().nullable().optional(),
      stop_sequence: z.string().nullable().optional(),
      usage: AnthropicUsage.optional(),
    })
    .optional(),

  /** Content block data for content_block_start events */
  content_block: z
    .object({
      type: z.string().optional(),
      id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),

  /** Delta data for content_block_delta and message_delta events */
  delta: z
    .object({
      text: z.string().optional(),
      input: z
        .union([z.string(), z.record(z.string(), z.unknown())])
        .optional(),
      stop_reason: z.string().nullable().optional(),
      stop_sequence: z.string().nullable().optional(),
    })
    .optional(),

  /** Index for content block events */
  index: z.int().nonnegative().optional(),
});

/**
 * Anthropic streaming response schema
 */
export const AnthropicStreamingResponseSchema = AnthropicStreamingDelta;

/**
 * Anthropic error response schema
 */
export const AnthropicErrorResponseSchema = z.object({
  /** Error type - always "error" */
  type: z.literal("error"),

  /** Error details */
  error: z.object({
    /** Error type classification */
    type: z.string(),

    /** Human-readable error message */
    message: z.string(),
  }),
});

/**
 * TypeScript type inferred from the Anthropic Messages response schema
 */
export type AnthropicMessagesResponseType = z.infer<
  typeof AnthropicMessagesResponseSchema
>;
