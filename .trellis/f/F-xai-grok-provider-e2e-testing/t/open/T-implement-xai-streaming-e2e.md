---
id: T-implement-xai-streaming-e2e
title: Implement xAI streaming E2E tests
status: open
priority: medium
parent: F-xai-grok-provider-e2e-testing
prerequisites:
  - T-create-xai-bridgeclient
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-18T00:11:51.756Z
updated: 2025-09-18T00:11:51.756Z
---

# Implement xAI Streaming E2E Tests

## Context

This task implements comprehensive streaming E2E tests for the xAI Grok provider, following the exact patterns established by the OpenAI E2E streaming tests. These tests validate real-time streaming functionality with delta accumulation and stream lifecycle management.

## Reference Implementation

Follow this existing OpenAI E2E testing pattern:

- `src/__tests__/e2e/openai/streaming.e2e.test.ts` - Complete streaming test suite

## Implementation Requirements

### 1. Create xAI Streaming E2E Test File (`src/__tests__/e2e/xai/streaming.e2e.test.ts`)

Mirror the structure of the OpenAI streaming tests but adapted for xAI:

```typescript
import { describe, test, expect, beforeAll } from "@jest/globals";
import type { BridgeClient } from "../../../client/bridgeClient";
import type { StreamDelta } from "../../../client/streamDelta";
import type { Message } from "../../../core/messages/message";
import { createTestClient } from "../shared/xaiModelHelpers";
import { ensureModelRegistered } from "../shared/ensureModelRegistered";
import { getXaiTestModel } from "../shared/getXaiTestModel";
import { loadXaiTestConfig } from "../shared/xaiTestConfig";
import { createTestMessages } from "../shared/createTestMessages";
import { withTimeout } from "../shared/withTimeout";
import { defaultLlmModels } from "../../../data/defaultLlmModels";

// Extract xAI models from default models data, filtering for streaming support
const xaiProvider = defaultLlmModels.providers.find((p) => p.id === "xai");
const xaiModels =
  xaiProvider?.models
    .filter((model) => model.streaming !== false) // Only include models that support streaming
    .map((model) => ({
      id: `xai:${model.id}`,
      name: model.name,
    })) || [];
```

### 2. Implement Streaming Helper Functions

#### Stream Delta Collection

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

#### Delta Accumulation

```typescript
function accumulateDeltas(deltas: StreamDelta[]): Partial<Message> {
  const accumulated: Partial<Message> = {
    role: "assistant",
    content: [],
  };

  for (const delta of deltas) {
    // Accumulate role if present
    if (delta.delta.role) {
      accumulated.role = delta.delta.role;
    }

    // Accumulate content
    if (delta.delta.content) {
      if (!accumulated.content) {
        accumulated.content = [];
      }

      for (const contentItem of delta.delta.content) {
        if (contentItem.type === "text") {
          // Find existing text item or create new one
          let textItem = accumulated.content.find(
            (item): item is { type: "text"; text: string } =>
              item.type === "text",
          );

          if (!textItem) {
            textItem = { type: "text", text: "" };
            accumulated.content.push(textItem);
          }

          textItem.text += contentItem.text || "";
        }
      }
    }
  }

  return accumulated;
}
```

#### StreamDelta Validation

```typescript
function validateStreamDelta(delta: StreamDelta): void {
  expect(delta).toHaveProperty("id");
  expect(delta).toHaveProperty("delta");
  expect(delta).toHaveProperty("finished");
  expect(typeof delta.id).toBe("string");
  expect(typeof delta.delta).toBe("object");
  expect(typeof delta.finished).toBe("boolean");
  expect(delta.id.length).toBeGreaterThan(0);
}
```

### 3. Implement Test Categories

#### Basic Streaming

- **Parameterized model testing**: Test all streaming-capable Grok models
- **Delta collection**: Validate streaming response structure
- **Multiple deltas**: Ensure paragraph responses generate multiple deltas
- **Stream termination**: Verify final delta marked as finished

#### Delta Accumulation

- **Complete message assembly**: Accumulate deltas into final message
- **Content ordering**: Preserve content sequence in accumulated message
- **Role handling**: Properly accumulate role information
- **Text content**: Validate accumulated text content integrity

#### Stream Lifecycle

- **Start and end**: Validate stream beginning and termination
- **Cancellation**: Test early stream termination scenarios
- **Resource cleanup**: Ensure proper resource management

#### Format Validation

- **StreamDelta schema**: Validate delta structure compliance
- **Usage information**: Check for usage data in final deltas
- **Metadata preservation**: Ensure metadata handling in streams

### 4. Key Test Implementations

#### Parameterized Streaming Tests

```typescript
test.each(xaiModels)(
  "should stream chat completion deltas with $name ($id)",
  async ({ id: modelId }) => {
    ensureModelRegistered(client, modelId);

    const messages = createTestMessages("Hello! Please respond briefly.");

    const streamPromise = client.stream({
      model: modelId,
      messages,
      temperature: 0.1, // Low temperature for more predictable responses
    });

    const stream = await withTimeout(streamPromise, 15000);
    expect(stream).toBeDefined();

    const deltas = await withTimeout(collectStreamDeltas(stream), 30000);

    // Basic stream validation
    expect(deltas.length).toBeGreaterThan(0);

    // Validate each delta structure
    deltas.forEach(validateStreamDelta);

    // Check that final delta is marked as finished
    const finalDelta = deltas[deltas.length - 1];
    expect(finalDelta.finished).toBe(true);

    // Ensure we have at least some content
    const hasContent = deltas.some(
      (delta) => delta.delta.content && delta.delta.content.length > 0,
    );
    expect(hasContent).toBe(true);
  },
  45000, // Extended timeout for streaming
);
```

#### Delta Accumulation Tests

```typescript
test("should accumulate deltas correctly into complete response", async () => {
  const messages = createTestMessages("Say exactly: 'Hello, World!'");

  const stream = await withTimeout(
    client.stream({
      model: testModel,
      messages,
      temperature: 0, // Deterministic for exact text
    }),
    15000,
  );

  const deltas = await withTimeout(collectStreamDeltas(stream), 30000);
  const accumulated = accumulateDeltas(deltas);

  // Should have assistant role
  expect(accumulated.role).toBe("assistant");

  // Should have content
  expect(accumulated.content).toBeDefined();
  expect(Array.isArray(accumulated.content)).toBe(true);
  expect(accumulated.content!.length).toBeGreaterThan(0);

  // Should have text content
  const textContent = accumulated.content!.find(
    (item): item is { type: "text"; text: string } => item.type === "text",
  );
  expect(textContent).toBeDefined();
  expect(textContent!.text.trim().length).toBeGreaterThan(0);
});
```

#### Stream Lifecycle Tests

```typescript
test("should handle stream start and end", async () => {
  const messages = createTestMessages("Hello");

  const stream = await withTimeout(
    client.stream({
      model: testModel,
      messages,
    }),
    15000,
  );

  let deltaCount = 0;
  let firstDelta: StreamDelta | null = null;
  let lastDelta: StreamDelta | null = null;

  for await (const delta of stream) {
    if (deltaCount === 0) {
      firstDelta = delta;
    }
    lastDelta = delta;
    deltaCount++;
  }

  expect(deltaCount).toBeGreaterThan(0);
  expect(firstDelta).not.toBeNull();
  expect(lastDelta).not.toBeNull();
  expect(firstDelta!.finished).toBe(false);
  expect(lastDelta!.finished).toBe(true);
});
```

### 5. Test Structure

Follow the exact describe block structure from OpenAI streaming tests:

- **"xAI Streaming E2E"** - Main test suite
  - **"Basic Streaming"** - Core streaming functionality
  - **"Delta Accumulation"** - Message assembly testing
  - **"Stream Lifecycle"** - Start/end/cancellation testing
  - **"Format Validation"** - Schema compliance testing
  - **"Error Handling"** - Failure scenarios

## Technical Approach

1. **Mirror OpenAI patterns exactly**: Use identical streaming test patterns and validation
2. **xAI-specific adaptations**: Use xAI models and provider configuration
3. **Real streaming integration**: Execute actual streaming API calls to xAI
4. **Comprehensive validation**: Test delta structure, accumulation, and lifecycle
5. **Performance optimization**: Use appropriate timeouts and resource management

## Acceptance Criteria

### Functional Requirements

- ✅ All streaming-capable Grok models tested with parameterized tests
- ✅ Real-time streaming produces multiple deltas before completion
- ✅ StreamDelta structure complies with interface requirements (id, delta, finished)
- ✅ Final delta marked as finished=true, earlier deltas finished=false
- ✅ Stream cancellation works without resource leaks
- ✅ Delta accumulation produces valid unified message format

### Streaming Validation

- ✅ Each delta has required fields (id, delta, finished) with correct types
- ✅ Content deltas accumulate correctly into coherent text
- ✅ Role information preserved through streaming process
- ✅ Usage information included in final delta when available

### Performance Requirements

- ✅ Streaming completes within generous timeouts (25-45 seconds)
- ✅ Multiple deltas generated for paragraph-length responses
- ✅ Efficient resource usage without memory leaks
- ✅ Proper cleanup on stream termination or cancellation

### Error Handling

- ✅ Invalid model streaming requests handled gracefully
- ✅ Network timeout scenarios produce appropriate errors
- ✅ Empty messages array rejected properly
- ✅ Stream errors don't cause resource leaks

## Dependencies

- Previous task: T-create-xai-bridgeclient (for xAI BridgeClient factory)
- Existing shared E2E helpers (createTestMessages, withTimeout)
- xAI provider streaming implementation
- Valid XAI_API_KEY for real streaming API testing

## Files to Create

**New Files:**

- `src/__tests__/e2e/xai/streaming.e2e.test.ts`

## Testing Strategy

### Test Scenarios

1. **Basic Streaming**: All models, delta validation, termination
2. **Accumulation**: Message assembly, content ordering, role handling
3. **Lifecycle**: Start/end validation, cancellation scenarios
4. **Validation**: Schema compliance, usage information, metadata
5. **Error Cases**: Invalid models, timeouts, empty requests

### Performance Considerations

- Use extended timeouts for streaming (45 seconds for parameterized tests)
- Test with low temperature for predictable responses
- Minimize token usage while ensuring comprehensive coverage
- Monitor resource cleanup and memory usage

## Technical Notes

### Streaming Model Support

- Filter models by `streaming !== false` capability
- All current Grok models support streaming by default
- Use model capabilities to determine streaming support

### Delta Processing

- Collect all deltas before validation for complete picture
- Validate each individual delta structure
- Test accumulation logic with deterministic prompts

### Resource Management

- Ensure proper stream cleanup on completion and cancellation
- Handle streaming errors without resource leaks
- Use appropriate timeouts to prevent hanging tests

## Out of Scope

- Chat completion testing (handled by chat task)
- Tool execution with streaming (handled by tools task)
- Performance benchmarking (basic observability only)
- Multi-provider streaming comparisons
