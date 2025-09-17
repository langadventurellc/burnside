/**
 * xAI v1 Request Schema
 *
 * Zod schemas for validating xAI API v1 request structure
 * following the OpenAI Responses API format that xAI now supports.
 */

import { z } from "zod";

/**
 * xAI supported model names enum
 */
const XAIModelSchema = z.enum([
  "grok-2",
  "grok-2-mini",
  "grok-2-vision-1212",
  "grok-3",
  "grok-3-mini",
  "grok-4-0709",
]);

/**
 * xAI message role schema
 */
const MessageRoleSchema = z.enum(["system", "user", "assistant", "tool"]);

/**
 * xAI message content schema supporting text and multimodal content
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
 * xAI message schema for the input array
 */
const XAIMessageSchema = z.object({
  type: z.literal("message"),
  role: MessageRoleSchema,
  content: MessageContentSchema,
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.any()).optional(),
});

/**
 * xAI reasoning configuration schema
 */
const ReasoningConfigSchema = z
  .object({
    effort: z.string().optional(),
    generate_summary: z.boolean().optional(),
    summary: z.string().optional(),
  })
  .optional();

/**
 * xAI search parameters schema
 */
const SearchParametersSchema = z
  .object({
    from_date: z.string().optional(),
    max_search_results: z.number().int().positive().optional(),
    mode: z.string().optional(),
    return_citations: z.boolean().optional(),
    sources: z.array(z.string()).optional(),
    to_date: z.string().optional(),
  })
  .optional();

/**
 * xAI text format schema
 */
const TextFormatSchema = z.union([
  z.object({
    type: z.literal("text"),
  }),
  z.object({
    type: z.literal("json_object"),
  }),
  z.object({
    type: z.literal("json_schema"),
    description: z.string().optional(),
    name: z.string().optional(),
    schema: z.record(z.unknown()).optional(),
    strict: z.boolean().optional(),
  }),
]);

/**
 * xAI text configuration schema
 */
const TextConfigSchema = z
  .object({
    format: z.array(TextFormatSchema).optional(),
  })
  .optional();

/**
 * xAI tool choice schema
 */
const ToolChoiceSchema = z
  .union([
    z.literal("auto"),
    z.literal("none"),
    z.literal("required"),
    z.object({
      type: z.literal("function"),
      function: z
        .object({
          name: z.string(),
        })
        .optional(),
    }),
  ])
  .optional();

/**
 * xAI tool function schema
 */
const ToolFunctionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
});

/**
 * xAI tool schema
 */
const ToolSchema = z.object({
  type: z.literal("function"),
  function: ToolFunctionSchema,
});

/**
 * Main xAI v1 Request Schema
 *
 * Schema for validating requests to the xAI API v1 endpoint
 * using the OpenAI Responses API format.
 */
export const XAIV1RequestSchema = z.object({
  /** Model to use for completion */
  model: XAIModelSchema,

  /** Input array containing messages (Responses API format) */
  input: z
    .array(XAIMessageSchema)
    .min(1, "At least one input message is required"),

  /** Whether to stream the response */
  stream: z.boolean().optional(),

  /** Temperature for response generation (0-2) */
  temperature: z.number().min(0).max(2).optional(),

  /** Maximum tokens to generate */
  max_output_tokens: z.number().int().positive().max(8192).optional(),

  /** Top-p nucleus sampling parameter */
  top_p: z.number().min(0).max(1).optional(),

  /** Tools available for function calling */
  tools: z.array(ToolSchema).optional(),

  /** Tool choice configuration */
  tool_choice: ToolChoiceSchema,

  /** Parallel tool calls configuration */
  parallel_tool_calls: z.boolean().optional(),

  /** Background information */
  background: z.string().optional(),

  /** Include configuration */
  include: z.string().optional(),

  /** Instructions for the model */
  instructions: z.string().optional(),

  /** Log probabilities configuration */
  logprobs: z.boolean().optional(),

  /** Top log probabilities count */
  top_logprobs: z.number().int().min(0).max(20).optional(),

  /** Metadata for the request */
  metadata: z.record(z.unknown()).optional(),

  /** Previous response ID for continuation */
  previous_response_id: z.string().optional(),

  /** Reasoning configuration */
  reasoning: ReasoningConfigSchema,

  /** Search parameters */
  search_parameters: SearchParametersSchema,

  /** Service tier */
  service_tier: z.string().optional(),

  /** Store configuration */
  store: z.boolean().optional(),

  /** Text formatting configuration */
  text: TextConfigSchema,

  /** Truncation configuration */
  truncation: z.record(z.unknown()).optional(),

  /** User identifier for abuse monitoring */
  user: z.string().optional(),
});

/**
 * TypeScript type inferred from the xAI request schema
 */
export type XAIV1Request = z.infer<typeof XAIV1RequestSchema>;
