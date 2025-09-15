---
id: T-implement-sse-streaming
title: Implement SSE streaming parser for OpenAI semantic events
status: open
priority: high
parent: F-openai-v1-provider-implementat
prerequisites:
  - T-create-openai-responses-v1
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-15T19:38:31.008Z
updated: 2025-09-15T19:38:31.008Z
---

# Implement SSE Streaming Parser for OpenAI Semantic Events

Implement the streaming parser that converts OpenAI Responses API semantic SSE events to unified StreamDelta format.

## Context

This task implements the streaming event parsing logic for OpenAI's Responses API v1, which uses semantic SSE events rather than simple JSON chunks. It leverages the existing `SseParser` from `src/core/streaming/sseParser.ts` and follows the streaming patterns established in the core infrastructure.

Reference: [OpenAI Streaming Documentation](https://platform.openai.com/docs/guides/streaming-responses)

## Implementation Requirements

### File to Create

- `src/providers/openai-responses-v1/streamingParser.ts` - SSE event parsing logic

### 1. Streaming Parser (`src/providers/openai-responses-v1/streamingParser.ts`)

**Core Parser Function:**

```typescript
export async function* parseOpenAIResponseStream(
  response: ProviderHttpResponse
): AsyncIterable<StreamDelta>
```

**SSE Event Processing:**

- Use existing `SseParser.parse()` from `src/core/streaming/sseParser.ts`
- Parse raw SSE events into typed OpenAI semantic events
- Convert semantic events to unified `StreamDelta` format

**Key Event Types to Handle:**

- `response.created` → Initial StreamDelta with id and metadata
- `response.output_text.delta` → Content StreamDelta with text increments
- `response.completed` → Final StreamDelta with `finished: true`
- `error` → Error handling (throw appropriate BridgeError)

**StreamDelta Conversion Logic:**

```typescript
// For text deltas
{
  id: event.response?.id || generateId(),
  delta: {
    role: "assistant",
    content: [{ type: "text", text: event.delta?.text || "" }]
  },
  finished: false,
  usage: event.usage || undefined,
  metadata: { eventType: event.type }
}

// For completion
{
  id: event.response?.id || previousId,
  delta: {},
  finished: true,
  usage: event.usage || undefined,
  metadata: { eventType: "response.completed" }
}
```

**State Management:**

- Track response ID across events
- Accumulate usage information
- Handle event ordering and buffering
- Detect completion vs error termination

### 2. Event Type Definitions

**Create Event Type Mappings:**

- Map OpenAI event types to internal processing logic
- Handle unknown event types gracefully (log warning, continue)
- Extract relevant data from each event type

**Termination Detection:**

- `response.completed` → Normal termination
- `error` → Error termination (throw BridgeError)
- Stream end without completion → Timeout or connection error

## Technical Approach

1. **Leverage SseParser**: Use existing SSE parsing infrastructure
2. **Handle Event Buffering**: Manage partial events and ordering
3. **Type Safety**: Use Zod schemas for event validation
4. **Error Recovery**: Handle malformed events gracefully
5. **Memory Efficiency**: Stream processing without buffering entire response

## Acceptance Criteria

### Functional Requirements

- [ ] Successfully parses OpenAI semantic SSE events
- [ ] Converts events to proper StreamDelta format
- [ ] Handles all required event types (created, delta, completed, error)
- [ ] Maintains response ID consistency across events
- [ ] Detects stream termination correctly

### Event Processing Requirements

- [ ] `response.created` events initialize streaming properly
- [ ] `response.output_text.delta` events provide incremental content
- [ ] `response.completed` events signal proper termination
- [ ] `error` events trigger appropriate error handling
- [ ] Unknown events are logged but don't break parsing

### Error Handling Requirements

- [ ] Malformed SSE events are handled gracefully
- [ ] Network errors are properly detected and reported
- [ ] Streaming errors are converted to appropriate BridgeError types
- [ ] Partial events are buffered and completed properly

### Performance Requirements

- [ ] Streaming processes events incrementally (no full buffering)
- [ ] Memory usage remains constant during streaming
- [ ] Event processing latency is minimal (<10ms per event)

### Testing Requirements (Include in this task)

- [ ] Unit tests with mock SSE event streams
- [ ] Unit tests for each event type conversion
- [ ] Unit tests for error conditions and malformed events
- [ ] Unit tests for termination detection
- [ ] Unit tests for state management across events
- [ ] Test file: `src/providers/openai-responses-v1/__tests__/streamingParser.test.ts`

## Dependencies

- Task: "Create OpenAI Responses v1 provider plugin structure and schemas"
- Existing SseParser from core streaming infrastructure
- StreamDelta type from client
- BridgeError types from core errors

## Out of Scope

- Non-streaming response parsing (handled by subsequent task)
- Request translation (handled by previous task)
- Provider registration (handled by subsequent task)
- Tool call event handling (out of Phase 4 scope)
