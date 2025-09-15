---
id: T-create-openai-responses-v1
title: Create OpenAI Responses v1 provider plugin structure and schemas
status: open
priority: high
parent: F-openai-v1-provider-implementat
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T19:37:29.364Z
updated: 2025-09-15T19:37:29.364Z
---

# Create OpenAI Responses v1 Provider Plugin Structure and Schemas

Establish the foundational structure for the OpenAI Responses v1 provider plugin with proper Zod schemas and configuration types.

## Context

This task implements the foundational structure for the first provider plugin in the LLM Bridge library, following the patterns established in `src/core/providers/providerPlugin.ts` and supporting the OpenAI Responses API v1 as specified in Phase 4 of the implementation plan.

## Implementation Requirements

### File Structure to Create

```
src/providers/openai-responses-v1/
├── index.ts          # Main provider plugin export
├── schema.ts         # Zod schemas for configuration and API types
└── models.ts         # Model capabilities and metadata
```

### 1. Provider Plugin Index (`src/providers/openai-responses-v1/index.ts`)

- Create main provider plugin class implementing `ProviderPlugin` interface from `src/core/providers/providerPlugin.ts`
- Basic plugin metadata:
  - id: "openai"
  - name: "OpenAI Responses Provider"
  - version: "responses-v1"
- Placeholder implementations for required methods (will be implemented in subsequent tasks):
  - `translateRequest()` - throw "Not implemented" for now
  - `parseResponse()` - throw "Not implemented" for now
  - `isTerminal()` - throw "Not implemented" for now
  - `normalizeError()` - throw "Not implemented" for now
- Optional methods: `initialize()`, `supportsModel()`

### 2. Zod Schemas (`src/providers/openai-responses-v1/schema.ts`)

Create comprehensive schemas following existing patterns in `src/core/validation/`:

**Configuration Schema:**

- `OpenAIResponsesV1Config` with fields:
  - `apiKey: string` (required)
  - `baseUrl: string` (optional, default: "https://api.openai.com")
  - `organization?: string` (optional)
  - `timeout?: number` (optional, default from config)

**Request Schema:**

- `OpenAIResponsesRequest` matching Responses API v1 format:
  - `model: string`
  - `input: array of message objects`
  - `stream?: boolean`
  - `temperature?: number`
  - `max_tokens?: number`

**Response Schema:**

- `OpenAIResponsesResponse` for non-streaming responses
- `OpenAIResponsesStreamEvent` for streaming events with event types:
  - `response.created`
  - `response.output_text.delta`
  - `response.completed`
  - `error`

### 3. Model Capabilities (`src/providers/openai-responses-v1/models.ts`)

- Define OpenAI model capabilities based on `defaultLlmModels.ts`
- Export function `getModelCapabilities(modelId: string)` returning `ModelCapabilities`
- Support models: `gpt-4o-2024-08-06`, `gpt-5-2025-08-07` (representative subset)
- Capabilities for OpenAI models:
  - `streaming: true`
  - `toolCalls: false` (Phase 4 scope - non-tool chat only)
  - `images: true`
  - `documents: true`
  - `supportedContentTypes: ["text", "image"]`

## Technical Approach

1. **Follow Existing Patterns**: Study `src/core/providers/` structure and validation patterns
2. **Use Zod Validation**: All schemas must use Zod for type safety and validation
3. **Import Existing Types**: Leverage types from `src/core/messages/`, `src/core/errors/`, etc.
4. **Maintain Consistency**: Follow naming conventions and module organization from existing code

## Acceptance Criteria

### Functional Requirements

- [ ] Provider plugin structure follows `ProviderPlugin` interface exactly
- [ ] All Zod schemas validate correctly for valid inputs
- [ ] Configuration schema handles required and optional fields properly
- [ ] Request/response schemas match OpenAI Responses API v1 specification
- [ ] Model capabilities are correctly defined for target OpenAI models

### Code Quality Requirements

- [ ] TypeScript compilation passes without errors
- [ ] All exports are properly typed with Zod inference
- [ ] File size stays under 400 LOC per file
- [ ] Imports follow project conventions (use .js extensions)

### Testing Requirements (Include in this task)

- [ ] Unit tests for all Zod schemas with valid/invalid inputs
- [ ] Unit tests for model capabilities function
- [ ] Unit tests for provider plugin basic metadata
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/schema.test.ts`
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/models.test.ts`

### Security Requirements

- [ ] API key configuration is properly typed as string
- [ ] No hardcoded secrets or credentials
- [ ] Input validation prevents injection through configuration

## Dependencies

- Existing ProviderPlugin interface
- Zod validation framework
- Core message and error types

## Out of Scope

- Actual request translation logic (handled by subsequent task)
- Response parsing implementation (handled by subsequent task)
- Error normalization logic (handled by subsequent task)
- Integration with ProviderRegistry (handled by subsequent task)
