---
id: T-implement-xai-request-and
title: Implement xAI request and response schemas
status: done
priority: high
parent: F-xai-grok-provider-implementati
prerequisites:
  - T-create-xai-configuration
affectedFiles:
  src/providers/xai-v1/requestSchema.ts:
    Created comprehensive xAI request schema
    with Zod validation supporting all 6 Grok models, OpenAI Responses API
    format with input array, multimodal content (text/image_url), function
    calling, and advanced features like reasoning and search parameters.
    Includes proper TypeScript type inference and JSDoc documentation.
  src/providers/xai-v1/responseSchema.ts: Created main xAI response schema for
    non-streaming responses supporting message and reasoning output types, usage
    metadata with detailed token counts, tool calls, and all optional fields
    like background, metadata, and text formatting. Follows OpenAI Responses API
    structure.
  src/providers/xai-v1/streamingResponseSchema.ts: Created streaming response
    schema for xAI response chunks with delta updates, supporting incremental
    content delivery, tool calls in streaming format, and usage information in
    final chunks. Validates response.chunk object type.
  src/providers/xai-v1/errorResponseSchema.ts:
    Created error response schema with
    validation for error codes, messages, types, and parameters. Includes
    non-empty string validation for required fields and proper nullable handling
    for optional parameters.
  src/providers/xai-v1/__tests__/requestSchema.test.ts:
    Created comprehensive test
    suite with 27 test cases covering valid requests (all models, multimodal
    content, function calling), invalid requests (missing fields, wrong types,
    parameter ranges), and edge cases. Includes TypeScript type inference
    verification.
  src/providers/xai-v1/__tests__/responseSchema.test.ts: Created response schema
    test suite with 20+ test cases covering complete responses with all fields,
    reasoning outputs, mixed output types, invalid responses, edge cases, and
    type inference validation.
  src/providers/xai-v1/__tests__/streamingResponseSchema.test.ts:
    Created streaming response test suite with 18+ test cases covering streaming
    chunks with deltas, tool calls, usage information, invalid chunks, edge
    cases with optional fields, and multi-output scenarios.
  src/providers/xai-v1/__tests__/errorResponseSchema.test.ts: Created error
    response test suite with 15+ test cases covering common error types (rate
    limit, auth, validation), invalid error responses, edge cases with special
    characters, and type inference validation.
log:
  - >-
    Successfully implemented comprehensive xAI request and response schemas for
    the LLM Bridge library using the OpenAI Responses API format. 


    Implemented complete Zod validation schemas covering:

    - Request validation with all 6 Grok model variants (grok-2, grok-2-mini,
    grok-2-vision-1212, grok-3, grok-3-mini, grok-4-0709)

    - Multimodal content support (text and image_url types) 

    - Function/tool calling with OpenAI-compatible format

    - Comprehensive parameter validation (temperature 0-2, max_tokens 1-8192,
    etc.)

    - Response validation for both streaming and non-streaming formats

    - Error response validation with proper error codes and messages

    - Advanced features like reasoning, search parameters, and text formatting


    Followed established project patterns from openai-responses-v1 provider
    while adapting for xAI's specific API format. All schemas include proper
    TypeScript type inference and comprehensive JSDoc documentation.


    Created complete test suite with 100 test cases covering:

    - Valid requests with all model variants and parameter combinations

    - Invalid request rejection with descriptive error messages  

    - Multimodal content validation

    - Function calling validation

    - Response parsing for all output types (message, reasoning)

    - Streaming chunk validation with delta updates

    - Error response validation for all common error types

    - Edge cases and boundary value testing

    - TypeScript type inference verification


    All quality checks pass including linting, formatting, and type checking.
    The implementation provides robust validation for xAI API interactions while
    maintaining compatibility with the LLM Bridge's unified interface.
schema: v1.0
childrenIds: []
created: 2025-09-17T19:56:14.740Z
updated: 2025-09-17T19:56:14.740Z
---

# Implement xAI Request and Response Schemas

## Context

This task creates the Zod validation schemas for xAI API request and response formats. These schemas ensure type safety and data validation for all interactions with the xAI API, following the OpenAI-compatible format with xAI-specific variations.

## Reference Implementation

Use these files as reference patterns:

- `src/providers/openai-responses-v1/requestSchema.ts`
- `src/providers/openai-responses-v1/responseSchema.ts`
- `src/providers/google-gemini-v1/requestSchema.ts`
- `src/providers/google-gemini-v1/responseSchema.ts`

## Implementation Requirements

### 1. Request Schema (`src/providers/xai-v1/requestSchema.ts`)

Create comprehensive request validation schema:

```typescript
export const XAIV1RequestSchema = z.object({
  // Model validation for supported Grok models
  model: z.enum([
    "grok-3-mini",
    "grok-3",
    "grok-4-0709",
    "grok-2",
    "grok-2-mini",
    "grok-2-vision-1212",
  ]),

  // Messages array (OpenAI-compatible format)
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant", "function"]),
        content: z.union([
          z.string(),
          z.array(
            z.object({
              type: z.enum(["text", "image_url"]),
              text: z.string().optional(),
              image_url: z
                .object({
                  url: z.string().url(),
                })
                .optional(),
            }),
          ),
        ]),
        name: z.string().optional(),
        function_call: z
          .object({
            name: z.string(),
            arguments: z.string(),
          })
          .optional(),
      }),
    )
    .min(1, "At least one message is required"),

  // Optional parameters
  max_tokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),

  // Function/tool calling support
  functions: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        parameters: z.record(z.unknown()).optional(),
      }),
    )
    .optional(),

  function_call: z
    .union([
      z.literal("auto"),
      z.literal("none"),
      z.object({ name: z.string() }),
    ])
    .optional(),
});

export type XAIV1Request = z.infer<typeof XAIV1RequestSchema>;
```

### 2. Response Schema (`src/providers/xai-v1/responseSchema.ts`)

Create response validation schemas for both streaming and non-streaming:

```typescript
// Non-streaming response schema
export const XAIV1ResponseSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion"),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      message: z.object({
        role: z.enum(["assistant", "function"]),
        content: z.string().nullable(),
        function_call: z
          .object({
            name: z.string(),
            arguments: z.string(),
          })
          .optional(),
      }),
      finish_reason: z
        .enum(["stop", "length", "function_call", "content_filter"])
        .nullable(),
    }),
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

// Streaming response chunk schema
export const XAIV1StreamingResponseSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion.chunk"),
  created: z.number(),
  model: z.string(),
  choices: z.array(
    z.object({
      index: z.number(),
      delta: z.object({
        role: z.enum(["assistant", "function"]).optional(),
        content: z.string().nullable().optional(),
        function_call: z
          .object({
            name: z.string().optional(),
            arguments: z.string().optional(),
          })
          .optional(),
      }),
      finish_reason: z
        .enum(["stop", "length", "function_call", "content_filter"])
        .nullable()
        .optional(),
    }),
  ),
});

// Error response schema
export const XAIV1ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    type: z.string().optional(),
    param: z.string().nullable().optional(),
  }),
});

export type XAIV1Response = z.infer<typeof XAIV1ResponseSchema>;
export type XAIV1StreamingResponse = z.infer<
  typeof XAIV1StreamingResponseSchema
>;
export type XAIV1ErrorResponse = z.infer<typeof XAIV1ErrorResponseSchema>;
```

## Acceptance Criteria

### Functional Requirements

✅ **Request Validation**: All xAI API request formats validate correctly
✅ **Response Validation**: Both streaming and non-streaming responses validate
✅ **Model Support**: All Grok model names validate properly
✅ **Multimodal Support**: Image content validation works correctly
✅ **Function Calling**: Tool/function calling schema validates properly
✅ **Error Handling**: Error response format validation works

### Data Validation Requirements

✅ **Message Format**: OpenAI-compatible message structure validation
✅ **Content Types**: Text and image_url content validation
✅ **Parameter Ranges**: Temperature, top_p, max_tokens within valid ranges
✅ **Required Fields**: Proper validation of required vs optional fields
✅ **Type Safety**: Complete TypeScript type inference

### Security Requirements

✅ **Input Sanitization**: All user inputs validated through schemas
✅ **Range Validation**: Parameters within safe operational ranges
✅ **Format Validation**: Strict format validation for all fields
✅ **Content Validation**: Image URL validation for security

## Testing Requirements

Include comprehensive unit tests covering:

### Request Schema Tests

- Valid requests with all supported models
- Message format validation (text and multimodal)
- Parameter range validation (temperature, max_tokens, etc.)
- Function calling schema validation
- Invalid request rejection (malformed data, out-of-range values)

### Response Schema Tests

- Non-streaming response validation
- Streaming chunk validation
- Error response validation
- Edge cases (null values, optional fields)
- Invalid response rejection

### Type Safety Tests

- TypeScript type inference verification
- Schema to type consistency validation

## Implementation Steps

1. **Create Request Schema File**: Set up validation for xAI request format
2. **Create Response Schema File**: Set up validation for response formats
3. **Define Model Enum**: List all supported Grok model names
4. **Implement Message Validation**: Support text and multimodal content
5. **Add Function Calling**: Schema for tool/function definitions
6. **Error Response Schema**: Validation for xAI error format
7. **Write Comprehensive Tests**: Cover all validation scenarios
8. **Verify Type Inference**: Ensure TypeScript types are correct

## Dependencies

- **Prerequisites**: T-create-xai-configuration (configuration schema)
- **Blocks**: Request translator and response parser components

## Out of Scope

- Request translation logic (handled in translator component)
- Response parsing implementation (handled in parser components)
- HTTP transport logic (handled by transport layer)

## Technical Notes

- Follow OpenAI-compatible format while supporting xAI-specific models
- Ensure streaming and non-streaming responses both validate properly
- Include comprehensive validation for multimodal content
- Support both function calling formats (legacy functions and newer tools)
