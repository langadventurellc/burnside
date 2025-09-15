/**
 * OpenAI Responses v1 Request Schema
 */

import { z } from "zod";

/**
 * OpenAI message role schema
 */
const MessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

/**
 * OpenAI message content schema
 */
const MessageContentSchema = z.union([
  z.string(),
  z.array(
    z.union([
      z.object({
        type: z.literal("text"),
        text: z.string(),
      }),
      z.object({
        type: z.literal("image_url"),
        image_url: z.object({
          url: z.string(),
          detail: z.enum(["low", "high", "auto"]).optional(),
        }),
      }),
    ]),
  ),
]);

/**
 * OpenAI chat message schema
 */
const ChatMessageSchema = z.object({
  role: MessageRoleSchema,
  content: MessageContentSchema,
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.any()).optional(),
});

/**
 * OpenAI Responses v1 Request Schema
 *
 * Schema for validating requests to the OpenAI Responses API v1 endpoint.
 */
export const OpenAIResponsesV1RequestSchema = z.object({
  /** Model to use for completion */
  model: z.string().min(1),

  /** Array of messages for the conversation */
  messages: z
    .array(ChatMessageSchema)
    .min(1, "At least one message is required"),

  /** Whether to stream the response */
  stream: z.boolean().optional(),

  /** Temperature for response generation (0-2) */
  temperature: z.number().min(0).max(2).optional(),

  /** Maximum tokens to generate */
  max_tokens: z.number().int().positive().optional(),

  /** Top-p nucleus sampling parameter */
  top_p: z.number().min(0).max(1).optional(),

  /** Frequency penalty (-2 to 2) */
  frequency_penalty: z.number().min(-2).max(2).optional(),

  /** Presence penalty (-2 to 2) */
  presence_penalty: z.number().min(-2).max(2).optional(),

  /** Stop sequences */
  stop: z.union([z.string(), z.array(z.string())]).optional(),

  /** Seed for deterministic generation */
  seed: z.number().int().optional(),

  /** User identifier for abuse monitoring */
  user: z.string().optional(),
});
