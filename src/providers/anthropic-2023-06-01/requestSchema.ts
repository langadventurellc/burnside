/**
 * Anthropic Messages API Request Schema
 *
 * Zod schemas for validating requests to the Anthropic Messages API v2023-06-01
 * before sending to the API endpoint.
 */

import { z } from "zod";

/**
 * Anthropic text content schema
 */
const AnthropicTextContent = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/**
 * Anthropic image content schema
 */
const AnthropicImageContent = z.object({
  type: z.literal("image"),
  source: z.object({
    type: z.literal("base64"),
    media_type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
    data: z.string(),
  }),
});

/**
 * Union of all supported Anthropic content types
 */
const AnthropicContentPart = z.union([
  AnthropicTextContent,
  AnthropicImageContent,
]);

/**
 * Anthropic message schema
 */
const AnthropicMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(AnthropicContentPart)]),
});

/**
 * Anthropic tool definition schema
 */
const AnthropicTool = z.object({
  name: z.string(),
  description: z.string().optional(),
  input_schema: z.record(z.unknown()), // JSON Schema object
});

/**
 * Anthropic Messages API request schema
 *
 * Validates the complete request structure for the Anthropic Messages API v2023-06-01.
 * Includes all required and optional parameters with proper validation constraints.
 */
export const AnthropicMessagesRequestSchema = z.object({
  /** Model ID to use for completion */
  model: z.string().min(1),

  /** Maximum number of tokens to generate */
  max_tokens: z.number().int().positive(),

  /** Array of messages in the conversation */
  messages: z
    .array(AnthropicMessage)
    .min(1, "At least one message is required"),

  /** System message to set context */
  system: z.string().optional(),

  /** Available tools for the model to use */
  tools: z.array(AnthropicTool).optional(),

  /** Whether to stream the response */
  stream: z.boolean().optional(),

  /** Temperature for response generation (0-1) */
  temperature: z.number().min(0).max(1).optional(),

  /** Top-p nucleus sampling parameter (0-1) */
  top_p: z.number().min(0).max(1).optional(),

  /** Stop sequences to end generation */
  stop_sequences: z.array(z.string()).optional(),
});

/**
 * TypeScript type inferred from the Anthropic Messages request schema
 */
export type AnthropicMessagesRequestType = z.infer<
  typeof AnthropicMessagesRequestSchema
>;
