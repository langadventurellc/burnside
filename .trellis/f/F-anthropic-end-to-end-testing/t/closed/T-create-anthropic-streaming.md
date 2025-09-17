---
id: T-create-anthropic-streaming
title: Create Anthropic streaming E2E tests
status: done
priority: medium
parent: F-anthropic-end-to-end-testing
prerequisites:
  - T-extend-shared-helpers-for
  - T-update-jest-setup-files-for
affectedFiles:
  src/__tests__/e2e/anthropic/streaming.e2e.test.ts: "Created comprehensive
    Anthropic streaming E2E test suite with 12 test cases exactly mirroring
    OpenAI structure: Basic Streaming (parameterized tests + multiple deltas),
    Delta Accumulation (correct accumulation + content ordering), Stream
    Lifecycle (start/end + cancellation), Format Validation (schema compliance +
    usage info), and Error Handling (invalid models + timeouts + empty
    messages). Includes proper helper functions for delta collection,
    accumulation, and validation, with correct timeout patterns and Anthropic
    API requirements."
log:
  - Successfully implemented comprehensive Anthropic streaming E2E tests that
    exactly mirror the OpenAI structure with all 12 test cases. The
    implementation validates streaming delta collection, accumulation, lifecycle
    management, and format validation with live Anthropic SSE streaming APIs.
    All tests are passing on first implementation, including parameterized tests
    across all streaming-capable Anthropic models, proper delta accumulation
    logic, stream lifecycle management, schema validation, and comprehensive
    error handling. The tests include proper timeout patterns (15s/30s/45s),
    maxTokens parameter required by Anthropic API, and follow all project
    conventions including one-export-per-file rule and TypeScript strict typing.
schema: v1.0
childrenIds: []
created: 2025-09-17T00:50:36.704Z
updated: 2025-09-17T00:50:36.704Z
---

# Create Anthropic Streaming E2E Tests

## Context

This task creates the Anthropic streaming E2E test suite that exactly mirrors the OpenAI `streaming.e2e.test.ts` structure with 12 test cases. The tests validate streaming delta collection, accumulation, lifecycle management, and format validation with live Anthropic SSE streaming APIs.

## Implementation Requirements

### 1. Create Test File (`src/__tests__/e2e/anthropic/streaming.e2e.test.ts`)

Mirror the exact structure of `src/__tests__/e2e/openai/streaming.e2e.test.ts` with these adaptations:

**Import Pattern**:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient.js";
import type { StreamDelta } from "../../../client/streamDelta.js";
import type { Message } from "../../../core/messages/message.js";
import { createAnthropicTestClient } from "../shared/modelHelpers.js";
import { ensureModelRegistered } from "../shared/ensureModelRegistered.js";
import { getAnthropicTestModel } from "../shared/getTestModel.js";
import { loadAnthropicTestConfig } from "../shared/testConfig.js";
import { createTestMessages } from "../shared/createTestMessages.js";
import { withTimeout } from "../shared/withTimeout.js";
import { defaultLlmModels } from "../../../data/defaultLlmModels.js";
```

**Streaming-Capable Model Filtering**:

```typescript
// Extract Anthropic models from default models data, filtering for streaming support
const anthropicProvider = defaultLlmModels.providers.find(
  (p) => p.id === "anthropic",
);
const anthropicModels =
  anthropicProvider?.models
    .filter((model) => model.streaming !== false) // Only include models that support streaming
    .map((model) => ({
      id: `anthropic:${model.id}`,
      name: model.name,
    })) || [];
```

### 2. Helper Functions (Copy from OpenAI)

**Delta Collection Helper**:

```typescript
async function collectStreamDeltas(
  stream: AsyncIterable<StreamDelta>,
): Promise<StreamDelta[]> {
  const deltas: StreamDelta[] = [];
  try {
    for await (const delta of stream) {
      deltas.push(delta);
    }
  } catch (error) {
    console.error("Error collecting stream deltas:", error);
    throw error;
  }
  return deltas;
}
```

**Delta Accumulation Helper**:

```typescript
function accumulateDeltas(deltas: StreamDelta[]): Partial<Message> {
  // Copy exact logic from OpenAI streaming test
  // Handle role accumulation, content accumulation, text concatenation
}
```

**StreamDelta Validation Helper**:

```typescript
function validateStreamDelta(delta: StreamDelta): void {
  // Copy exact validation logic from OpenAI streaming test
  // Validate id, delta, finished properties and types
}
```

### 3. Test Suite Structure (12 test cases exactly matching OpenAI)

**Basic Streaming**:

- Parameterized test for streaming-capable Anthropic models (`test.each(anthropicModels)`)
- Multiple deltas production test before completion

**Delta Accumulation**:

- Correct accumulation into complete response test
- Content ordering preservation test

**Stream Lifecycle**:

- Stream start and end handling test
- Stream cancellation test

**Format Validation**:

- StreamDelta schema compliance test
- Usage information in final delta test

**Error Handling**:

- Invalid model streaming test
- Network timeout scenarios test
- Empty messages array test

### 4. Exact Test Descriptions and Timeout Patterns

Use identical test descriptions as OpenAI tests:

- "should stream chat completion deltas with $name ($id)"
- "should produce multiple deltas before completion"
- "should accumulate deltas correctly into complete response"
- "should preserve content ordering in accumulated message"
- "should handle stream start and end"
- "should handle stream cancellation"
- "should validate StreamDelta schema compliance"
- "should include usage information in final delta when available"
- "should handle streaming with invalid model gracefully"
- "should handle network timeout scenarios"
- "should handle empty messages array"

**Timeout Patterns**:

- 15s for stream creation
- 30s for delta collection
- 45s for extended streaming tests (with explicit timeout parameter)

## Acceptance Criteria

- [ ] Test file contains exactly 12 test cases mirroring OpenAI structure
- [ ] Parameterized tests run only on streaming-capable Anthropic models
- [ ] Delta collection and accumulation logic works with Anthropic SSE format
- [ ] Stream lifecycle management (start, multiple deltas, finish) validates correctly
- [ ] StreamDelta schema validation covers id, delta, finished properties
- [ ] Final delta contains proper completion markers and usage information
- [ ] Stream cancellation scenarios handle early termination gracefully
- [ ] Error handling covers invalid models, timeouts, and malformed requests
- [ ] All timeout patterns match OpenAI equivalents (15s/30s/45s)
- [ ] Tests validate against claude-3-5-haiku-latest as default model
- [ ] Content ordering and delta accumulation produce correct final messages

## Dependencies

- Requires T-extend-shared-helpers-for for createAnthropicTestClient and related helpers
- Requires T-update-jest-setup-files-for for environment validation
- Uses existing shared utilities (withTimeout, createTestMessages, etc.)
- References streaming-capable Anthropic models from defaultLlmModels.ts

## Security Considerations

- Never log API keys in test output
- Handle streaming interruption securely
- Validate stream data format to prevent injection
- Clean up streaming resources properly

## Testing Requirements

The tests themselves serve as integration tests for streaming, ensuring:

- Proper stream resource cleanup
- Deterministic delta accumulation
- Consistent streaming behavior across models
- Error recovery from stream failures

## Technical Approach

1. Copy helper functions from OpenAI streaming.e2e.test.ts
2. Replace OpenAI-specific imports with Anthropic equivalents
3. Filter models for streaming capability (`streaming !== false`)
4. Maintain identical test logic for delta processing
5. Use same validation patterns for StreamDelta format
6. Ensure proper stream lifecycle management
7. Apply same timeout patterns and error handling

## Out of Scope

- Creating chat or tool execution tests (handled by separate tasks)
- Modifying existing OpenAI streaming test files
- Adding new streaming features not present in OpenAI equivalent
- Performance optimization beyond basic timeout handling
