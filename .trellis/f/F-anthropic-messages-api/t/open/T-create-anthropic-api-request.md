---
id: T-create-anthropic-api-request
title: Create Anthropic API request and response schemas
status: open
priority: high
parent: F-anthropic-messages-api
prerequisites:
  - T-create-anthropic-provider
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-16T13:24:47.832Z
updated: 2025-09-16T13:24:47.832Z
---

# Create Anthropic API Request and Response Schemas

Implement Zod schemas for validating Anthropic Messages API requests and responses, ensuring type safety and proper API contract validation.

## Context

This task creates the API boundary validation schemas for the Anthropic Messages API v2025-05-14. These schemas validate outgoing requests to Anthropic and incoming responses, providing type safety and runtime validation.

**Reference Implementation**: Follow patterns from `src/providers/openai-responses-v1/requestSchema.ts` and `src/providers/openai-responses-v1/responseSchema.ts`

**API Documentation**: Anthropic Messages API v2025-05-14 specification

**Feature Reference**: F-anthropic-messages-api - Anthropic Messages API Provider Implementation

## Implementation Requirements

### File Locations

Create both:

- `src/providers/anthropic-2025-05-14/requestSchema.ts`
- `src/providers/anthropic-2025-05-14/responseSchema.ts`

### Request Schema (`requestSchema.ts`)

Define schemas for Anthropic API requests:

1. **Message Content Types**:

   ```typescript
   const AnthropicTextContent = z.object({
     type: z.literal("text"),
     text: z.string(),
   });

   const AnthropicImageContent = z.object({
     type: z.literal("image"),
     source: z.object({
       type: z.literal("base64"),
       media_type: z.enum([
         "image/jpeg",
         "image/png",
         "image/gif",
         "image/webp",
       ]),
       data: z.string(),
     }),
   });
   ```

2. **Tool Definition Schema**:

   ```typescript
   const AnthropicTool = z.object({
     name: z.string(),
     description: z.string().optional(),
     input_schema: z.record(z.unknown()), // JSON Schema
   });
   ```

3. **Main Request Schema**:
   ```typescript
   const AnthropicMessagesRequest = z.object({
     model: z.string(),
     max_tokens: z.number().positive(),
     messages: z.array(AnthropicMessage),
     system: z.string().optional(),
     tools: z.array(AnthropicTool).optional(),
     stream: z.boolean().optional(),
     temperature: z.number().min(0).max(1).optional(),
     top_p: z.number().min(0).max(1).optional(),
     stop_sequences: z.array(z.string()).optional(),
   });
   ```

### Response Schema (`responseSchema.ts`)

Define schemas for Anthropic API responses:

1. **Content Block Types**:

   ```typescript
   const AnthropicTextBlock = z.object({
     type: z.literal("text"),
     text: z.string(),
   });

   const AnthropicToolUseBlock = z.object({
     type: z.literal("tool_use"),
     id: z.string(),
     name: z.string(),
     input: z.record(z.unknown()),
   });
   ```

2. **Non-Streaming Response**:

   ```typescript
   const AnthropicMessagesResponse = z.object({
     id: z.string(),
     type: z.literal("message"),
     role: z.literal("assistant"),
     content: z.array(z.union([AnthropicTextBlock, AnthropicToolUseBlock])),
     model: z.string(),
     stop_reason: z
       .enum(["end_turn", "max_tokens", "stop_sequence", "tool_use"])
       .nullable(),
     stop_sequence: z.string().nullable().optional(),
     usage: z.object({
       input_tokens: z.number(),
       output_tokens: z.number(),
     }),
   });
   ```

3. **Streaming Response Delta**:

   ```typescript
   const AnthropicStreamingDelta = z.object({
     type: z.enum([
       "message_start",
       "content_block_start",
       "content_block_delta",
       "content_block_stop",
       "message_delta",
       "message_stop",
     ]),
     message: z.object({}).optional(),
     content_block: z.object({}).optional(),
     delta: z
       .object({
         text: z.string().optional(),
         input: z.record(z.unknown()).optional(),
       })
       .optional(),
     index: z.number().optional(),
   });
   ```

4. **Error Response Schema**:
   ```typescript
   const AnthropicErrorResponse = z.object({
     type: z.literal("error"),
     error: z.object({
       type: z.string(),
       message: z.string(),
     }),
   });
   ```

### Technical Approach

- Use discriminated unions for content types
- Implement proper error response handling
- Support both streaming and non-streaming response formats
- Follow Anthropic's exact API field naming conventions
- Include comprehensive type exports

## Acceptance Criteria

1. **Request Schema Validation**:
   - ✅ All Anthropic request fields properly validated
   - ✅ Message content types (text, image) correctly defined
   - ✅ Tool definitions follow Anthropic's schema format
   - ✅ Optional fields handle undefined values correctly
   - ✅ Numeric constraints properly enforced (temperature, top_p, max_tokens)

2. **Response Schema Validation**:
   - ✅ Non-streaming responses fully validated
   - ✅ Streaming deltas properly typed with discriminated unions
   - ✅ Tool use blocks correctly structured
   - ✅ Usage statistics properly typed
   - ✅ Stop reasons enumerated correctly

3. **Error Handling**:
   - ✅ Error responses properly typed
   - ✅ Validation provides clear error messages
   - ✅ Malformed responses handled gracefully

4. **Type Safety**:
   - ✅ No `any` types used
   - ✅ Proper TypeScript inference from schemas
   - ✅ Discriminated unions for content/delta types

5. **Unit Tests** (included in this task):
   - ✅ Test valid request/response parsing
   - ✅ Test invalid request/response rejection
   - ✅ Test edge cases for all field types
   - ✅ Test streaming delta parsing
   - ✅ Test error response parsing
   - ✅ Achieve >90% code coverage

## Dependencies

- Zod library for schema validation
- Configuration schema from T-create-anthropic-provider

## Out of Scope

- Actual HTTP request/response handling (separate tasks)
- Translation between unified and Anthropic formats (separate task)
- Provider plugin integration (separate task)

## Testing Requirements

Create `src/providers/anthropic-2025-05-14/__tests__/requestSchema.test.ts` and `responseSchema.test.ts` with:

- Valid schema parsing tests
- Invalid schema rejection tests
- Edge case validation
- Type inference verification
- Error message quality validation
