/**
 * xAI v1 Response Schema
 *
 * Zod schemas for validating xAI API v1 response structure
 * following the OpenAI Responses API format that xAI now supports.
 */

import { z } from "zod";

/**
 * xAI response content part schema
 */
const XAIResponseContentPartSchema = z.object({
  type: z.literal("output_text"),
  text: z.string(),
  annotations: z.array(z.unknown()).nullable(),
  logprobs: z.array(z.unknown()).nullable(),
});

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
 * xAI response output message schema
 */
const XAIResponseOutputMessageSchema = z.object({
  id: z.string().optional(),
  type: z.literal("message"),
  status: z.string().optional(),
  role: z.literal("assistant"),
  content: z.array(XAIResponseContentPartSchema),
  tool_calls: z.array(XAIToolCallSchema).optional(),
});

/**
 * xAI reasoning output schema
 */
const XAIResponseOutputReasoningSchema = z.object({
  id: z.string().optional(),
  type: z.literal("reasoning"),
  summary: z.array(z.unknown()).optional(),
});

/**
 * xAI function call output schema
 */
const XAIResponseOutputFunctionCallSchema = z.object({
  id: z.string(),
  type: z.literal("function_call"),
  status: z.string(),
  arguments: z.string(),
  call_id: z.string(),
  name: z.string(),
});

/**
 * xAI response output schema
 * Supports message, reasoning, and function call outputs
 */
const XAIResponseOutputSchema = z.union([
  XAIResponseOutputMessageSchema,
  XAIResponseOutputReasoningSchema,
  XAIResponseOutputFunctionCallSchema,
]);

/**
 * xAI incomplete details schema
 */
const IncompleteDetailsSchema = z
  .object({
    reason: z.string(),
  })
  .nullable();

/**
 * xAI debug output schema
 */
const DebugOutputSchema = z
  .object({
    attempts: z.number(),
    cache_read_count: z.number(),
    cache_read_input_bytes: z.number(),
    cache_write_count: z.number(),
    cache_write_input_bytes: z.number(),
    engine_request: z.string(),
    lb_address: z.string(),
    prompt: z.string(),
    request: z.string(),
    responses: z.array(z.unknown()),
    sampler_tag: z.string(),
  })
  .optional();

/**
 * xAI reasoning response schema
 */
const ReasoningResponseSchema = z
  .object({
    effort: z.string().nullable(),
    generate_summary: z.boolean().optional(),
    summary: z.string().nullable(),
  })
  .optional();

/**
 * xAI text format response schema
 */
const TextFormatResponseSchema = z.union([
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
 * xAI text response configuration schema
 */
const TextResponseConfigSchema = z.object({
  format: z
    .union([z.array(TextFormatResponseSchema), TextFormatResponseSchema])
    .optional(),
});

/**
 * xAI tool choice response schema
 */
const ToolChoiceResponseSchema = z.union([
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
]);

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
 * Complete xAI v1 Response Schema
 */
export const XAIV1ResponseSchema = z.object({
  /** Unique response identifier */
  id: z.string(),

  /** Response object type */
  object: z.string(),

  /** Response status */
  status: z.string(),

  /** Model used for generation */
  model: z.string(),

  /** Response output array */
  output: z.array(XAIResponseOutputSchema),

  /** Token usage information */
  usage: XAIUsageSchema,

  /** Response creation timestamp */
  created_at: z.number().optional(),

  /** Background information */
  background: z.string().optional(),

  /** Debug output information */
  debug_output: DebugOutputSchema,

  /** Incomplete details if response is incomplete */
  incomplete_details: IncompleteDetailsSchema,

  /** Maximum output tokens configuration */
  max_output_tokens: z.number().nullable(),

  /** Metadata associated with the response */
  metadata: z.record(z.unknown()).nullable(),

  /** Parallel tool calls flag */
  parallel_tool_calls: z.boolean().optional(),

  /** Previous response ID reference */
  previous_response_id: z.string().nullable(),

  /** Reasoning configuration */
  reasoning: ReasoningResponseSchema,

  /** Store flag */
  store: z.boolean().optional(),

  /** Temperature used */
  temperature: z.number().nullable(),

  /** Text configuration */
  text: TextResponseConfigSchema,

  /** Tool choice configuration */
  tool_choice: ToolChoiceResponseSchema,

  /** Tools array */
  tools: z.array(z.unknown()),

  /** Top-p value used */
  top_p: z.number().nullable(),

  /** User identifier */
  user: z.string().nullable(),
});

/**
 * TypeScript type derived from the main response schema
 */
export type XAIV1Response = z.infer<typeof XAIV1ResponseSchema>;
